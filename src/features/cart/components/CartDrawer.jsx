import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../../features/cart/CartContext.jsx";
import { useUI, useBodyLock } from "../../../shared/UIContext.jsx";
import { money, itemsSubtotal, plural } from "../../../shared/lib/format.js";
import { loadBestSellers } from "../../../shared/lib/catalog.js";
import { useEffect } from "react";
import QuantityStepper from "../../../shared/ui/QuantityStepper.jsx";
import { MiniRow } from "../../catalog/components/ProductCard.jsx";
import { CloseIcon, BagIcon, ArrowIcon, CheckIcon } from "../../../shared/ui/Icons.jsx";

/** Free-shipping threshold, in minor units (cents). */
const FREE_SHIPPING_AT = 7500;

const ASSURANCE = ["Samples at checkout", "Free returns", "Secure checkout"];

/**
 * Bag drawer.
 *
 * Slides in from the right over a soft white scrim, with a shipping-threshold
 * bar pinned above the line items, a scrolling body, and a fixed ledger +
 * checkout action at the bottom.
 */
export default function CartDrawer() {
  const { isOpen, close } = useUI();
  const open = isOpen("cart");
  const { cart, count, isEmpty, setQuantity } = useCart();
  const [promoOpen, setPromoOpen] = useState(true);

  useBodyLock(open);

  const currency = cart.totals ?? {};
  const subtotal = useMemo(
    () => Number(currency.total_items ?? itemsSubtotal(cart.items)),
    [currency.total_items, cart.items]
  );

  const remaining = Math.max(0, FREE_SHIPPING_AT - subtotal);
  const progress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_AT) * 100));

  return (
    <>
      <div className="drawer-scrim drawer-scrim--soft" data-open={open} onClick={close} aria-hidden="true" />

      <aside
        className="drawer drawer--right cart-drawer"
        data-open={open}
        role="dialog"
        aria-modal={open}
        aria-labelledby="cart-drawer-title"
        aria-hidden={!open}
      >
        <div className="drawer__head cart-drawer__head">
          <h2 id="cart-drawer-title" className="sub-sm">
            Shopping bag ({count}) {plural(count, "item")}
          </h2>

          <button type="button" className="icon-btn" onClick={close} aria-label="Close shopping bag">
            <CloseIcon />
          </button>
        </div>

        <div className="drawer__body cart-drawer__body">
          {isEmpty ? (
            <EmptyBag onClose={close} />
          ) : (
            <>
              <div className="ship-meter">
                <p className="ship-meter__msg">
                  {remaining > 0 ? (
                    <>
                      Add <strong>{money(remaining, currency)}</strong> more for free shipping
                    </>
                  ) : (
                    <>You now have free shipping.</>
                  )}
                </p>

                <div className="ship-meter__track" role="progressbar" aria-valuemin={0} aria-valuemax={FREE_SHIPPING_AT} aria-valuenow={subtotal} aria-label="Progress towards free shipping">
                  <span className="ship-meter__fill" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <ul className="cart-list">
                {cart.items.map((item) => (
                  <CartLine key={item.key} item={item} onChange={(qty) => setQuantity(item.key, qty)} />
                ))}
              </ul>

              <PromoCode open={promoOpen} onToggle={() => setPromoOpen((value) => !value)} />
            </>
          )}
        </div>

        {!isEmpty ? (
          <div className="drawer__foot cart-drawer__foot">
            <Ledger cart={cart} />

            <div className="cart-drawer__actions">
              <Link to="/checkout" className="btn btn--lg btn--block" onClick={close}>
                Checkout
                <ArrowIcon />
              </Link>

              <Link to="/cart" className="btn btn--quiet btn--block" onClick={close}>
                View bag
              </Link>
            </div>

            <div className="assurance cart-drawer__assurance">
              {ASSURANCE.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        ) : null}
      </aside>
    </>
  );
}

function CartLine({ item, onChange }) {
  const { busy } = useCart();
  const image = item.images?.[0];
  const variation = item.variation?.length ? item.variation.map((v) => v.value).join(", ") : "";

  return (
    <li className="cart-line" data-busy={busy.has(`item:${item.key}`) || undefined}>
      <Link to={`/product/${item.slug ?? item.id}`} className="cart-line__media" tabIndex={-1} aria-hidden="true">
        {image ? <img src={image.thumbnail ?? image.src} alt="" loading="lazy" /> : null}
      </Link>

      <div className="cart-line__info">
        <div className="cart-line__top">
          <div className="cart-line__names">
            <Link to={`/product/${item.slug ?? item.id}`} className="cart-line__name">
              {item.name}
            </Link>
            {variation ? <span className="cart-line__variant">{variation}</span> : null}
          </div>

          <span className="lead-sm cart-line__price">{money(item.totals?.line_total, item.totals)}</span>
        </div>

        <div className="cart-line__controls">
          <QuantityStepper
            value={item.quantity}
            onChange={onChange}
            min={Math.max(1, item.quantity_limits?.minimum ?? 1)}
            max={item.quantity_limits?.maximum ?? 9999}
            label={`quantity of ${item.name}`}
          />

          <RemoveButton itemKey={item.key} name={item.name} />
        </div>
      </div>
    </li>
  );
}

function RemoveButton({ itemKey, name }) {
  const { removeItem, busy } = useCart();
  const pending = busy.has(`item:${itemKey}`);

  return (
    <button
      type="button"
      className="cart-line__remove"
      onClick={() => removeItem(itemKey)}
      disabled={pending}
      aria-label={name ? `Remove ${name} from bag` : "Remove item from bag"}
    >
      <CloseIcon size={14} />
    </button>
  );
}

function PromoCode({ open, onToggle }) {
  const { cart, applyCoupon, removeCoupon, busy } = useCart();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const pending = busy.has("coupon");

  async function submit(event) {
    event.preventDefault();
    if (!code.trim()) return;

    setMessage("");
    const result = await applyCoupon(code.trim());

    if (result) setCode("");
    else setMessage("That code couldn’t be applied.");
  }

  return (
    <div className="promo">
      <button type="button" className="promo__toggle" onClick={onToggle} aria-expanded={open}>
        <span className="sub-xs">Have a promo code?</span>
        <span className="acc__icon" data-open={open || undefined} aria-hidden="true" />
      </button>

      <div className="promo__panel" data-open={open}>
        <div>
          {cart.coupons?.length ? (
            <ul className="promo__codes">
              {cart.coupons.map((coupon) => (
                <li key={coupon.code}>
                  <span className="promo__code">
                    <CheckIcon size={12} />
                    {coupon.code}
                  </span>
                  <button
                    type="button"
                    className="promo__remove"
                    onClick={() => removeCoupon(coupon.code)}
                    aria-label={`Remove discount code ${coupon.code}`}
                  >
                    <CloseIcon size={12} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <form className="promo__form" onSubmit={submit}>
              <input
                className="promo__input"
                type="text"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="Enter code"
                aria-label="Discount code"
              />
              <button type="submit" className="btn" disabled={pending || !code.trim()}>
                {pending ? "Applying…" : "Apply"}
              </button>
            </form>
          )}

          {message ? (
            <p className="field__error" role="alert">
              {message}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function Ledger({ cart, showEstimate = false }) {
  const totals = cart.totals ?? {};
  const subtotal = Number(totals.total_items ?? 0);
  const shipping = totals.total_shipping === null || totals.total_shipping === undefined
    ? null
    : Number(totals.total_shipping);
  const discount = Number(totals.total_discount ?? 0);
  const total = Number(totals.total_price ?? 0);

  const metThreshold = subtotal >= FREE_SHIPPING_AT;

  return (
    <div className="ledger">
      <div className="ledger__row">
        <span>Subtotal</span>
        <span className="lead-sm">{money(subtotal, totals)}</span>
      </div>

      {discount > 0 ? (
        <div className="ledger__row ledger__row--discount">
          <span>Discount</span>
          <span>−{money(discount, totals)}</span>
        </div>
      ) : null}

      <div className="ledger__row">
        <span>Shipping</span>
        <span className="ledger__muted">
          {shipping === null ? "Calculated at checkout" : metThreshold && shipping === 0 ? "Free" : money(shipping, totals)}
        </span>
      </div>

      <div className="ledger__row">
        <span>Tax</span>
        <span className="ledger__muted">Calculated at checkout</span>
      </div>

      {showEstimate ? (
        <div className="ledger__row ledger__row--total">
          <span className="lead-md">Estimated Total</span>
          <span className="lead-md">{money(total, totals)}</span>
        </div>
      ) : null}
    </div>
  );
}

function EmptyBag({ onClose }) {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    let alive = true;
    loadBestSellers(3).then((items) => alive && setSuggestions(items));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="cart-empty">
      <BagIcon size={28} />
      <p className="sub-sm">Your bag is empty.</p>

      <Link to="/shop" className="btn btn--secondary" onClick={onClose}>
        Shop All
      </Link>

      {suggestions.length ? (
        <div className="cart-empty__recs">
          <p className="sub-xs muted">Best sellers</p>
          {suggestions.map((product) => (
            <MiniRow key={product.id} product={product} onNavigate={onClose} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export { FREE_SHIPPING_AT, ASSURANCE };
