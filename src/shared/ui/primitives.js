import styled, { css } from "styled-components";
import { mq } from "../styles/theme.js";

/* =============================================================
   Typography — the display/body ramp used across every feature.
   ============================================================= */

const family = css`
  font-family: ${({ theme: t }) => t.font.serif};
  font-weight: 300;
  line-height: 0.9;
  color: ${({ theme: t }) => t.color.cocoa};
`;

const ramp = (step) => css`
  font-size: ${({ theme: t }) => t.type[step][0]};
  letter-spacing: ${({ theme: t }) => t.type[step][1]};
`;

export const H1 = styled.h1`
  ${family};
  ${ramp("headerXl")};

  ${mq.lg} {
    font-size: ${({ theme: t }) => t.type.headerLg[0]};
    letter-spacing: ${({ theme: t }) => t.type.headerLg[1]};
  }
`;

export const H2 = styled.h2`
  ${family};
  ${ramp("headerMd")};

  ${mq.lg} {
    font-size: ${({ theme: t }) => t.type.headerLg[0]};
    letter-spacing: ${({ theme: t }) => t.type.headerLg[1]};
  }
`;

export const H3 = styled.h3`
  ${family};
  ${ramp("headerSm")};

  ${mq.lg} {
    font-size: ${({ theme: t }) => t.type.headerMd[0]};
    letter-spacing: ${({ theme: t }) => t.type.headerMd[1]};
  }
`;

export const H4 = styled.h4`
  ${family};
  ${ramp("headerSm")};
`;

/** Uppercase tracked label. */
const upper = css`
  font-weight: 500;
  line-height: 1.5;
  text-transform: uppercase;
`;

const Sub = styled.p`
  ${upper};
  ${({ $size = "subheaderSm" }) => ramp($size)};
  color: ${({ $muted, theme: t }) => ($muted ? t.color.sonicSilver : "inherit")};
`;

/** Each step pins its own size so `<SubMd />` cannot silently inherit Sub's 14px. */
const subStep = (size) => styled(Sub)`
  ${ramp(size)};
`;

export const SubXs = subStep("subheaderXs");
export const SubSm = Sub;
export const SubMd = subStep("subheaderMd");
export const SubLg = subStep("subheaderLg");

const Body = styled.p`
  ${ramp("bodySm")};
  font-weight: ${({ $light }) => ($light ? 300 : 400)};
  color: ${({ theme: t, $muted }) => ($muted ? t.color.sonicSilver : "inherit")};
`;

export const BodyXs = Body;
export const BodySm = Body;
export const BodyMd = styled(Body)`
  ${ramp("bodyMd")};
`;
export const BodyLg = styled(Body)`
  ${ramp("bodyLg")};
  font-weight: 300;
`;

const Lead = styled.p`
  font-weight: ${({ $weight = 700 }) => $weight};
  color: inherit;
`;

export const LeadSm = styled(Lead)`
  ${ramp("leadSm")};
`;
export const LeadMd = styled(Lead)`
  ${ramp("leadMd")};
`;
export const LeadLg = styled(Lead)`
  ${ramp("leadLg")};
  font-weight: 500;
`;

export const Muted = css`
  color: ${({ theme: t }) => t.color.sonicSilver};
`;

export const SrOnly = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

/* =============================================================
   Buttons
   ============================================================= */

export const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: ${({ $large }) => ($large ? "60px" : "48px")};
  padding: ${({ $large }) => ($large ? "18px 32px" : "14px 32px")};
  font-size: ${({ $large }) => ($large ? "14px" : "12px")};
  font-weight: 500;
  line-height: 1.5;
  letter-spacing: 0.075rem;
  text-transform: uppercase;
  text-align: center;
  border: 1.5px solid
    ${({ theme: t, $variant, $quiet }) =>
      $quiet ? t.color.grey300 : $variant === "secondary" ? t.color.cocoa : t.color.cocoa};
  background: ${({ theme: t, $variant, $quiet }) => {
    if ($quiet) return "transparent";
    if ($variant === "secondary") return "transparent";
    return t.color.cocoa;
  }};
  color: ${({ theme: t, $variant, $quiet }) => {
    if ($quiet) return t.color.cocoa;
    if ($variant === "secondary") return t.color.cocoa;
    return t.color.white;
  }};
  width: ${({ $block }) => ($block ? "100%" : "auto")};
  cursor: pointer;
  transition:
    background-color ${({ theme: t }) => `${t.motion.slow} ${t.motion.ease}`},
    border-color ${({ theme: t }) => `${t.motion.slow} ${t.motion.ease}`},
    color ${({ theme: t }) => `${t.motion.slow} ${t.motion.ease}`};

  &:hover:not(:disabled) {
    background: ${({ theme: t, $variant, $quiet }) => {
      if ($quiet) return t.color.springWood;
      if ($variant === "secondary") return t.color.cocoa;
      return t.color.kabulHover;
    }};
    border-color: ${({ theme: t, $variant, $quiet }) => {
      if ($quiet) return t.color.cocoa;
      if ($variant === "secondary") return t.color.cocoa;
      return t.color.kabulHover;
    }};
    color: ${({ theme: t, $quiet }) => ($quiet ? t.color.cocoa : t.color.white)};
  }

  &:disabled {
    background: ${({ theme: t, $quiet, $variant }) => {
      if ($quiet) return "transparent";
      if ($variant === "secondary") return "transparent";
      return t.color.springWood;
    }};
    border-color: ${({ theme: t, $quiet, $variant }) => {
      if ($quiet) return t.color.grey300;
      if ($variant === "secondary") return t.color.grey300;
      return t.color.springWood;
    }};
    color: ${({ theme: t, $quiet, $variant }) => {
      if ($quiet) return t.color.grey300;
      if ($variant === "secondary") return t.color.grey300;
      return t.color.grey400;
    }};
    cursor: not-allowed;
  }
`;

/** Small-caps text button — "Shop all", "Change", inline actions. */
export const ButtonLink = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ $large }) => ($large ? "6px" : "4px")};
  font-size: ${({ theme: t, $large }) => ($large ? t.type.subheaderSm[0] : t.type.subheaderXs[0])};
  letter-spacing: ${({ theme: t, $large }) => ($large ? "1.4px" : t.type.subheaderXs[1])};
  font-weight: 500;
  line-height: 1.5;
  text-transform: uppercase;
  color: ${({ theme: t }) => t.color.cocoa};
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

export const LinkButton = styled(ButtonLink).attrs({ as: "span" })``;

export const UnderlineLink = css`
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 4px;
  transition: color ${({ theme: t }) => `${t.motion.slow} ${t.motion.ease}`};

  &:hover {
    color: ${({ theme: t }) => t.color.kabulHover};
  }
`;

/* =============================================================
   Form fields
   ============================================================= */

const control = css`
  width: 100%;
  min-height: 48px;
  padding: 14px 2px;
  background: transparent;
  border: 0;
  border-bottom: 1px solid ${({ theme: t }) => t.color.cocoa};
  border-radius: 0;
  color: ${({ theme: t }) => t.color.cocoa};
  font-size: 16px;
  line-height: 1.5;
  letter-spacing: -0.32px;
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

export const FieldLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${({ theme: t }) => t.color.cocoa};
`;

export const Required = styled.span`
  color: ${({ theme: t }) => t.color.rust};
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
  color: ${({ theme: t }) => t.color.cocoa};
`;

export const FieldError = styled.p`
  margin-top: 6px;
  font-size: 14px;
  line-height: 1.28;
  color: ${({ theme: t }) => t.color.rust};
`;

export const FieldHint = styled.p`
  margin-top: 6px;
  font-size: 12px;
  color: ${({ theme: t }) => t.color.sonicSilver};
`;

/** Two-up field row that collapses to one column on small screens. */
export const FieldRow = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  ${mq.sm} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const Checkbox = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  cursor: pointer;

  input {
    accent-color: ${({ theme: t }) => t.color.cocoa};
  }
`;

/* =============================================================
   Option pills, swatches, steppers
   ============================================================= */

export const Pill = styled.button`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 80px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  text-align: center;
  background: ${({ $on }) => ($on ? "#271f1f" : "transparent")};
  color: ${({ theme: t, $on, $disabled }) => {
    if ($disabled) return t.color.grey300;
    return $on ? t.color.white : t.color.cocoa;
  }};
  border: 1px solid
    ${({ theme: t, $on, $disabled }) => {
      if ($disabled) return t.color.grey300;
      return $on ? t.color.cocoa : t.color.grey300;
    }};
  cursor: ${({ $disabled }) => ($disabled ? "not-allowed" : "pointer")};
  transition:
    color ${({ theme: t }) => `${t.motion.fast} ${t.motion.ease}`},
    background-color ${({ theme: t }) => `${t.motion.fast} ${t.motion.ease}`},
    border-color ${({ theme: t }) => `${t.motion.fast} ${t.motion.ease}`};

  &:hover:not(:disabled) {
    border-color: ${({ theme: t }) => t.color.cocoa};
  }

  ${({ $out }) =>
    $out &&
    css`
      &::after {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(
          to bottom right,
          transparent calc(50% - 1px),
          #d6d0c7 50%,
          transparent calc(50% + 1px)
        );
        pointer-events: none;
      }
    `}
`;

export const SwatchWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

export const Swatch = styled.button`
  padding: 12px;
  border-radius: 999px;
  cursor: pointer;
  background: ${({ $color, theme: t }) => $color ?? t.color.grey200};

  span {
    display: block;
    width: 40px;
    height: 40px;
    border-radius: 999px;
    box-shadow: 0 0 0 1.5px transparent;
    transition: box-shadow ${({ theme: t }) => `${t.motion.fast} ${t.motion.ease}`};
  }

  &:hover span,
  &[aria-checked="true"] span {
    box-shadow: 0 0 0 1.5px ${({ theme: t }) => t.color.cocoa};
  }

  &[aria-checked="true"] span {
    box-shadow:
      0 0 0 1.5px ${({ theme: t }) => t.color.cocoa},
      0 0 0 4px ${({ theme: t }) => t.color.white},
      0 0 0 5.5px ${({ theme: t }) => t.color.cocoa};
  }
`;

/* =============================================================
   Badges, tags, accordion, assurance strip
   ============================================================= */

export const Badge = styled.span`
  display: inline-block;
  padding: 6px 10px;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  background: ${({ theme: t, $light }) => ($light ? t.color.dawnPink : t.color.cocoa)};
  color: ${({ theme: t, $light }) => ($light ? t.color.cocoa : t.color.white)};
`;

export const Tag = styled.button`
  display: inline-block;
  padding: 4px 8px;
  font-size: 12px;
  line-height: 1.5;
  text-transform: uppercase;
  color: ${({ theme: t, $active }) => ($active ? t.color.white : t.color.cocoa)};
  background: ${({ theme: t, $active }) => ($active ? t.color.cocoa : "transparent")};
  border: 1px solid ${({ theme: t, $active }) => ($active ? t.color.cocoa : t.color.grey300)};
  cursor: pointer;
  transition:
    background-color ${({ theme: t }) => `${t.motion.fast} ${t.motion.ease}`},
    border-color ${({ theme: t }) => `${t.motion.fast} ${t.motion.ease}`},
    color ${({ theme: t }) => `${t.motion.fast} ${t.motion.ease}`};

  &:hover {
    background: ${({ theme: t }) => t.color.cocoa};
    border-color: ${({ theme: t }) => t.color.cocoa};
    color: ${({ theme: t }) => t.color.white};
  }

  mark {
    background: none;
    color: inherit;
    font-weight: 600;
  }
`;

export const AccordionRoot = styled.div`
  border-top: 1px solid ${({ theme: t }) => t.color.grey300};
`;

export const AccordionTrigger = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding: 20px 0;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  color: ${({ theme: t }) => t.color.cocoa};
  text-align: left;
`;

export const AccordionIcon = styled.span`
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

  &::after {
    transition: transform 250ms ${({ theme: t }) => t.motion.ease};
  }

  ${AccordionTrigger}[aria-expanded="true"] &::after {
    transform: translate(-50%, -50%) rotate(90deg);
  }

  ${({ $open }) =>
    $open &&
    css`
      &::after {
        transform: translate(-50%, -50%) rotate(90deg);
      }
    `}
`;

export const AccordionPanel = styled.div`
  display: grid;
  grid-template-rows: ${({ $open }) => ($open ? "1fr" : "0fr")};
  transition: grid-template-rows 250ms ${({ theme: t }) => t.motion.ease};

  > div {
    overflow: hidden;
  }
`;

export const AccordionContent = styled.div`
  padding-bottom: 24px;
  color: ${({ theme: t }) => t.color.kabul};
  font-size: 14px;
  line-height: 1.7;
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

/* =============================================================
   Layout atoms
   ============================================================= */

export const Container = styled.div`
  max-width: ${({ theme: t }) => t.layout.container};
  margin-inline: auto;
  padding-inline: 32px;

  ${mq.lg} {
    padding-inline: 16px;
  }
`;

export const ContainerInset = styled.div`
  max-width: ${({ theme: t }) => `calc(${t.layout.containerInset} + 64px)`};
  margin-inline: auto;
  padding-inline: 32px;

  ${mq.lg} {
    padding-inline: 16px;
  }
`;

export const ContainerNarrow = styled.div`
  max-width: ${({ theme: t }) => t.layout.containerNarrow};
  margin-inline: auto;
  padding-inline: 32px;

  ${mq.lg} {
    padding-inline: 16px;
  }
`;

export const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  color: ${({ theme: t }) => t.color.cocoa};
  transition: background-color ${({ theme: t }) => `${t.motion.fast} ${t.motion.ease}`};

  &:hover {
    background: ${({ theme: t }) => t.color.springWood};
    border-radius: 50%;
  }
`;

export const Divider = styled.hr`
  border: 0;
  border-top: 1px solid ${({ theme: t }) => t.color.grey300};
  margin: 0;
`;

/** Off-screen until focused — the first thing a keyboard reader hits. */
export const SkipLink = styled.a`
  position: absolute;
  top: -100px;
  left: 8px;
  z-index: 200;
  background: ${({ theme: t }) => t.color.cocoa};
  color: ${({ theme: t }) => t.color.white};
  padding: 12px 18px;
  transition: top ${({ theme: t }) => `${t.motion.fast} ${t.motion.ease}`};

  &:focus {
    top: 8px;
  }
`;

/** Centred empty / error / loading message block. */
export const StateMessage = styled.div`
  display: grid;
  place-items: center;
  gap: 18px;
  padding: 120px 16px;
  text-align: center;
  color: ${({ theme: t }) => t.color.sonicSilver};
`;

export const Section = styled.section`
  padding: 64px 0;

  ${mq.lg} {
    padding: 40px 0;
  }
`;

export const Skeleton = styled.div`
  background: linear-gradient(
    90deg,
    ${({ theme: t }) => t.color.springWood} 25%,
    ${({ theme: t }) => t.color.grey200} 37%,
    ${({ theme: t }) => t.color.springWood} 63%
  );
  background-size: 400% 100%;
  animation: cereve-shimmer 1.3s ease infinite;
  ${({ $tile }) =>
    $tile &&
    css`
      width: 100%;
      aspect-ratio: 3 / 4;
      border-radius: 2px;
    `}
`;

/* =============================================================
   Empty-image placeholder
   Most products in the seed catalogue have no photography, so the
   "no image" state has to read as a deliberate tile rather than a
   broken frame. Single source of truth for cards, tiles and the PDP.
   ============================================================= */

export const NoImage = styled.span`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 12%;
  text-align: center;
  background: ${({ theme: t }) => t.color.springWood};

  &::before {
    content: "";
    position: absolute;
    inset: 8%;
    border: 1px solid ${({ theme: t }) => t.color.grey300};
    pointer-events: none;
  }
`;

export const NoImageMark = styled.span`
  position: relative;
  display: block;
  max-width: 100%;
  font-family: ${({ theme: t }) => t.font.sans};
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.34em;
  text-transform: uppercase;
  text-indent: 0.34em;
  color: ${({ theme: t }) => t.color.sonicSilver};
`;
