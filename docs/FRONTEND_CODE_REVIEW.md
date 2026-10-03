# Frontend Code Review

This review covers the tracked frontend source, configuration, public assets,
and the WordPress integration source as of the current `main` branch.

## Executive Summary

The application has a sensible feature-oriented structure and a good central
API boundary. Cart/session handling is stronger than many small headless
storefronts because WooCommerce remains the source of truth and cart mutations
are refreshed. The main risk is not the React structure; it is the number of
implicit contracts with WooCommerce, WordPress plugins, payment gateways, and
the live web server.

There are no tracked unit, integration, end-to-end, or accessibility tests.
Production confidence currently depends on lint, build, manual testing, and the
live WordPress environment.

## Findings by Priority

### High: Verify variable-product add-to-cart payload

`src/features/catalog/pages/ProductPage.jsx` passes a matched variation ID in an
array-like shape, while `src/shared/lib/woo.js` sends it as `variation_id`.
WooCommerce Store API implementations commonly expect one numeric variation ID.
Verify a real variable product through the API and checkout. If the contract is
numeric, normalize it before the request and add a regression test.

### High: Do not ignore shipping-rate selection failure

`src/features/checkout/pages/Checkout.jsx` calls the shipping-rate selection
operation but can continue to payment without proving it succeeded. A failed
selection can leave the cart with no valid method or a stale method. Block the
step transition, show the server error, and test a rate change end to end.

### High: Confirm variation attribute matching against real metadata

`ProductPage.jsx` derives keys from visible attribute labels by lowercasing and
replacing spaces. WooCommerce attributes may use taxonomy names, slugs, prefixes,
or encoded terms. A valid option can therefore fail to match. Normalize both
the product data and the selected option through one explicit mapping.

### High: Verify production SPA fallback

`BrowserRouter` needs every application route to serve `index.html` on direct
navigation. A link from the home page can work while a direct `/checkout` request
returns a server 404. Test nested routes after every web-server or deployment
change.

### Medium: Search category parameter differs from shop behavior

`Shop.jsx` resolves category slugs to IDs before requesting products, while
`SearchPage.jsx` passes a slug directly. Store API category parameters generally
use IDs. Verify filtered search results and centralize category parameter
normalization.

### Medium: Product variation gallery is incomplete

The gallery helper in `woo.js` currently returns base product images even though
the surrounding code describes variation/gallery resolution. Confirm whether a
selected variant must change the hero image and implement it consistently.

### Medium: Product URL fallback can use an ID as a slug

Some cart links fall back from `item.slug` to `item.id`. Product lookup then
uses a slug query. If the slug is missing, the numeric fallback may not resolve.
Prefer a dedicated product-ID lookup or ensure cart line data always includes a
valid slug.

### Medium: WordPress pages are not fully paginated

`woo.js` requests a bounded page size for WordPress pages but does not walk all
pagination headers/pages. Sites with more than the requested maximum can lose
content lookup coverage. Add pagination or document the intentional limit.

### Medium: HTML content is trusted without a frontend sanitizer

`ContentPage.jsx` and `ProductPage.jsx` render WordPress/WooCommerce HTML through
`dangerouslySetInnerHTML`. This is acceptable only when upstream content is
trusted and sanitized. Review WordPress roles, allowed HTML, embeds, and any
third-party content before expanding author permissions.

### Medium: Newsletter and restock forms are local-only

The newsletter and restock flows display success or log data without a backend
subscription operation. This creates a misleading user experience. Either wire
them to a real service/API or label them as unavailable until implemented.

### Medium: Hard-coded country/state fallbacks can create bad orders

Checkout contains a limited country fallback and defaults a missing US state to
`TX`. If dynamic WooCommerce metadata fails, users can receive invalid address
data or incorrect shipping-zone matching. Prefer an explicit error and a complete
server-provided directory.

### Medium: Supplier rules are business-critical but lightly tested

The WordPress plugin filters suppliers and images, while checkout blocks mixed or
unknown suppliers. A catalog change can make products disappear or carts fail.
Document the rule and cover allowed, disallowed, and mixed carts with integration
tests.

### Low: Two styling layers need ownership discipline

The repository intentionally retains two styling layers after the first full
migration caused scroll jitter and layout regressions: styled-components for
reusable components and legacy CSS for catalog, product, search, chrome, footer,
and checkout pages. A future migration must be validated route by route against
the committed CSS behavior before removing these imports.

The safe migration currently completed is limited to badge styling in the shared
`Badge` component. Tags and motion/layout-sensitive rules remain in legacy CSS
intentionally.

### Low: Lint warnings need triage

Current warnings include unused imports/constants, state updates inside effects,
Fast Refresh export warnings, and an incomplete checkout effect dependency list.
They are not currently fatal, but the checkout dependency warning deserves a
behavior review rather than a blind suppression.

### Low: Production infrastructure details are in the repository

`DEPLOYMENT.md` contains a public host, SSH alias, user, key path, and production
directories. It contains no private key, but public repositories usually keep
operational details in private documentation or deployment secrets.

## Positive Design Decisions

- Feature directories make domain ownership discoverable.
- `woo.js` provides a clear transport boundary.
- WooCommerce remains authoritative after cart mutations.
- Coupon operations are serialized to reduce race conditions.
- Guest cart tokens are persisted without storing passwords.
- Account changes refresh cart state.
- The UI has skip links, focus-visible styles, live regions, labels, and reduced
  motion support.
- Static legal files are easy to edit and deploy.
- Deployment documentation requires a production backup and route verification.

## Recommended Test Plan

### Unit/API tests

- Woo error normalization.
- Cart token and nonce persistence.
- Cart mutation refreshes.
- Coupon queue ordering.
- Product and price normalization.
- Catalog cache expiry.
- Category slug-to-ID conversion.
- Customer session restoration.
- Page pagination.

### Component tests

- Product quick add and variable option selection.
- Cart quantity, coupon, and remove behavior.
- Login and registration validation.
- Checkout validation and shipping selection.
- Search filters and empty states.
- Account route protection.

### Browser tests

1. Browse category to product to cart.
2. Buy a variable product.
3. Complete guest checkout.
4. Complete authenticated checkout.
5. Apply and remove a coupon.
6. Change shipping rate.
7. Follow a payment redirect.
8. Login, view orders, and open order detail.
9. Navigate directly to nested routes.
10. Exercise mobile menu, search, cart, and keyboard escape/focus behavior.

## Review Boundary

This document is a code review, not a guarantee that the live WooCommerce
installation returns every expected field. Server response shapes and payment
behavior must be verified in the real environment.
