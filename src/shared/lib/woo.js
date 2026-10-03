/**
 * WooCommerce Store API client.
 *
 * Everything the storefront renders comes from here:
 *   /wp-json/wc/store/v1/products          catalogue
 *   /wp-json/wc/store/v1/products/categories  taxonomy
 *   /wp-json/wc/store/v1/cart             session cart
 *   /wp-json/wc/store/v1/checkout         order placement
 *
 * In development Vite proxies `/woo-api` and `/wp-api` (see vite.config.js).
 * In production Caddy serves the SPA on the same host as WordPress, so we
 * talk to the real REST prefixes and keep auth cookies first-party.
 */

import { decodeEntities } from "./format.js";

const STORE = import.meta.env.DEV ? "/woo-api" : "/wp-json/wc/store/v1";
const WP = import.meta.env.DEV ? "/wp-api" : "/wp-json";

const TOKEN_KEY = "cosmetic.cart.token";

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

let priming = null;

/**
 * Woo rejects every cart mutation that arrives without a valid Nonce, and the
 * nonce only ever arrives on a response. A cold session had none, so the first
 * add-to-bag raced the cart read and came back 401. That left the cart without
 * an address, so the shipping calculator matched no zone and checkout reported
 * "No shipping options are available for this address" no matter what address
 * was entered. Read the cart once to obtain a nonce before mutating.
 */
function primeNonce() {
  if (nonce) return Promise.resolve();
  if (!priming) {
    priming = request("/cart")
      .catch(() => null)
      .finally(() => {
        priming = null;
      });
  }
  return priming;
}

async function request(path, { method = "GET", body, withCart = false, base = STORE } = {}) {
  if (withCart && method !== "GET") await primeNonce();

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

function query(params, extras = []) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }

  for (const [key, value] of extras) {
    if (value === undefined || value === null || value === "") continue;
    search.append(key, String(value));
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
  "brands",
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
  "brands",
  "attributes",
  "stock_availability",
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
  brand = "",
  tag = "",
  onSale = false,
  featured = false,
  orderby = "menu_order",
  order = "asc",
  minPrice,
  maxPrice,
  stockStatus = "instock",
  slug = "",
  include = "",
  attribute = "",
  attributeTermId = ""
} = {}) {
  const eanSearch = search.trim().replace(/[\s-]/g, "");
  if (/^\d{8,14}$/.test(eanSearch)) {
    const match = await findProductByEan(eanSearch).catch(() => null);
    if (!match) return { items: [], total: 0, totalPages: 0 };

    const result = await getProducts({
      page: 1,
      perPage: 1,
      include: String(match.id),
      category,
      categories,
      brand,
      tag,
      onSale,
      featured,
      stockStatus,
      orderby,
      order,
      minPrice,
      maxPrice,
      attribute,
      attributeTermId
    });
    return {
      ...result,
      items: result.items.map((product) => ({ ...product, ean: match.ean }))
    };
  }

  const extras = [];
  if (attribute && attributeTermId) {
    extras.push(["attributes[0][attribute]", attribute]);
    extras.push(["attributes[0][term_id]", String(attributeTermId)]);
  }

  const path = `/products${query({
    page,
    per_page: perPage,
    search,
    category,
    categories,
    brand,
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
  }, extras)}`;

  const res = await fetch(`${STORE}${path}`, {
    cache: "no-store",
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

/**
 * Catalogue images are external supplier URLs served at full resolution (often
 * 300 KB–1.6 MB). Grid tiles only need ~400 px, so request smaller variants
 * where the upstream CDN supports it. Shopify's `?width=` transform is the
 * main offender; other hosts ignore the query and keep working.
 */
function cdnImageUrl(url, width) {
  if (typeof url !== "string" || !url) return url;
  try {
    const parsed = new URL(url);
    if (/(^|\.)shopify\.com$/.test(parsed.hostname) || /\.cdn\.shopify\.com$/.test(parsed.hostname)) {
      parsed.searchParams.set("width", String(width));
      return parsed.toString();
    }
  } catch {
    return url;
  }
  return url;
}

/** Build a card-sized image object with a srcset the grid can pick from. */
function cardImage(image) {
  if (!image) return null;
  const base = image.src ?? image.thumbnail ?? null;
  if (!base) return null;
  const widths = [280, 400, 560];
  const srcset = widths
    .map((width) => {
      const variant = cdnImageUrl(base, width);
      return variant === base ? null : `${variant} ${width}w`;
    })
    .filter(Boolean)
    .join(", ");
  return {
    ...image,
    src: cdnImageUrl(base, 560),
    thumbnail: cdnImageUrl(base, 400),
    srcset,
    sizes: "(max-width: 479px) 50vw, (max-width: 1023px) 33vw, 25vw"
  };
}

function withPriceParts(product) {
  const parts = unwrapPriceHtml(product.price_html);
  const meta = product.prices ?? {};

  return {
    ...product,
    name: decodeEntities(product.name),
    sku: decodeEntities(product.sku),
    // short_description stays raw: it is an HTML body, and decodeEntities is
    // only safe on plain text. The PDP renders it through the HTML sanitizer.
    categories: (product.categories ?? []).map((category) => ({
      ...category,
      name: decodeEntities(category.name)
    })),
    brands: (product.brands ?? []).map((brand) => ({
      ...brand,
      name: decodeEntities(brand.name)
    })),
    attributes: (product.attributes ?? []).map((attribute) => ({
      ...attribute,
      name: decodeEntities(attribute.name),
      terms: (attribute.terms ?? []).map((term) => ({
        ...term,
        name: decodeEntities(term.name)
      }))
    })),
    image: cardImage(product.images?.[0]),
    hoverImage: cardImage(product.images?.[1]),
    priceParts: {
      regular: parts?.regular ?? null,
      sale: parts?.sale ?? null,
      current: parts?.current ?? formatMinor(meta.price, meta)
    }
  };
}

const cartProductSlugs = new Map();

/** Woo cart rows omit the product slug, so resolve product IDs before exposing
 *  cart links. This keeps the headless product route canonical throughout bag
 *  and checkout views instead of linking to the numeric ID. */
async function withDecodedItems(cart) {
  if (!cart?.items?.length) return cart;

  const unresolvedIds = [...new Set(cart.items
    .filter((item) => !item.slug && !item.product_slug && !cartProductSlugs.has(String(item.id)))
    .map((item) => Number(item.id))
    .filter((id) => id > 0))];

  if (unresolvedIds.length) {
    try {
      const { items } = await getProducts({
        include: unresolvedIds.join(","),
        perPage: unresolvedIds.length,
        stockStatus: ""
      });
      items.forEach((product) => {
        if (product.slug) cartProductSlugs.set(String(product.id), product.slug);
      });
    } catch {
      // Keep the cart usable if the optional URL lookup fails.
    }
  }

  return {
    ...cart,
    items: cart.items.map((item) => ({
      ...item,
      slug: item.slug ?? item.product_slug ?? cartProductSlugs.get(String(item.id)) ?? "",
      name: decodeEntities(item.name),
      variation: (item.variation ?? []).map((entry) => ({
        ...entry,
        value: decodeEntities(entry.value)
      }))
    }))
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
  const { items } = await getProducts({ slug, perPage: 1, stockStatus: "" });

  if (!items.length) throw new WooError("Product not found", { status: 404 });

  return getProduct(Number(items[0].id));
}

/** Fetch the full detail payload for a product id. */
export async function getProduct(id) {
  const [product, catalogMeta] = await Promise.all([
    request(`/products/${id}${query({ _fields: PRODUCT_FIELDS })}`),
    getCatalogMetadata([id])
  ]);
  if (!catalogMeta.products?.[String(id)]) {
    throw new WooError("Product not found", { status: 404 });
  }
  const enriched = withPriceParts(product);

  return {
    ...enriched,
    categories: product.categories ?? [],
    descriptionHtml: product.description ?? "",
    shortDescriptionHtml: product.short_description ?? "",
    galleries: resolveGallery(product)
  };
}

/** Fetch WooCommerce's global unique ID (the product EAN/GTIN). */
export async function getProductEan(id) {
  const result = await request(`/cereve/v1/products/${encodeURIComponent(id)}/ean`, { base: WP });
  return typeof result?.ean === "string" ? result.ean : "";
}

/** Read supplier shipping metadata and WooCommerce's country directory in one request. */
export async function getCatalogMetadata(ids = []) {
  const uniqueIds = [...new Set(ids.map(Number).filter((id) => Number.isInteger(id) && id > 0))];
  if (!uniqueIds.length) return { products: {}, countries: {} };
  return request(`/cereve/v1/products/catalog-meta${query({ ids: uniqueIds.slice(0, 100).join(",") })}`, { base: WP });
}

/** Resolve an exact EAN through WooCommerce's indexed global-unique-ID lookup. */
async function findProductByEan(ean) {
  return request(`/cereve/v1/ean/${encodeURIComponent(ean)}`, { base: WP });
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

async function getCollection(path, params = {}) {
  const res = await fetch(`${STORE}${path}${query(params)}`, {
    headers: { Accept: "application/json" },
    credentials: "include"
  });

  if (!res.ok) throw toError(await res.json().catch(() => null), res.status);

  const body = await res.json();
  const items = Array.isArray(body) ? body : [];

  return {
    items,
    total: Number(res.headers.get("x-wp-total") ?? items.length),
    totalPages: Number(res.headers.get("x-wp-totalpages") ?? 1)
  };
}

/** Walk Store API pages. Cap so a missing per_page header cannot fire thousands of requests. */
export async function getAllCollectionPages(path, params = {}) {
  const perPage = params.per_page ?? 100;
  const first = await getCollection(path, { ...params, page: 1, per_page: perPage });
  const pages = Math.min(Math.max(Number(first.totalPages) || 1, 1), 20);

  if (pages <= 1) return first.items;

  const remaining = await Promise.all(
    Array.from({ length: pages - 1 }, (_, index) =>
      getCollection(path, { ...params, page: index + 2, per_page: perPage })
    )
  );

  return [...first.items, ...remaining.flatMap((page) => page.items)];
}

export async function getProductCategories({ perPage = 100, hideEmpty = true, page = 1 } = {}) {
  const { items } = await getCollection("/products/categories", {
    per_page: perPage,
    page,
    hide_empty: hideEmpty ? "true" : undefined
  });
  return items;
}

export async function getProductBrands({ perPage = 100, hideEmpty = true, page = 1, search = "" } = {}) {
  const { items } = await getCollection("/products/brands", {
    per_page: perPage,
    page,
    search,
    hide_empty: hideEmpty ? "true" : undefined
  });
  return items;
}

export async function getAllProductCategories() {
  return getAllCollectionPages("/products/categories", { hide_empty: "true" });
}

/** Category counts for the same in-stock, image-bearing supplier catalogue as product lists. */
export async function getCatalogCategoryCounts() {
  return request("/cereve/v1/products/catalog-counts", { base: WP });
}

export async function getAllProductBrands() {
  return getAllCollectionPages("/products/brands", { hide_empty: "true" });
}

export async function getProductAttributes() {
  const { items } = await getCollection("/products/attributes", { per_page: 100 });
  return items;
}

export async function getProductAttributeTerms(attributeId, { hideEmpty = true } = {}) {
  const { items } = await getCollection(`/products/attributes/${attributeId}/terms`, {
    per_page: 100,
    hide_empty: hideEmpty ? "true" : undefined
  });
  return items;
}

export async function getProductTags({ perPage = 100 } = {}) {
  const tags = await request(`/products/tags${query({ per_page: perPage })}`);
  return Array.isArray(tags) ? tags : [];
}

/* ------------------------------------------------------------------ *
 * Cart
 * ------------------------------------------------------------------ */

export async function getCart() {
  return withDecodedItems(await request(`/cart`, { withCart: true }));
}

export async function addToCart({ id, quantity = 1, variationId }) {
  return withDecodedItems(
    await request(`/cart/items`, {
      method: "POST",
      withCart: true,
      body: { id, quantity, variation_id: variationId }
    })
  );
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
      customer_note: customerNote,
      payment_data: []
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

export async function getCustomerOrder(id) {
  return customer(`/orders/${encodeURIComponent(id)}`);
}
