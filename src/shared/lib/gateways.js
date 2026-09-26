/**
 * WooCommerce payment gateway labels.
 *
 * The Store API cart only returns gateway *ids* (`payment_methods: ["cod",
 * "bacs"]`) — it never ships human-readable titles to guests, so the storefront
 * owns the wording. Anything not listed here falls back to a prettified id, so a
 * newly enabled gateway still renders instead of appearing blank.
 */
const GATEWAY_LABELS = {
  cod: { name: "Cash on delivery", description: "Pay with cash when your order is delivered." },
  bacs: { name: "Direct bank transfer", description: "Transfer your payment directly to our bank account." },
  cheque: { name: "Check payments", description: "Send a check to our store with your order." },
  paypal: { name: "PayPal", description: "Pay securely with your PayPal account." },
  "woocommerce-gateway-stripe": { name: "Credit / debit card", description: "Pay securely with your card." },
  stripe: { name: "Credit / debit card", description: "Pay securely with your card." },
  klarna: { name: "Klarna", description: "Four interest-free payments at checkout." },
  affirm: { name: "Affirm", description: "Pay over time with a quick credit check." },
  "afterpay-pay-later": { name: "Afterpay", description: "Four interest-free payments at checkout." },
  apple_pay: { name: "Apple Pay", description: "Pay with your Apple wallet." },
  google_pay: { name: "Google Pay", description: "Pay with your Google wallet." }
};

/** Fall back to a readable label, e.g. "my_custom_gateway" -> "My custom gateway". */
function prettify(id) {
  return String(id)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

/** Turn the cart's gateway id list into renderable options. */
export function describeGateways(ids = []) {
  return ids.map((id) => {
    const known = GATEWAY_LABELS[id];
    return {
      id,
      name: known?.name ?? prettify(id),
      description: known?.description ?? ""
    };
  });
}
