import { useEffect, useState } from "react";
import {
  getAllCollectionPages,
  getAllProductBrands,
  getCatalogCategoryCounts,
  getProductAttributes,
  getProductAttributeTerms,
  getProducts
} from "./woo.js";
import { titleCase, decodeEntities } from "./format.js";

/**
 * Taxonomy for a multi-brand Woo catalogue.
 *
 * The WordPress shop mixed `product_cat` departments with brand names (the
 * feed writes both). `product_brand` is the real brand list — thousands of
 * terms. The storefront therefore:
 *   - treats parent `product_cat` rows that are not also brands as departments
 *   - uses `product_brand` for the mega menu and the filter typeahead
 *
 * That used to live in sillage-bridge shortcodes; the headless app owns it.
 */

const DEMO_CAT_SLUGS = new Set(["body", "face", "hands", "legs", "uncategorized"]);

const MEGA_DEPARTMENT_LIMIT = 15;
const MEGA_BRAND_LIMIT = 24;

const CATALOG_CACHE_KEY = "cosmetic.catalog.v1";
const CATALOG_CACHE_MAX_AGE = 6 * 60 * 60 * 1000;

export const PRIMARY_DEPARTMENT_NAV = [
  { label: "Parapharmacy", slug: "parapharmacy", aliases: ["parapharmacy", "parapharma"] },
  { label: "Drugstore", slug: "drugstore", aliases: ["drugstore"] },
  { label: "Makeup", slug: "makeup", aliases: ["makeup"] },
  { label: "Fragrance", slug: "fragrance", aliases: ["fragrance", "fragance"] },
  { label: "Skin Care", slug: "skin-care", aliases: ["skincare"] },
  { label: "Women", slug: "women", aliases: ["women", "woman", "damen"] },
  { label: "Men", slug: "men", aliases: ["men", "mens"] }
];

const termKey = (value) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

export function primaryDepartments(departments = []) {
  return PRIMARY_DEPARTMENT_NAV.map((entry) => {
    const category = departments.find((item) =>
      entry.aliases.includes(termKey(item.slug)) || entry.aliases.includes(termKey(item.name))
    );
    return category ? { ...category, name: entry.label } : {
      id: `nav-${entry.slug}`,
      name: entry.label,
      slug: entry.slug,
      href: `/shop/${entry.slug}`,
      children: []
    };
  });
}

function readCatalogCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(CATALOG_CACHE_KEY) ?? "null");
    if (cached?.catalog && Date.now() - cached.savedAt < CATALOG_CACHE_MAX_AGE) return cached.catalog;
  } catch {
    // Storage can be unavailable in private browsing; network loading still works.
  }
  return null;
}

function writeCatalogCache(catalog) {
  try {
    localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), catalog }));
  } catch {
    // Keep the in-memory cache even when browser storage is full or disabled.
  }
}

/** Preferred merchandising order; remaining slots fill by product count. */
const FEATURED_BRAND_KEYS = [
  "dior",
  "clarins",
  "chanel",
  "esteelauder",
  "maybelline",
  "revlon",
  "shiseido",
  "loreal",
  "pacorabanne",
  "nivea",
  "vichy",
  "isdin",
  "cerave",
  "clinique",
  "elizabetharden",
  "givenchy",
  "garnier",
  "schwarzkopf",
  "beter",
  "eurostil"
];

const DEPARTMENT_LABELS = {
  fragance: "Fragrance"
};

const CONCERN_LABELS = {
  combined: "Combination Skin",
  damaged: "Damaged Hair",
  dry: "Dry Skin",
  oily: "Oily Skin",
  sensitive: "Sensitive Skin"
};

let catalogPromise = null;

function normaliseTerm(term, hrefPrefix) {
  return {
    id: term.id,
    name: DEPARTMENT_LABELS[term.slug] ?? titleCase(decodeEntities(term.name)),
    rawName: decodeEntities(term.name),
    slug: term.slug,
    parent: term.parent,
    count: term.count,
    image: term.image ?? null,
    description: term.description ?? "",
    href: `${hrefPrefix}/${term.slug}`
  };
}

function brandKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "");
}

function partitionCatalog(categories, brands) {
  const brandSlugs = new Set(brands.map((brand) => brand.slug));
  const brandNames = new Set(brands.map((brand) => brandKey(brand.rawName)));

  const departments = categories
    .filter((category) => {
      if (category.parent) return false;
      if (category.count < 20) return false;
      if (DEMO_CAT_SLUGS.has(category.slug)) return false;
      if (brandSlugs.has(category.slug)) return false;
      if (brandNames.has(brandKey(category.rawName))) return false;
      return true;
    })
    .sort((a, b) => b.count - a.count);

  return { departments, brands, categories };
}

export function loadCatalog() {
  catalogPromise ??= (() => {
    const cached = readCatalogCache();
    if (cached) return Promise.resolve(cached);

    return Promise.all([
    // Keep every non-empty category available for direct product-category
    // links; department navigation still selects only parent categories below.
    getAllCollectionPages("/products/categories", { hide_empty: "true" }),
    getAllProductBrands(),
    getCatalogCategoryCounts().catch(() => ({}))
  ])
    .then(([rawCategories, rawBrands, categoryCounts]) => {
      const categories = rawCategories.map((term) => normaliseTerm({
        ...term,
        count: categoryCounts[String(term.id)] ?? 0
      }, "/shop"));
      const brands = rawBrands.map((term) => normaliseTerm(term, "/shop/brand"));
      const catalog = partitionCatalog(categories, brands);
      writeCatalogCache(catalog);
      return catalog;
    })
      .catch((error) => {
        catalogPromise = null;
        throw error;
      });
  })();

  return catalogPromise;
}

export function loadCategories() {
  return loadCatalog().then((catalog) => catalog.categories);
}

export function loadBrands() {
  return loadCatalog().then((catalog) => catalog.brands);
}

export function groupCategories(categories = []) {
  const byId = new Map(categories.map((category) => [category.id, { ...category, children: [] }]));
  const roots = [];

  for (const category of byId.values()) {
    const parent = category.parent ? byId.get(category.parent) : null;
    if (parent && parent !== category) parent.children.push(category);
    else roots.push(category);
  }

  return roots;
}

export function letterOf(name) {
  const letter = (name || "").trim().charAt(0).toUpperCase();
  return letter >= "A" && letter <= "Z" ? letter : "#";
}

export function filterBrands(brands, { query = "", letter = "" } = {}) {
  const needle = query.trim().toLowerCase();
  return brands.filter((brand) => {
    if (letter && letterOf(brand.name) !== letter) return false;
    if (needle && !brand.name.toLowerCase().includes(needle) && !brand.slug.includes(needle)) {
      return false;
    }
    return true;
  });
}

export function useCatalog() {
  const [state, setState] = useState({
    loading: true,
    departments: [],
    brands: [],
    categories: [],
    roots: [],
    flat: [],
    error: ""
  });

  useEffect(() => {
    let alive = true;

    loadCatalog()
      .then((catalog) => {
        if (!alive) return;
        setState({
          loading: false,
          departments: catalog.departments,
          brands: catalog.brands,
          categories: catalog.categories,
          roots: catalog.departments,
          flat: catalog.categories,
          error: ""
        });
      })
      .catch((error) => {
        if (!alive) return;
        setState((current) => ({ ...current, loading: false, error: error.message }));
      });

    return () => {
      alive = false;
    };
  }, []);

  return state;
}

/** Back-compat for callers that only needed the category tree. */
export function useCategories() {
  const catalog = useCatalog();
  return {
    loading: catalog.loading,
    roots: catalog.departments,
    flat: catalog.categories,
    error: catalog.error
  };
}

const featuredCache = new Map();

export async function loadFeatured(categorySlug, limit = 4) {
  const key = `${categorySlug || "all"}:${limit}`;
  if (featuredCache.has(key)) return featuredCache.get(key);

  const catalog = await loadCatalog().catch(() => null);
  const categoryId = categorySlug
    ? catalog?.categories.find((entry) => entry.slug === categorySlug)?.id
    : undefined;

  const promise = getProducts({
    category: categoryId,
    perPage: limit,
    orderby: "popularity",
    order: "desc"
  })
    .then((result) => result.items)
    .catch(() => []);

  featuredCache.set(key, promise);
  return promise;
}

export function useFeatured(categorySlug, limit = 4) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let alive = true;
    loadFeatured(categorySlug, limit).then((items) => {
      if (alive) setProducts(items);
    });
    return () => {
      alive = false;
    };
  }, [categorySlug, limit]);

  return products;
}

export function loadBestSellers(limit = 4) {
  const key = `bestsellers:${limit}`;
  if (featuredCache.has(key)) return featuredCache.get(key);

  const promise = getProducts({ perPage: limit, orderby: "popularity", order: "desc" })
    .then((result) => result.items)
    .catch(() => []);

  featuredCache.set(key, promise);
  return promise;
}
