import styled from "styled-components";
import { discountPercent } from "../lib/format.js";
import { StarIcon } from "./Icons.jsx";
import { LeadSm, LeadLg, BodySm, Muted, SrOnly } from "./primitives.js";

/* ---- Price ---------------------------------------------------- */

const PriceWrap = styled.p`
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  color: ${({ theme: t }) => t.color.cocoa};

  del {
    color: ${({ theme: t }) => t.color.cavernous};
    text-decoration-thickness: 1px;
  }

  ins {
    text-decoration: none;
    font-weight: 600;
  }

  small {
    ${Muted};
  }
`;

const Off = styled.span`
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${({ theme: t }) => t.color.rust};
`;

const RatingText = styled(BodySm)`
  ${Muted};
`;

const amountFor = (size) =>
  size === "lg" ? LeadLg : size === "sm" ? BodySm : LeadSm;

/** Renders a price with a struck regular amount when the item is reduced. */
export function Price({ product, className = "", size = "md" }) {
  const parts = product?.priceParts ?? {};
  const prices = product?.prices ?? {};
  const off = discountPercent(prices);
  const Amount = amountFor(size);

  return (
    <PriceWrap className={className} as={Amount} $as={Amount}>
      {parts.regular && parts.sale ? (
        <>
          <del aria-label={`Original price ${parts.regular}`}>{parts.regular}</del>
          <ins aria-label={`Sale price ${parts.sale}`}>{parts.sale}</ins>
        </>
      ) : (
        <span>{parts.current}</span>
      )}
      {off ? <Off>-{off}%</Off> : null}
    </PriceWrap>
  );
}

/** Compact price for carts, where the currency is usually redundant. */
export function LinePrice({ item, currency }) {
  const price = Number(item?.totals?.line_total ?? 0);
  const subtotal = Number(item?.totals?.line_subtotal ?? 0);

  return (
    <PriceWrap as={LeadSm}>
      {subtotal !== price ? (
        <>
          <del>{item.totals.line_subtotal_formatted ?? subtotal}</del>
          <ins>{item.totals.line_total_formatted ?? price}</ins>
        </>
      ) : (
        <span>{item.totals.line_total_formatted ?? price}</span>
      )}
      {currency ? <small>{currency}</small> : null}
    </PriceWrap>
  );
}

/* ---- Rating --------------------------------------------------- */

const StarsWrap = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

const StarsRow = styled.span`
  display: inline-flex;
  gap: 2px;
`;

export function Stars({ rating = 0, count, size = 13, className = "" }) {
  const value = Number(rating) || 0;
  if (!value && !count) return null;

  return (
    <StarsWrap className={className} title={`${value} out of 5`}>
      <StarsRow aria-hidden="true">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon key={star} size={size} filled={star <= Math.round(value)} />
        ))}
      </StarsRow>

      {count ? (
        <RatingText as="span" $light>
          {value} <SrOnly>out of 5 stars,</SrOnly> {count}{" "}
          {count === 1 ? "Review" : "Reviews"}
        </RatingText>
      ) : (
        <SrOnly>{value} out of 5 stars</SrOnly>
      )}
    </StarsWrap>
  );
}
