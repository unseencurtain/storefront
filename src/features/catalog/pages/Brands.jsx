import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCatalog, filterBrands, letterOf } from "../../../shared/lib/catalog.js";

const LETTERS = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", "#"];

/** Full brand directory — the mega menu only shows a slice. */
export default function BrandsPage() {
  const { brands, loading } = useCatalog();
  const [query, setQuery] = useState("");
  const [letter, setLetter] = useState("");

  const matches = useMemo(
    () => filterBrands(brands, { query, letter }),
    [brands, query, letter]
  );

  const grouped = useMemo(() => {
    const buckets = new Map();
    for (const brand of matches) {
      const key = letterOf(brand.name);
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(brand);
    }
    return [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [matches]);

  return (
    <main className="page shop">
      <div className="container">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Brands</span>
        </nav>

        <header className="shop__head">
          <div>
            <h1 className="hdr-lg shop__title">Brands</h1>
            <p className="body-md muted shop__desc">
              {loading ? "Loading…" : `${brands.length.toLocaleString()} brands in the catalogue.`}
            </p>
          </div>
        </header>

        <div className="shop__bar">
          <input
            className="filters__search"
            type="search"
            value={query}
            placeholder="Search brands"
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search brands"
          />
        </div>

        <div className="brand-letters" role="tablist" aria-label="Jump to letter">
          <button type="button" className="filters__link" data-active={!letter || undefined} onClick={() => setLetter("")}>
            All
          </button>
          {LETTERS.map((entry) => (
            <button
              key={entry}
              type="button"
              className="filters__link"
              data-active={letter === entry || undefined}
              onClick={() => setLetter((current) => (current === entry ? "" : entry))}
            >
              {entry}
            </button>
          ))}
        </div>

        {grouped.map(([group, list]) => (
          <section key={group} className="brand-group">
            <h2 className="sub-sm">{group}</h2>
            <ul className="brand-group__list">
              {list.map((brand) => (
                <li key={brand.id}>
                  <Link to={brand.href}>
                    {brand.name}
                    <span className="filters__count">{brand.count.toLocaleString()}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
