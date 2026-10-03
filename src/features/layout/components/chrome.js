import styled, { css } from "styled-components";
import { mq } from "../../../shared/styles/theme.js";
import { Container } from "../../../shared/ui/primitives.js";

/**
 * Chrome primitives shared by every overlay surface: the announcement bar,
 * header, mega menu, mobile menu, cart drawer and search panel.
 *
 * They live together because the z-index ladder, the scrim treatment and the
 * drawer shell are one design decision — splitting them across six files is
 * what made them drift apart in the first place.
 */

/* ---- Scrims -------------------------------------------------- */

export const Scrim = styled.div`
  position: fixed;
  inset: 0;
  background: ${({ theme: t, $tone }) =>
    $tone === "light" ? t.color.backdropLight : $tone === "dim" ? "rgba(0,0,0,0.45)" : t.color.backdropSoft};
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  visibility: ${({ $open }) => ($open ? "visible" : "hidden")};
  transition:
    opacity ${({ theme: t }) => `${t.motion.base} ${t.motion.ease}`},
    visibility ${({ theme: t }) => t.motion.base};

  ${({ $tone }) =>
    $tone === "light" &&
    css`
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
    `}

  ${({ $tone }) =>
    $tone === "soft" &&
    css`
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
    `}

  ${({ $z }) => `z-index: ${$z ?? 55};`}
`;

/* ---- Drawer shell -------------------------------------------- */

export const Drawer = styled.aside`
  position: fixed;
  top: 0;
  z-index: 75;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: ${({ $width }) => $width ?? "min(500px, 100%)"};
  background: ${({ theme: t }) => t.color.white};
  box-shadow: ${({ theme: t }) => t.shadow.panel};
  transition: transform ${({ theme: t }) => `${t.motion.drawer} ${t.motion.easeInOut}`};
  visibility: ${({ $open }) => ($open ? "visible" : "hidden")};
  right: ${({ $side }) => ($side === "left" ? "auto" : "0")};
  left: ${({ $side }) => ($side === "left" ? "0" : "auto")};
  transform: translateX(
    ${({ $side, $open }) => {
      if ($open) return "0";
      return $side === "left" ? "-100%" : "100%";
    }}
  );
`;

export const DrawerHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex: 0 0 auto;
  height: 60px;
  padding: 0 24px;
  border-bottom: 1px solid ${({ theme: t }) => t.color.grey200};

  ${mq.lg} {
    padding: 0 16px;
  }
`;

export const DrawerBody = styled.div`
  flex: 1 1 auto;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 20px 24px 32px;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  ${mq.lg} {
    padding: 20px 16px 32px;
  }
`;

export const DrawerFoot = styled.div`
  position: relative;
  z-index: 20;
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  /* Same inline padding as the head and body, so the pinned actions line up
     with the items above instead of running into the panel edges. The upward
     shadow does the separating, so there is no border rule. */
  padding: 16px 24px 8px;
  background: ${({ theme: t }) => t.color.white};
  box-shadow: ${({ theme: t }) => t.shadow.lift};

  ${mq.lg} {
    padding: 16px 16px 8px;
  }

  ${({ $row }) =>
    $row &&
    css`
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 14px 16px;
      padding: 20px 24px;

       ${mq.lg} {
         padding: 20px 16px;
       }

       @media (max-width: 480px) {
         flex-direction: column;
         align-items: stretch;
         gap: 12px;
       }
     `}
`;

/* ---- Top announcement bar ------------------------------------ */

export const AnnounceBar = styled.div`
  background: ${({ theme: t }) => t.color.announcement};
  color: ${({ theme: t }) => t.color.white};
`;

export const AnnounceButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 48px;
  padding: 12px 32px;
  color: inherit;
  text-align: center;

  ${mq.lg} {
    padding: 12px 16px;
  }
`;

export const AnnounceText = styled.span`
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  text-decoration: underline;
  text-underline-offset: 4px;
  animation: cereve-announce 400ms ${({ theme: t }) => t.motion.ease};
`;

export const AnnounceChevron = styled.span`
  display: inline-flex;
  opacity: 0.9;
`;

/* ---- Header -------------------------------------------------- */

export const SiteHeader = styled.header`
  position: sticky;
  top: 0;
  z-index: 50;
  background: ${({ theme: t }) => t.color.white};
  border-bottom: 1px solid ${({ theme: t }) => t.color.grey200};
`;

/* ---- Mega menu ----------------------------------------------- */

export const Mega = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 45;
  display: grid;
  grid-template-rows: ${({ $open }) => ($open ? "1fr" : "0fr")};
  transition: grid-template-rows ${({ theme: t }) => `320ms ${t.motion.ease}`};

  ${mq.lg} {
    display: none;
  }
`;

/** The collapsing viewport: grid-rows 0fr->1fr animates against this. */
export const MegaClip = styled.div`
  overflow: hidden;
  min-height: 0;
`;

export const MegaInner = styled.div`
  display: grid;
  grid-template-columns: ${({ $layout }) =>
    $layout === "brands" ? "minmax(0, 1fr)" : "200px 1fr 1.15fr"};
  gap: 48px;
  padding-block: 40px 48px;
`;

export const SearchPanel = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 65;
  max-height: 100dvh;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: ${({ theme: t }) => t.color.white};
  border-top: 1px solid ${({ theme: t }) => t.color.grey300};
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  visibility: ${({ $open }) => ($open ? "visible" : "hidden")};
  transform: translateY(${({ $open }) => ($open ? "0" : "-10px")});
  transition:
    opacity ${({ theme: t }) => `${t.motion.base} ${t.motion.ease}`},
    transform ${({ theme: t }) => `${t.motion.base} ${t.motion.ease}`},
    visibility ${({ theme: t }) => t.motion.base};

  @media (max-width: 1023px) {
    z-index: 80;
    inset: 0;
    max-height: none;
    transform: none;
    transition:
      opacity 180ms ease,
      visibility 180ms;
  }
`;

export const SearchInner = styled.div`
  padding-block: 24px 40px;
`;

export const SearchField = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  border: 1px solid ${({ theme: t }) => t.color.cocoa};
  background: ${({ theme: t }) => t.color.grey100};
`;

export const SearchIconSlot = styled.span`
  position: absolute;
  left: 16px;
  color: ${({ theme: t }) => t.color.cavernous};
  pointer-events: none;
`;

export const SearchInput = styled.input`
  flex: 1;
  min-width: 0;
  padding: 16px 120px 16px 48px;
  background: transparent;
  border: 0;
  border-radius: 0;
  font-size: 16px;
  letter-spacing: -0.32px;
  color: ${({ theme: t }) => t.color.cocoa};
  -webkit-appearance: none;
  appearance: none;

  &::-webkit-search-cancel-button {
    display: none;
  }

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: ${({ theme: t }) => t.color.grey400};
  }
`;

export const SearchActions = styled.div`
  position: absolute;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

/* ---- Top bar ------------------------------------------------ */

export const TopBar = styled(Container)`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;
  padding-block: 12px;

  @media (max-width: 767px) {
    grid-template-columns: 34px minmax(0, 1fr) auto;
    gap: 8px;
  }
`;

export const TopBarSide = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  justify-self: start;
`;

export const Burger = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  margin-left: -6px;
  color: ${({ theme: t }) => t.color.cocoa};

  @media (min-width: 1024px) {
    display: none;
  }
`;

export const Wordmark = styled.a`
  justify-self: center;
  font-family: ${({ theme: t }) => t.font.serif};
  font-size: ${({ $small }) => ($small ? "22px" : "30px")};
  font-weight: 400;
  line-height: 1;
  letter-spacing: ${({ $small }) => ($small ? "4px" : "6px")};
  text-transform: uppercase;
  color: ${({ theme: t }) => t.color.cocoa};
  white-space: nowrap;

  @media (max-width: 767px) {
    font-size: 20px;
    letter-spacing: 3px;
  }
`;

export const TopBarUtils = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  justify-self: end;

  @media (max-width: 767px) {
    gap: 0;
  }
`;

export const CartButton = styled.button`
  position: relative;
`;

export const CartCount = styled.span`
  position: absolute;
  right: 2px;
  bottom: 4px;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: ${({ theme: t }) => t.color.cocoa};
  color: ${({ theme: t }) => t.color.white};
  font-size: 10px;
  font-weight: 600;
  line-height: 1;

  ${({ $animate }) =>
    $animate &&
    css`
      animation: cereve-cart-bump 500ms ${({ theme: t }) => t.motion.ease};
    `}
`;

/* ---- Nav rail ----------------------------------------------- */

export const NavRail = styled.nav`
  position: relative;
  border-top: 1px solid ${({ theme: t }) => t.color.grey200};

  /* The rail's items are hover-and-panel buttons, so below the breakpoint the
     burger owns navigation and this row is dead weight. */
  @media (max-width: 1023px) {
    display: none;
  }
`;

export const NavRailList = styled.ul`
  list-style: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 39px;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

export const NavRailItem = styled.li`
  position: relative;
  list-style: none;
`;

export const NavRailLink = styled.button`
  display: inline-flex;
  align-items: center;
  padding: 10px 2px;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  color: ${({ theme: t }) => t.color.cocoa};
  white-space: nowrap;
  transition: color ${({ theme: t }) => `${t.motion.slow} ${t.motion.ease}`};

  &:hover,
  &[aria-expanded="true"] {
    color: ${({ theme: t }) => t.color.kabulHover};
  }
`;

/** The underline that wipes in under the active category. */
export const NavRailRule = styled.span`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 2px;
  height: 1px;
  background: currentColor;
  transform: scaleX(${({ $on }) => ($on ? 1 : 0)});
  transform-origin: left;
  transition: transform ${({ theme: t }) => `${t.motion.base} ${t.motion.ease}`};
`;

export const NavRailSkeleton = styled.span`
  display: block;
  width: 70px;
  height: 11px;
  border-radius: 2px;
`;

/* ---- Mega menu internals ------------------------------------ */

export const MegaPanel = styled.div`
  background: ${({ theme: t }) => t.color.white};
  border-top: 1px solid ${({ theme: t }) => t.color.grey200};
  box-shadow: 0 18px 30px -20px rgba(0, 0, 0, 0.3);
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  transform: translateY(${({ $open }) => ($open ? "0" : "-10px")});
  transition:
    opacity ${({ theme: t }) => `${t.motion.base} ${t.motion.ease}`},
    transform ${({ theme: t }) => `${t.motion.base} ${t.motion.ease}`};
  transition-delay: ${({ $open }) => ($open ? "60ms" : "0ms")};
`;

export const MegaLead = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
`;

export const MegaLinks = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 32px 24px;
  align-content: start;

  ul {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: 16px;
  }
`;

export const MegaLink = styled.a`
  font-size: 14px;
  line-height: 1.5;
  letter-spacing: -0.28px;
  color: ${({ theme: t }) => t.color.cocoa};
  transition: color ${({ theme: t }) => `${t.motion.slow} ${t.motion.ease}`};

  &:hover {
    color: ${({ theme: t }) => t.color.kabulHover};
  }
`;

export const MegaBlurb = styled.p`
  max-width: 34ch;
  margin-top: 14px;
  font-size: 14px;
  color: ${({ theme: t }) => t.color.kabul};
`;

export const MegaProducts = styled.div`
  > p {
    color: ${({ theme: t }) => t.color.sonicSilver};
  }
`;

/** A real list so the browser paints no `disc` markers on the bare <li> rows —
 *  the global reset only clears `ul`/`ol`, not orphaned `li` elements. */
export const MegaProductGrid = styled.ul`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-top: 16px;
  list-style: none;
  padding: 0;
`;

export const MegaBrandSearch = styled.input`
  width: min(420px, 100%);
  margin-top: 8px;
  padding: 10px 14px;
  border: 1px solid ${({ theme: t }) => t.color.tan};
  background: ${({ theme: t }) => t.color.stone};
  font-size: 14px;
  letter-spacing: -0.28px;
  color: ${({ theme: t }) => t.color.cocoa};

  &:focus {
    outline: 2px solid ${({ theme: t }) => t.color.focus};
    outline-offset: 2px;
  }
`;

export const MegaLetters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 16px;
`;

export const MegaLetter = styled.button`
  min-width: 28px;
  padding: 6px 4px;
  font-size: 12px;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: ${({ theme: t, $on }) => ($on ? t.color.white : t.color.cocoa)};
  background: ${({ theme: t, $on }) => ($on ? t.color.cocoa : "transparent")};

  &:hover {
    background: ${({ theme: t, $on }) => ($on ? t.color.cocoa : t.color.grey200)};
  }
`;

export const MegaBrandGrid = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 8px 24px;
  margin-top: 20px;
  max-height: 320px;
  overflow: auto;
  list-style: none;
  padding: 0;
`;

/* ---- Mobile menu -------------------------------------------- */

export const MenuSearch = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 16px 0;
  margin-bottom: 8px;
  border-bottom: 1px solid ${({ theme: t }) => t.color.cocoa};
  color: ${({ theme: t }) => t.color.cocoa};
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  text-align: left;
`;

export const MenuNav = styled.nav`
  display: flex;
  flex-direction: column;
  padding-bottom: 20px;
`;

export const MenuRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid ${({ theme: t }) => t.color.grey200};
`;

export const MenuLink = styled.a`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 18px 0;
  font-size: ${({ $strong, theme: t }) => ($strong ? t.type.bodyMd[0] : t.type.leadSm[0])};
  font-weight: ${({ $strong }) => ($strong ? 500 : 700)};
  letter-spacing: ${({ $strong, theme: t }) => ($strong ? t.type.bodyMd[1] : t.type.leadSm[1])};
  color: ${({ theme: t }) => t.color.cocoa};
  text-align: left;
  transition: color ${({ theme: t }) => `${t.motion.slow} ${t.motion.ease}`};

  &:hover {
    color: ${({ theme: t }) => t.color.kabulHover};
  }
`;

export const MenuToggle = styled.button`
  flex: 0 0 44px;
  align-self: stretch;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: -8px;
`;

/** Collapses on grid-template-rows 0fr -> 1fr, the same trick the mega uses. */
export const MenuSub = styled.ul`
  display: grid;
  grid-template-rows: ${({ $open }) => ($open ? "1fr" : "0fr")};
  transition: grid-template-rows 250ms ${({ theme: t }) => t.motion.ease};
  border-bottom: 1px solid ${({ theme: t }) => t.color.grey200};

  > li {
    overflow: hidden;
  }
`;

/** Inner list — all links share one grid row so the collapse is total. */
export const MenuSubList = styled.ul`
  padding: 4px 0;
`;

export const MenuSubLink = styled.a`
  display: block;
  padding: 10px 0 10px 16px;
  font-size: ${({ theme: t }) => t.type.bodySm[0]};
  letter-spacing: ${({ theme: t }) => t.type.bodySm[1]};
  color: ${({ theme: t }) => t.color.kabul};
  transition: color ${({ theme: t }) => `${t.motion.slow} ${t.motion.ease}`};

  &:hover {
    color: ${({ theme: t }) => t.color.kabulHover};
  }
`;

export const MenuUtils = styled.ul`
  display: flex;
  flex: 0 0 auto;
  gap: 20px;

  @media (max-width: 480px) {
    justify-content: flex-start;
  }
`;

export const MenuSocial = styled.ul`
  display: flex;
  flex: 0 0 auto;
  gap: 14px;
  /* Stays hard right when the foot wraps onto two rows on a narrow phone. */
  margin-left: auto;

  @media (max-width: 480px) {
    justify-content: space-between;
    width: 100%;
    margin-left: 0;
  }
`;

export const MenuSocialLink = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  color: ${({ theme: t }) => t.color.cocoa};
  transition: opacity ${({ theme: t }) => `${t.motion.fast} ${t.motion.ease}`};

  &:hover {
    opacity: 0.6;
  }
`;

/* ---- Search panel internals ---------------------------------- */

export const SearchForm = styled.form`
  margin-bottom: 24px;
`;

export const SearchClear = styled.button`
  font-size: ${({ theme: t }) => t.type.bodySm[0]};
  font-weight: 500;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  text-decoration: underline;
  text-underline-offset: 4px;
  color: ${({ theme: t }) => t.color.cocoa};
`;

export const SearchBody = styled.div`
  transition: opacity ${({ theme: t }) => `${t.motion.base} ${t.motion.ease}`};

  ${({ $busy }) =>
    $busy &&
    css`
      opacity: 0.6;
      pointer-events: none;
    `}
`;

export const SearchSplit = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 3fr);
  gap: 48px;

  ${mq.lg} {
    grid-template-columns: minmax(0, 1fr);
    gap: 28px;
  }
`;

export const SearchRailHead = styled.h2`
  margin-top: 28px;
`;

export const SearchTags = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
`;

export const SearchProductsHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 20px;

  ${mq.lg} {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
`;

export const SearchGrid = styled.ul`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px;
  margin-top: 18px;

  ${mq.lg} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
`;

export const SearchEmpty = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
