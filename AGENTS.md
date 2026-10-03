# Agent Instructions

## Scope

This is the React/Vite frontend for a headless WooCommerce storefront. Work on
`main` unless the user explicitly requests another branch.

## File Ownership

- `src/App.jsx`: providers, routes, redirects, and layout selection.
- `src/shared/lib/woo.js`: WordPress/WooCommerce transport and normalization.
- `src/shared/lib/catalog.js`: catalog metadata, cache, trees, and filters.
- `src/shared/UIContext.jsx`: global overlay, menu, search, and cart UI state.
- `src/features/cart/CartContext.jsx`: authoritative cart state and mutations.
- `src/features/account/AccountContext.jsx`: cookie-backed customer session.
- `src/features/checkout/pages/Checkout.jsx`: checkout state and server flow.
- `src/features/catalog/pages/ProductPage.jsx`: product, variants, gallery, and add-to-cart.
- `src/features/catalog/pages/Shop.jsx`: catalog filters, pagination, and product grid.
- `src/features/layout/components/`: header, mobile menu, footer, drawers, and chrome.
- `src/shared/ui/`: reusable styled-components and visual primitives.
- `src/shared/styles/theme.js`: styled-component design tokens.
- `src/styles/*.css`: stable visual source of truth for catalog, product, search,
  chrome, footer, and checkout behavior.
- `wordpress/`: server-side REST/filter plugin source.
- `public/legal-pages/`: static HTML copied unchanged into `dist/`.

## Styling Policy

The project intentionally uses a hybrid styling system. Use styled-components
for new reusable controls and isolated static styles. Keep legacy CSS for
animations, transitions, responsive grids, image sizing, sticky/fixed elements,
drawers, overlays, product detail layout, checkout layout, and scroll behavior.

The previous full migration caused scroll jitter and layout regressions. Compare
legacy CSS with the current route before moving any rule. Never delete a legacy
rule until every usage has verified desktop and mobile parity.

Current intentional UI behavior:

- The visible shop `Featured` sort control is removed.
- The visible `Availability`/`On sale only` filter is removed.
- Active filter tags use a dark cocoa background.
- Mobile category menu entries are direct links without plus/minus toggles.
- Mobile drawer account/bag actions and social links stack cleanly.

## State and API Rules

- WooCommerce remains authoritative after cart mutations.
- Preserve cookies, cart tokens, nonces, and `credentials: include`.
- Never store passwords or customer credentials in local storage.
- Account changes must refresh cart state.
- Product URLs normally use slugs, not IDs passed to slug lookups.
- Do not claim newsletter/restock success without a backend operation.

## Verification

Before editing shared code, inspect all call sites. After editing, run:

```bash
npm run lint
npm run build
```

Test `/`, `/shop`, `/brands`, `/search`, `/cart/`, `/checkout/`, direct nested
routes, the mobile menu, active filter tags, product gallery/variants, and shop
scroll behavior when relevant.

Before deployment, back up OVH's `/home/ubuntu/sillage/frontend/dist` into a
timestamped `dist.backup-*` directory. Never manually edit `dist/` or
`node_modules/`.

## Documentation

- Human guide: `docs/FRONTEND_GUIDE.md`
- LibreOffice guide: `docs/FRONTEND_GUIDE.odt`
- Code review: `docs/FRONTEND_CODE_REVIEW.md`
- Model context: `docs/FRONTEND_FOR_MODELS.md`
- Deployment: `DEPLOYMENT.md`
