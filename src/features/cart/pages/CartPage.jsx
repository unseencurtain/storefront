import { Link } from "react-router-dom";
import { useCart } from "../../../features/cart/CartContext.jsx";
import { useUI } from "../../../shared/UIContext.jsx";
import { money, plural } from "../../../shared/lib/format.js";
import { Ledger, FREE_SHIPPING_AT, ASSURANCE } from "../../../features/cart/components/CartDrawer.jsx";
import QuantityStepper from "../../../shared/ui/QuantityStepper.jsx";
import { ArrowIcon, BagIcon, CheckIcon } from "../../../shared/ui/Icons.jsx";
import { loadBestSellers } from "../../../shared/lib/catalog.js";
import { useEffect, useState } from "react";
import { MiniRow } from "../../../features/catalog/components/ProductCard.jsx";

/** Full-page bag. Mirrors the drawer, with the wider ledger from the reference. */
export default function CartPage() {
  const { cart, count, isEmpty, setQuantity, status } = useCart();
  const { open } = useUI();
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (!isEmpty) return;

    let alive = true;
    loadBestSellers(3).then((items) => alive && setSuggestions(items));

    return () => {
      alive = false;
    };
  }, [isEmpty]);

  if (status === "idle") {
    return (
      <main className="page container-inset">
        <div className="state-msg">
          <span className="spinner" />
        </div>
      </main>
    );
  }

  return (
    <main className="page container-inset cart-page">
      <h1 className="sub-sm cart-page__title">
        Shopping bag ({count}) {plural(count, "item")}
      </h1>

      {isEmpty ? (
        <div className="cart-empty cart-empty--page">
          <BagIcon size={30} />
          <p className="sub-sm">Your bag is empty.</p>
          <Link to="/shop" className="btn">
            Shop All
          </Link>

          {suggestions.length ? (
            <div className="cart-empty__recs">
              <p className="sub-xs muted">Best sellers</p>
              {suggestions.map((product) => (
                <MiniRow key={product.id} product={product} />
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <>
          <ul className="cart-list cart-list--page">
            {cart.items.map((item) => (
              <li key={item.key} className="cart-line cart-line--page">
                <Link to={`/product/${item.slug ?? item.id}`} className="cart-line__media" tabIndex={-1} aria-hidden="true">
                  {item.images?.[0] ? (
                    <img src={item.images[0].src ?? item.images[0].thumbnail} alt="" loading="lazy" />
                  ) : null}
                </Link>

                <div className="cart-line__info">
                  <div className="cart-line__top">
                    <div className="cart-line__names">
                      <Link to={`/product/${item.slug ?? item.id}`} className="cart-line__name">
                        {item.name}
                      </Link>
                      {item.variation?.length ? (
                        <span className="cart-line__variant">
                          {item.variation.map((variation) => variation.value).join(", ")}
                        </span>
                      ) : null}
                      <span className="sr-only">
                        {item.quantity} {plural(Number(item.quantity), "unit")} in bag
                      </span>
                    </div>

                    <span className="lead-sm cart-line__price">
                      {money(item.totals?.line_total, item.totals)}
                    </span>
                  </div>

                  <div className="cart-line__controls">
                    <QuantityStepper
                      value={item.quantity}
                      onChange={(quantity) => setQuantity(item.key, quantity)}
                      min={Math.max(1, item.quantity_limits?.minimum ?? 1)}
                      max={item.quantity_limits?.maximum ?? 9999}
                      label={`quantity of ${item.name}`}
                    />

                    <button
                      type="button"
                      className="cart-line__removelink"
                      onClick={() => setQuantity(item.key, 0)}
                      aria-label={`Remove ${item.name} from bag`}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="cart-page__summary">
            <Ledger cart={cart} showEstimate />

            <p className="body-sm muted cart-page__note">
              Discount codes can be applied at checkout.
            </p>

            <Link to="/checkout" className="btn btn--lg btn--block">
              Checkout
              <ArrowIcon />
            </Link>

            <button type="button" className="btn btn--quiet btn--block" onClick={() => open("cart")}>
              Continue shopping
            </button>

            <ul className="cart-page__perks">
              {[
                Number(cart.totals?.total_items ?? 0) >= FREE_SHIPPING_AT
                  ? "You’ve unlocked free shipping"
                  : `Spend ${money(FREE_SHIPPING_AT - Number(cart.totals?.total_items ?? 0), cart.totals)} for free shipping`,
                ...ASSURANCE
              ].map((perk) => (
                <li key={perk}>
                  <CheckIcon size={13} />
                  {perk}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </main>
  );
}
