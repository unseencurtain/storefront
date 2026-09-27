/**
 * Design tokens as a theme object.
 *
 * These mirror the palette, type scale, layout and motion values the storefront
 * was built around. Components read them through `props.theme` so a value is
 * changed in exactly one place, and the responsive gutter stays a single
 * function of viewport width.
 */

const gutter = 16;
const gutterLg = 32;

export const theme = {
  color: {
    /** Primary ink and primary button fill. */
    cocoa: "#271f1f",
    /** Body copy. */
    kabul: "#5e5047",
    kabulHover: "#756e65",
    /** Footer background. */
    dawnPink: "#efe6e1",
    /** Mission panel, icon hover, disabled fill. */
    springWood: "#f7f4f0",
    /** Page wash. */
    stone: "#fbf9f7",
    /** Secondary copy, accordion headers. */
    sonicSilver: "#757575",
    /** Tertiary copy. */
    cavernous: "#525252",
    /** Error text, announcement bar. */
    rust: "#a2605a",
    announcement: "#a2605b",

    white: "#ffffff",
    grey100: "#f7f4f0",
    grey200: "#ece7e1",
    /** Borders, disabled ink. */
    grey300: "#d6d0c7",
    grey400: "#b0a9a0",
    /** Form control border, card hairlines. */
    tan: "#bba293",
    /** Cart line dividers. */
    greyLightish: "#dddddd",
    cartBanner: "#faf8f6",

    backdropSoft: "rgba(239, 230, 225, 0.49)",
    backdropLight: "rgba(255, 255, 255, 0.8)",
    focus: "#756e65"
  },

  shadow: {
    panel: "0 10px 20px rgba(0, 0, 0, 0.15)",
    float: "0 12px 16px -4px rgba(0, 0, 0, 0.16), 0 4px 6px -2px rgba(0, 0, 0, 0.04)",
    /* Casts upward so a bar pinned to the bottom edge reads as floating. */
    lift: "0 -4px 8px -2px rgba(0, 0, 0, 0.16), 0 -2px 4px -2px rgba(0, 0, 0, 0.04)"
  },

  font: {
    sans: '"Archivo", "Helvetica Neue", Helvetica, Arial, sans-serif',
    serif: '"Cormorant Garamond", "Times New Roman", Times, serif'
  },

  /** Type scale: [font-size, letter-spacing]. */
  type: {
    headerSm: ["32px", "-1.28px"],
    headerMd: ["40px", "-1.6px"],
    headerLg: ["60px", "-2.56px"],
    headerXl: ["80px", "-3.2px"],

    subheaderXs: ["12px", "1.2px"],
    subheaderSm: ["14px", "1.4px"],
    subheaderMd: ["16px", "1.6px"],
    subheaderLg: ["18px", "1.8px"],

    leadLg: ["20px", "-0.4px"],
    leadMd: ["16px", "-0.32px"],
    leadSm: ["14px", "-0.28px"],

    bodyLg: ["20px", "-0.4px"],
    bodyMd: ["16px", "-0.32px"],
    bodySm: ["14px", "-0.28px"],
    bodyXs: ["12px", "-0.24px"]
  },

  layout: {
    container: "1400px",
    containerInset: "930px",
    containerNarrow: "676px",
    headerHeight: "60px"
  },

  motion: {
    ease: "cubic-bezier(0.4, 0, 0.2, 1)",
    easeInOut: "cubic-bezier(0.62, 0.05, 0.24, 1)",
    fast: "150ms",
    base: "300ms",
    slow: "400ms",
    drawer: "600ms"
  },

  bp: {
    sm: "640px",
    md: "820px",
    lg: "1024px",
    xl: "1280px"
  }
};

/** Page gutter, widening on large screens. */
export const gutterOf = (width) => (width >= 1024 ? gutterLg : gutter);

/**
 * Media helpers.
 *
 * `below` is max-width so it reads as "everything up to here", which is how the
 * responsive overrides in the original stylesheet were written.
 */
export const media = {
  below: (size) => `@media (max-width: ${size})`,
  above: (size) => `@media (min-width: ${size})`
};

export const mq = {
  sm: media.below(theme.bp.sm),
  md: media.below(theme.bp.md),
  lg: media.below(theme.bp.lg),
  xl: media.below(theme.bp.xl)
};

export default theme;
