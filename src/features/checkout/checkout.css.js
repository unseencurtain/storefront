/**
 * Checkout styles, ported 1:1 from the legacy `.checkout*`, `.summary*`,
 * `.ledger*`, `.steps*`, `.rate*`, `.promo*` and `.field*` rules so the page
 * keeps the exact approved design while the CSS files shrink.
 */
import styled, { css } from "styled-components";
import { mq } from "../../shared/styles/theme.js";
import {
  Container,
  ContainerInset,
  ContainerNarrow,
  Muted,
  SubMd
} from "../../shared/ui/primitives.js";

/* ---- Reusable atoms lifted out of ui.css -------------------- */

/**
 * Defaults to `type="button"` on purpose: these atoms sit inside the checkout
 * <form>, and a bare <button> defaults to submit, which would place the order
 * whenever a step button is clicked. Opt in explicitly with type="submit".
 */
export const Button = styled.button.attrs((p) => ({
  type: p.type ?? "button"
}))`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px;
  padding: 14px 32px;
  font-family: ${({ theme: t }) => t.font.sans};
  font-size: ${({ theme: t }) => t.type.subheaderXs[0]};
  font-weight: 500;
  line-height: 1.5;
  letter-spacing: 0.075rem;
  text-transform: uppercase;
  text-align: center;
  border: 1.5px solid ${({ theme: t }) => t.color.cocoa};
  background: ${({ theme: t, $quiet, $secondary }) =>
    $quiet ? "transparent" : $secondary ? t.color.white : t.color.cocoa};
  color: ${({ theme: t, $quiet, $secondary }) =>
    $quiet || $secondary ? t.color.cocoa : t.color.white};
  cursor: pointer;
  transition:
    background-color ${({ theme: t }) => `${t.motion.slow} ${t.motion.ease}`},
    border-color ${({ theme: t }) => `${t.motion.slow} ${t.motion.ease}`},
    color ${({ theme: t }) => `${t.motion.slow} ${t.motion.ease}`};

  &:hover:not(:disabled) {
    background: ${({ theme: t, $quiet, $secondary }) =>
      $quiet ? t.color.cocoa : t.color.cocoa};
    border-color: ${({ theme: t }) => t.color.kabulHover};
    color: ${({ theme: t, $quiet }) => ($quiet ? t.color.white : t.color.white)};
  }

  &:disabled {
    color: ${({ theme: t }) => t.color.grey300};
    border-color: ${({ theme: t }) => t.color.grey300};
    background: ${({ theme: t, $quiet }) => ($quiet ? "transparent" : t.color.grey300)};
    cursor: not-allowed;
  }

  ${({ $block }) =>
    $block &&
    css`
      width: 100%;
    `}
`;

export const TextLink = styled.button.attrs({ type: "button" })`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: 0;
  background: none;
  font-family: ${({ theme: t }) => t.font.sans};
  font-size: ${({ theme: t }) => t.type.subheaderXs[0]};
  font-weight: 500;
  line-height: 1.5;
  letter-spacing: ${({ theme: t }) => t.type.subheaderXs[1]};
  text-transform: uppercase;
  color: ${({ theme: t }) => t.color.cocoa};
  cursor: pointer;
  transition: color ${({ theme: t }) => `${t.motion.slow} ${t.motion.ease}`};

  &:hover {
    color: ${({ theme: t }) => t.color.kabulHover};
  }

  svg {
    transition: transform ${({ theme: t }) => `${t.motion.fast} ${t.motion.ease}`};
  }

  &:hover svg {
    transform: translateX(3px);
  }
`;

export const WordmarkSmall = styled.a`
  justify-self: start;
  font-family: ${({ theme: t }) => t.font.serif};
  font-size: 22px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: ${({ theme: t }) => t.color.cocoa};
  text-decoration: none;
`;

export const InlineLink = styled.a`
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 4px;
  transition: color ${({ theme: t }) => `${t.motion.slow} ${t.motion.ease}`};

  &:hover {
    color: ${({ theme: t }) => t.color.kabulHover};
  }
`;

const control = css`
  width: 100%;
  min-height: 48px;
  padding: 14px 2px;
  background: transparent;
  border: 0;
  border-bottom: 1px solid
    ${({ theme: t, $invalid }) => ($invalid ? t.color.rust : t.color.cocoa)};
  border-radius: 0;
  color: ${({ theme: t }) => t.color.cocoa};
  font-family: ${({ theme: t }) => t.font.sans};
  font-size: ${({ theme: t }) => t.type.bodyMd[0]};
  line-height: 1.5;
  letter-spacing: ${({ theme: t }) => t.type.bodyMd[1]};
  transition: border-color ${({ theme: t }) => `${t.motion.fast} ${t.motion.ease}`};

  &::placeholder {
    color: ${({ theme: t }) => t.color.grey400};
  }

  &:focus {
    outline: none;
    border-bottom-color: ${({ theme: t }) => t.color.cocoa};
    border-bottom-width: 2px;
    padding-bottom: 13px;
  }
`;

export const Field = styled.div`
  display: block;
  position: relative;
`;

export const FieldLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: ${({ theme: t }) => t.type.bodyXs[0]};
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${({ theme: t }) => t.color.cocoa};

  span {
    color: ${({ theme: t }) => t.color.rust};
  }
`;

export const Input = styled.input`
  ${control};
`;

export const Textarea = styled.textarea`
  ${control};
  min-height: 88px;
  resize: vertical;
`;

export const Select = styled.select`
  ${control};
  appearance: none;
  cursor: pointer;
  background-image: linear-gradient(45deg, transparent 50%, currentColor 50%),
    linear-gradient(135deg, currentColor 50%, transparent 50%);
  background-position:
    calc(100% - 11px) calc(50% - 1px),
    calc(100% - 6px) calc(50% - 1px);
  background-size: 5px 5px;
  background-repeat: no-repeat;
  padding-right: 28px;
`;

export const FieldError = styled.p`
  margin-top: 6px;
  font-size: 14px;
  line-height: 1.28;
  color: ${({ theme: t }) => t.color.rust};
`;

export const FieldRow = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  ${mq.sm} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

/* ---- Checkout page ----------------------------------------- */

export const CheckoutPage = styled.main`
  padding-block: 48px 96px;
`;

export const CheckoutGrid = styled(Container)`
  display: grid;
  grid-template-columns: minmax(0, 580px) minmax(0, 480px);
  gap: 90px;
  justify-content: center;
  align-items: start;

  ${mq.lg} {
    grid-template-columns: minmax(0, 1fr);
    gap: 40px;
  }
`;

export const CheckoutMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const CheckoutTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 24px;
  border-bottom: 1px solid ${({ theme: t }) => t.color.grey200};
`;

export const Title = styled(SubMd).attrs({ as: "h1" })`
  color: ${({ theme: t }) => t.color.cocoa};
`;

export const PanelHead = styled.h2`
  margin-top: 12px;
  color: ${({ theme: t }) => t.color.cocoa};
`;

export const Panel = styled.section`
  display: flex;
  flex-direction: column;
  gap: 20px;

  &[hidden] {
    display: none;
  }
`;

export const Steps = styled.ol`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding-bottom: 8px;
  margin: 0;
  list-style: none;
`;

export const StepItem = styled.li`
  &:not(:last-child)::after {
    content: "";
    display: inline-block;
    width: 24px;
    height: 1px;
    margin-left: 8px;
    background: ${({ theme: t }) => t.color.grey300};
    vertical-align: middle;
  }
`;

export const StepButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  border: 0;
  background: none;
  font-family: ${({ theme: t }) => t.font.sans};
  font-size: ${({ theme: t }) => t.type.bodyXs[0]};
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${({ theme: t, $state }) =>
    $state === "todo" ? t.color.grey400 : t.color.cocoa};
  cursor: ${({ $state }) => ($state === "done" ? "pointer" : "default")};
`;

export const StepDot = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: 1px solid currentColor;
  border-radius: 50%;
  font-size: 11px;
  background: ${({ theme: t, $state }) =>
    $state === "current" ? t.color.cocoa : "transparent"};
  color: ${({ theme: t, $state }) =>
    $state === "current" ? t.color.white : "inherit"};
`;

export const ErrorBanner = styled.p`
  padding: 14px 16px;
  background: #fbf1f0;
  border-left: 2px solid ${({ theme: t }) => t.color.rust};
  font-size: ${({ theme: t }) => t.type.bodySm[0]};
  color: ${({ theme: t }) => t.color.rust};
`;

export const Legal = styled.p`
  ${Muted};
  max-width: 52ch;
`;

export const CheckLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: ${({ theme: t }) => t.type.bodySm[0]};
  color: ${({ theme: t }) => t.color.kabul};
  cursor: pointer;

  input {
    width: 16px;
    height: 16px;
    accent-color: ${({ theme: t }) => t.color.cocoa};
  }
`;

export const CheckoutNav = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 8px;
`;

export const ContactSummary = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  background: ${({ theme: t }) => t.color.springWood};
`;

/* ---- Shipping / payment option rows ------------------------- */

export const OptionList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const Option = styled.label`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border: 1px solid
    ${({ theme: t, $active }) => ($active ? t.color.cocoa : t.color.grey300)};
  cursor: pointer;
  transition: border-color ${({ theme: t }) => `${t.motion.fast} ${t.motion.ease}`};

  &:hover {
    border-color: ${({ theme: t }) => t.color.cocoa};
  }

  input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
`;

export const OptionDot = styled.span`
  flex: 0 0 16px;
  width: 16px;
  height: 16px;
  border: 1px solid
    ${({ theme: t, $active }) => ($active ? t.color.cocoa : t.color.grey400)};
  border-radius: 50%;
  transition:
    border-color ${({ theme: t }) => `${t.motion.fast} ${t.motion.ease}`},
    box-shadow ${({ theme: t }) => `${t.motion.fast} ${t.motion.ease}`};
  box-shadow: ${({ $active }) =>
    $active
      ? "inset 0 0 0 4px #ffffff, inset 0 0 0 9px currentColor"
      : "none"};
  color: ${({ theme: t }) => t.color.cocoa};
`;

export const OptionBody = styled.span`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  color: ${({ theme: t }) => t.color.cocoa};
`;

export const OptionPrice = styled.span`
  white-space: nowrap;
  color: ${({ theme: t }) => t.color.cocoa};
`;

/* ---- Order summary rail ------------------------------------- */

export const SummaryAside = styled.aside`
  position: sticky;
  top: 32px;

  ${mq.lg} {
    position: static;
  }
`;

export const Summary = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 32px;
  background: ${({ theme: t }) => t.color.stone};
  border: 1px solid ${({ theme: t }) => t.color.grey200};
`;

export const SummaryItems = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 340px;
  overflow-y: auto;
  padding-right: 4px;
  margin: 0;
  list-style: none;
`;

export const SummaryItem = styled.li`
  display: grid;
  grid-template-columns: 60px minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
`;

export const SummaryThumb = styled.span`
  position: relative;
  display: block;
  aspect-ratio: 3 / 4;
  overflow: visible;
  background: ${({ theme: t }) => t.color.white};
  border: 1px solid ${({ theme: t }) => t.color.grey200};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const SummaryQty = styled.span`
  position: absolute;
  top: -8px;
  right: -8px;
  min-width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: ${({ theme: t }) => t.color.cocoa};
  color: ${({ theme: t }) => t.color.white};
  font-size: 10px;
  font-weight: 600;
`;

export const SummaryNames = styled.span`
  display: flex;
  flex-direction: column;
  min-width: 0;
  color: ${({ theme: t }) => t.color.cocoa};
`;

export const SummaryPrice = styled.span`
  white-space: nowrap;
  color: ${({ theme: t }) => t.color.cocoa};
`;

/* ---- Promo code --------------------------------------------- */

export const PromoForm = styled.form`
  display: flex;
  gap: 10px;
  padding-bottom: 20px;
`;

export const PromoInput = styled.input`
  flex: 1;
  min-width: 0;
  padding: 12px 2px;
  background: transparent;
  border: 0;
  border-bottom: 1px solid ${({ theme: t }) => t.color.cavernous};
  font-family: ${({ theme: t }) => t.font.sans};
  font-size: ${({ theme: t }) => t.type.bodySm[0]};
  letter-spacing: ${({ theme: t }) => t.type.bodySm[1]};
  color: ${({ theme: t }) => t.color.cocoa};

  &:focus {
    outline: none;
    border-bottom-color: ${({ theme: t }) => t.color.cocoa};
  }
`;

export const AppliedList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0 0 20px;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    background: ${({ theme: t }) => t.color.springWood};
    font-size: ${({ theme: t }) => t.type.bodyXs[0]};
    letter-spacing: ${({ theme: t }) => t.type.bodyXs[1]};
    text-transform: uppercase;
    color: ${({ theme: t }) => t.color.cocoa};
  }
`;

export const AppliedCode = styled.span`
  flex: 0 0 auto;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

export const AppliedDetail = styled.span`
  ${Muted};
  flex: 1;
  min-width: 0;
`;

export const AppliedRemove = styled.button`
  flex: 0 0 auto;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: ${({ theme: t }) => t.color.sonicSilver};
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
`;

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
`;

export const LedgerMuted = styled.span`
  ${Muted};
  text-align: right;
`;

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
    content: "•";
    margin-right: 8px;
    color: ${({ theme: t }) => t.color.sonicSilver};
  }
`;

/* ---- Empty bag + confirmation ------------------------------- */

export const EmptyState = styled(ContainerInset)`
  display: grid;
  place-items: center;
  gap: 18px;
  padding-block: 120px;
  text-align: center;
  color: ${({ theme: t }) => t.color.sonicSilver};
`;

export const Confirmation = styled(ContainerNarrow)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
  padding-block: 80px;
`;

export const ConfirmationList = styled.dl`
  display: flex;
  flex-wrap: wrap;
  gap: 40px;
  width: 100%;
  padding-block: 24px;
  margin: 0;
  border-block: 1px solid ${({ theme: t }) => t.color.grey200};

  dt {
    margin-bottom: 6px;
  }

  dd {
    margin: 0;
    color: ${({ theme: t }) => t.color.cocoa};
  }
`;
