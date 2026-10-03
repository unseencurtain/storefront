# Frontend Context for Models

This file is optimized for coding agents and cheaper models. Read it before
editing this repository. It is a map of ownership, contracts, invariants, and
verification rules. It is intentionally direct and operational.

## Operating Rules

1. Work on `main` only. Feature branches were removed intentionally.
2. Inspect the existing file and nearby imports before editing.
3. Make the smallest correct change. Do not refactor unrelated code.
4. Do not edit `dist/` or `node_modules/` as source.
5. Use `apply_patch` for manual edits.
6. Preserve the existing visual language and responsive behavior.
7. Run `npm run lint` and `npm run build` after code changes.
8. For cart, account, checkout, or API changes, test the affected live flow.
9. Do not add fake success states for operations without a backend.
10. Do not change WordPress API response assumptions without checking the
    corresponding server/plugin code.

## Canonical Commands

```bash
npm run lint
npm run build
git status --short --branch
```

The production deployment is a static copy of `dist/` to OVH. Read
`DEPLOYMENT.md`; always back up the current live `dist/` before replacement.

## Source Ownership

```text
src/main.jsx                         entry and global CSS order
src/App.jsx                          providers and routes
src/shared/lib/woo.js                transport/API contract
src/shared/lib/catalog.js            catalog metadata/cache/normalization
src/shared/UIContext.jsx             global UI state
src/features/cart/CartContext.jsx    cart state and mutation orchestration
src/features/account/AccountContext.jsx auth session state
src/features/checkout/pages/Checkout.jsx checkout state machine/UI
src/features/catalog/pages/ProductPage.jsx product/variant behavior
src/features/catalog/pages/Shop.jsx catalog filters and grids
src/features/layout/                 header/footer/menu/chrome
src/features/search/                 search overlay and route
src/shared/ui/                        reusable UI primitives/widgets
src/shared/styles/                   styled theme and global style
src/styles/                          legacy/global CSS system
wordpress/                           server plugin source
public/                              copied static assets and legal HTML
```

## Provider and Data Flow

```text
BrowserRouter
  -> CartProvider
    -> AccountProvider
      -> UIProvider
        -> routes and Layout
```

API flow:

```text
page/component
  -> feature context or shared helper
    -> src/shared/lib/woo.js
      -> WooCommerce Store API or WordPress REST API
```

Do not call WooCommerce directly from multiple components with custom headers.
Extend `woo.js`, normalize there, and consume the normalized result.

## API Contracts

Production REST roots:

- WooCommerce Store API: `/wp-json/wc/store/v1`
- WordPress REST API: `/wp-json`

Development proxy roots:

- `/woo-api` maps to the local Store API.
- `/wp-api` maps to the local WordPress API.

Requests may depend on:

- cookies (`credentials: include`)
- WooCommerce `Cart-Token`
- WooCommerce nonce
- local-storage guest cart token
- external customer-auth plugin endpoints

Custom WordPress plugin endpoints in `wordpress/cereve-storefront-ean.php`:

- `GET /wp-json/cereve/v1/ean/{ean}`
- `GET /wp-json/cereve/v1/products/{id}/ean`
- `GET /wp-json/cereve/v1/products/catalog-meta?ids=...`
- `GET /wp-json/cereve/v1/products/catalog-counts`

The frontend also expects a separate customer-auth plugin. It is not in this
repository. Do not assume auth changes are frontend-only.

## State Invariants

- WooCommerce cart response is authoritative after mutations.
- Cart mutation loading/busy state must be cleared on success and failure.
- Coupon operations are serialized.
- Guest cart token must survive reloads.
- Login/signup/logout refreshes cart state.
- Account credentials must not be placed in local storage.
- Checkout cannot safely advance without a valid selected shipping rate.
- Product routes normally use slugs; do not silently treat IDs as slugs.
- Checkout is intentionally rendered without normal header/footer chrome.
- Supplier restrictions are business logic; preserve them unless explicitly
  changing the business rule.

## File-Level Instructions

- `App.jsx`: route/provider changes only; preserve compatibility aliases.
- `woo.js`: one transport boundary; preserve headers, cookies, nonce, and error
  normalization.
- `catalog.js`: preserve cache key/version and normalize API data here.
- `CartContext.jsx`: do not make local cart totals authoritative.
- `AccountContext.jsx`: do not persist passwords or customer credentials.
- `Checkout.jsx`: validate server operations before changing steps; test payment
  redirects and shipping rates.
- `ProductPage.jsx`: test variant matching and `variation_id` payloads with a
  real variable product.
- `Shop.jsx` and `SearchPage.jsx`: ensure category filters use the parameter
  shape expected by the Store API, usually IDs.
- `Shop.jsx` and `styles/shop.css`: preserve the shop filter responsive behavior.
  Brand links align with the search field on desktop, counts have a gutter from
  the slim scrollbar, and the open mobile drawer must stack above the site
  header through `shop--filters-open`.
- `ProductCard.jsx`: check all callers: home, shop, search, related products.
- `Header.jsx` and `MobileMenu.jsx`: update desktop/mobile navigation together.
- `Footer.jsx`: newsletter UI is not a backend subscription unless explicitly
  connected.
- `public/legal-pages/*.html`: static files; no React imports or build logic.
- `wordpress/*.php`: server-side contract; review security and query behavior.

## Styling Rules

The project currently uses two styling layers. Legacy CSS files remain imported
for catalog, product, search, chrome, footer, and checkout pages because the
first full styled-components migration caused scroll jitter and layout
regressions. Styled-components is preferred for new reusable components, but do
not remove legacy imports without route-by-route visual parity checks.

Only badge styling has been safely moved into the shared `Badge` component. Keep
tags, animation/transition rules, responsive grids, image sizing, drawers,
product/checkout layout, and scroll-sensitive CSS in the legacy files unless
route-by-route visual parity proves a replacement safe.

Use styled-components for all new work. Do not introduce a third styling system.
When changing a token, use `theme.js` and `GlobalStyle.js`. Check mobile widths,
focus states, reduced motion, and dark/contrast assumptions before finishing.

## Common Customization Recipes

Branding: edit `src/shared/lib/branding.js`, `index.html`, header, footer, and
global metadata as needed.

Theme: edit `src/styles/tokens.css` and keep `src/shared/styles/theme.js`
synchronized while both styling layers exist.

Homepage: edit `src/features/catalog/pages/Home.jsx`; keep API/data helpers out
of static marketing markup.

Navigation: update `Header.jsx`, `MobileMenu.jsx`, route definitions in `App.jsx`,
and related chrome styles.

Legal content: add/edit `public/legal-pages/*.html`; verify the copied URL after
build/deploy.

Catalog behavior: inspect `catalog.js`, `Shop.jsx`, `SearchPage.jsx`, and `woo.js`.
Do not change a filter parameter without checking Store API expectations.

Cart behavior: inspect `CartContext.jsx` and the specific cart component. Keep
the server refresh after mutation.

Checkout behavior: inspect `Checkout.jsx`, `woo.js`, and WordPress/payment
contracts. Run a complete live checkout flow.

Supplier behavior: update both the PHP filtering plugin and frontend checkout
validation/display logic.

## Known Risks to Check Before Touching Related Code

- Variable product payload may use the wrong variation ID shape.
- Shipping selection failure may not block checkout progression.
- Variation attribute key derivation is fragile.
- Product variation image gallery is incomplete.
- Search category filtering may use slugs instead of IDs.

Shop filter visual invariants:

- Do not reintroduce left indentation on links inside `.filters__brands`.
- Keep the desktop brand-list scrollbar slim and leave space before it for
  counts.
- Test the mobile filter drawer with the site header visible; the drawer must
  cover the header rather than allowing the header to overlay its title or
  close button.
- Numeric product URL fallback may be passed to a slug lookup.
- WordPress page loading is bounded and not fully paginated.
- `dangerouslySetInnerHTML` assumes trusted sanitized server content.
- Newsletter/restock success is currently local-only.
- Country/state fallback data can produce invalid checkout addresses.
- No automated test suite exists.

## Review and Change Checklist

Before editing:

- Identify the owning feature and transport boundary.
- Read imports and nearby state/effect logic.
- Search all call sites before changing a shared function.
- Check whether the behavior exists in desktop and mobile variants.

After editing:

- Run `npm run lint`.
- Run `npm run build`.
- Run `git diff --check`.
- Inspect the diff for unrelated changes.
- Test affected routes and API flows.
- If deployment is requested, back up live `dist/` first.

## Do Not Do

- Do not delete compatibility routes without an explicit migration plan.
- Do not bypass `woo.js` for convenience.
- Do not store auth secrets in local storage.
- Do not claim a newsletter/restock request succeeded without a backend.
- Do not silently remove supplier or checkout restrictions.
- Do not overwrite production without a backup.
- Do not fix unrelated lint warnings in a feature patch unless requested.
- Do not modify generated `dist/` files manually.
