import { money } from "../../../shared/lib/format.js";
import { LeadMd, LeadSm } from "../../../shared/ui/primitives.js";
import {
  Ledger as LedgerBox,
  LedgerMuted,
  LedgerRow
} from "../cart.css.js";
import { FREE_SHIPPING_AT } from "../constants.js";

/** Order totals. `showEstimate` adds the estimated total the bag page needs. */
export function Ledger({ cart, showEstimate = false }) {
  const totals = cart.totals ?? {};
  const subtotal = Number(totals.total_items ?? 0);
  const shipping =
    totals.total_shipping === null || totals.total_shipping === undefined
      ? null
      : Number(totals.total_shipping);
  const discount = Number(totals.total_discount ?? 0);
  const total = Number(totals.total_price ?? 0);

  const metThreshold = subtotal >= FREE_SHIPPING_AT;

  return (
    <LedgerBox>
      <LedgerRow>
        <span>Subtotal</span>
        <LeadSm>{money(subtotal, totals)}</LeadSm>
      </LedgerRow>

      {discount > 0 ? (
        <LedgerRow $discount>
          <span>Discount</span>
          <span>−{money(discount, totals)}</span>
        </LedgerRow>
      ) : null}

      <LedgerRow>
        <span>Shipping</span>
        <LedgerMuted>
          {shipping === null
            ? "Calculated at checkout"
            : metThreshold && shipping === 0
              ? "Free"
              : money(shipping, totals)}
        </LedgerMuted>
      </LedgerRow>

      <LedgerRow>
        <span>Tax</span>
        <LedgerMuted>Calculated at checkout</LedgerMuted>
      </LedgerRow>

      {showEstimate ? (
        <LedgerRow $total>
          <LeadMd>Estimated Total</LeadMd>
          <LeadMd>{money(total, totals)}</LeadMd>
        </LedgerRow>
      ) : null}
    </LedgerBox>
  );
}
