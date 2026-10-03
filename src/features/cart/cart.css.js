import styled, { css } from "styled-components";
import { mq } from "../../shared/styles/theme.js";
import { BodySm, LeadSm, Muted, Page, SubSm } from "../../shared/ui/primitives.js";
import { DrawerBody, DrawerFoot } from "../layout/components/chrome.js";

/**
 * Cart surfaces shared by the bag drawer, the bag page, and checkout.
 *
 * Ported verbatim from the .cart-line*, .ship-meter*, .ledger*, .promo*, and
 * .assurance rules in shop.css / ui.css so the two agree on totals, promo
 * codes, and reassurance. The line rows carry a 1px divider between items,
 * which is the only rule that makes a multi-item bag read as separate rows.
 */

/* ---- Totals ledger ------------------------------------------ */

export const Ledger = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-bottom: 16px;
`;

export const LedgerRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  font-size: ${({ theme: t }) => t.type.bodyMd[0]};
  letter-spacing: ${({ theme: t }) => t.type.bodyMd[1]};
  color: ${({ theme: t }) => t.color.cocoa};

  ${({ $total }) =>
    $total &&
    css`
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid ${({ theme: t }) => t.color.grey200};
    `}

  ${({ $discount }) =>
    $discount &&
    css`
      color: ${({ theme: t }) => t.color.kabul};
    `}
`;

export const LedgerMuted = styled.span`
  ${Muted};
  font-size: ${({ theme: t }) => t.type.bodySm[0]};
  text-align: right;
`;

/* ---- Reassurance strip --------------------------------------- */

export const Assurance = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 27px;
  overflow: hidden;
  background: ${({ theme: t }) => t.color.cartBanner};
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: ${({ theme: t }) => t.color.cocoa};
  white-space: nowrap;

  span + span::before {
    content: "\\2022";
    margin-right: 8px;
    color: ${({ theme: t }) => t.color.sonicSilver};
  }
`;

/* ---- Free-shipping meter ------------------------------------- */

export const ShipMeter = styled.div`
  padding-inline: 0 0;
  margin-bottom: 20px;
`;

export const MeterMsg = styled.p`
  margin-bottom: 10px;
  font-size: 12.8px;
  line-height: 1.5;
  letter-spacing: 0.01em;
  text-align: center;
  color: ${({ theme: t }) => t.color.cocoa};

  strong {
    font-weight: 500;
  }
`;

export const MeterTrack = styled.div`
  height: 4px;
  background: ${({ theme: t }) => t.color.grey300};
  overflow: hidden;
`;

export const MeterFill = styled.span`
  display: block;
  height: 100%;
  background: ${({ theme: t }) => t.color.cocoa};
  transition: width 400ms ${({ theme: t }) => t.motion.ease};
`;

/* ---- Line items --------------------------------------------- */

export const LineList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

/** The divider above each row is what makes the bag read as separate items. */
export const LineRow = styled.li`
  position: relative;
  display: flex;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid ${({ theme: t }) => t.color.greyLightish};
  line-height: 1.7;

  &:first-child {
    border-top: 0;
    padding-top: 0;
  }

  ${({ $page }) =>
    $page &&
    css`
      padding-block: 24px;
    `}

  ${({ $busy }) =>
    $busy &&
    css`
      opacity: 0.5;
      pointer-events: none;
    `}
`;

export const LineMedia = styled.a`
  flex: 0 0 88px;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  background: ${({ theme: t }) => t.color.springWood};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const LineInfo = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
  min-width: 0;
`;

export const LineTop = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
`;

export const LineNames = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

export const LineName = styled.a`
  font-size: ${({ theme: t }) => t.type.bodySm[0]};
  letter-spacing: ${({ theme: t }) => t.type.bodySm[1]};
  color: ${({ theme: t }) => t.color.cocoa};
  transition: color ${({ theme: t }) => `${t.motion.slow} ${t.motion.ease}`};

  &:hover {
    color: ${({ theme: t }) => t.color.sonicSilver};
  }
`;

export const LineVariant = styled.span`
  font-size: ${({ theme: t }) => t.type.bodySm[0]};
  letter-spacing: ${({ theme: t }) => t.type.bodySm[1]};
  color: ${({ theme: t }) => t.color.sonicSilver};
`;

/** Extends LeadSm rather than using `as`, which would drop its typography —
 *  the legacy markup carried both `lead-sm` and `cart-line__price`. */
export const LinePrice = styled(LeadSm)`
  white-space: nowrap;
  color: ${({ theme: t }) => t.color.cocoa};
`;

export const LineControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

export const LineRemoveIcon = styled.button.attrs({ type: "button" })`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 48px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  color: ${({ theme: t }) => t.color.cocoa};
  transition: background-color ${({ theme: t }) => `${t.motion.fast} ${t.motion.ease}`};

  &:hover {
    background: ${({ theme: t }) => t.color.springWood};
  }
`;

export const LineRemoveLink = styled.button.attrs({ type: "button" })`
  font-size: ${({ theme: t }) => t.type.bodyXs[0]};
  letter-spacing: ${({ theme: t }) => t.type.bodyXs[1]};
  text-decoration: underline;
  text-underline-offset: 4px;
  color: ${({ theme: t }) => t.color.sonicSilver};
  transition: color ${({ theme: t }) => `${t.motion.slow} ${t.motion.ease}`};

  &:hover {
    color: ${({ theme: t }) => t.color.cocoa};
  }
`;

/* ---- Promo code ---------------------------------------------- */

export const Promo = styled.div`
  margin-top: 24px;
  border-top: 1px solid ${({ theme: t }) => t.color.grey300};
`;

export const PromoToggle = styled.button.attrs({ type: "button" })`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding: 20px 0;
  color: ${({ theme: t }) => t.color.cocoa};
`;

/** The plus/minus glyph, rotated into an x when the panel is open. */
export const AccIcon = styled.span`
  position: relative;
  flex: 0 0 15px;
  width: 15px;
  height: 15px;
  color: ${({ theme: t }) => t.color.cocoa};

  &::before,
  &::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 10px;
    height: 1px;
    background: currentColor;
    transform: translate(-50%, -50%);
  }

  /* Stood up to read as "+" while closed; rotates down onto the other bar to
   * read as "-" once expanded. */
  &::after {
    transform: translate(-50%, -50%) rotate(90deg);
    transition: transform 250ms ${({ theme: t }) => t.motion.ease};
  }

  ${({ $open }) =>
    $open &&
    css`
      &::after {
        transform: translate(-50%, -50%);
      }
    `}
`;

export const PromoPanel = styled.div`
  display: grid;
  grid-template-rows: ${({ $open }) => ($open ? "1fr" : "0fr")};
  transition: grid-template-rows 250ms ${({ theme: t }) => t.motion.ease};

  > div {
    overflow: hidden;
  }
`;

export const PromoForm = styled.form`
  display: flex;
  gap: 10px;
  padding-bottom: 20px;
`;

export const PromoInput = styled.input.attrs({ type: "text" })`
  flex: 1;
  min-width: 0;
  padding: 12px 2px;
  background: transparent;
  border: 0;
  border-bottom: 1px solid ${({ theme: t }) => t.color.cavernous};
  font-size: ${({ theme: t }) => t.type.bodySm[0]};
  letter-spacing: ${({ theme: t }) => t.type.bodySm[1]};
  color: ${({ theme: t }) => t.color.cocoa};

  &:focus {
    outline: none;
    border-bottom-color: ${({ theme: t }) => t.color.cocoa};
  }
`;

export const PromoCodes = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 20px;
  margin: 0;

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 14px;
    background: ${({ theme: t }) => t.color.springWood};
    font-size: ${({ theme: t }) => t.type.bodyXs[0]};
    letter-spacing: ${({ theme: t }) => t.type.bodyXs[1]};
    text-transform: uppercase;
    color: ${({ theme: t }) => t.color.cocoa};
  }
`;

export const PromoCode = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

export const PromoRemove = styled.button.attrs({ type: "button" })`
  color: ${({ theme: t }) => t.color.sonicSilver};
`;

/* ---- Empty bag ----------------------------------------------- */

export const EmptyBag = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  padding: ${({ $page }) => ($page ? "72px 0" : "48px 0 24px")};
  text-align: center;
  color: ${({ theme: t }) => t.color.cocoa};
`;

export const EmptyRecs = styled.div`
  width: 100%;
  margin-top: 16px;
  text-align: left;

  > p {
    margin-bottom: 8px;
  }
`;

/* ---- Drawer shell extras -------------------------------------- */

/** The bag body tucks its first block up under the drawer head. */
export const CartDrawerBody = styled(DrawerBody)`
  padding-top: 16px;
`;

/** Separates the totals block from the line items above it. */
export const DrawerLedger = styled.div`
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid ${({ theme: t }) => t.color.greyLightish};
`;

/** Single row above the CTA: label left, amount right. */
export const DrawerEstimate = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  font-weight: 800;
  color: ${({ theme: t }) => t.color.cocoa};
`;

export const DrawerActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

  /* The secondary action is a link-height row so the block reads as one CTA
     with a fallback underneath. */
  > *:last-child {
    min-height: 36px;
    padding-block: 8px;
  }
`;

export const DrawerAssurance = styled(Assurance)`
  height: auto;
  min-height: 27px;
  flex-wrap: wrap;
  gap: 6px;
  letter-spacing: 0.6px;
  margin-bottom: 0;
  overflow: visible;
  white-space: normal;
  text-align: center;
`;

/** Pinned bottom block. The 181px budget is the panel's floor, so the parts
 *  spread inside it rather than growing the card past the design height. */
export const CartDrawerFoot = styled(DrawerFoot)`
  min-height: 181px;
  padding: 8px 24px 12px;

  ${mq.lg} {
    padding: 8px 16px 12px;
  }
`;

/* ---- Bag page ------------------------------------------------ */

/** `.page` shell + `.cart-page` block padding, on the inset container width. */
export const CartPage = styled(Page)`
  padding-block: 40px 80px;
`;

export const CartPageTitle = styled(SubSm).attrs({ as: "h1" })`
  margin-bottom: 32px;
  color: ${({ theme: t }) => t.color.cocoa};
`;

/** Roomier line rhythm than the drawer's. */
export const PageLine = styled(LineRow)`
  padding-block: 24px;
`;

export const PageSummary = styled.div`
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid ${({ theme: t }) => t.color.grey200};

  ${mq.lg} {
    margin-top: 0;
    padding-top: 0;
    border-top: 0;
  }
`;

export const CartMain = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 360px);
  align-items: start;
  gap: 64px;

  ${mq.lg} {
    display: block;
  }
`;

export const PageNote = styled(BodySm)`
  ${Muted};
  margin-bottom: 16px;
`;

/** Stacks the checkout / continue pair 10px apart, as `.btn + .btn` did. */
export const PageActions = styled.div`
  > * + * {
    margin-top: 10px;
  }
`;

export const Perks = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 24px 0 0;
  padding: 0;

  li {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: ${({ theme: t }) => t.type.bodySm[0]};
    color: ${({ theme: t }) => t.color.kabul};
  }
`;
