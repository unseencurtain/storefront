/** Inline SVG icons — stroke-based, sized in `em`, coloured by `currentColor`. */

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
  focusable: "false"
};

export function SearchIcon({ size = 20, ...rest }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} {...base} {...rest}>
      <circle cx="8.5" cy="8.5" r="5.75" />
      <path d="m13 13 4.25 4.25" />
    </svg>
  );
}

export function BagIcon({ size = 20, ...rest }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} {...base} {...rest}>
      <path d="M4 6.5h12l-.9 10.1a1.5 1.5 0 0 1-1.5 1.4H6.4a1.5 1.5 0 0 1-1.5-1.4Z" />
      <path d="M7 6.5V5a3 3 0 0 1 6 0v1.5" />
    </svg>
  );
}

export function AccountIcon({ size = 20, ...rest }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} {...base} {...rest}>
      <circle cx="10" cy="6.5" r="3.5" />
      <path d="M3.75 17.25a6.25 6.25 0 0 1 12.5 0" />
    </svg>
  );
}

export function CloseIcon({ size = 18, ...rest }) {
  return (
    <svg viewBox="0 0 18 18" width={size} height={size} {...base} {...rest}>
      <path d="M3 3l12 12M15 3 3 15" />
    </svg>
  );
}

export function ChevronIcon({ size = 12, direction = "down", ...rest }) {
  const rotate = { down: 0, up: 180, left: 90, right: -90 }[direction] ?? 0;

  return (
    <svg
      viewBox="0 0 12 12"
      width={size}
      height={size}
      {...base}
      strokeWidth={1.75}
      style={{ transform: `rotate(${rotate}deg)`, transition: "transform 300ms var(--ease)" }}
      {...rest}
    >
      <path d="m2 4 4 4 4-4" />
    </svg>
  );
}

export function ArrowIcon({ size = 14, direction = "right", ...rest }) {
  const rotate = { right: 0, down: 90, left: 180, up: -90 }[direction] ?? 0;

  return (
    <svg
      viewBox="0 0 14 14"
      width={size}
      height={size}
      {...base}
      style={{ transform: `rotate(${rotate}deg)` }}
      {...rest}
    >
      <path d="M2 7h10M8 3l4 4-4 4" />
    </svg>
  );
}

export function CheckIcon({ size = 14, ...rest }) {
  return (
    <svg viewBox="0 0 14 14" width={size} height={size} {...base} strokeWidth={1.75} {...rest}>
      <path d="m2.5 7.5 3 3 6-7" />
    </svg>
  );
}

export function MinusIcon({ size = 12, ...rest }) {
  return (
    <svg viewBox="0 0 12 12" width={size} height={size} {...base} strokeWidth={1.5} {...rest}>
      <path d="M2 6h8" />
    </svg>
  );
}

export function PlusIcon({ size = 12, ...rest }) {
  return (
    <svg viewBox="0 0 12 12" width={size} height={size} {...base} strokeWidth={1.5} {...rest}>
      <path d="M6 2v8M2 6h8" />
    </svg>
  );
}

export function StarIcon({ size = 14, filled = false, ...rest }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d="M8 1.8 9.9 5.6l4.1.6-3 2.9.7 4.1L8 11.3l-3.7 1.9.7-4.1-3-2.9 4.1-.6Z" />
    </svg>
  );
}

/* ---- Social ------------------------------------------------ */

export function InstagramIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.2.05 1.8.25 2.2.42.6.22 1 .48 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c0 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2 0-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c0-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.1 0-3.5 0-4.7.07-1.1.05-1.7.24-2.1.4-.5.2-.9.44-1.3.83-.4.4-.63.75-.83 1.29-.16.4-.35 1-.4 2.1C2.6 8.9 2.6 9.3 2.6 12s0 3.1.07 4.3c.05 1.1.24 1.7.4 2.1.2.5.44.9.83 1.3.4.4.75.63 1.29.83.4.16 1 .35 2.1.4 1.2.07 1.6.07 4.7.07s3.5 0 4.7-.07c1.1-.05 1.7-.24 2.1-.4.5-.2.9-.44 1.3-.83.4-.4.63-.75.83-1.29.16-.4.35-1 .4-2.1.07-1.2.07-1.6.07-4.3s0-3.1-.07-4.3c-.05-1.1-.24-1.7-.4-2.1a3.5 3.5 0 0 0-.83-1.29 3.5 3.5 0 0 0-1.29-.83c-.4-.16-1-.35-2.1-.4-1.2-.07-1.6-.07-4.7-.07Zm0 3.06a4.94 4.94 0 1 1 0 9.88 4.94 4.94 0 0 1 0-9.88Zm0 1.8a3.14 3.14 0 1 0 0 6.28 3.14 3.14 0 0 0 0-6.28Zm5.15-3.2a1.16 1.16 0 1 1 0 2.32 1.16 1.16 0 0 1 0-2.32Z" />
    </svg>
  );
}

export function TikTokIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M16.6 2h-2.9v13.1a2.6 2.6 0 1 1-2.2-2.6v-3a5.6 5.6 0 1 0 5.1 5.6V9a6.6 6.6 0 0 0 3.8 1.2V7.3a3.7 3.7 0 0 1-3.8-3.7V2Z" />
    </svg>
  );
}

export function FacebookIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M14 8.5V6.8c0-.8.2-1.3 1.4-1.3H17V2.6c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.2v1.8H8V12h2.6v9.4H14V12h2.5l.4-3.5H14Z" />
    </svg>
  );
}

export function YouTubeIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M22.5 7.2a2.8 2.8 0 0 0-2-2C18.8 4.7 12 4.7 12 4.7s-6.8 0-8.5.5a2.8 2.8 0 0 0-2 2A29 29 0 0 0 1 12a29 29 0 0 0 .5 4.8 2.8 2.8 0 0 0 2 2c1.7.5 8.5.5 8.5.5s6.8 0 8.5-.5a2.8 2.8 0 0 0 2-2A29 29 0 0 0 23 12a29 29 0 0 0-.5-4.8ZM9.8 15.3V8.7l5.7 3.3-5.7 3.3Z" />
    </svg>
  );
}

export function PinterestIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.5 1.8-2.5.9 0 1.3.7 1.3 1.5 0 .9-.6 2.2-.9 3.5-.2 1 .5 1.9 1.6 1.9 1.9 0 3.2-2.4 3.2-5.3 0-2.2-1.5-3.8-4.1-3.8a4.7 4.7 0 0 0-4.9 4.7c0 .9.3 1.5.8 2 .2.2.2.3.1.5l-.2.8c0 .3-.2.4-.5.3-1.3-.6-2.1-2.4-2.1-3.9 0-3.2 2.3-6.1 6.6-6.1 3.5 0 6.2 2.5 6.2 5.8 0 3.5-2.2 6.3-5.2 6.3-1 0-2-.5-2.3-1.2l-.6 2.4c-.2.9-.8 1.9-1.2 2.6A10 10 0 1 0 12 2Z" />
    </svg>
  );
}

export function XIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M17.5 3h3.2l-7 8 8.2 10h-6.4l-5-6.1L4.7 21H1.5l7.5-8.6L1.2 3h6.6l4.5 5.6L17.5 3Zm-1.1 16.2h1.8L7.7 4.7H5.8l10.6 14.5Z" />
    </svg>
  );
}

/* ---- Commitment marks -------------------------------------- */

export function PlanetIcon({ size = 28 }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden="true">
      <circle cx="16" cy="16" r="6" />
      <ellipse cx="16" cy="16" rx="14" ry="5.5" transform="rotate(-28 16 16)" />
      <path d="M12 11.5c1-1.2 2.3-1.8 3.4-1.6" strokeLinecap="round" />
    </svg>
  );
}

export function BunnyIcon({ size = 28 }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden="true">
      <path d="M11 13V6.5a2 2 0 0 1 4 0V12M17 12V5.5a2 2 0 0 1 4 0V13" strokeLinecap="round" />
      <path d="M9 13h14a6 6 0 0 1 1 11.9V27h-4v-2.1H12V27H8v-2.1A6 6 0 0 1 9 13Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="13" cy="18" r="1" fill="currentColor" />
      <circle cx="19" cy="18" r="1" fill="currentColor" />
      <path d="M16 21v1.5" strokeLinecap="round" />
    </svg>
  );
}

export function AccessibilityIcon({ size = 28 }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <circle cx="16" cy="6" r="2.4" />
      <path d="M7 11.5h18" strokeLinecap="round" />
      <path d="M16 11.5V22m0 0-3.5 8M16 22l3.5 8" strokeLinecap="round" />
      <path d="M11 14.5 9 21m12-6.5 2 6.5" strokeLinecap="round" />
    </svg>
  );
}

/** Hamburger that morphs into a close when `open`. */
export function MenuIcon({ open = false, size = 20 }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="butt"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M1 5h18M1 10h18M1 15h18"
        style={{
          transformOrigin: "10px center",
          transform: open ? "rotate(45deg) translateY(5px)" : "none",
          transition: "transform 300ms var(--ease)"
        }}
      />
      <path
        d="M1 10h18"
        style={{
          opacity: open ? 0 : 1,
          transition: "opacity 150ms var(--ease)"
        }}
      />
      <path
        d="M1 15h18"
        style={{
          transformOrigin: "10px center",
          transform: open ? "rotate(-45deg) translateY(-5px)" : "none",
          transition: "transform 300ms var(--ease)"
        }}
      />
    </svg>
  );
}

/** Small circular cart counter shown on the bag icon. */
export function CartCount({ count = 0, animate = false }) {
  if (!count) return null;

  return (
    <span
      className="cart-count"
      data-animate={animate ? "true" : undefined}
      aria-hidden="true"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
