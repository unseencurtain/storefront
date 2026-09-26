import styled, { css } from "styled-components";
import { mq } from "../../../shared/styles/theme.js";
import { SubSm } from "../../../shared/ui/primitives.js";

/**
 * Footer bands: mission panel, main footer (link columns + commitments +
 * newsletter), locale row, legal strip.
 *
 * The link columns are one component rendered twice — a grid on desktop, an
 * accordion below 1024px — so the column and link styles are shared and only
 * the two wrappers differ.
 */

export const SiteFooter = styled.footer`
  margin-top: 96px;
  color: ${({ theme: t }) => t.color.cocoa};
`;

/* ---- Mission panel ------------------------------------------ */

export const Mission = styled.section`
  background: ${({ theme: t }) => t.color.springWood};
  text-align: center;
`;

export const MissionInner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding-block: 64px;
`;

export const MissionTitle = styled.h2`
  max-width: 18ch;
`;

export const MissionBody = styled.p`
  max-width: 62ch;
  color: ${({ theme: t }) => t.color.kabul};
`;

/* ---- Main footer -------------------------------------------- */

export const FooterMain = styled.div`
  background: ${({ theme: t }) => t.color.dawnPink};
  padding-block: 64px;
`;

export const FooterMainInner = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) auto minmax(0, 260px);
  gap: 56px;
  align-items: start;

  ${mq.lg} {
    grid-template-columns: minmax(0, 1fr);
    gap: 40px;
  }
`;

export const FooterNavDesktop = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 32px 24px;

  ${mq.lg} {
    display: none;
  }
`;

export const FooterNavMobile = styled.div`
  display: none;

  ${mq.lg} {
    display: block;
  }
`;

export const FooterNavColumn = styled.nav`
  ul {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
`;

export const FooterNavHeading = styled(SubSm).attrs({ as: "h3" })`
  margin-bottom: 16px;
  color: ${({ theme: t }) => t.color.cocoa};
`;

export const FooterNavLink = styled.a`
  font-size: ${({ theme: t }) => t.type.bodySm[0]};
  line-height: 1.5;
  letter-spacing: ${({ theme: t }) => t.type.bodySm[1]};
  color: ${({ theme: t }) => t.color.cocoa};
  transition: color ${({ theme: t }) => `${t.motion.slow} ${t.motion.ease}`};

  &:hover {
    color: ${({ theme: t }) => t.color.kabulHover};
  }
`;

export const FooterAccordionRoot = styled.div`
  ${mq.lg} {
    border-top: 1px solid rgba(39, 31, 31, 0.16);
  }
`;

export const FooterAccordionList = styled.ul`
  ${mq.lg} {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-bottom: 20px;
  }
`;

/* ---- Commitments -------------------------------------------- */

export const CommitmentsHead = styled.p`
  margin-bottom: 20px;
  text-align: center;
`;

export const CommitmentsList = styled.ul`
  display: flex;
  gap: 12px;
`;

export const CommitmentItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 84px;
  height: 84px;
  padding: 12px;
  color: ${({ theme: t }) => t.color.cocoa};
`;

export const CommitmentLink = styled.a`
  display: flex;
  transition: opacity ${({ theme: t }) => `${t.motion.fast} ${t.motion.ease}`};

  &:hover {
    opacity: 0.6;
  }
`;

/* ---- Newsletter --------------------------------------------- */

export const FooterNews = styled.div`
  h2 {
    margin-bottom: 8px;
  }

  ${mq.lg} {
    padding: 48px 16px;
    margin-inline: -16px;
    background: rgba(39, 31, 31, 0.04);
  }
`;

/* ---- Locale row --------------------------------------------- */

export const FooterLocale = styled.div`
  background: ${({ theme: t }) => t.color.dawnPink};
  border-top: 1px solid rgba(39, 31, 31, 0.12);
`;

export const FooterLocaleInner = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  padding-block: 20px;
`;

export const FooterLocaleList = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
`;

export const FooterLocaleItem = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: ${({ theme: t }) => t.type.bodySm[0]};
  letter-spacing: ${({ theme: t }) => t.type.bodySm[1]};
  color: ${({ theme: t }) => t.color.cocoa};
  transition: color ${({ theme: t }) => `${t.motion.slow} ${t.motion.ease}`};

  &:hover {
    color: ${({ theme: t }) => t.color.kabulHover};
  }

  ${({ $active }) =>
    $active &&
    css`
      font-weight: 500;
    `}
`;

/* ---- Legal strip -------------------------------------------- */

export const FooterLegal = styled.div`
  background: ${({ theme: t }) => t.color.cocoa};
  color: ${({ theme: t }) => t.color.dawnPink};
`;

export const FooterLegalInner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
  padding-block: 32px;

  ${mq.lg} {
    flex-direction: column;
    align-items: flex-start;
  }
`;

export const FooterLegalLinks = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;

  ${mq.lg} {
    justify-content: flex-start;
  }

  li {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* The bullet separator, without an extra DOM node. */
  li:not(:first-child)::before {
    content: "•";
    color: rgba(239, 230, 225, 0.5);
  }
`;

export const FooterLegalLink = styled.a`
  font-size: ${({ theme: t }) => t.type.bodyXs[0]};
  letter-spacing: ${({ theme: t }) => t.type.bodyXs[1]};
  color: inherit;
  transition: color ${({ theme: t }) => `${t.motion.slow} ${t.motion.ease}`};

  &:hover {
    color: ${({ theme: t }) => t.color.white};
  }
`;

export const FooterLegalSocial = styled.ul`
  display: flex;
  gap: 16px;
`;

export const FooterLegalSocialLink = styled.a`
  display: inline-flex;
  color: inherit;
  transition: opacity ${({ theme: t }) => `${t.motion.fast} ${t.motion.ease}`};

  &:hover {
    opacity: 0.6;
  }
`;
