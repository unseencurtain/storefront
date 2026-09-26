import { Link } from "react-router-dom";
import { useState } from "react";
import styled, { css } from "styled-components";
import { useCart } from "../../cart/CartContext.jsx";
import { Price } from "../../../shared/ui/Price.jsx";
import {
  Badge,
  BodyXs,
  Muted,
  NoImage,
  NoImageMark
} from "../../../shared/ui/primitives.js";

/* ---- Catalogue card ----------------------------------------- */

const Card = styled.article`
  position: relative;
  display: flex;
  flex-direction: column;
`;

const Media = styled(Link)`
  position: relative;
  display: block;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  background: ${({ theme: t }) => t.color.springWood};
`;

const Img = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 300ms ${({ theme: t }) => t.motion.ease};
`;

const Primary = styled(Img)`
  opacity: ${({ $crossfade }) => ($crossfade ? 0 : 1)};
`;

const Secondary = styled(Img)`
  opacity: 0;

  ${Media}:hover & {
    opacity: 1;
  }
`;

const Flags = styled.span`
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
`;

const QuickAdd = styled.button`
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid ${({ theme: t }) => t.color.cocoa};
  color: ${({ theme: t }) => t.color.cocoa};
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  opacity: 0;
  transform: translateY(8px);
  transition:
    opacity ${({ theme: t }) => `${t.motion.base} ${t.motion.ease}`},
    transform ${({ theme: t }) => `${t.motion.base} ${t.motion.ease}`},
    background-color ${({ theme: t }) => `${t.motion.fast} ${t.motion.ease}`},
    color ${({ theme: t }) => `${t.motion.fast} ${t.motion.ease}`};

  ${Card}:hover &,
  &:focus-visible {
    opacity: 1;
    transform: translateY(0);
  }

  &:hover,
  ${({ $added, theme: t }) =>
    $added &&
    css`
      background: ${t.color.cocoa};
      color: ${t.color.white};
    `}
`;

const Body = styled.div`
  padding-top: 16px;
`;

const Title = styled.h3`
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  letter-spacing: -0.28px;
  color: ${({ theme: t }) => t.color.cocoa};

  a {
    transition: opacity ${({ theme: t }) => `${t.motion.fast} ${t.motion.ease}`};
  }

  a:hover {
    opacity: 0.7;
  }
`;

const Variants = styled(BodyXs)`
  ${Muted};
  margin-top: 4px;
`;

const CardPrice = styled(Price)`
  margin-top: 6px;
  color: ${({ theme: t }) => t.color.cocoa};
`;

/**
 * Catalogue tile: portrait image with a cross-fade to the second image, then
 * title, price and a quick-add button that appears on hover/focus.
 */
export default function ProductCard({ product, eager = false, showQuickAdd = true }) {
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const image = product.image;
  const second = product.hoverImage;
  const swatchCount =
    product.attributes?.reduce((sum, attribute) => sum + (attribute.terms?.length ?? 0), 0) ?? 0;

  const soldOut = !product.is_in_stock;
  const purchasable = product.is_purchasable && !soldOut;

  async function quickAdd(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!purchasable || adding) return;

    setAdding(true);
    const result = await addItem({ id: product.id, quantity: 1 });
    setAdding(false);

    if (result) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2200);
    }
  }

  return (
    <Card>
      <Media to={`/product/${product.slug}`} aria-label={product.name}>
        {image ? (
          <>
            <Primary
              src={image.src ?? image.thumbnail}
              alt={image.alt || product.name}
              loading={eager ? "eager" : "lazy"}
              decoding="async"
              $crossfade={Boolean(second)}
            />
            {second ? (
              <Secondary
                src={second.src ?? second.thumbnail}
                alt=""
                loading="lazy"
                decoding="async"
              />
            ) : null}
          </>
        ) : (
          <NoImage>
            <NoImageMark>Cereve</NoImageMark>
          </NoImage>
        )}

        <Flags>
          {soldOut ? <Badge $light>Sold out</Badge> : null}
          {!soldOut && product.on_sale ? <Badge>Sale</Badge> : null}
        </Flags>
      </Media>

      {showQuickAdd && purchasable ? (
        <QuickAdd
          type="button"
          $added={added}
          onClick={quickAdd}
          disabled={adding}
          aria-label={`Add ${product.name} to bag`}
        >
          {added ? "Added" : adding ? "Adding…" : "Quick add"}
        </QuickAdd>
      ) : null}

      <Body>
        <Title>
          <Link to={`/product/${product.slug}`}>{product.name}</Link>
        </Title>

        {swatchCount > 1 ? (
          <Variants>
            {swatchCount} option{swatchCount === 1 ? "" : "s"}
          </Variants>
        ) : null}

        <CardPrice product={product} />
      </Body>
    </Card>
  );
}

/* ---- Compact tile (mega menu, search rails) ------------------ */

const TileLink = styled(Link)`
  display: block;
`;

const TileMedia = styled.span`
  display: block;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  background: ${({ theme: t }) => t.color.springWood};
  margin-bottom: 12px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity 300ms ${({ theme: t }) => t.motion.ease};
  }

  ${TileLink}:hover & img {
    opacity: 0.88;
  }
`;

const TileName = styled.span`
  display: block;
  font-size: 12px;
  line-height: 1.4;
  letter-spacing: -0.24px;
  color: ${({ theme: t }) => t.color.cocoa};
`;

const TilePrice = styled(Price)`
  margin-top: 4px;
  font-size: 12px;
  color: ${({ theme: t }) => t.color.cocoa};
`;

/** Compact tile for the mega menu and search overlay rails. */
export function ProductTile({ product, onNavigate }) {
  return (
    <TileLink
      to={`/product/${product.slug}`}
      onClick={onNavigate}
      tabIndex={-1}
      aria-hidden="true"
    >
      <TileMedia>
        {product.image ? (
          <img
            src={product.image.src ?? product.image.thumbnail}
            alt=""
            loading="lazy"
            decoding="async"
          />
        ) : (
          <NoImage as="span" style={{ position: "static", background: "none", padding: 0 }}>
            <NoImageMark as="span" style={{ fontSize: 9 }}>
              Cereve
            </NoImageMark>
          </NoImage>
        )}
      </TileMedia>
      <TileName>{product.name}</TileName>
      <TilePrice product={product} size="sm" />
    </TileLink>
  );
}

/* ---- Mini row (cart drawer recommendations) ------------------ */

const MiniLink = styled(Link)`
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding: 10px 0;
  border-bottom: 1px solid ${({ theme: t }) => t.color.greyLightish};
`;

const MiniMedia = styled.span`
  display: block;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  background: ${({ theme: t }) => t.color.springWood};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const MiniName = styled.span`
  font-size: 12px;
  line-height: 1.4;
  color: ${({ theme: t }) => t.color.cocoa};
`;

const MiniPrice = styled(Price)`
  font-size: 12px;
`;

/** Single-line row used in the cart drawer recommendations. */
export function MiniRow({ product, onNavigate }) {
  return (
    <MiniLink to={`/product/${product.slug}`} onClick={onNavigate}>
      <MiniMedia>
        {product.image ? (
          <img src={product.image.thumbnail ?? product.image.src} alt="" loading="lazy" />
        ) : null}
      </MiniMedia>
      <MiniName>{product.name}</MiniName>
      <MiniPrice product={product} size="sm" />
    </MiniLink>
  );
}
