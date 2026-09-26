import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getProducts } from "../../../shared/lib/woo.js";
import { useCategories } from "../../../shared/lib/catalog.js";
import { useUI } from "../../../shared/UIContext.jsx";
import ProductCard from "../../../features/catalog/components/ProductCard.jsx";
import { SearchIcon, ArrowIcon, CloseIcon } from "../../../shared/ui/Icons.jsx";

const PER_PAGE = 12;

const SORTS = [
  { value: "relevance", label: "Relevance" },
  { value: "date-desc", label: "Newest" },
  { value: "price-asc", label: "Price, low to high" },
  { value: "price-desc", label: "Price, high to low" }
];

/** Full search results, with a count banner, filter rail and sorting. */
export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const { open } = useUI();
  const { flat } = useCategories();

  const term = params.get("q") ?? "";
  const sort = params.get("sort") ?? "relevance";
  const category = params.get("category") ?? "";
  const page = Math.max(1, Number(params.get("page") ?? 1));

  const [data, setData] = useState({ items: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const [orderby, order] = sort === "relevance" ? ["menu_order", "asc"] : sort.split("-");

  useEffect(() => {
    if (!term) {
      setData({ items: [], total: 0, totalPages: 1 });
      setLoading(false);
      return undefined;
    }

    let alive = true;
    setLoading(true);

    getProducts({
      search: term,
      category: category || undefined,
      page,
      perPage: PER_PAGE,
      orderby,
      order
    })
      .then((result) => alive && setData(result))
      .catch(() => alive && setData({ items: [], total: 0, totalPages: 1 }))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [term, category, page, orderby, order]);

  const suggestions = useMemo(() => {
    if (term.length < 2) return [];

    return flat
      .filter((entry) => entry.name.toLowerCase().includes(term.toLowerCase()))
      .slice(0, 6);
  }, [term, flat]);

  function update(next) {
    const merged = new URLSearchParams(params);
    next.forEach(([key, value]) => {
      if (value === null || value === "") merged.delete(key);
      else merged.set(key, String(value));
    });
    setParams(merged, { replace: true });
  }

  return (
    <main className="page container search-page">
      <header className="search-page__head">
        <p className="search-page__label">
          <SearchIcon size={16} />
          Search results for
        </p>

        <h1 className="hdr-lg search-page__term">
          {term ? `“${term}”` : "Everything"}
        </h1>

        <div className="search-page__bar">
          <span className="body-sm muted">
            {loading ? "Searching…" : `${data.total} ${data.total === 1 ? "Result" : "Results"}`}
          </span>

          <label className="shop__sort">
            <span className="sr-only">Sort results by</span>
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
          </label>
        </div>
      </header>

      {term ? (
        <form
          className="search-page__field"
          onSubmit={(event) => event.preventDefault()}
          role="search"
        >
          <SearchIcon size={18} className="search__icon" />
          <input
            className="search__input"
            type="search"
            defaultValue={term}
            key={term}
            placeholder="Search products and categories"
            aria-label="Search products and categories"
            onBlur={(event) => {
              const next = event.target.value.trim();
              if (next !== term) update([["q", next]]);
            }}
          />
          <button type="button" className="icon-btn" onClick={() => open("search")} aria-label="Open search suggestions">
            <ArrowIcon />
          </button>
        </form>
      ) : null}

      {suggestions.length ? (
        <ul className="chips">
          {suggestions.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                className="tag"
                onClick={() => update([["category", entry.slug]])}
              >
                {entry.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {category ? (
        <ul className="chips">
          <li>
            <button
              type="button"
              className="tag is-active"
              onClick={() => update([["category", null]])}
            >
              {flat.find((entry) => entry.slug === category)?.name ?? category}
              <CloseIcon size={11} />
            </button>
          </li>
        </ul>
      ) : null}

      <div className="search-page__grid">
        {loading ? (
          Array.from({ length: PER_PAGE }, (_, index) => (
            <div key={index} className="card card--skeleton">
              <div className="card__media skeleton" style={{ aspectRatio: "3 / 4" }} />
            </div>
          ))
        ) : data.items.length ? (
          <>
            {data.items.map((product, index) => (
              <ProductCard key={product.id} product={product} eager={index < 4} />
            ))}
          </>
        ) : (
          <div className="state-msg state-msg--wide">
            <p className="sub-sm">
              No results found for{term ? ` “${term}”.` : " that."} Check the
              spelling or use a different word or phrase.
            </p>

            <button type="button" className="btn btn--secondary" onClick={() => open("search")}>
              Search again
            </button>

            <Link to="/shop" className="btn-link btn-link--lg">
              Browse all products
              <ArrowIcon />
            </Link>
          </div>
        )}
      </div>

      {!loading && data.totalPages > 1 ? (
        <nav className="pager" aria-label="Pagination">
          <button
            type="button"
            className="pager__btn"
            onClick={() => update([["page", page - 1]])}
            disabled={page <= 1}
          >
            Previous page
          </button>

          <span className="body-sm muted">
            Page {page} of {data.totalPages}
          </span>

          <button
            type="button"
            className="pager__btn"
            onClick={() => update([["page", page + 1]])}
            disabled={page >= data.totalPages}
          >
            Next page
          </button>
        </nav>
      ) : null}
    </main>
  );
}
