import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  WooError,
  createCustomer,
  getCustomer,
  getCustomerOrders,
  loginCustomer,
  logoutCustomer,
  saveCustomer
} from "../../shared/lib/woo.js";
import { useCart } from "../cart/CartContext.jsx";

const AccountContext = createContext(null);

const ANONYMOUS = {
  id: 0,
  email: "",
  first_name: "",
  last_name: "",
  display_name: "",
  phone: "",
  billing: {},
  shipping: {}
};

/**
 * Signed-in customer session.
 *
 * The session itself is a WordPress auth cookie, so it survives a reload with
 * no token in localStorage — we only mirror the profile into React state to
 * render the header and prefill checkout. A 401 from /customer simply means
 * "guest", which is a normal state here and never an error worth surfacing.
 */
export function AccountProvider({ children }) {
  const { refresh } = useCart();
  const [customer, setCustomer] = useState(ANONYMOUS);
  const [status, setStatus] = useState("loading"); // loading | ready
  const [busy, setBusy] = useState(false);

  const applySession = useCallback(
    (payload) => {
      setCustomer({ ...ANONYMOUS, ...(payload ?? {}) });
      setStatus("ready");
      return payload;
    },
    []
  );

  // Restore the session on boot. The cookie is already present, so this is a
  // single cheap request that tells us who — if anyone — is signed in.
  useEffect(() => {
    let cancelled = false;

    getCustomer()
      .then((payload) => {
        if (!cancelled) applySession(payload);
      })
      .catch((err) => {
        if (cancelled) return;
        // 401 = not signed in. Anything else still leaves us in guest mode,
        // but the failure is worth knowing about while developing.
        if (!(err instanceof WooError) || err.status !== 401) {
          console.warn("[storefront] session restore failed", err);
        }
        applySession(null);
      });

    return () => {
      cancelled = true;
    };
  }, [applySession]);

  const signIn = useCallback(
    async (credentials) => {
      setBusy(true);
      try {
        const payload = await loginCustomer(credentials);
        applySession(payload);
        // The guest bag is carried over by session, but the cart in state was
        // fetched for the guest token — re-read it now that we are the owner.
        await refresh();
        return payload;
      } finally {
        setBusy(false);
      }
    },
    [applySession, refresh]
  );

  const register = useCallback(
    async (details) => {
      setBusy(true);
      try {
        const payload = await createCustomer(details);
        applySession(payload);
        await refresh();
        return payload;
      } finally {
        setBusy(false);
      }
    },
    [applySession, refresh]
  );

  const signOut = useCallback(async () => {
    setBusy(true);
    try {
      await logoutCustomer();
      applySession(null);
      await refresh();
    } finally {
      setBusy(false);
    }
  }, [applySession, refresh]);

  const updateProfile = useCallback(async (patch) => {
    setBusy(true);
    try {
      const payload = await saveCustomer(patch);
      applySession(payload);
      return payload;
    } finally {
      setBusy(false);
    }
  }, [applySession]);

  const value = useMemo(
    () => ({
      customer,
      isLoggedIn: Boolean(customer.id),
      isResolved: status === "ready",
      busy,
      signIn,
      register,
      signOut,
      updateProfile,
      getOrders: (options) => getCustomerOrders(options)
    }),
    [customer, status, busy, signIn, register, signOut, updateProfile]
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const context = useContext(AccountContext);

  if (!context) {
    throw new Error("useAccount must be used inside <AccountProvider>");
  }

  return context;
}

export default AccountContext;
