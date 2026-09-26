import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getProducts } from "../../../shared/lib/woo.js";
import { useCategories } from "../../../shared/lib/catalog.js";
import ProductCard from "../../../features/catalog/components/ProductCard.jsx";
import { ArrowIcon, BagIcon, SearchIcon, CheckIcon, StarIcon } from "../../../shared/ui/Icons.jsx";
import { EmailCapture } from "../../../shared/ui/Accordion.jsx";

/** Editorial home: hero statement, category rail, featured grid, journal band. */
export default function Home() {
  const { roots } = useCategories();
  const [featured, setFeatured] = useState([]);
  const [newIn, setNewIn] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    Promise.all([
      getProducts({ perPage: 4, orderby: "popularity", order: "desc" }),
      getProducts({ perPage: 4, orderby: "date", order: "desc" })
    ])
      .then(([popular, recent]) => {
        if (!alive) return;
        setFeatured(popular.items);
        setNewIn(recent.items);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, []);

  const categories = useMemo(() => roots.slice(0, 3), [roots]);

  return (
    <main className="page home">
      <section className="hero">
        <div className="container hero__inner">
          <p className="sub-sm hero__eyebrow">New season</p>

          <h1 className="hdr-xl hero__title">
            Makeup That Makes
            <br />
            Your Skin Better™
          </h1>

          <p className="body-lg hero__lede">
            Thoughtful formulations in every category — complexion, eye, lip and
            body — built to perform and to protect your skin.
          </p>

          <div className="hero__actions">
            <Link to="/shop" className="btn">
              Shop All
              <ArrowIcon />
            </Link>
            <Link to="/shop?sort=popularity" className="btn btn--secondary">
              Bestsellers
            </Link>
          </div>
        </div>

        <div className="hero__marquee" aria-hidden="true">
          <div className="hero__marqueetrack">
            {Array.from({ length: 2 }, (_, group) => (
              <span key={group}>
                {["Clean formulas", "Cruelty free", "Recyclable packaging", "Free returns", "Made in small batches"].map(
                  (item) => (
                    <span key={item} className="hero__marqueeitem">
                      {item}
                      <span className="hero__marqueedot">•</span>
                    </span>
                  )
                )}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Category rail */}
      <section className="container section">
        <header className="section__head">
          <h2 className="hdr-md">Shop by category</h2>
          <Link to="/shop" className="btn-link btn-link--lg">
            View all
            <ArrowIcon />
          </Link>
        </header>

        <ul className="cat-rail">
          {categories.map((category) => (
            <li key={category.id}>
              <Link to={category.href} className="cat-tile">
                <span className="cat-tile__media">
                  {category.image?.src ? (
                    <img src={category.image.src} alt="" loading="lazy" />
                  ) : (
                    <span className="cat-tile__placeholder" aria-hidden="true">
                      <BagIcon size={26} />
                    </span>
                  )}
                </span>

                <span className="cat-tile__body">
                  <span className="sub-sm cat-tile__name">{category.name}</span>
                  <span className="body-xs muted">
                    {category.count} {category.count === 1 ? "product" : "products"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Featured grid */}
      <section className="container section">
        <header className="section__head">
          <h2 className="hdr-md">Most loved</h2>
          <Link to="/shop?sort=popularity" className="btn-link btn-link--lg">
            Shop all
            <ArrowIcon />
          </Link>
        </header>

        <div className="grid-products">
          {loading
            ? Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="card card--skeleton">
                  <div className="card__media skeleton" style={{ aspectRatio: "3 / 4" }} />
                </div>
              ))
            : featured.map((product, index) => (
                <ProductCard key={product.id} product={product} eager={index < 2} />
              ))}
        </div>
      </section>

      {/* Promise band */}
      <section className="promises">
        <div className="container promises__inner">
          {[
            { title: "Formulated with care", body: "Every product is reviewed for performance and skin compatibility." },
            { title: "Small batch", body: "Made in limited runs so nothing sits in a warehouse for years." },
            { title: "Easy returns", body: "Thirty days to change your mind, on us." }
          ].map((item) => (
            <div key={item.title} className="promise">
              <CheckIcon size={18} />
              <h3 className="sub-sm">{item.title}</h3>
              <p className="body-sm muted">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* New in */}
      <section className="container section">
        <header className="section__head">
          <h2 className="hdr-md">New in</h2>
          <Link to="/shop?sort=date-desc" className="btn-link btn-link--lg">
            Shop all
            <ArrowIcon />
          </Link>
        </header>

        <div className="grid-products">
          {loading
            ? Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="card card--skeleton">
                  <div className="card__media skeleton" style={{ aspectRatio: "3 / 4" }} />
                </div>
              ))
            : newIn.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>

      {/* Journal + newsletter */}
      <section className="journal">
        <div className="container journal__inner">
          <div className="journal__copy">
            <p className="sub-sm">The Journal</p>
            <h2 className="hdr-md">How to build a routine that lasts</h2>
            <p className="body-md muted">
              Three steps, no ten-step rituals. Start with a cleanse that respects
              your barrier, follow with treatment, then seal it in.
            </p>

            <Link to="/about" className="btn-link btn-link--lg">
              Read more
              <ArrowIcon />
            </Link>
          </div>

          <div className="journal__signup">
            <h2 className="sub-sm">Join the list</h2>
            <p className="body-sm muted">
              15% off your first order, plus early access to launches.
            </p>

            <EmailCapture
              submitLabel="Sign up"
              onSubmit={async () => {
                await new Promise((resolve) => setTimeout(resolve, 350));
              }}
            />

            <ul className="journal__proof">
              {["4.6 average rating", "8,000+ reviews", "Free returns"].map((item) => (
                <li key={item}>
                  <StarIcon size={12} filled />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="container section section--last">
        <div className="search-cta">
          <SearchIcon size={22} />
          <h2 className="hdr-md">Looking for something specific?</h2>
          <p className="body-md muted">
            Search the full catalogue by name, category or tag.
          </p>
          <Link to="/search" className="btn btn--secondary">
            Browse everything
            <ArrowIcon />
          </Link>
        </div>
      </section>
    </main>
  );
}
