import { Link, useLocation, useParams } from "react-router-dom";
import { getPages } from "../../../shared/lib/woo.js";
import { decodeEntities } from "../../../shared/lib/format.js";
import { useEffect, useState } from "react";
import { ArrowIcon, BagIcon } from "../../../shared/ui/Icons.jsx";
import { Accordion } from "../../../shared/ui/Accordion.jsx";

/** Renders a WordPress page by slug, with an editorial fallback. */
export default function ContentPage({ slug: slugProp }) {
  const params = useParams();
  const { pathname } = useLocation();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  // These routes are static (/about, /help) so there is no :slug to read.
  // Fall back to the first path segment, which also covers nested paths.
  const slug =
    slugProp ?? params.slug ?? pathname.split("/").filter(Boolean)[0] ?? "";

  useEffect(() => {
    let alive = true;
    setLoading(true);

    getPages({ perPage: 100 })
      .then((pages) => alive && setPage(pages.find((entry) => entry.slug === slug) ?? null))
      .catch(() => alive && setPage(null))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <main className="page container-narrow">
        <div className="state-msg">
          <span className="spinner" />
        </div>
      </main>
    );
  }

  return (
    <main className="page content-page">
      <div className="container-narrow">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{titleFor(slug)}</span>
        </nav>

        <h1 className="hdr-md content-page__title">
          {decodeEntities(page?.title?.rendered) || titleFor(slug)}
        </h1>

        <div className="content-page__body">
          {page?.content?.rendered ? (
            // WordPress page bodies are authored in the admin, so this is the
            // one place the storefront renders trusted editor HTML.
            <div className="prose" dangerouslySetInnerHTML={{ __html: page.content.rendered }} />
          ) : (
            <>
              {slug === "about" ? <AboutBody /> : null}
              {slug === "help" ? <HelpBody /> : null}
              {slug === "account" ? <AccountBody /> : null}
            </>
          )}
        </div>

        <Link to="/shop" className="btn">
          Shop All
          <ArrowIcon />
        </Link>
      </div>
    </main>
  );
}

function titleFor(slug) {
  return (
    {
      about: "About Us",
      help: "Help + Contact",
      account: "My Account",
      cart: "Shopping Bag",
      checkout: "Checkout"
    }[slug] ?? slug
  );
}

function AboutBody() {
  return (
    <div className="prose">
      <p>
        Cereve began with a simple frustration: too many products promise more
        than they deliver, and most of them work against the skin they sit on.
        We make fewer things, formulate them properly, and label everything.
      </p>

      <h2>What we stand for</h2>
      <ul>
        <li>Every formula is reviewed for skin compatibility before it ships.</li>
        <li>No animal testing, at any stage of development.</li>
        <li>Small production runs, so nothing expires in a warehouse.</li>
        <li>Full ingredient disclosure on every product page and carton.</li>
      </ul>

      <p>
        The result is a small, deliberate range across complexion, eye, lip and
        body — products you can build a routine around without thinking about it
        twice.
      </p>
    </div>
  );
}

function HelpBody() {
  return (
    <div className="acc-list">
      <Accordion title="When will my order arrive?" defaultOpen>
        Orders ship within 1–2 business days and standard delivery takes 3–5
        business days. You’ll receive tracking by email.
      </Accordion>
      <Accordion title="How do returns work?">
        Send items back within 30 days of delivery for a full refund. We cover
        the return label; refunds clear 3–5 days after the parcel reaches us.
      </Accordion>
      <Accordion title="Can I change or cancel an order?">
        Yes — contact us within an hour of placing it and we’ll catch it before
        it ships.
      </Accordion>
      <Accordion title="Do you ship internationally?">
        We currently ship across North America, the UK and the EU. Duties for
        international orders are calculated at checkout.
      </Accordion>
      <Accordion title="Something else?">
        Write to hello@cereve.example and we’ll pick it up within one business
        day.
      </Accordion>
    </div>
  );
}

function AccountBody() {
  return (
    <div className="prose">
      <p>
        Customer accounts are handled by WooCommerce. This storefront is a
        headless front end, so sign-in is served from WordPress rather than this
        React app.
      </p>

      <p>
        <a
          className="btn btn--secondary"
          href="/wp-login.php"
        >
          Go to WordPress sign in
        </a>
      </p>

      <p className="body-sm muted">
        <BagIcon size={14} /> Your bag lives in the browser and follows you
        between visits, with or without an account.
      </p>
    </div>
  );
}

export function NotFound() {
  return (
    <main className="page container-narrow state-msg">
      <p className="sub-sm">Error 404</p>
      <h1 className="hdr-lg">Page not found</h1>
      <p className="body-sm muted">The page you’re looking for has moved or never existed.</p>
      <Link to="/shop" className="btn">
        Shop All
        <ArrowIcon />
      </Link>
    </main>
  );
}
