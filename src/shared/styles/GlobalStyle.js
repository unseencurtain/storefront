import { createGlobalStyle } from "styled-components";
import theme, { gutterOf, mq } from "./theme.js";

/**
 * Global reset, document typography and the handful of primitives that are
 * genuinely page-level (containers, page fade, reduced-motion). Everything
 * component-shaped lives with its component.
 */
const GlobalStyle = createGlobalStyle`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html {
    -webkit-text-size-adjust: 100%;
  }

  body {
    margin: 0;
    background: ${({ theme: t }) => t.color.white};
    color: ${({ theme: t }) => t.color.kabul};
    font-family: ${({ theme: t }) => t.font.sans};
    font-size: 16px;
    line-height: 1.5;
    letter-spacing: -0.32px;
    font-synthesis: none;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body.is-locked {
    overflow: hidden;
  }

  h1, h2, h3, h4, h5, h6, p, figure {
    margin: 0;
  }

  img, svg, video {
    display: block;
    max-width: 100%;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button, input, select, textarea {
    font: inherit;
    letter-spacing: inherit;
    color: inherit;
  }

  button {
    background: none;
    border: 0;
    padding: 0;
    cursor: pointer;
  }

  ul, ol {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  fieldset {
    margin: 0;
    padding: 0;
    border: 0;
    min-width: 0;
  }

  legend {
    padding: 0;
  }

  hr {
    border: 0;
    border-top: 1px solid ${({ theme: t }) => t.color.grey300};
    margin: 0;
  }

  ::selection {
    background: ${({ theme: t }) => t.color.dawnPink};
    color: ${({ theme: t }) => t.color.cocoa};
  }

  :focus-visible {
    outline: 2px solid ${({ theme: t }) => t.color.focus};
    outline-offset: 2px;
  }

  /* ---- Layout primitives ------------------------------------ */

  .container {
    max-width: ${({ theme: t }) => t.layout.container};
    margin-inline: auto;
    padding-inline: ${gutterOf(1024)}px;
  }

  @media (max-width: 1023px) {
    .container {
      padding-inline: ${gutterOf(0)}px;
    }
  }

  .container-inset {
    max-width: ${({ theme: t }) => `calc(${t.layout.containerInset} + ${gutterOf(1024) * 2}px)`};
    margin-inline: auto;
    padding-inline: ${gutterOf(1024)}px;
  }

  @media (max-width: 1023px) {
    .container-inset {
      padding-inline: ${gutterOf(0)}px;
    }
  }

  .page {
    min-height: 55vh;
    animation: ${({ theme: t }) => `cereve-fade ${t.motion.base} ${t.motion.ease} both`};
  }

  /* ---- Loading / empty states -------------------------------- */

  .spinner {
    width: 22px;
    height: 22px;
    border: 1.5px solid ${({ theme: t }) => t.color.grey300};
    border-top-color: ${({ theme: t }) => t.color.cocoa};
    border-radius: 50%;
    animation: cereve-spin 0.7s linear infinite;
  }

  .skeleton {
    background: linear-gradient(
      90deg,
      ${({ theme: t }) => t.color.springWood} 25%,
      ${({ theme: t }) => t.color.grey200} 37%,
      ${({ theme: t }) => t.color.springWood} 63%
    );
    background-size: 400% 100%;
    animation: cereve-shimmer 1.3s ease infinite;
  }

  @keyframes cereve-fade {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  @keyframes cereve-spin {
    to { transform: rotate(360deg); }
  }

  @keyframes cereve-announce {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes cereve-cart-bump {
    0%   { transform: scale(1); }
    40%  { transform: scale(1.35); }
    100% { transform: scale(1); }
  }

  @keyframes cereve-shimmer {
    0%   { background-position: 100% 0; }
    100% { background-position: 0 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
`;

export default GlobalStyle;

export { mq, theme };
