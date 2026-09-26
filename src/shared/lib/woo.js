/**
 * WooCommerce Store API client.
 *
 * Everything the storefront renders comes from here:
 *   /wp-json/wc/store/v1/products          catalogue
 *   /wp-json/wc/store/v1/products/categories  taxonomy
 *   /wp-json/wc/store/v1/cart             session cart
 *   /wp-json/wc/store/v1/checkout         order placement
 *
 * Dev requests are proxied through Vite (see vite.config.js), which is why we
 * talk to the relative `/woo-api` prefix rather than an absolute host.
 */

const STORE = "/woo-api";
const WP = "/wp-api";

const TOKEN_KEY = "cereve.cart.token";

/** Guest cart token, persisted so a reload keeps the bag. */
let cartToken = readToken();
let nonce = null;

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

function writeToken(value) {
  cartToken = value;
  try {
    localStorage.setItem(TOKEN_KEY, value);
  } catch {
    /* private mode — session-only cart */
  }
}

export class WooError extends Error {
  constructor(message, { status, code, data } = {}) {
    super(message);
    this.name = "WooError";
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

function buildHeaders({ body, withCart }) {
  const headers = { Accept: "application/json" };

  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (withCart) {
    if (cartToken) headers["Cart-Token"] = cartToken;
    if (nonce) headers.Nonce = nonce;
  }
  return headers;
}

function absorbHeaders(res) {
  const token = res.headers.get("cart-token");
  if (token && token !== cartToken) writeToken(token);

  const freshNonce = res.headers.get("nonce");
  if (freshNonce) nonce = freshNonce;
}

async function request(path, { method = "GET", body, withCart = false, base = STORE } = {}) {
  let res;

  try {
    res = await fetch(`${base}${path}`, {
      method,
      headers: buildHeaders({ body, withCart }),
      credentials: "include",
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch {
    throw new WooError("Network request failed. Check your connection.", { status: 0 });
  }

  absorbHeaders(res);

  if (res.status === 204) return null;

  const text = await res.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) throw toError(data, res.status);

  return data;
}

function toError(data, status) {
  if (data && typeof data === "object") {
    const message =
      data.message ||
      data.code ||
      (Array.isArray(data.data) ? data.data[0]?.message : null) ||
      "Request failed";

    return new WooError(message, { status, code: data.code, data: data.data });
  }

  return new WooError(typeof data === "string" && data ? data : "Request failed", {
    status
  });
}

function query(params) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }

  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/* ------------------------------------------------------------------ *
 * Catalogue
 * ------------------------------------------------------------------ */

const PRODUCT_FIELDS = [
  "id",
  "name",
  "slug",
  "type",
  "sku",
  "permalink",
  "short_description",
  "description",
  "on_sale",
  "has_options",
  "is_purchasable",
  "is_in_stock",
  "is_on_backorder",
  "low_stock_remaining",
  "stock_availability",
  "average_rating",
  "review_count",
  "images",
  "categories",
  "tags",
  "attributes",
  "variations",
  "grouped_products",
  "prices",
  "price_html"
].join(",");

const LIST_FIELDS = [
  "id",
  "name",
  "slug",
  "permalink",
  "on_sale",
  "is_purchasable",
  "is_in_stock",
  "images",
  "categories",
  "attributes",
  "prices",
  "price_html",
  "average_rating",
  "review_count"
].join(",");

function unwrapPriceHtml(html) {
  if (typeof html !== "string") return null;

  // The Store API hands back a fragment of WooCommerce's own price template.
  // It is trustworthy output, but we only want the visible money out of it so
  // the storefront can style amounts itself instead of inheriting theme CSS.
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll(".screen-reader-text").forEach((node) => node.remove());

  return {
    regular: doc.querySelector("del .amount")?.textContent.trim() ?? null,
    sale: doc.querySelector("ins .amount")?.textContent.trim() ?? null,
    current: doc.querySelector("ins .amount, .amount")?.textContent.trim() ?? null
  };
}

/**
 * Fetch a page of products. Returns `{ items, total, totalPages }`.
 */
export async function getProducts({
  page = 1,
  perPage = 12,
  search = "",
  category = "",
  categories = "",
  tag = "",
  onSale = false,
  featured = false,
  orderby = "menu_order",
  order = "asc",
  minPrice,
  maxPrice,
  stockStatus = "",
  slug = "",
  include = ""
} = {}) {
  const path = `/products${query({
    page,
    per_page: perPage,
    search,
    category,
    categories,
    tag,
    on_sale: onSale ? "true" : undefined,
    featured: featured ? "true" : undefined,
    orderby,
    order,
    min_price: minPrice,
    max_price: maxPrice,
    stock_status: stockStatus,
    slug,
    include,
    _fields: LIST_FIELDS
  })}`;

  const res = await fetch(`${STORE}${path}`, {
    headers: { Accept: "application/json" }
  });

  if (!res.ok) throw toError(await res.json().catch(() => null), res.status);

  const body = await res.json();
  const items = (Array.isArray(body) ? body : []).map(withPriceParts);

  return {
    items,
    total: Number(res.headers.get("x-wp-total") ?? items.length),
    totalPages: Number(res.headers.get("x-wp-totalpages") ?? 1)
  };
}

function withPriceParts(product) {
  const parts = unwrapPriceHtml(product.price_html);
  const meta = product.prices ?? {};

  return {
    ...product,
    image: product.images?.[0] ?? null,
    hoverImage: product.images?.[1] ?? null,
    priceParts: {
      regular: parts?.regular ?? null,
      sale: parts?.sale ?? null,
      current: parts?.current ?? formatMinor(meta.price, meta)
    }
  };
}

function formatMinor(minor, meta) {
  if (minor === undefined || minor === null) return null;
  const value = Number(minor) / 10 ** (meta?.currency_minor_unit ?? 2);
  const symbol = meta?.currency_symbol ?? "$";
  return `${symbol}${value.toFixed(meta?.currency_minor_unit ?? 2)}`;
}

/** Fetch a single product by slug. */
export async function getProductBySlug(slug) {
  const { items } = await getProducts({ slug, perPage: 1 });

  if (!items.length) throw new WooError("Product not found", { status: 404 });

  return getProduct(Number(items[0].id));
}

/** Fetch the full detail payload for a product id. */
export async function getProduct(id) {
  const product = await request(`/products/${id}${query({ _fields: PRODUCT_FIELDS })}`);
  const enriched = withPriceParts(product);

  return {
    ...enriched,
    categories: product.categories ?? [],
    descriptionHtml: product.description ?? "",
    shortDescriptionHtml: product.short_description ?? "",
    galleries: resolveGallery(product)
  };
}

/**
 * Variable products expose a shallow stub for each variation; the Store API
 * hands back the real set through /products/<id>/variations.
 */
async function resolveGallery(product) {
  const base = {
    main: product.images?.[0] ?? null,
    thumbs: (product.images ?? []).slice(0, 6)
  };

  if (product.type !== "variable" || !product.variations?.length) return base;

  return base;
}

export async function getProductVariations(productId, perPage = 100) {
  const variations = await request(
    `/products/${productId}/variations${query({
      per_page: perPage,
      _fields:
        "id,sku,name,attributes,images,prices,price_html,is_in_stock,is_purchasable,stock_availability,on_sale,has_options"
    })}`
  );

  return (Array.isArray(variations) ? variations : []).map(withPriceParts);
}

/* ------------------------------------------------------------------ *
 * Taxonomy
 * ------------------------------------------------------------------ */

export async function getProductCategories({ perPage = 100, hideEmpty = true } = {}) {
  const categories = await request(
    `/products/categories${query({ per_page: perPage, hide_empty: hideEmpty ? "true" : undefined })}`
  );

  return Array.isArray(categories) ? categories : [];
}

export async function getProductTags({ perPage = 100 } = {}) {
  const tags = await request(`/products/tags${query({ per_page: perPage })}`);
  return Array.isArray(tags) ? tags : [];
}

/* ------------------------------------------------------------------ *
 * Cart
 * ------------------------------------------------------------------ */

export async function getCart() {
  return request(`/cart`, { withCart: true });
}

export async function addToCart({ id, quantity = 1, variationId }) {
  return request(`/cart/items`, {
    method: "POST",
    withCart: true,
    body: { id, quantity, variation_id: variationId }
  });
}

export async function updateCartItem(key, { quantity, variationId }) {
  return request(`/cart/items/${encodeURIComponent(key)}`, {
    method: "PUT",
    withCart: true,
    body: { quantity, variation_id: variationId }
  });
}

export async function removeCartItem(key) {
  return request(`/cart/items/${encodeURIComponent(key)}`, {
    method: "DELETE",
    withCart: true
  });
}

export async function applyCoupon(code) {
  return request(`/cart/apply-coupon`, {
    method: "POST",
    withCart: true,
    body: { code }
  });
}

export async function removeCoupon(code) {
  return request(`/cart/remove-coupon`, {
    method: "POST",
    withCart: true,
    body: { code }
  });
}

/** Push the shopper's address into the cart so shipping can be quoted. */
export async function updateCustomer(cart, address) {
  return request(`/cart/update-customer`, {
    method: "POST",
    withCart: true,
    body: {
      billing_address: { ...address, email: cart?.billing_address?.email || address.email },
      shipping_address: address
    }
  });
}

export async function selectShippingRate(packageId, rateId) {
  return request(`/cart/select-shipping-rate`, {
    method: "POST",
    withCart: true,
    body: { package_id: packageId, rate_id: rateId }
  });
}

export async function placeOrder({ billingAddress, shippingAddress, paymentMethod, customerNote }) {
  return request(`/checkout`, {
    method: "POST",
    withCart: true,
    body: {
      billing_address: billingAddress,
      shipping_address: shippingAddress,
      payment_method: paymentMethod,
      customer_note: customerNote
    }
  });
}

/* ------------------------------------------------------------------ *
 * WordPress core
 * ------------------------------------------------------------------ */

export async function getPages({ perPage = 50 } = {}) {
  const pages = await request(`/wp/v2/pages${query({ per_page: perPage, _fields: "id,slug,title,link,parent" })}`, {
    base: WP
  });

  return Array.isArray(pages) ? pages : [];
}

export async function getPage(slug) {
  const pages = await getPages({ perPage: 100 });
  return pages.find((page) => page.slug === slug) ?? null;
}

export function getCartToken() {
  return cartToken;
}

/* ------------------------------------------------------------------ *
 * Customer session
 *
 * Served by the cereve-storefront-auth MU plugin, which wraps the WP core
 * user functions so the session is a real auth cookie (no application
 * passwords, no admin exposure).
 * ------------------------------------------------------------------ */

function customer(path, options) {
  return request(`/customer${path}`, { base: STORE, ...options });
}

export async function createCustomer(payload) {
  return customer("", { method: "POST", body: payload });
}

export async function loginCustomer({ email, password }) {
  return customer("/login", { method: "POST", body: { email, password } });
}

export async function logoutCustomer() {
  return customer("/logout", { method: "POST" });
}

/** Throws WooError 401 when there is no valid session. */
export async function getCustomer() {
  return customer("");
}

export async function saveCustomer(patch) {
  return customer("", { method: "PUT", body: patch });
}

export async function getCustomerOrders({ perPage = 20, page = 1 } = {}) {
  const data = await customer(`/orders${query({ per_page: perPage, page })}`);

  return {
    items: Array.isArray(data?.items) ? data.items : [],
    total: Number(data?.total) || 0,
    page: Number(data?.page) || 1
  };
}
