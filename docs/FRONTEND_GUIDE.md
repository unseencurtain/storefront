# Frontend Guide

This is the human-facing guide for the headless Cosmetic storefront. It explains
where the code lives, how data moves through the application, what can be
customized safely, and how to verify changes.

## 1. Project Summary

The project is a React 19 single-page application built with Vite. It is served
as static files and talks to a WordPress/WooCommerce installation on the same
origin in production.

Main technologies:

- React and React Router for the UI and client-side routes.
- Styled Components for newer component-level styling.
- Global CSS files for the older/shared visual system.
- WooCommerce Store API for products, cart, shipping, checkout, and payments.
- WordPress REST API for pages and custom catalog/customer endpoints.
- Vite for development, proxying, and production builds.

The production frontend is a copied `dist/` directory, not a server-side
checkout application. The browser must still be able to reach WordPress,
WooCommerce, payment gateways, and the custom WordPress plugins.

## 2. Start Here

```bash
npm install
npm run dev
```

Useful commands:

```bash
npm run lint
npm run build
npm run preview
```

The development proxy is configured in `vite.config.js`. The local WordPress
site is expected at `https://react-store.ddev.site`.

The normal change workflow is:

1. Work only on `main`.
2. Make the smallest change in the appropriate feature or shared module.
3. Run `npm run lint` and `npm run build`.
4. Test the affected route, cart behavior, and checkout behavior when relevant.
5. Deploy the generated `dist/` only after the build succeeds.
6. Keep a timestamped production backup before replacing `dist/`.

See `DEPLOYMENT.md` for the current OVH deployment procedure and server paths.

## 3. Repository Map

```text
frontend/
├── index.html                 Vite HTML shell, fonts, title, asset entry
├── package.json               Scripts and dependencies
├── vite.config.js             Vite server and WordPress proxy
├── public/                    Files copied unchanged into dist/
│   └── legal-pages/           Static legal and informational HTML
├── src/
│   ├── main.jsx               React entry point and global CSS imports
│   ├── App.jsx                Providers and route table
│   ├── features/              Business features grouped by domain
│   ├── shared/                API clients, contexts, design system, widgets
│   └── styles/                Legacy/global CSS and design tokens
├── wordpress/                 WordPress plugin source used by the API
├── DEPLOYMENT.md              Live server and deployment notes
└── docs/                      Project documentation
```

`dist/` and `node_modules/` are generated/local directories. Do not edit them
as source files. The deployed `dist/` is produced by `npm run build`.

## 4. Runtime Architecture

The provider hierarchy in `src/App.jsx` is intentional:

```text
BrowserRouter
└── CartProvider
    └── AccountProvider
        └── UIProvider
            └── Routes and Layout
```

Important consequences:

- Routes can use browser history and direct links.
- Account actions can refresh the authoritative cart.
- Cart and account state are available to layout components and pages.
- The checkout route uses a bare layout without the normal chrome.

The application has four layers:

1. **Presentation:** JSX pages and components in `src/features` and `src/shared/ui`.
2. **State:** `CartContext`, `AccountContext`, and `UIContext`.
3. **Domain helpers:** `catalog.js`, `format.js`, `gateways.js`, and branding.
4. **Transport:** `woo.js` for WooCommerce/WordPress requests.

Keep API calls out of presentational components when a reusable helper belongs
in `src/shared/lib/woo.js` or a context. Keep page-specific display decisions
inside the feature page.

## 5. Routes

Routes are defined in `src/App.jsx`.

Primary routes:

- `/` home page
- `/shop` catalog
- `/shop/:slug` and `/shop/:slug/:child` category pages
- `/shop/brand/:brandSlug` brand catalog
- `/brands` brand index
- `/product/:slug` and `/products/:slug` product detail
- `/cart` full cart page
- `/checkout` checkout flow
- `/search` search results
- `/login`, `/signup`, `/account`, `/account/orders/:id` account flows

Compatibility routes include `/brand/:brandSlug`, `/collection/:slug`,
`/product-category/...`, `/products/:slug`, and `/bags` redirecting to cart.

When adding a route:

1. Add it in `src/App.jsx`.
2. Decide whether it should use the normal `Layout` or the bare checkout layout.
3. Add a direct-navigation test against the production server.
4. Confirm the web server falls back to `index.html` for the route.

## 6. Data and API Flow

### WooCommerce client

`src/shared/lib/woo.js` is the transport boundary. It handles:

- Store API requests under `/wp-json/wc/store/v1`.
- WordPress REST requests under `/wp-json`.
- Development proxy prefixes `/woo-api` and `/wp-api`.
- `credentials: include` for cookie-based sessions.
- WooCommerce cart tokens and nonces.
- Guest cart token persistence in local storage.
- Product, category, brand, customer, cart, checkout, and page operations.

Do not add a second ad hoc `fetch` implementation for WooCommerce. Add a
small, named function to `woo.js`, normalize the response there, and expose a
stable result to the feature layer.

### Catalog

`src/shared/lib/catalog.js` loads and normalizes categories, brands, counts,
department trees, and product metadata. Catalog metadata is cached in local
storage under `cosmetic.catalog.v2` for approximately six hours.

The usual flow is:

```text
catalog.js metadata
  -> Shop/Home/Brands navigation
  -> woo.js product request
  -> ProductCard or ProductPage
```

### Cart

`src/features/cart/CartContext.jsx` owns cart state and calls `woo.js` for the
authoritative cart. It serializes coupon operations, tracks busy mutations,
persists a guest cart token, and refreshes after account changes.

Cart UI files:

- `CartPage.jsx`: full-page cart route.
- `CartDrawer.jsx`: overlay cart.
- `CartLine.jsx`: one line item.
- `CartCoupon.jsx`: coupon input and messages.
- `Ledger.jsx`: totals and order summary.
- `cart.css.js`: cart-specific styled rules.

### Account

`src/features/account/AccountContext.jsx` owns cookie-backed customer session
state. It restores `/customer`, treats `401` as a normal logged-out state, and
refreshes the cart after login, signup, logout, or session changes.

Passwords and customer credentials are not placed in local storage.

### Checkout

`src/features/checkout/pages/Checkout.jsx` manages information, shipping, and
payment. Address updates are sent to WooCommerce so shipping rates can be
calculated. The final request includes billing/shipping data, payment method,
customer note, and payment data. Redirect gateways use `window.location.assign`.

Checkout is tightly coupled to the WooCommerce cart response and the separate
customer-auth WordPress plugin. Test it against the live WordPress/WooCommerce
environment, not only a static browser build.

## 7. File-by-File Reference

### Root and configuration

- `index.html`: document shell, title, meta description, favicon, Google Fonts,
  and Vite asset tags.
- `package.json`: scripts and React, router, styled-components, Vite, Oxlint,
  and compiler dependencies.
- `package-lock.json`: locked dependency graph. Change through npm, not manual
  editing.
- `vite.config.js`: React plugin, compiler setup, dev server, and API proxies.
- `.oxlintrc.json`: lint configuration.
- `.gitignore`: generated and local files excluded from Git.
- `README.md`: starter Vite notes; this guide is the application documentation.
- `DEPLOYMENT.md`: OVH host, paths, backup requirement, and deployment checks.

### Entry and routing

- `src/main.jsx`: mounts the app and imports global CSS in cascade order.
- `src/App.jsx`: composes providers and defines all routes and redirects.

### Shared state and libraries

- `src/shared/UIContext.jsx`: modal, search, cart drawer, menu, promo, and UI
  overlay state plus helpers.
- `src/shared/lib/branding.js`: brand names, marks, and brand-level identity.
- `src/shared/lib/catalog.js`: catalog metadata loading, normalization, trees,
  cache, counts, and category helpers.
- `src/shared/lib/format.js`: display formatting helpers for prices and text.
- `src/shared/lib/gateways.js`: payment gateway display labels and metadata.
- `src/shared/lib/woo.js`: all major WordPress and WooCommerce transport logic.
- `src/shared/styles/theme.js`: styled-components theme values.
- `src/shared/styles/GlobalStyle.js`: global styled-components reset and base
  rules.
- `src/features/content/pages/content.css.js`: content page styled components.
- `src/features/catalog/pages/catalogPages.css.js`: catalog page styled
  components.
- `src/features/account/pages/accountRoute.css.js`: account loading styles.
- `src/shared/ui/primitives.js`: reusable styled typography, layout, buttons,
  fields, and surfaces.
- `src/shared/ui/Icons.jsx`: icon components sourced from the SVG sprite.
- `src/shared/ui/Price.jsx`: consistent price rendering.
- `src/shared/ui/Accordion.jsx`: expandable content widget.
- `src/shared/ui/QuantityStepper.jsx`: accessible quantity control.
- `src/shared/ui/accountForms.js`: account form field styles and helpers.
- `src/shared/ui/accountLayout.js`: account page layout primitives.

### Account feature

- `AccountContext.jsx`: session state and auth actions.
- `Account.jsx`: account dashboard and order list.
- `AccountRoute.jsx`: authenticated/guest route guard behavior.
- `Login.jsx`: login form.
- `Signup.jsx`: registration form.
- `OrderDetail.jsx`: order detail rendering.
- `orderDetail.css.js`: order detail styling.

### Cart feature

- `CartContext.jsx`: cart state, mutations, token, coupon queue, and refreshes.
- `constants.js`: cart constants and display defaults.
- `cart.css.js`: cart styled components and layout rules.
- `CartCoupon.jsx`: coupon apply/remove UI.
- `CartDrawer.jsx`: slide-out cart UI.
- `CartLine.jsx`: line item controls and product link.
- `Ledger.jsx`: subtotal, discount, shipping, and total summary.
- `CartPage.jsx`: full cart page composition.

### Catalog feature

- `ProductCard.jsx`: reusable product tile, quick add, image, price, and badges.
- `Home.jsx`: marketing homepage, ribbons, featured content, and newsletter UI.
- `Shop.jsx`: filters, category/brand navigation, sorting, and product grid.
- `Brands.jsx`: brand index and brand navigation.
- `ProductPage.jsx`: product details, gallery, variants, quantity, related items,
  add-to-cart, and restock UI.

### Checkout feature

- `checkout/pages/Checkout.jsx`: complete information/shipping/payment flow.
- `checkout/checkout.css.js`: checkout styled components and responsive rules.

### Content feature

- `content/pages/ContentPage.jsx`: WordPress page/content rendering and fallback.

### Layout feature

- `AnnouncementBar.jsx`: promotional announcement strip.
- `Header.jsx`: desktop header, navigation, search trigger, account/cart actions.
- `MobileMenu.jsx`: mobile navigation drawer.
- `Footer.jsx`: footer links, newsletter UI, social links, and service messaging.
- `Layout.jsx`: header/footer/chrome composition and checkout exception.
- `chrome.js`: styled header, navigation, and shared chrome pieces.
- `footer.js`: footer-specific styled definitions.

### Search feature

- `SearchOverlay.jsx`: global quick-search overlay.
- `SearchPage.jsx`: search route, filters, query, and result list.

### Global styles

- `styles/tokens.css`: CSS custom properties for palette, type, spacing, and motion.
- `styles/base.css`: reset, body, typography, links, and accessibility basics.
- `styles/chrome.css`: header/navigation/chrome classes.
- `styles/shop.css`: catalog, cards, filters, product, and checkout classes.
- `styles/footer.css`: footer classes.
- `styles/ui.css`: shared controls and utility classes.

The application currently uses two styling layers. The legacy CSS files remain
the visual source of truth for catalog, product, search, chrome, footer, and
checkout pages because the first full styled-components migration introduced
scroll jitter and layout regressions. Styled-components remains preferred for
new reusable components, but legacy imports must not be removed without
route-by-route visual parity checks.

The current safe migration is intentionally small: badge styling is owned by
the shared `Badge` component, while tags, motion, responsive layout, drawers,
product proportions, checkout layout, and scroll-sensitive rules remain in
legacy CSS.

### Shop filter behavior

The catalog filter markup is owned by `Shop.jsx` and its responsive presentation
is owned by `styles/shop.css`:

- Desktop brand links align with the brand search field; do not restore the
  generic sub-link indentation inside `.filters__brands`.
- Desktop brand lists keep a small right gutter between item counts and the
  scrollbar. The scrollbar is intentionally slim and should not be replaced by
  a full-width browser scrollbar.
- On mobile, the filter panel is a full-height drawer. When open, the shop page
  receives `shop--filters-open` so the drawer stacks above the sticky site
  header. Keep the drawer header and close button within that panel.
- Mobile filter links and brand lists retain their shared content inset and the
  mobile drawer remains scrollable.

When changing filter spacing or overflow, verify both desktop and mobile shop
views. The filter drawer is especially sensitive to stacking-context changes
because the shop page uses a page-fade animation.

### WordPress source

- `wordpress/cereve-storefront-ean.php`: custom REST endpoints for EAN lookup,
  catalog metadata/counts, and supplier/image filtering.

The frontend also expects a separate customer-auth plugin that is not stored in
this repository. Coordinate frontend auth changes with that server plugin.

### Public files

- `public/favicon.svg`: browser/site icon.
- `public/icons.svg`: SVG icon sprite.
- `public/legal-pages/*.html`: static legal and informational pages copied to
  `dist/legal-pages/` unchanged during build.

## 8. Safe Customization Map

| Goal | Primary file(s) | Notes |
| --- | --- | --- |
| Change store name or logo text | `src/shared/lib/branding.js`, `index.html` | Check header, footer, title, and metadata. |
| Change colors/type/spacing | `src/styles/tokens.css`, `src/shared/styles/theme.js` | Keep both token sources synchronized while both systems exist. |
| Change homepage sections | `src/features/catalog/pages/Home.jsx` | Keep product loading and marketing copy separate. |
| Change announcement text | `src/features/layout/components/AnnouncementBar.jsx` | Confirm mobile wrapping. |
| Change header navigation | `Header.jsx`, `MobileMenu.jsx`, `chrome.js` | Update desktop and mobile behavior together. |
| Change footer links/copy | `Footer.jsx`, `footer.js` | Verify legal routes and external links. |
| Add a legal page | `public/legal-pages/` | Use a static HTML file and verify the deployed URL. |
| Change product card appearance | `ProductCard.jsx`, nearby styled definitions | Check home, shop, search, and related products. |
| Change catalog filters | `Shop.jsx`, `catalog.js`, `woo.js` | WooCommerce parameters must remain compatible. |
| Change product detail layout | `ProductPage.jsx` | Preserve variant selection and cart payload behavior. |
| Change cart UI | `CartContext.jsx`, cart components, `cart.css.js` | Keep server refreshes authoritative. |
| Change checkout fields | `Checkout.jsx` | Validate against WooCommerce and shipping zones. |
| Change gateway labels | `src/shared/lib/gateways.js` | Do not remove a gateway without server confirmation. |
| Change REST behavior | `src/shared/lib/woo.js`, WordPress plugin | Update both sides of the contract. |
| Change supplier restrictions | `wordpress/cereve-storefront-ean.php`, checkout | This is business logic, not only presentation. |

Avoid changing API response shapes in a component. Normalize them in `woo.js`
so the rest of the application has one predictable contract.

## 9. Important Contracts and Invariants

- The production app and WordPress APIs normally share an origin.
- Auth and cart requests require cookies and/or WooCommerce headers.
- The cart returned by WooCommerce is authoritative after mutations.
- Guest cart tokens must survive page reloads.
- Account changes must refresh the cart.
- Product URLs normally use slugs, not numeric IDs.
- Static files in `public/` are copied as-is and are not processed by React.
- Checkout depends on valid shipping rates and payment methods from WooCommerce.
- Supplier rules intentionally restrict some products and mixed carts.
- BrowserRouter requires production SPA fallback to `index.html`.
- WordPress-rendered HTML is trusted content and must be sanitized upstream.

## 10. Known Review Findings

The detailed review is in `docs/FRONTEND_CODE_REVIEW.md`. The highest priority
items to verify before changing checkout or product behavior are:

1. Variable-product add-to-cart currently appears to send an array where the
   Store API usually expects a numeric variation ID.
2. Checkout can advance after a failed shipping-rate selection.
3. Search category filtering passes a slug while shop filtering resolves IDs.
4. Variation attribute matching depends on a fragile label-to-slug conversion.
5. Product variation gallery resolution is incomplete.
6. Newsletter and restock forms currently show local success without a backend.

## 11. Testing Expectations

There is currently no automated test suite. At minimum, manually test:

- Home, shop, brand, category, product, search, cart, checkout, and account routes.
- Guest cart persistence across reloads.
- Variable product option selection and add-to-cart.
- Coupon apply and remove.
- Shipping rate selection and payment redirect.
- Login/logout and account order pages.
- Mobile menu, search overlay, cart drawer, and keyboard escape behavior.
- Direct navigation to nested routes on the deployed server.

Run both `npm run lint` and `npm run build` before deployment. Lint currently
reports warnings but no fatal errors; warnings should not be silently treated as
proof that the affected behavior is correct.
