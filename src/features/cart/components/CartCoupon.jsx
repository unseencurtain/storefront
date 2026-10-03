import { useState } from "react";
import { useCart } from "../CartContext.jsx";
import { CheckIcon, CloseIcon } from "../../../shared/ui/Icons.jsx";
import { Button, FieldError } from "../../../shared/ui/primitives.js";
import {
  PromoCode,
  PromoCodes,
  PromoForm,
  PromoInput,
  PromoRemove
} from "../cart.css.js";

/** Coupon control shared by the full shopping-bag page. */
export function CartCoupon() {
  const { cart, applyCoupon, removeCoupon, busy, error } = useCart();
  const [code, setCode] = useState("");
  const pending = busy.has("coupon") || [...busy].some((key) => key.startsWith("coupon:"));
  const coupons = cart.coupons ?? [];

  async function submit(event) {
    event.preventDefault();
    const value = code.trim();
    if (!value || pending) return;

    const result = await applyCoupon(value);
    if (result) setCode("");
  }

  return (
    <div>
      <PromoForm onSubmit={submit}>
        <PromoInput
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Discount code or gift card"
          aria-label="Discount code"
        />
        <Button type="submit" disabled={pending || !code.trim()}>
          {pending ? "Applying…" : "Apply"}
        </Button>
      </PromoForm>

      {coupons.length ? (
        <PromoCodes>
          {coupons.map((coupon) => (
            <li key={coupon.code}>
              <PromoCode>
                <CheckIcon size={12} />
                {coupon.code}
              </PromoCode>
              <PromoRemove
                disabled={pending}
                onClick={() => removeCoupon(coupon.code)}
                aria-label={`Remove discount code ${coupon.code}`}
              >
                <CloseIcon size={12} />
              </PromoRemove>
            </li>
          ))}
        </PromoCodes>
      ) : null}

      {error ? <FieldError role="alert">{error}</FieldError> : null}
    </div>
  );
}
