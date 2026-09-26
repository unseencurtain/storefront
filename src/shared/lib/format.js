/** Formatting and cart-shape helpers shared across the storefront. */

/** Format a WooCommerce minor-unit integer as a localised money string. */
export function money(minor, currency = {}) {
  const unit = currency.currency_minor_unit ?? 2;
  const value = Number(minor ?? 0) / 10 ** unit;
  const digits = unit === 0 ? 0 : unit;

  let formatted = value.toFixed(digits);
  const separator = currency.currency_thousand_separator ?? ",";
  const decimal = currency.currency_decimal_separator ?? ".";

  const [whole, fraction] = formatted.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, separator);

  formatted = fraction ? `${grouped}${decimal}${fraction}` : grouped;

  return `${currency.currency_prefix ?? "$"}${formatted}${currency.currency_suffix ?? ""}`;
}

/** Sum a list of cart items into WooCommerce minor units. */
export function itemsSubtotal(items = []) {
  return items.reduce((sum, item) => sum + Number(item.totals?.line_subtotal ?? 0), 0);
}

export function itemsCount(items = []) {
  return items.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0);
}

/** "Limited edition" -> "Limited Edition" for use in nav + titles. */
export function titleCase(value = "") {
  return value
    .replace(/[&]/g, " and ")
    .replace(/['’]/g, "")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function plural(count, singular, pluralForm) {
  return count === 1 ? singular : (pluralForm ?? `${singular}s`);
}

export function discountPercent(prices = {}) {
  const sale = Number(prices.sale_price ?? 0);
  const regular = Number(prices.regular_price ?? 0);

  if (!sale || !regular || regular <= sale) return null;

  return Math.round(((regular - sale) / regular) * 100);
}

/** Options chosen on a variable product, e.g. ["Medium", "Blue"]. */
export function chosenOptionLabels(variation) {
  if (!variation?.attributes) return [];

  return Object.values(variation.attributes)
    .map((attribute) => (typeof attribute === "string" ? attribute : attribute?.option))
    .filter(Boolean);
}

/**
 * Colour-ish swatch detection so product options can render as dots when the
 * term name is recognisably a shade.
 */
const SHADE_WORDS =
  /\b(black|white|cream|ivory|beige|nude|tan|brown|chocolate|coffee|mocha|red|crimson|scarlet|maroon|pink|rose|blush|coral|peach|orange|rust|amber|yellow|gold|olive|green|sage|emerald|teal|blue|navy|denim|lilac|purple|violet|lavender|grey|gray|silver|bronze|copper|clear|transparent)\b/i;

export function isShade(label = "") {
  return SHADE_WORDS.test(label);
}

/** Deterministic colour for a shade name when the store provides no swatch. */
export function shadeColor(label = "") {
  const named = {
    black: "#1c1c1c",
    white: "#f4f1ec",
    cream: "#f0e7d8",
    ivory: "#f2ece0",
    beige: "#e3d5c3",
    nude: "#e0c3ad",
    tan: "#d2a679",
    brown: "#7a4f37",
    chocolate: "#4a2f24",
    coffee: "#5a3a2e",
    mocha: "#8a6a55",
    red: "#b3242b",
    crimson: "#a01c30",
    scarlet: "#c02b31",
    maroon: "#5c1f2b",
    pink: "#eaa7b3",
    rose: "#d78194",
    blush: "#e8b7b0",
    coral: "#f0806c",
    peach: "#f3bda2",
    orange: "#e07a35",
    rust: "#a2542a",
    amber: "#d99323",
    yellow: "#e5c53f",
    gold: "#c9a227",
    olive: "#7a7a3c",
    green: "#4f7a4a",
    sage: "#9aab90",
    emerald: "#2e6b52",
    teal: "#3f7d80",
    blue: "#3b5b8c",
    navy: "#22304f",
    denim: "#4a6a96",
    lilac: "#b9a3d4",
    purple: "#6a4b8a",
    violet: "#6b3f8f",
    lavender: "#b6a3c7",
    grey: "#9a9a9a",
    gray: "#9a9a9a",
    silver: "#c4c6c8",
    bronze: "#8c6239",
    copper: "#b87333",
    clear: "#eef1f2"
  };

  const key = String(label).toLowerCase();

  for (const [name, hex] of Object.entries(named)) {
    if (key.includes(name)) return hex;
  }

  // Stable fallback derived from the string so the same option always matches.
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charAt(i)) % 360;
  return `hsl(${hash} 26% 72%)`;
}

/* ------------------------------------------------------------------ *
 * Order records
 *
 * Orders come from the customer endpoint rather than the Store API, so totals
 * arrive as decimal strings ("129.00") instead of minor-unit integers.
 * ------------------------------------------------------------------ */

/** Format a decimal string from an order record for display. */
export function decimalMoney(value, currencyCode = "USD") {
  const parsed = Number(value ?? 0);
  const amount = Number.isFinite(parsed) ? parsed : 0;

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode || "USD"
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

/** Format a WooCommerce date string as "12 March 2026". */
export function formatDate(value) {
  if (!value) return "";

  const date = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}
