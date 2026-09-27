import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getProducts, getProductTags } from "../../../shared/lib/woo.js";
import { useCategories, groupCategories, loadCategories } from "../../../shared/lib/catalog.js";
import ProductCard from "../../../features/catalog/components/ProductCard.jsx";
import { ChevronIcon, CloseIcon, ArrowIcon } from "../../../shared/ui/Icons.jsx";

const PER_PAGE = 12;

const SORTS = [
  { value: "menu_order-asc", label: "Featured" },
  { value: "popularity-desc", label: "Most popular" },
  { value: "date-desc", label: "Newest" },
  { value: "price-asc", label: "Price, low to high" },
  { value: "price-desc", label: "Price, high to low" },
  { value: "title-asc", label: "Alphabetical" }
];

/**
 * Collection / product listing.
 *
 * Reads the whole query string so any view is linkable: `?category=`,
 * `?sort=`, `?on_sale=1`, `?search=`, `?page=`.
 */
export default function Shop() {
  const { slug, child } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { flat } = useCategories();

  const [data, setData] = useState({ items: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [tags, setTags] = useState([]);
  const firstRun = useRef(true);

  // A nested path wins over the query string, so /shop/fashion/shoes is stable.
  const category = child ?? slug ?? params.get("category") ?? "";
  const sort = params.get("sort") ?? "menu_order-asc";
  const onSale = params.get("on_sale") === "1";
  const search = params.get("search") ?? "";
  const page = Math.max(1, Number(params.get("page") ?? 1));
  const activeTag = params.get("tag") ?? "";

  const [orderby, order] = sort.split("-");

  const current = useMemo(
    () => flat.find((entry) => entry.slug === category) ?? null,
    [flat, category]
  );


  useEffect(() => {
    let alive = true;
    setLoading(true);
    setFailed("");

    getProducts({
      page,
      perPage: PER_PAGE,
      category: category || undefined,
      tag: activeTag || undefined,
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
  }, [page, category, activeTag, onSale, search, orderby, order]);

  // Shop page offers its own filter surface, so it needs the tag list.
  useEffect(() => {
    getProductTags({ perPage: 12 })
      .then((list) => setTags(list))
      .catch(() => setTags([]));
  }, []);

  // A filter change should always send the shopper back to page one.
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, activeTag, onSale, search, sort]);

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
    navigate({ pathname: "/shop", search: next.toString() });
  }

  const heading = current?.name ?? (search ? `Results for “${search}”` : "Shop All");
  const description = current?.description || "";

  const activeChips = [
    current ? { key: "category", label: current.name, onClear: clearCategory } : null,
    onSale ? { key: "on_sale", label: "On sale" } : null,
    activeTag ? { key: "tag", label: tags.find((t) => t.slug === activeTag)?.name ?? activeTag } : null,
    search ? { key: "search", label: `“${search}”` } : null
  ].filter(Boolean);

  return (
    <main className="page shop">
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
            {loading ? "Loading…" : `${data.total} ${data.total === 1 ? "Product" : "Products"}`}
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

          <label className="shop__sort">
            <span className="sr-only">Sort products by</span>
            <select
              className="shop__sortselect"
              value={sort}
              onChange={(event) => update([["sort", event.target.value]])}
            >
              {SORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronIcon size={12} direction="down" />
          </label>
        </div>

        <div className="shop__layout">
          <aside className="shop__filters" data-open={filtersOpen} aria-label="Filters">
            <FilterPanel
              flat={flat}
              tags={tags}
              params={params}
              onUpdate={update}
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

                {data.totalPages > 1 ? (
                  <Pagination page={page} totalPages={data.totalPages} onGo={(next) => update([["page", next]], { resetPage: false })} />
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

function FilterPanel({ flat, tags, params, onUpdate, onClose }) {
  const tree = useMemo(() => groupCategories(flat), [flat]);
  const active = params.get("category") ?? "";

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
              data-active={!active || undefined}
              onClick={() => onUpdate([["category", null]])}
            >
              All
            </button>
          </li>

          {tree.map((root) => (
            <li key={root.id}>
              <button
                type="button"
                className="filters__link"
                data-active={active === root.slug || undefined}
                onClick={() => onUpdate([["category", root.slug]])}
              >
                {root.name}
                <span className="filters__count">{root.count}</span>
              </button>

              {root.children?.length ? (
                <ul className="filters__sub">
                  {root.children.map((child) => (
                    <li key={child.id}>
                      <button
                        type="button"
                        className="filters__link filters__link--sub"
                        data-active={active === child.slug || undefined}
                        onClick={() => onUpdate([["category", child.slug]])}
                      >
                        {child.name}
                        <span className="filters__count">{child.count}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      {tags.length ? (
        <div className="filters__group">
          <p className="sub-xs filters__label">Tag</p>
          <ul className="filters__tags">
            {tags.map((tag) => {
              const on = params.get("tag") === tag.slug;

              return (
                <li key={tag.id}>
                  <button
                    type="button"
                    className="tag"
                    data-active={on || undefined}
                    onClick={() => onUpdate([["tag", on ? null : tag.slug]])}
                  >
                    {tag.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <div className="filters__group">
        <p className="sub-xs filters__label">Availability</p>
        <ul>
          <li>
            <button
              type="button"
              className="filters__link"
              data-active={params.get("on_sale") === "1" || undefined}
              onClick={() =>
                onUpdate([["on_sale", params.get("on_sale") === "1" ? null : "1"]])
              }
            >
              On sale only
            </button>
          </li>
        </ul>
      </div>

      <div className="filters__foot">
        <button
          type="button"
          className="btn btn--quiet btn--block"
          onClick={() => onUpdate([["category", null], ["tag", null], ["on_sale", null], ["search", null]])}
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
