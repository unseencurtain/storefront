import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import * as woo from "../../shared/lib/woo.js";

const CartContext = createContext(null);

const EMPTY_CART = {
  items: [],
  coupons: [],
  totals: {},
  shipping_rates: [],
  payment_methods: [],
  items_count: 0
};

export function CartProvider({ children }) {
  const [cart, setCart] = useState(EMPTY_CART);
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error
  const [busyKeys, setBusyKeys] = useState(() => new Set());
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");

  // Guards against a slow first GET clobbering a cart the user already filled.
  const touched = useRef(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const initial = await woo.getCart();
        if (cancelled) return;
        setCart(initial);
      } catch {
        if (!cancelled) setError("We couldn’t load your bag.");
      } finally {
        if (!cancelled) setStatus("ready");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const markBusy = useCallback((key, on) => {
    setBusyKeys((current) => {
      const next = new Set(current);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);

  /**
   * Store mutations return the touched line item, not the whole cart, so after
   * every write we pull the authoritative cart back from the server.
   */
  const refresh = useCallback(async () => {
    try {
      setCart(await woo.getCart());
    } catch {
      /* transient — the next interaction will retry */
    }
  }, []);

  /** Only a real cart payload may replace cart state — mutations return line items. */
  const isCartPayload = (value) => Array.isArray(value?.items);

  /** Run a mutation, keep the previous cart visible until the server answers. */
  const mutate = useCallback(
    async (key, operation) => {
      touched.current = true;
      markBusy(key, true);
      setError("");

      try {
        const next = await operation();

        if (isCartPayload(next)) {
          setCart(next);
          return next;
        }

        // 204 / empty body (e.g. removing a line) still means the cart changed,
        // but there is nothing to apply. Re-read it so callers keep getting a
        // truthy payload to gate their announcements and refresh on.
        try {
          const fresh = await woo.getCart();
          setCart(fresh);
          return fresh;
        } catch {
          return { items: [], ...EMPTY_CART };
        }
      } catch (err) {
        // Keep whatever the server last confirmed; surface the message instead.
        try {
          setCart(await woo.getCart());
        } catch {
          /* ignore — the banner already explains the failure */
        }

        setError(err.message || "Something went wrong. Please try again.");
        return null;
      } finally {
        markBusy(key, false);
      }
    },
    [markBusy]
  );

  const addItem = useCallback(
    async ({ id, quantity = 1, variationId } = {}) => {
      const result = await mutate(`add:${id}:${variationId ?? ""}`, () =>
        woo.addToCart({ id, quantity, variationId })
      );

      if (result) {
        setAnnouncement(`Added ${result.name} to your bag.`);
        await refresh();
      }

      return result;
    },
    [mutate, refresh]
  );

  const setQuantity = useCallback(
    async (key, quantity) => {
      const item = cart.items.find((entry) => entry.key === key);
      const name = item?.name ?? "Item";

      const result = await mutate(`item:${key}`, () => {
        if (quantity <= 0) return woo.removeCartItem(key);
        return woo.updateCartItem(key, { quantity });
      });

      if (result) {
        setAnnouncement(
          quantity <= 0
            ? `Removed ${name} from your bag.`
            : `Updated ${name} quantity to ${quantity}.`
        );
        await refresh();
      }

      return result;
    },
    [cart.items, mutate, refresh]
  );

  const removeItem = useCallback(
    (key) => setQuantity(key, 0),
    [setQuantity]
  );

  const applyCoupon = useCallback(
    async (code) => {
      const result = await mutate("coupon", () => woo.applyCoupon(code));
      if (result) {
        setAnnouncement(`Discount code ${code} applied.`);
        await refresh();
      }
      return result;
    },
    [mutate, refresh]
  );

  const removeCoupon = useCallback(
    async (code) => {
      const result = await mutate(`coupon:${code}`, () => woo.removeCoupon(code));
      if (result) {
        setAnnouncement(`Discount code ${code} removed.`);
        await refresh();
      }
      return result;
    },
    [mutate, refresh]
  );

  const setAddress = useCallback(
    async (address) => {
      const result = await mutate("address", () => woo.updateCustomer(cart, address));
      if (result) await refresh();
      return result;
    },
    [cart, mutate, refresh]
  );

  const chooseShippingRate = useCallback(
    async (packageId, rateId) => {
      const result = await mutate(`rate:${rateId}`, () =>
        woo.selectShippingRate(packageId, rateId)
      );
      if (result) await refresh();
      return result;
    },
    [mutate, refresh]
  );

  const checkout = useCallback(
    async (payload) => {
      const result = await mutate("checkout", () => woo.placeOrder(payload));
      if (result) setCart(EMPTY_CART);
      return result;
    },
    [mutate]
  );

  const clearError = useCallback(() => setError(""), []);
  const clearAnnouncement = useCallback(() => setAnnouncement(""), []);

  const value = useMemo(
    () => ({
      cart,
      status,
      error,
      announcement,
      busy: busyKeys,
      isEmpty: !cart.items?.length,
      count: cart.items_count ?? 0,
      addItem,
      setQuantity,
      removeItem,
      applyCoupon,
      removeCoupon,
      setAddress,
      chooseShippingRate,
      checkout,
      refresh,
      clearError,
      clearAnnouncement
    }),
    [
      cart,
      status,
      error,
      announcement,
      busyKeys,
      addItem,
      setQuantity,
      removeItem,
      applyCoupon,
      removeCoupon,
      setAddress,
      chooseShippingRate,
      checkout,
      refresh,
      clearError,
      clearAnnouncement
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside <CartProvider>");
  return context;
}
