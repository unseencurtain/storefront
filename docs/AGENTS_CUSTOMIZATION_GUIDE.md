# Agent Customization Guide

This guide explains how to customize the storefront safely and how to add a
feature without breaking the WooCommerce contract, responsive layouts, or
production deployment. Read `AGENTS.md` first for the short repository rules.

## 1. Start With Context

Before editing:

1. Identify the route, component, state owner, API calls, and styles involved.
2. Read the target file and every nearby shared import.
3. Search all call sites before changing a shared component, context, helper, or
   CSS class.
4. Check the current git status. Do not overwrite unrelated user changes.
5. Decide whether the change is presentation, state, transport, server logic,
   or a combination of these.

Use the smallest change that satisfies the requirement. Do not refactor a file
or migrate a styling system while implementing an unrelated feature.

## 2. Architecture And Ownership

The application is organized into providers, routes, feature pages, shared
helpers, and global styles:

```text
src/main.jsx
  -> src/App.jsx
    -> CartProvider
      -> AccountProvider
        -> UIProvider
          -> Layout and routes
```

Use the ownership map below. A change should normally start in the listed file,
not in a neighboring file that happens to render the same UI.

| Concern | Owner | Rules |
| --- | --- | --- |
| Providers and routes | `src/App.jsx` | Preserve redirects, aliases, and checkout's bare layout. |
| WooCommerce and WordPress requests | `src/shared/lib/woo.js` | Normalize responses and preserve cookies, tokens, nonces, and credentials. |
| Catalog metadata and filters | `src/shared/lib/catalog.js` | Preserve cache keys, normalization, counts, and tree behavior. |
| Global overlay/menu/search/cart UI | `src/shared/UIContext.jsx` | Keep global UI state separate from authoritative cart data. |
| Cart state and mutations | `src/features/cart/CartContext.jsx` | WooCommerce response remains authoritative after every mutation. |
| Customer session | `src/features/account/AccountContext.jsx` | Never persist passwords or credentials. |
| Checkout flow | `src/features/checkout/pages/Checkout.jsx` | Validate server results before advancing the UI. |
| Product behavior | `src/features/catalog/pages/ProductPage.jsx` | Preserve variant matching, gallery behavior, and add-to-cart payloads. |
| Catalog page | `src/features/catalog/pages/Shop.jsx` | Own filters, pagination, product grid, and catalog navigation. |
| Header, menu, footer, drawers | `src/features/layout/components/` | Check desktop and mobile together. |
| Reusable controls | `src/shared/ui/` | Prefer styled-components for new isolated controls. |
| Stable responsive/layout CSS | `src/styles/*.css` | Preserve legacy rules for layout, scroll, drawers, and transitions. |
| Server-side catalog behavior | `wordpress/` | Review frontend and plugin contracts together. |
| Static legal pages | `public/legal-pages/` | Keep as standalone HTML; do not add React imports. |

## 3. Choosing An Implementation

### Text, labels, and copy

Edit the component that owns the copy. Check desktop wrapping, mobile wrapping,
accessibility labels, and links. Do not hard-code the same label in multiple
components when a shared constant or branding helper already exists.

### Visual changes

Use the existing class or styled primitive first. Add a new rule only when the
existing behavior cannot express the requirement.

- Use styled-components for new reusable controls and isolated static styles.
- Keep `src/styles/*.css` for animations, responsive grids, image sizing,
  sticky/fixed elements, drawers, overlays, product layout, checkout layout,
  and scroll behavior.
- Keep selectors scoped to the feature. Avoid broad element selectors.
- Preserve existing breakpoints, spacing tokens, focus states, and transitions.
- For fixed or sticky UI, inspect stacking contexts before changing `z-index`.
- For scrollable UI, verify scrollbar width, content gutter, touch scrolling,
  keyboard scrolling, and the end of the list.

Never delete a legacy rule during a feature change without checking every usage
on desktop and mobile. The previous full CSS migration caused scroll jitter and
layout regressions.

### Local component state

Use local state for transient concerns such as an input, open section, pending
visual state, or selected tab. Keep state close to the component that owns it.
Do not duplicate server data in several local states unless there is a clear
loading or editing requirement.

### Shared UI state

Use `UIContext` for global overlays, menu state, search visibility, and cart
drawer visibility. Do not put cart contents or totals there.

### Server-backed state

Use the feature context or a named helper in `woo.js`. The flow should be:

```text
user action
  -> feature handler/context
    -> woo.js request
      -> normalize response
        -> update authoritative state
          -> render result or error
```

Show success only after the server operation succeeds. Never invent success for
newsletter, restock, account, payment, or cart operations without a backend
operation confirming it.

## 4. Adding A New Feature

Follow this sequence for a new capability:

1. Define the user-visible behavior, route, data source, loading state, empty
   state, error state, and responsive behavior.
2. Find the nearest feature folder and place page-level code there. Put reusable
   controls in `src/shared/ui/` only when there are multiple real consumers.
3. Add or extend the transport function in `woo.js` if the feature needs data.
   Normalize the response at the transport boundary.
4. Add state to the owning context only if multiple unrelated components need
   it. Otherwise keep it local to the page or feature component.
5. Add the route in `App.jsx`, including direct navigation and compatibility
   behavior where appropriate.
6. Implement the default, loading, empty, error, and success states before
   polishing the visual details.
7. Add responsive CSS using the existing design tokens and breakpoint behavior.
8. Inspect related call sites and existing CSS for regressions.
9. Run lint, build, and focused manual checks.
10. Deploy only after the build succeeds, with a timestamped server backup.

Do not add a route only to hide an unfinished feature. Direct routes must load
through the production SPA fallback and must handle refreshes.

## 5. API And WooCommerce Rules

- Use `src/shared/lib/woo.js` as the transport boundary.
- Preserve `credentials: include` for cookie-backed requests.
- Preserve WooCommerce cart tokens, nonces, and required headers.
- Treat WooCommerce cart responses as authoritative after mutations.
- Keep product URLs slug-based unless the endpoint explicitly requires an ID.
- Confirm Store API parameter shapes before changing filters or product queries.
- Normalize inconsistent API fields once in `woo.js`, not in every component.
- Review `wordpress/*.php` when changing a custom endpoint or filter contract.
- Never expose customer credentials in local storage, query strings, or logs.

When changing an API response, inspect all consumers before changing the
normalizer. A harmless-looking field rename can affect catalog, search, product,
cart, and checkout views.

## 6. Responsive And Accessibility Checklist

Every UI change must be considered at minimum at mobile and desktop widths.
Check:

- Content does not overflow horizontally.
- Fixed drawers cover the intended viewport and do not sit behind the header.
- Sticky elements do not overlap content or controls.
- Text, counts, and icons align consistently.
- Buttons and links have visible focus states.
- Icon-only controls have accessible labels.
- Inputs have labels or meaningful placeholders.
- Escape and close actions work for overlays and drawers.
- Keyboard users can reach and operate the changed controls.
- Touch scrolling works for long lists and drawers.

For a drawer or overlay, inspect parent stacking contexts, not only the child
`z-index`. Animated page wrappers can create a stacking context that prevents a
child from appearing above the site header.

## 7. Verification

Run after code changes:

```bash
npm run lint
npm run build
git diff --check
```

Lint currently reports existing warnings; warnings are not proof that the
changed behavior is correct. Build must complete successfully.

At minimum, manually test the affected route and these shared surfaces when
relevant:

- `/`, `/shop`, `/brands`, `/search`
- `/cart/` and `/checkout/`
- Direct navigation to nested product, category, and brand routes
- Header, mobile menu, search overlay, drawers, and Escape handling
- Active filters, pagination, product gallery, variants, and add-to-cart
- Guest cart persistence, account changes, and checkout server transitions

For visual changes, compare both desktop and phone layouts. For API or cart
changes, test against the real WordPress/WooCommerce environment when possible.

## 8. Deployment

Production serves the generated `dist/` directory. Never manually edit `dist/`
or `node_modules/`.

Required deployment sequence:

1. Run lint and build locally.
2. Create a backup on OVH under `/home/ubuntu/sillage/frontend/` using a
   timestamped `dist.backup-*` directory.
3. Sync the generated `dist/` to `/home/ubuntu/sillage/frontend/dist/`.
4. Verify the live route, affected interaction, `/cart/`, and `/checkout/`.
5. Report the live URL, backup path, checks performed, and any remaining risks.
6. Push to GitHub only after the user confirms the live behavior.

Do not claim deployment success without checking the live response. Do not
delete old backups unless the user explicitly asks for cleanup.

## 9. Common Mistakes

- Editing `dist/` instead of source files.
- Calling WooCommerce directly from a component.
- Making local cart totals authoritative.
- Persisting account credentials in local storage.
- Adding a desktop-only fix that breaks the mobile drawer.
- Raising a child `z-index` without checking its parent stacking context.
- Replacing stable legacy CSS during an unrelated feature.
- Removing a shared CSS rule without checking all usages.
- Claiming success before a server operation returns success.
- Skipping the build because a change appears to be CSS-only.
- Deploying without a timestamped backup.
- Committing unrelated work or user changes.

## 10. Documentation Expectations

Update documentation when a change introduces or modifies:

- A route, provider, context, API endpoint, or server contract
- A deliberate responsive or styling invariant
- A deployment path, verification requirement, or operational command
- A known limitation, compatibility route, or business rule

Keep documentation factual and tied to the current implementation. Prefer
short operational rules over speculative design descriptions.
