import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getProducts } from "../../../shared/lib/woo.js";
import { useCatalog, filterBrands, loadCategories } from "../../../shared/lib/catalog.js";
import ProductCard from "../../../features/catalog/components/ProductCard.jsx";
import { ChevronIcon, CloseIcon, ArrowIcon } from "../../../shared/ui/Icons.jsx";

const PER_PAGE = 24;

/**
 * Collection / product listing.
 *
 * Reads the whole query string so any view is linkable: `?category=`,
 * `?sort=`, `?on_sale=1`, `?search=`, `?page=`.
 */
export default function Shop() {
  const { slug, child, brandSlug } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { departments, brands, categories, loading: taxLoading } = useCatalog();

  const [data, setData] = useState({ items: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const category = child ?? slug ?? params.get("category") ?? "";
  const brandParam = brandSlug ?? params.get("brand") ?? "";
  const sort = params.get("sort") ?? "menu_order-asc";
  const onSale = params.get("on_sale") === "1";
  const search = params.get("search") ?? "";
  const page = Math.max(1, Number(params.get("page") ?? 1));

  const [orderby, order] = sort.split("-");

  const current = useMemo(
    () => departments.find((entry) => entry.slug === category) ?? categories.find((entry) => entry.slug === category) ?? null,
    [departments, categories, category]
  );

  const currentBrand = useMemo(
    () => brands.find((entry) => entry.slug === brandParam) ?? null,
    [brands, brandParam]
  );

  useEffect(() => {
    if (taxLoading) return undefined;

    let alive = true;
    setLoading(true);
    setFailed("");

    getProducts({
      page,
      perPage: PER_PAGE,
      category: current?.id || undefined,
      brand: currentBrand?.id || undefined,
      onSale,
      search: search || undefined,
      orderby,
      order
    })
      .then((result) => alive && setData(result))
      .catch((error) => alive && setFailed(error.message))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [taxLoading, page, current?.id, currentBrand?.id, onSale, search, orderby, order]);

  function update(next, { resetPage = true } = {}) {
    const merged = new URLSearchParams(params);
    next.forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") merged.delete(key);
      else merged.set(key, String(value));
    });
    if (resetPage) merged.delete("page");
    setParams(merged, { replace: true });
  }

  function clearCategory() {
    const next = new URLSearchParams(params);
    next.delete("category");
    next.delete("page");
    navigate({ pathname: brandParam ? `/shop/brand/${brandParam}` : "/shop", search: next.toString() });
  }

  function clearBrand() {
    const next = new URLSearchParams(params);
    next.delete("brand");
    next.delete("page");
    navigate({ pathname: current ? `/shop/${current.slug}` : "/shop", search: next.toString() });
  }

  const heading =
    currentBrand?.name ?? current?.name ?? (search ? `Results for “${search}”` : "Shop All");
  const description = current?.description || "";
  // WooCommerce's Store API can report the global catalogue total for a
  // category query even though its returned product rows are category-scoped.
  // Use the server-computed active catalogue count for the category header
  // and pagination unless the shopper has narrowed it further.
  const categoryOnly = Boolean(current && !currentBrand && !search && !onSale);
  const visibleTotal = categoryOnly ? current.count : data.total;
  const visibleTotalPages = categoryOnly
    ? Math.max(1, Math.ceil(visibleTotal / PER_PAGE))
    : data.totalPages;

  const activeChips = [
    current ? { key: "category", label: current.name, onClear: clearCategory } : null,
    currentBrand ? { key: "brand", label: currentBrand.name, onClear: clearBrand } : null,
    onSale ? { key: "on_sale", label: "On sale" } : null,
    search ? { key: "search", label: `“${search}”` } : null
  ].filter(Boolean);

  return (
    <main className={`page shop${filtersOpen ? " shop--filters-open" : ""}`}>
      <div className="container">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true">/</span>
          {current ? (
            <>
              <Link to="/shop">Shop</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{current.name}</span>
            </>
          ) : (
            <span aria-current="page">{heading}</span>
          )}
        </nav>

        <header className="shop__head">
          <div>
            <h1 className="hdr-lg shop__title">{heading}</h1>
            {description ? <p className="body-md muted shop__desc">{description}</p> : null}
          </div>

          <p className="shop__count body-sm muted">
            {loading ? "Loading…" : `${visibleTotal} ${visibleTotal === 1 ? "Product" : "Products"}`}
          </p>
        </header>

        {activeChips.length ? (
          <ul className="chips">
            {activeChips.map((chip) => (
              <li key={chip.key}>
                <button
                  type="button"
                  className="tag is-active"
                  onClick={() =>
                    chip.onClear ? chip.onClear() : update([[chip.key, null]])
                  }
                >
                  {chip.label}
                  <CloseIcon size={11} />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="shop__bar">
          <button
            type="button"
            className="shop__filterbtn"
            onClick={() => setFiltersOpen(true)}
            aria-expanded={filtersOpen}
          >
            <span className="sub-xs">Filter</span>
            <ChevronIcon size={12} direction="down" />
          </button>

        </div>

        <div className="shop__layout">
          <aside className="shop__filters" data-open={filtersOpen} aria-label="Filters">
            <FilterPanel
              departments={departments}
              brands={brands}
              current={current}
              currentBrand={currentBrand}
              params={params}
              onUpdate={update}
              onNavigate={navigate}
              onClose={() => setFiltersOpen(false)}
            />
          </aside>

          <div className="shop__results">
            {failed ? (
              <div className="state-msg">
                <p className="sub-sm">We couldn’t load these products.</p>
                <p className="body-sm muted">{failed}</p>
              </div>
            ) : loading ? (
              <div className="grid-products">
                {Array.from({ length: PER_PAGE }, (_, index) => (
                  <div key={index} className="card card--skeleton">
                    <div className="card__media skeleton" style={{ aspectRatio: "3 / 4" }} />
                  </div>
                ))}
              </div>
            ) : data.items.length ? (
              <>
                <div className="grid-products">
                  {data.items.map((product, index) => (
                    <ProductCard key={product.id} product={product} eager={index < 4} />
                  ))}
                </div>

                {visibleTotalPages > 1 ? (
                  <Pagination page={page} totalPages={visibleTotalPages} onGo={(next) => update([["page", next]], { resetPage: false })} />
                ) : null}
              </>
            ) : (
              <div className="state-msg">
                <p className="sub-sm">No products found</p>
                <p className="body-sm muted">Try removing a filter or searching for something else.</p>
                <Link to="/shop" className="btn btn--secondary">
                  Clear filters
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ *
 * Filters
 * ------------------------------------------------------------------ */

function FilterPanel({ departments, brands, current, currentBrand, params, onUpdate, onNavigate, onClose }) {
  const [brandQuery, setBrandQuery] = useState("");
  const matches = useMemo(
    () => filterBrands(brands, { query: brandQuery }).slice(0, 40),
    [brands, brandQuery]
  );

  function goDepartment(slug) {
    const next = new URLSearchParams(params);
    next.delete("page");
    onNavigate({ pathname: slug ? `/shop/${slug}` : "/shop", search: next.toString() });
  }

  function goBrand(slug) {
    const next = new URLSearchParams(params);
    next.delete("page");
    onNavigate({ pathname: slug ? `/shop/brand/${slug}` : "/shop", search: next.toString() });
  }

  return (
    <div className="filters">
      <div className="filters__head">
        <h2 className="sub-sm">Filters</h2>
        <button type="button" className="icon-btn filters__close" onClick={onClose} aria-label="Close filters">
          <CloseIcon />
        </button>
      </div>

      <div className="filters__group">
        <p className="sub-xs filters__label">Category</p>
        <ul>
          <li>
            <button
              type="button"
              className="filters__link"
              data-active={!current || undefined}
              onClick={() => goDepartment("")}
            >
              All
            </button>
          </li>

          {departments.map((root) => (
            <li key={root.id}>
              <button
                type="button"
                className="filters__link"
                data-active={current?.slug === root.slug || undefined}
                onClick={() => goDepartment(root.slug)}
              >
                {root.name}
                <span className="filters__count">{root.count.toLocaleString()}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="filters__group">
        <p className="sub-xs filters__label">Brand</p>
        <input
          className="filters__search"
          type="search"
          value={brandQuery}
          placeholder={`Search ${brands.length.toLocaleString()} brands`}
          onChange={(event) => setBrandQuery(event.target.value)}
        />
        <ul className="filters__brands">
          {currentBrand && !brandQuery ? (
            <li>
              <button type="button" className="filters__link" data-active onClick={() => goBrand("")}>
                {currentBrand.name}
                <span className="filters__count">clear</span>
              </button>
            </li>
          ) : null}
          {matches.map((brand) => (
            <li key={brand.id}>
              <button
                type="button"
                className="filters__link filters__link--sub"
                data-active={currentBrand?.slug === brand.slug || undefined}
                onClick={() => goBrand(brand.slug === currentBrand?.slug ? "" : brand.slug)}
              >
                {brand.name}
                <span className="filters__count">{brand.count.toLocaleString()}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="filters__foot">
        <button
          type="button"
          className="btn btn--quiet btn--block"
          onClick={() => {
            onUpdate([["on_sale", null], ["search", null]]);
            onNavigate({ pathname: "/shop" });
          }}
        >
          Clear all
        </button>
        <button type="button" className="btn btn--block" onClick={onClose}>
          Apply filters
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Pagination
 * ------------------------------------------------------------------ */

function Pagination({ page, totalPages, onGo }) {
  const window = useMemo(() => {
    const pages = new Set([1, totalPages, page, page - 1, page + 1]);
    return [...pages].filter((value) => value >= 1 && value <= totalPages).sort((a, b) => a - b);
  }, [page, totalPages]);

  return (
    <nav className="pager" aria-label="Pagination">
      <button
        type="button"
        className="pager__btn"
        onClick={() => onGo(page - 1)}
        disabled={page <= 1}
      >
        <ArrowIcon size={13} direction="left" />
        <span>Previous</span>
      </button>

      <ol className="pager__nums">
        {window.map((value, index) => (
          <li key={value}>
            {index > 0 && value - window[index - 1] > 1 ? (
              <span className="pager__gap">…</span>
            ) : null}
            <button
              type="button"
              className="pager__num"
              data-active={value === page || undefined}
              onClick={() => onGo(value)}
              aria-current={value === page ? "page" : undefined}
            >
              {value}
            </button>
          </li>
        ))}
      </ol>

      <button
        type="button"
        className="pager__btn"
        onClick={() => onGo(page + 1)}
        disabled={page >= totalPages}
      >
        <span>Next</span>
        <ArrowIcon size={13} />
      </button>
    </nav>
  );
}

export { loadCategories };
