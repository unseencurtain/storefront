import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getProductBySlug,
  getProductEan,
  getProductVariations,
  getProducts,
  WooError
} from "../../../shared/lib/woo.js";
import { useCart } from "../../../features/cart/CartContext.jsx";
import { useUI } from "../../../shared/UIContext.jsx";
import { isShade, shadeColor, discountPercent } from "../../../shared/lib/format.js";
import { Price, Stars } from "../../../shared/ui/Price.jsx";
import QuantityStepper from "../../../shared/ui/QuantityStepper.jsx";
import ProductCard from "../../../features/catalog/components/ProductCard.jsx";
import { NoImage, NoImageMark } from "../../../shared/ui/primitives.js";
import { STORE_NAME } from "../../../shared/lib/branding.js";
import { Accordion, DisclosureList, EmailCapture } from "../../../shared/ui/Accordion.jsx";
import { ArrowIcon, CheckIcon, BagIcon, CloseIcon } from "../../../shared/ui/Icons.jsx";

/**
 * Product detail.
 *
 * Gallery on one side, buy box on the other. Variable products render one
 * option group per attribute — circles for shades, labelled pills for
 * everything else — and the CTA only enables once a purchasable combination
 * is chosen. Sold-out items swap the CTA for a restock notification form.
 */
export default function ProductPage() {
  const { slug } = useParams();
  const { addItem } = useCart();
  const { open } = useUI();

  const [product, setProduct] = useState(null);
  const [ean, setEan] = useState("");
  const [variations, setVariations] = useState([]);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selected, setSelected] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    let alive = true;

    setLoading(true);
    setError("");
    setProduct(null);
    setEan("");
    setSelected({});
    setQuantity(1);
    setActiveImage(0);
    setNotified(false);

    getProductBySlug(slug)
      .then(async (found) => {
        if (!alive) return;
        setProduct(found);
        getProductEan(found.id)
          .then((value) => alive && setEan(value))
          .catch(() => {});

        if (found.type === "variable") {
          const list = await getProductVariations(found.id);
          if (alive) setVariations(list);
        }

        const categoryId = found.categories?.[0]?.id;
        const { items } = await getProducts({
          category: categoryId,
          perPage: 5
        });

        if (alive) setRelated(items.filter((item) => item.id !== found.id).slice(0, 4));
      })
      .catch((err) => {
        if (!alive) return;
        setError(err instanceof WooError && err.status === 404 ? "not-found" : err.message);
      })
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [slug]);

  /** Attribute axes, e.g. [{ name: 'Size', terms: [...] }]. */
  const optionGroups = useMemo(() => {
    if (!product?.attributes?.length) return [];

    return product.attributes
      .filter((attribute) => attribute.terms?.length)
      // Only attributes with multiple actual variation values are purchase
      // choices. Other attributes (including Volume) are product facts.
      .filter((attribute) => product.type === "variable" && new Set(
        variations
          .map((variation) => attributeSlugFor(variation, attribute.taxonomy ?? attribute.name))
          .filter(Boolean)
      ).size > 1)
      .map((attribute) => {
        const variationsForTerm = new Map();

        for (const variation of variations) {
          const key = attributeSlugFor(variation, attribute.taxonomy ?? attribute.name);
          if (key) variationsForTerm.set(key, variation);
        }

        return {
          id: attribute.id ?? attribute.name,
          name: attribute.name,
          taxonomy: attribute.taxonomy,
          isShade: attribute.terms.some((term) => isShade(term.name)),
          terms: attribute.terms.map((term) => {
            const variation = variationsForTerm.get(term.slug);
            const available = variation ? variation.is_purchasable && variation.is_in_stock : null;

            return {
              id: term.id,
              name: term.name,
              slug: term.slug,
              available
            };
          })
        };
      });
  }, [product, variations]);

  /** The variation matching every chosen option, if one exists. */
  const match = useMemo(() => {
    if (!variations.length) return null;

    const chosen = Object.entries(selected).filter(([, value]) => value);
    if (chosen.length !== optionGroups.length) return null;

    return (
      variations.find((variation) =>
        optionGroups.every((group) => {
          const value = selected[group.id];
          const attribute = variation.attributes?.[group.taxonomy ?? group.name];
          const label = typeof attribute === "string" ? attribute : attribute?.option;
          return String(label ?? "").toLowerCase() === String(value).toLowerCase();
        })
      ) ?? null
    );
  }, [selected, variations, optionGroups]);

  const gallery = useMemo(() => {
    if (!product) return [];
    const images = [product.image, ...(product.galleries?.thumbs ?? [])];
    return images.filter((image, index, all) => image && all.findIndex((o) => o?.id === image.id) === index);
  }, [product]);

  const isVariable = product?.type === "variable";
  const needsChoice = isVariable && !match;
  const soldOut = Boolean(product && (!product.is_in_stock || (!isVariable && product.is_purchasable === false)));
  const canBuy = Boolean(product) && !soldOut && (!isVariable || Boolean(match));

  const activePrice = match?.priceParts ? { ...product, priceParts: match.priceParts, prices: match.prices ?? product.prices } : product;
  const activeStock = match ? match.is_in_stock : product?.is_in_stock;
  const productFacts = (product?.attributes ?? []).filter((attribute) => attribute.terms?.length);

  async function handleAdd() {
    if (!canBuy || adding) return;

    setAdding(true);
    const result = await addItem({
      id: product.id,
      quantity,
      variationId: match ? [match.id] : undefined
    });
    setAdding(false);

    if (result) open("cart");
  }

  if (loading) return <ProductSkeleton />;

  if (error === "not-found") {
    return (
      <main className="page state-msg">
        <h1 className="hdr-md">Product not found</h1>
        <p className="body-sm muted">It may have sold out or moved.</p>
        <Link to="/shop" className="btn">
          Back to shop
        </Link>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="page state-msg">
        <h1 className="sub-md">Something went wrong</h1>
        <p className="body-sm muted">{error}</p>
        <Link to="/shop" className="btn btn--secondary">
          Back to shop
        </Link>
      </main>
    );
  }

  return (
    <main className="page pdp">
      <div className="container">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true">/</span>
          {product.categories?.[0] ? (
            <>
              <Link to={`/shop/${product.categories[0].slug}`}>{product.categories[0].name}</Link>
              <span aria-hidden="true">/</span>
            </>
          ) : null}
          <span aria-current="page">{product.name}</span>
        </nav>

        <div className="pdp__layout pdp__layout--details">
          <header className="pdp__heading">
            <h1 className="hdr-sm pdp__title">{product.name}</h1>
            <div className="pdp__meta">
              <Price product={activePrice} size="lg" />
              {product.review_count ? <Stars rating={product.average_rating} count={product.review_count} /> : null}
            </div>
          </header>

          <section className="pdp__gallery" aria-label="Product images">
            <div className="pdp__stage">
              {gallery[activeImage] ? (
                <img
                  src={gallery[activeImage].src ?? gallery[activeImage].thumbnail}
                  alt={gallery[activeImage].alt || product.name}
                  className="pdp__image"
                />
              ) : (
                <NoImage>
                  <NoImageMark>{STORE_NAME}</NoImageMark>
                </NoImage>
              )}

              {soldOut ? <span className="badge pdp__flag">Sold out</span> : null}
            </div>

            {gallery.length > 1 ? (
              <ul className="pdp__thumbs">
                {gallery.map((image, index) => (
                  <li key={image.id ?? index}>
                    <button
                      type="button"
                      className="pdp__thumb"
                      data-active={index === activeImage || undefined}
                      onClick={() => setActiveImage(index)}
                      aria-label={`View image ${index + 1} of ${gallery.length}`}
                      aria-pressed={index === activeImage}
                    >
                      <img src={image.thumbnail ?? image.src} alt="" loading="lazy" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className="pdp__info">
            {product.shortDescriptionHtml ? (
              <div
                className="pdp__short body-sm"
                dangerouslySetInnerHTML={{ __html: product.shortDescriptionHtml }}
              />
            ) : null}

            {productFacts.length ? (
              <dl className="pdp__facts body-sm">
                {productFacts.map((attribute) => (
                  <div key={attribute.id ?? attribute.name}>
                    <dt>{attribute.name}</dt>
                    <dd>{attribute.terms.map((term) => term.name).join(", ")}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            {/* Option groups */}
            {optionGroups.map((group) => (
              <div key={group.id} className="pdp__options">
                <p className="pdp__optionlabel lead-sm">
                  {group.name}:{" "}
                  <span className="muted">{selected[group.id] ?? "Select"}</span>
                </p>

                <div
                  className={group.isShade ? "swatches" : "pills"}
                  role="radiogroup"
                  aria-label={group.name}
                >
                  {group.terms.map((term) => {
                    const on = selected[group.id] === term.name;
                    const disabled = term.available === false;

                    if (group.isShade) {
                      return (
                        <button
                          key={term.id}
                          type="button"
                          role="radio"
                          className="swatch"
                          style={{ "--swatch-color": shadeColor(term.name) }}
                          aria-checked={on}
                          aria-label={term.name}
                          disabled={disabled}
                          onClick={() => setSelected((current) => ({ ...current, [group.id]: term.name }))}
                        >
                          <span className="swatch__dot" />
                        </button>
                      );
                    }

                    return (
                      <button
                        key={term.id}
                        type="button"
                        role="radio"
                        className={`pill ${disabled ? "pill--out" : ""}`}
                        aria-checked={on}
                        disabled={disabled}
                        onClick={() => setSelected((current) => ({ ...current, [group.id]: term.name }))}
                      >
                        {term.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Quantity + CTA */}
            <div className="pdp__buy">
              {soldOut || activeStock === false ? (
                <NotifyMe
                  productName={product.name}
                  notified={notified}
                  onNotified={() => setNotified(true)}
                />
              ) : (
                <>
                  <QuantityStepper
                    value={quantity}
                    onChange={setQuantity}
                    min={Math.max(1, match?.quantity_limits?.minimum ?? 1)}
                    max={match?.quantity_limits?.maximum ?? 9999}
                    label={product.name}
                  />

                  <button
                    type="button"
                    className="btn btn--lg btn--block pdp__cta"
                    onClick={handleAdd}
                    disabled={!canBuy || adding}
                  >
                    {adding ? "Adding…" : needsChoice ? "Select an option" : "Add to Bag"}
                    {!adding && !needsChoice ? <BagIcon size={16} /> : null}
                  </button>
                </>
              )}
            </div>

            {!soldOut ? (
              <ul className="pdp__perks">
                {["Free shipping over $75", "14-day returns", "Cruelty free"].map((perk) => (
                  <li key={perk}>
                    <CheckIcon size={14} />
                    {perk}
                  </li>
                ))}
              </ul>
            ) : null}

            {/* Detail accordions */}
            <div className="pdp__acc">
              <Accordion title="Description" defaultOpen>
                {product.descriptionHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
                ) : (
                  <p className="muted">No description provided.</p>
                )}
              </Accordion>

              <Accordion title="Shipping + Returns">
                <p>
                  Orders typically arrive within 1–3 business days in the
                  Netherlands and 3–7 business days across the EU. Returns are
                  accepted within 14 days, provided the item is unused and its
                  hygiene seal is intact.
                </p>
                <p>
                  <Link to="/order-tracking">Track an order</Link> or read our{" "}
                  <Link to="/refund-and-returns">Refund &amp; Returns Policy</Link>.
                </p>
              </Accordion>

              <Accordion title="Ingredients">
                <p>
                  Full ingredient lists are printed on each product page. Vendor
                  formulations are shown as supplied; always check the carton if
                  you have an allergy.
                </p>
              </Accordion>
            </div>

            <div className="pdp__skumeta body-xs muted">
              {ean ? (
                <p>
                  <strong>EAN:</strong> {ean}
                </p>
              ) : null}
              {product.sku ? (
                <p>
                  <strong>SKU:</strong> {product.sku}
                </p>
              ) : null}
              {product.categories?.length ? (
                <p>
                  <strong>Category:</strong>{" "}
                  {product.categories.map((category, index) => (
                    <span key={category.id}>
                      {index ? ", " : ""}
                      <Link to={`/shop/${category.slug}`}>{category.name}</Link>
                    </span>
                  ))}
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </div>

      {/* Pairings */}
      {related.length ? (
        <section className="container section">
          <header className="section__head">
            <h2 className="hdr-md">You may also like</h2>
            <Link to="/shop" className="btn-link btn-link--lg">
              Shop all
              <ArrowIcon />
            </Link>
          </header>

          <div className="grid-products">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="container section">
        <DisclosureList
          items={[
            {
              question: "How do I choose my option?",
              answer: "Each option is labelled with the exact shade or size. If a swatch is struck through it is sold out for that combination — pick another to see what is in stock."
            },
            {
              question: "When will my order arrive?",
              answer: "Delivery typically takes 1–3 business days in the Netherlands and 3–7 business days across the EU. You will get a tracking link by email as soon as the parcel leaves the studio."
            },
            {
              question: "What if it isn't right for me?",
              answer: "Send unused, unsealed items back within 14 days of delivery. Return shipping is generally paid by the customer, and refunds are issued within 14 days of receiving the return."
            }
          ]}
        />
      </section>
    </main>
  );
}

/* ------------------------------------------------------------------ *
 * Restock notification
 * ------------------------------------------------------------------ */

function NotifyMe({ productName, notified, onNotified }) {
  if (notified) {
    return (
      <div className="notify">
        <h2 className="hdr-sm notify__title">Thanks.</h2>
        <p className="body-md">We’ll let you know when {productName} is back in stock.</p>
      </div>
    );
  }

  return (
    <div className="notify">
      <h2 className="sub-sm notify__head">Sold out</h2>

      <EmailCapture
        placeholder="Email Address"
        submitLabel="Notify me"
        onSubmit={async () => {
          await new Promise((resolve) => setTimeout(resolve, 400));
          onNotified();
        }}
      />

      <p className="body-xs muted notify__note">
        We’ll only use your email to notify you when this product is restocked.
      </p>
    </div>
  );
}

function attributeSlugFor(variation, taxonomy) {
  const attribute = variation?.attributes?.[taxonomy];
  const label = typeof attribute === "string" ? attribute : attribute?.option;
  return label ? String(label).toLowerCase().replace(/\s+/g, "-") : null;
}

function ProductSkeleton() {
  return (
    <main className="page pdp">
      <div className="container">
        {/* Mirrors the real .crumbs row so the gallery doesn't jump down once
            the product resolves. Height must match the loaded breadcrumb. */}
        <nav className="crumbs" aria-hidden="true">
          <span className="skeleton" style={{ height: 21, width: "62%" }} />
        </nav>

        <div className="pdp__layout">
          <div className="pdp__gallery">
            <div className="pdp__stage skeleton" style={{ aspectRatio: "3 / 4" }} />
          </div>

          <div className="pdp__info">
            <div className="skeleton" style={{ height: 34, width: "70%" }} />
            <div className="skeleton" style={{ height: 20, width: "30%", marginTop: 20 }} />
            <div className="skeleton" style={{ height: 60, marginTop: 32 }} />
            <div className="skeleton" style={{ height: 60, marginTop: 32 }} />
          </div>
        </div>
      </div>
    </main>
  );
}

export { discountPercent, CloseIcon };
