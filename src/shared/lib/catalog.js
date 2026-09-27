import { useEffect, useState } from "react";
import { getProductCategories, getProducts, getProductTags } from "./woo.js";
import { titleCase, decodeEntities } from "./format.js";

/**
 * The header nav, the shop sidebar and the search panel all need the product
 * taxonomy. Fetch it once per session and share the promise.
 */
let categoriesPromise = null;
let tagsPromise = null;

export function loadCategories() {
  categoriesPromise ??= getProductCategories()
    .then((categories) => categories.map(normaliseCategory))
    .catch((error) => {
      categoriesPromise = null;
      throw error;
    });

  return categoriesPromise;
}

export function loadTags() {
  tagsPromise ??= getProductTags().catch(() => []);
  return tagsPromise;
}

function normaliseCategory(category) {
  return {
    id: category.id,
    name: titleCase(decodeEntities(category.name)),
    rawName: decodeEntities(category.name),
    slug: category.slug,
    parent: category.parent,
    count: category.count,
    image: category.image ?? null,
    description: category.description ?? "",
    href: `/shop/${category.slug}`
  };
}

/** Nest a flat category list into `[{ ...category, children: [] }]`. */
export function groupCategories(categories = []) {
  const byId = new Map(
    categories.map((category) => [category.id, { ...category, children: [] }])
  );
  const roots = [];

  for (const category of byId.values()) {
    const parent = category.parent ? byId.get(category.parent) : null;

    if (parent && parent !== category) parent.children.push(category);
    else roots.push(category);
  }

  return roots;
}

export function useCategories() {
  const [state, setState] = useState({ loading: true, roots: [], flat: [], error: "" });

  useEffect(() => {
    let alive = true;

    loadCategories()
      .then((flat) => {
        if (!alive) return;
        setState({ loading: false, roots: groupCategories(flat), flat, error: "" });
      })
      .catch((error) => {
        if (!alive) return;
        setState({ loading: false, roots: [], flat: [], error: error.message });
      });

    return () => {
      alive = false;
    };
  }, []);

  return state;
}

/* ------------------------------------------------------------------ *
 * Featured-product cache, so re-opening a mega menu is instant.
 * ------------------------------------------------------------------ */

const featuredCache = new Map();

export async function loadFeatured(categorySlug, limit = 4) {
  const key = `${categorySlug || "all"}:${limit}`;

  if (featuredCache.has(key)) return featuredCache.get(key);

  const promise = getProducts({
    category: categorySlug || undefined,
    perPage: limit,
    orderby: "menu_order",
    order: "asc"
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

/** Best sellers, used on the home page and in the empty search state. */
export function loadBestSellers(limit = 4) {
  const key = `bestsellers:${limit}`;
  if (featuredCache.has(key)) return featuredCache.get(key);

  const promise = getProducts({ perPage: limit, orderby: "popularity", order: "desc" })
    .then((result) => result.items)
    .catch(() => []);

  featuredCache.set(key, promise);
  return promise;
}
