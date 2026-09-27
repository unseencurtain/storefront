import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../CartContext.jsx";
import { useUI, useBodyLock } from "../../../shared/UIContext.jsx";
import { money, itemsSubtotal, plural } from "../../../shared/lib/format.js";
import { loadBestSellers } from "../../../shared/lib/catalog.js";
import { CartLine } from "./CartLine.jsx";
import { Ledger } from "./Ledger.jsx";
import { FREE_SHIPPING_AT, ASSURANCE } from "../constants.js";
import { MiniRow } from "../../catalog/components/ProductCard.jsx";
import { CloseIcon, BagIcon, ArrowIcon, CheckIcon } from "../../../shared/ui/Icons.jsx";
import {
  Button,
  FieldError,
  IconButton,
  LeadMd,
  SubSm,
  SubXs
} from "../../../shared/ui/primitives.js";
import { Drawer, DrawerHead, Scrim } from "../../layout/components/chrome.js";
import {
  AccIcon,
  CartDrawerBody,
  CartDrawerFoot,
  DrawerActions,
  DrawerAssurance,
  DrawerEstimate,
  DrawerLedger,
  EmptyBag,
  EmptyRecs,
  LineList,
  MeterFill,
  MeterMsg,
  MeterTrack,
  Promo,
  PromoCode,
  PromoCodes,
  PromoForm,
  PromoInput,
  PromoPanel,
  PromoRemove,
  PromoToggle,
  ShipMeter
} from "../cart.css.js";

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
  const bodyRef = useRef(null);

  useBodyLock(open);

  useLayoutEffect(() => {
    if (!open) return;
    const body = bodyRef.current;
    if (body) body.scrollTop = body.scrollHeight;
  }, [open, count]);

  const currency = cart.totals ?? {};
  const subtotal = useMemo(
    () => Number(currency.total_items ?? itemsSubtotal(cart.items)),
    [currency.total_items, cart.items]
  );

  const remaining = Math.max(0, FREE_SHIPPING_AT - subtotal);
  const progress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_AT) * 100));

  return (
    <>
      <Scrim $open={open} $tone="soft" $z={70} onClick={close} aria-hidden="true" />

      <Drawer
        $open={open}
        $side="right"
        role="dialog"
        aria-modal={open}
        aria-labelledby="cart-drawer-title"
        aria-hidden={!open}
      >
        <DrawerHead>
          <SubSm as="h2" id="cart-drawer-title">
            Shopping bag ({count}) {plural(count, "item")}
          </SubSm>

          <IconButton type="button" onClick={close} aria-label="Close shopping bag">
            <CloseIcon />
          </IconButton>
        </DrawerHead>

        <CartDrawerBody ref={bodyRef}>
          {isEmpty ? (
            <EmptyBagBody onClose={close} />
          ) : (
            <>
              <ShipMeter>
                <MeterMsg>
                  {remaining > 0 ? (
                    <>
                      Add <strong>{money(remaining, currency)}</strong> more for free shipping
                    </>
                  ) : (
                    <>You now have free shipping.</>
                  )}
                </MeterMsg>

                <MeterTrack role="progressbar" aria-valuemin={0} aria-valuemax={FREE_SHIPPING_AT} aria-valuenow={subtotal} aria-label="Progress towards free shipping">
                  <MeterFill style={{ width: `${progress}%` }} />
                </MeterTrack>
              </ShipMeter>

              <LineList>
                {cart.items.map((item) => (
                  <CartLine key={item.key} item={item} onChange={(qty) => setQuantity(item.key, qty)} />
                ))}
              </LineList>

              {/* Totals sit with the items, above the promo field — the pinned
                  foot carries actions only. */}
              <DrawerLedger>
                <Ledger cart={cart} />
              </DrawerLedger>

              <PromoSection open={promoOpen} onToggle={() => setPromoOpen((value) => !value)} />
            </>
          )}
        </CartDrawerBody>

        {!isEmpty ? (
          <CartDrawerFoot>
            <DrawerEstimate>
              <LeadMd $weight={800}>Estimated Total</LeadMd>
              <LeadMd $weight={800}>
                {money(Number(cart.totals?.total_price ?? 0), currency)} {currency.currency_code}
              </LeadMd>
            </DrawerEstimate>

            <DrawerActions>
              <Button as={Link} to="/checkout" $block onClick={close}>
                Checkout
                <ArrowIcon />
              </Button>

              <Button as={Link} to="/cart" $quiet $block onClick={close}>
                View bag
              </Button>
            </DrawerActions>

            <DrawerAssurance>
              {ASSURANCE.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </DrawerAssurance>
          </CartDrawerFoot>
        ) : null}
      </Drawer>
    </>
  );
}

function PromoSection({ open, onToggle }) {
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
    <Promo>
      <PromoToggle onClick={onToggle} aria-expanded={open}>
        <SubXs>Have a promo code?</SubXs>
        <AccIcon $open={open} aria-hidden="true" />
      </PromoToggle>

      <PromoPanel $open={open}>
        <div>
          {cart.coupons?.length ? (
            <PromoCodes>
              {cart.coupons.map((coupon) => (
                <li key={coupon.code}>
                  <PromoCode>
                    <CheckIcon size={12} />
                    {coupon.code}
                  </PromoCode>
                  <PromoRemove
                    onClick={() => removeCoupon(coupon.code)}
                    aria-label={`Remove discount code ${coupon.code}`}
                  >
                    <CloseIcon size={12} />
                  </PromoRemove>
                </li>
              ))}
            </PromoCodes>
          ) : (
            <PromoForm onSubmit={submit}>
              <PromoInput
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="Enter code"
                aria-label="Discount code"
              />
              <Button type="submit" disabled={pending || !code.trim()}>
                {pending ? "Applying…" : "Apply"}
              </Button>
            </PromoForm>
          )}

          {message ? (
            <FieldError role="alert">{message}</FieldError>
          ) : null}
        </div>
      </PromoPanel>
    </Promo>
  );
}

function EmptyBagBody({ onClose }) {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    let alive = true;
    loadBestSellers(3).then((items) => alive && setSuggestions(items));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <EmptyBag>
      <BagIcon size={28} />
      <SubSm>Your bag is empty.</SubSm>

      <Button as={Link} to="/shop" $variant="secondary" onClick={onClose}>
        Shop All
      </Button>

      {suggestions.length ? (
        <EmptyRecs>
          <SubXs $muted>Best sellers</SubXs>
          {suggestions.map((product) => (
            <MiniRow key={product.id} product={product} onNavigate={onClose} />
          ))}
        </EmptyRecs>
      ) : null}
    </EmptyBag>
  );
}
