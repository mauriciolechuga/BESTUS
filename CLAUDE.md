# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A multi-store Cypress end-to-end test suite that verifies customer-facing forms and pages on the Best Access Doors family of live BigCommerce storefronts. One shared set of specs runs against any store; each store is described by a JSON file in `stores/`. No application code lives here — only test code.

Stores: BESTUS (bestaccessdoors.com — the default), BESTCA, ADAP, ADC, AAP, FSE, BRH (all seven fully configured); CAD, PDA (scaffolds — homepage-level specs only until their config sections are filled in).

## Commands

```bash
# Install dependencies (once)
npm install

# Run all tests headlessly against the default store, BESTUS (stub mode — no real leads created)
npx cypress run            # or: npm test

# Run a single spec file
npx cypress run --spec "cypress/e2e/contact-form.cy.js"

# Run against a specific store
npm run test:store bestca
npm run test:store -- aap --spec "cypress/e2e/homepage.cy.js"   # extra args forwarded to cypress run

# Run every store sequentially (continues on failure, summary table at the end)
npm run test:all
npm run test:all -- --stores bestus,bestca

# Open interactive Cypress app (default store; restart after editing a stores/*.json)
npx cypress open
npx cross-env STORE=bestca cypress open

# Live submission mode (creates real Zoho CRM leads — use sparingly)
npm run test:live
```

## Multi-Store Architecture

- `cypress.config.js` reads `process.env.STORE` (default `bestus`), loads `stores/<STORE>.json`, sets `baseUrl` from it, and injects the whole object into `Cypress.env('site')` plus `STORE`. Screenshots/videos go to per-store subfolders (`cypress/videos/<store>/`). The loader throws with the list of available codes on an unknown store and sanity-checks `storeCode`/`baseUrl`/`homePath`.
- `cypress/support/store.js` is the only module that reads `Cypress.env('site')`. It exports:
  - `getStore()` — the store config object, available synchronously at spec module-evaluation time (this is why config is injected via env rather than `cy.fixture()` — `describe` vs `describe.skip` must be decided at collection time)
  - `describeIfStore(condition, title, [options,] fn)` / `itIfStore(condition, title, fn, [reason])` — run the suite/test when the config section exists, otherwise `describe.skip`/`it.skip` with a `[skipped: not configured for <CODE>]` title suffix so missing features show as pending, never silently absent. `itIfStore`'s optional `reason` replaces that suffix with `[skipped: <reason>]` for _deliberate_ gates (theme lacks the element, form doesn't require the field, Electron-only limitation) so the skip self-documents to anyone running the suite — e.g. `[skipped: store theme hides breadcrumbs on mobile (pdp.mobileBreadcrumbsHidden)]`. Omit `reason` only for genuine "not configured yet" gates on scaffold stores.
  - `storePath(path)` — appends the store's `visitQuery` if set (AAP needs `?redirect=disable` on every visit)
  - `homePath()` — the store's homepage path (FSE's homepage is `/new-home/`, not `/`)
- **Nullable-section contract** in `stores/*.json`: `plp`, `products`, `discovery`, `pdp`, and each entry under `forms` may be `null`, which makes the specs gated on them skip. `storeCode`, `baseUrl`, `homePath`, `branding.copyrightText`, and `branding.imageHosts` are required. `branding.footerLocationText`, `branding.warehousesLink`, and `branding.partnerLinks` may be `null` (their individual homepage tests skip). See `stores/bestus.json` for the full shape; scaffolds carry a `_todo` key describing what to fill.
- Store-specific text lives in config, not specs: brand/copyright text, footer location, PLP heading/breadcrumb labels (`plp.mainHeading`/`plp.breadcrumbLabel` — Spanish on PDA), search terms, sort label.
- **Footer theme drift**: stores run different BigCommerce footer themes, so footer selectors/expectations are config-driven. `FOOTER_DEFAULTS` in `store.js` holds the BESTUS values (`footer.tcsFooter`, `.box h3`, `.Contact-info-box`, `.Copyright p`, 2+ tel links); any key can be overridden per store via `branding.footer` (see `stores/bestca.json`, which uses `footer.footer`, `h5.footer-info-heading`, `.contactbox`, `.footer-copyright p`, 1 tel link). `footerConfig()` returns the merged result; `assertFooterHeadings` and both homepage specs read from it.
- **Header theme drift**: some themes have no semantic `<header>` element (ADAP's desktop header is `div.desktop-header-section`, its mobile header `div.iPad_header`). `headerSelector()` / `mobileHeaderSelector()` in `store.js` default to `header` and are overridden per store via `branding.headerSelector` / `branding.mobileHeaderSelector` (mobile falls back to desktop). Consumed by both homepage specs, `pdp.mobile.cy.js`, and `assertMaxTouchTarget`. Likewise the mobile nav drawer: `MOBILE_NAV` in `devices.js` resolves via `mobileNavSelector()` (default `div.mobile-menu`; ADAP and AAP both override to `#mySidenav` via `branding.mobileNavSelector`).
- **PLP/PDP theme drift**: same pattern — `PLP_SELECTOR_DEFAULTS` / `PDP_SELECTOR_DEFAULTS` in `store.js` hold BESTUS selectors (PLP `heading`, breadcrumbs, sidebar, subcategory boxes + their `subcategoryTitle`/`subcategoryLink` internals, `productCard` grid container, `cardPrice`, gallery image, description, related carousel, product-info-form container, qty stepper buttons, `pdfNewTab`), overridable per store via `plp.selectors` / `pdp.selectors` (see `stores/adap.json`, `stores/bestca.json`, `stores/adc.json`). Nullable selector keys (`breadcrumbHome`, `sidebar`, `bestSellers`, `subcategoryBox`, `cardPrice`, `relatedCarousel`, `productInfoForm`, `qtyIncrement`, `qtyDecrement`) skip their check when set to null — use for stores whose theme lacks the element (ADC sets `cardPrice: null` because its mixed catalog interleaves priced and quote-only cards). `assertBreadcrumbs`/`assertProductInfoForm` read from `pdpSelectors()`; `productCardSelector()` (exported from `checks.js`) reads `plp.selectors.productCard`; `assertProductCards` reads `plp.selectors.cardPrice` and `plp.cy.js`/`plp.mobile.cy.js` read `plp.selectors.heading`.
- **SearchSpring "Snap" theme drift (BESTCA)**: BESTCA runs a newer SearchSpring storefront theme than BESTUS/ADAP. Its product grid renders into `ul.ss__results.ss__results--grid` (not `ul.productGrid`), so `plp.selectors.productCard` is set to `ul.ss__results li.product` and is read everywhere via `productCardSelector()` (used by `waitForProducts`, `assertProductCards`, `getVisibleProductTitles`, the search/no-results checks, and the PLP/discovery grid-click tests). Pagination uses `.ss__pagination__*` markup with a `?page=2` query param (set via `plp.selectors.pagination`; `assertPaginationAdvanced`'s active-page selector union includes `.ss__pagination__current`; the discovery page-2 click union includes `a.ss__pagination__link[href*="page=2"]`). Sort hash-routes like ADAP (`#/sort:calculated_price:asc`). BESTCA also has no qty stepper buttons (`qtyIncrement`/`qtyDecrement: null`) and a `searchspring/personalized-recommendations` script with `profile="similar"` rather than `"recently-viewed"` (`pdp.recentlyViewedProfile`).
- **SearchSpring "Snap" theme drift (ADC)**: ADC also runs the Snap theme + CAD, but with its own deltas on top of the BESTCA pattern. Its grid `<ul>` carries BOTH `ss__results` and `productGrid` classes; pagination uses `?p=2` (not `?page=2`) and marks the active page with `.pagination-item--current` (both already in the `assertPaginationAdvanced` unions / `pageTwoToken`). PLP/category headings are `h1.container-header` (`plp.selectors.heading`). **Mixed catalog**: priced "Best Access Doors" brand products and quote-only (price-less, no-cart, empty-JSON-LD-price) products are interleaved in the same grid, so config points `plp`/`products`/`pdp`/`discovery` at `/best-access-doors/` priced products AND sets `plp.selectors.cardPrice: null` to skip per-card price assertions. The search-results page has no `<h1>` at all → `discovery.search.resultsHaveHeading: false` gates the mobile search-heading check. PDPs render a hidden mobile-only `h1.productView-title.Mobile_title` before the visible title, so the discovery PDP-handoff uses `.filter(':visible')`. Subcategory tiles are `.subcategory-item` with title+href both on `a.subcategory-link` (`subcategoryBox`/`subcategoryTitle`/`subcategoryLink`). ADC HAS qty steppers (unlike BESTCA), no related carousel (`relatedCarousel: null`), and ships no recommendations script (`pdp.recentlyViewedProfile: null`). Footer is a distinct "footer-new" theme (see Footer theme drift). Lighthouse a11y floors in the high-60s/low-70s, so `lighthouse.thresholds.accessibility: 65`.
- **SearchSpring "Snap" theme drift (AAP)**: AAP (acudoraccesspanels.com) runs the Snap theme with `visitQuery: "redirect=disable"` required on every URL visit. Key deltas from ADC/BESTCA: flat category taxonomy — no child categories exist, so `plp.subcategory: null` skips the subcategory-page suite; mobile breadcrumbs hidden (`pdp.mobileBreadcrumbsHidden: true`); mobile nav is `#mySidenav` (same override as ADAP); no qty stepper buttons (`qtyIncrement`/`qtyDecrement: null`); related carousel is `.ss__recommendation--carousel`; product info form is `.product_form_wrap`; PDP description tab is `#tab-description`; pagination uses `?p=2` (same as ADC). Footer headings use U+2019 curly apostrophe (`what's in store`). **Known site deficiency (in progress)**: mobile header has a 23px hamburger icon and 12px logo link — below the 44px WCAG touch-target standard. AAP devs notified June 16 2026 with a CSS fix recommendation (`min-height: 44px` + `display:flex` on the hamburger and logo link selectors). Touch-target tests intentionally left failing until the fix ships. **Klaviyo popup**: the Klaviyo email-capture popup is deliberately not blocked (store-functional) but covers DOM elements during test runs — PLP product-card click (`plp.cy.js`) and discovery pagination click both use `{ force: true }` to bypass it. **Zoho floating-label template**: AAP Zoho forms use a floating-label overlay that covers all text inputs. `ZohoFormPage` base-class fill methods (`fillFirstName`, `fillLastName`, `fillCompany`, `fillEmail`) now all use `scrollIntoView().clear({ force: true }).type(v, { force: true })` — this change applies to all stores and is safe because forced typing still drives the real input and triggers Zoho client-side validation.
- **SearchSpring "Snap" theme drift (FSE)**: FSE (firesafetyequipment.com) runs the Snap theme. Footer nav links are direct `<a>` children of `.box` divs (no `<ul>`/`<li>` wrappers) → `branding.footer.navLinks: ".site-footer .box a"`. Copyright sits in `<div class="Copyright">` as a sibling of `.footer-bottom`, not inside it → `branding.footer.copyright: ".site-footer .Copyright p"`. Mobile breadcrumbs are `display:none` → `pdp.mobileBreadcrumbsHidden: true`. Pagination uses `?page=2` (same as BESTCA). No related carousel, no SS recently-viewed script. Homepage path is `/new-home/` (custom page-builder page). **Known site deficiencies (tests intentionally failing — devs notified June 17 2026)**: (1) `/new-home/` has no `<meta name="description">` tag — `seo.cy.js` "has a non-empty meta description" fails; FSE admin must add a meta description to the page in BigCommerce admin. (2) `grid-box-icon-1.jpg` in `section[data-image-gallery]` has no `alt` attribute — `images.cy.js` "all product gallery images have a non-empty alt attribute" fails; FSE admin must add alt text to the image in BigCommerce Media Manager.
- **BRH theme drift (bestroofhatches.com)**: BRH runs the same standard BigCommerce theme generation as BESTUS (`ul.productGrid`, `h1.page-heading`, `.breadcrumbs`) but with no SearchSpring — it uses native BC search (`/search.php?q=…`) and native BC sort (`#sort` select, `?sort=priceasc` query param → `discovery.sort.urlHash: null`). **Native BC search always returns results** (shows full catalog for any term, even nonsense) — no zero-result state exists → `discovery.search.noResultsTerm: null` skips the no-results test (gated via `itIfStore` in `discovery.cy.js`). Entirely quote-only catalog: no prices, no Add-to-Cart, no qty input, no lead-time widget (`pdp.quoteOnly: true` gates those four PDP tests in `pdp.cy.js` and `pdp.mobile.cy.js`; `qtyIncrement`/`qtyDecrement: null`, `cardPrice: null`). PLP main is `/aluminum/` (not `/products/`). Sidebar is `.sidebarBlock` (not `.categories-left`); no `#treeView` — `bestSellers` overridden to `.sidebarBlock a[href*="best-sellers"]`. No subcategory tiles (`subcategoryBox: null`). Mobile nav is `#mySidenav` (same override as ADAP/AAP). Mobile breadcrumbs hidden → `pdp.mobileBreadcrumbsHidden: true`. PDP: breadcrumbs `.breadcrumbs` (not `.breadcrumbs.new_breadcrumbs`), no `a.breadcrumb-home` (`breadcrumbHome: null`), gallery `section[data-image-gallery] img` (not `.thumbnail_image`), description `.productView-description` (not `.productView-description1`), no carousel/Yotpo/SS recently-viewed. Footer: root is plain `<footer>` (no `.tcsFooter`); headings mixed-case (`"What's In Store"`, `"SECURE SHOPPING"`, `"My Account"`, `"Contact Info"`); no `.Contact-info-box` — contact info in `footer .box:last-child`; phone links at `footer a[href^="tel:"]`; **no payment icons** — `paymentIcons: null` in footer config, gated via `itIfStore` in `homepage.cy.js` and `homepage.mobile.cy.js`. No Pro Club / Become Vendor / Architects forms. **Known site deficiency (tests intentionally failing)**: BRH products have no SKU configured in BigCommerce admin → `seo.cy.js` "has a JSON-LD Product block with name, sku, price, currency, and availability" fails (`assertProductJsonLd` requires `sku` to identify the site-rendered Product block). BRH admin must add SKUs (model numbers) to products in BigCommerce admin.
- **Lighthouse threshold drift**: `lighthouse.cy.js` merges the BESTUS-baseline `THRESHOLD_DEFAULTS` (`performance:50, accessibility:80, seo:70`) with a per-store top-level `lighthouse.thresholds` override; ADC lowers `accessibility` to 65 for its footer-new theme's real a11y deficiencies.
- **Currency drift**: `assertProductJsonLd` checks `offers.priceCurrency` against `branding.currency` (default `USD`); BESTCA and ADC (Canada) set `branding.currency: "CAD"`.
- Cypress cannot change `baseUrl` mid-run, so `scripts/run-all.js` spawns one `cypress run` process per store.
- **Site deficiency policy**: when a test fails because of a genuine site deficiency (missing SEO tag, missing image alt text, a11y violation, missing content) — do **not** skip (unless otherwise stated), gate, or comment out the test. Leave it failing as a visible signal in CI. Document the deficiency in the store's `_notes` in `stores/<code>.json`, add it to the store's Snap-drift or architecture entry in this file, and notify the responsible dev team. This keeps the dashboard honest and gives devs a concrete failing test to resolve. The Lighthouse thresholds override (`lighthouse.thresholds`) is the one sanctioned exception — it lowers the numeric floor for a whole page category, not an individual test, and is used only when the live scores are structurally below the default due to theme-level a11y issues rather than fixable content.

## Browser Baselines

All specs (except `lighthouse.cy.js`) are browser-agnostic and pass in both Chrome and Firefox. `lighthouse.cy.js` skips itself automatically when run in Firefox.

```bash
# Chrome baseline (default — also runs Lighthouse)
npx cypress run --browser chrome

# Firefox baseline (lighthouse.cy.js is skipped automatically)
npx cypress run --browser firefox
```

## Architecture

### Stub vs. Live Mode

By default, all Zoho form POST requests are intercepted and replaced with a fake success response. No real data reaches the CRM. Live mode requires **both** `LIVE_SUBMIT=true` and `I_KNOW_THIS_IS_LIVE=true` environment variables set simultaneously — this double-gate is intentional.

The `cy.interceptZoho(alias, urlPattern)` custom command handles this via `setupZohoIntercept()` in `cypress/support/utils/zohoIntercept.js`.

### Page Object Hierarchy

All form page objects extend `ZohoFormPage` (the base class in `cypress/support/pages/ZohoFormPage.js`), which provides common Zoho field selectors (`input[name="Name_First"]`, `input[name="Email"]`, etc.) and a `submit()` / `expectSuccess()` method.

Subclasses add form-specific fields:

- `ContactFormPage` — adds address fields, inquiry type dropdown, message textarea, and file attachment
- `QuoteFormPage` — adds model (`SingleLine1`), size (`SingleLine2`), quantity dropdown, address (`SingleLine3`)
- `ProClubFormPage` — adds address fields and country dropdown
- `ProductFormPage` — takes `site`, `productUrlOverride`, and `randomize` constructor args; uses `pickProduct()` to resolve the product URL; adds `fillDetails()` for the `MultiLine` textarea

### Custom Commands (`cypress/support/commands.js`)

- `cy.uniqueEmail()` — generates a timestamped test email from the store config's `testEmailTemplate`
- `cy.fillPersona(formPage, persona, email)` — duck-typed: calls fill methods on the page object only if they exist, so the same persona object works across all forms
- `cy.interceptZoho(alias, urlPattern)` — sets up stub or passthrough intercept based on env flags

### Spec Files (`cypress/e2e/`)

**Form tests** (all follow: `before()` loads fixtures → `beforeEach()` instantiates page → `describe('Happy path')` → `describe('Validation')`):

- `contact-form.cy.js` — submission success, payload validation, optional file attachment; validates inquiry type options and required fields
- `quote-form.cy.js` — submission success, payload validation; validates quantity options and required fields
- `pro-club-form.cy.js` — submission success, non-US country support, payload validation; validates country dropdown default and required fields
- `become-vendor-form.cy.js` — submission success, payload validation; minimal negative coverage (the only store with the form so far, ADAP at `/bvl1/`, uses a custom-built page posting to Zoho — no `zf-submitColor` button, details textarea named "Additional Details" — so client-side validation behavior is unconfirmed)
- `architect-form.cy.js` — submission success, payload validation, negative paths (empty/malformed required fields). (`/architects/`, standard Zoho form `ADCcaArchitects`); BESTUS, BESTCA, ADAP and the rest have no architects form, so their `forms.architectInquiries` stays `null` and the spec shows as skipped there.
- `product-form.cy.js` — submission success, payload validation; validates required fields including details textarea

**Page/layout tests:**

- `homepage.cy.js` — header/footer visibility, nav link health (no 404s), footer sections/contact info/payment icons/copyright/partner logos, phone number consistency, no console errors
- `homepage.mobile.cy.js` — 3 phones + 1 tablet (portrait + phone landscape); key elements, footer, contact info, payment icons, copyright, no horizontal overflow, mobile nav present, touch target sizes (≥44px phones, ≥24px tablets)
- `plp.cy.js` — heading, breadcrumb, sidebar categories, best sellers, subcategory boxes, product grid (image/title/price/link on first 3 cards), PDP navigation, pagination controls + JSON blob validity, sidebar category link health, no console errors
- `plp.mobile.cy.js` — same device matrix as homepage.mobile; heading, breadcrumb, product grid, product cards, subcategory boxes, sidebar DOM presence, no horizontal overflow, mobile nav, no console errors
- `pdp.cy.js` — picks a random URL from the store config's `pdp.popular` list each run; checks breadcrumbs, product title (`h1.productView-title`), price (`[data-product-price-without-tax]`), image gallery, quantity input + inc/dec buttons, Add to Cart button, PDF spec sheet links (open in `_blank`), description section, optional YouTube iframe, related products carousel (`.content-carousel .owl-carousel`), Yotpo reviews widget, SearchSpring recently-viewed script tag, product info request form fields, SKU, and lead time / stock status; no console errors
- `pdp.mobile.cy.js` — same 3 phones + 1 tablet device matrix as other mobile specs; portrait pass per device covers header visible, breadcrumbs, title, price, image gallery, qty input, Add to Cart, description, carousel, SKU, lead time, product info form, mobile nav DOM presence, no horizontal overflow, no console errors, touch target height (44px phones / 24px tablets); landscape pass for phones only covers title and no horizontal overflow
- `discovery.cy.js` — search (known term returns relevant products checked against `expectedTokens`; nonsense term shows a no-results message or an empty grid), category/refinement pages render, sort by price low-to-high verified by `assertSortApplied` (the URL hash becomes `#/ps:calculated_price:asc` AND the grid re-renders to a different order than the default) rather than by asserting numeric price order — the cheapest items are "Call for pricing" with no price and sort to the top, so the visible grid often shows no prices; numeric ascending order is only checked opportunistically if priced products happen to be visible. Pagination advances to page 2 (`pp=2`) with a different product set, PDP handoff from results; one console-error check on a category load. Cross-page logic lives in `checks.js` helpers (`performHeaderSearch`, `assertSearchResults`, `assertNoSearchResults`, `assertDiscoveryPage`, `applySortOption`, `assertSortApplied`, `assertPaginationAdvanced`)
- `discovery.mobile.cy.js` — same 3 phones + 1 tablet device matrix; per device, a category page (portrait) and a search-results page render with no horizontal overflow and no console errors

**SEO, accessibility & performance tests:**

- `seo.cy.js` — on homepage, PLP, and a random PDP: asserts `<title>` and `<meta name="description">` are present and non-empty; on PDP also validates the `Product` JSON-LD block (name, sku, description, image, price, currency, availability)
- `images.cy.js` — on a random PDP: asserts all product gallery images have non-empty `alt` attributes; on homepage and a random PDP: requests all same-domain images and asserts none return 4xx/5xx
- `lighthouse.cy.js` — Chrome only (auto-skipped in Firefox); runs Lighthouse on homepage, PLP, and a random PDP and fails if Performance < 50, Accessibility < 80, or SEO < 70. These BESTUS-baseline thresholds are overridable per store via the top-level `lighthouse.thresholds` in `stores/<code>.json` — ADC's "footer-new" theme has real accessibility deficiencies (live scores high-60s/low-70s) so it sets `accessibility: 65`

### Fixtures and Store Configs

- `stores/<code>.json` (NOT a Cypress fixture — loaded by Node in `cypress.config.js`) — canonical per-store source for base URL, `homePath`/`visitQuery` quirks, branding text, PLP paths/labels, form paths, Zoho submit URL glob patterns, product URLs (`products.known`), PDP URLs (`pdp.popular`), discovery inputs (`discovery`: search terms/`expectedTokens`, representative `categories`, `mobileCategory`, `multiPageCategory`, and `sort` label/param/value), and `testEmailTemplate`
- `personas.json` — fake customer data used as form input; `primary` is the only persona currently defined; store-agnostic and shared by all stores

### Environment Variables

| Variable              | Purpose                                                                  |
| --------------------- | ------------------------------------------------------------------------ |
| `STORE`               | Which store to run against (a filename from `stores/`, default `bestus`) |
| `LIVE_SUBMIT`         | Set to `true` to allow real form submissions                             |
| `I_KNOW_THIS_IS_LIVE` | Must also be `true` to enable live mode (second safety gate)             |
| `PRODUCT_URL`         | Override which product page the product-form tests use                   |
| `RANDOMIZE_PRODUCT`   | Pick a random URL from the store config's `products.known` list          |

### Global Setup (`cypress/support/e2e.js`)

Runs before every test: imports `cypress-real-events`, calls `blockThirdParty()` (from `checks.js`) to stub ~17 third-party analytics/ad/tracking vendors with an empty 204 — GA, GTM, GA Connector, Zoho PageSense, Meta, Reddit, Spotify, Taboola, leadsy, iovation, Geotargetly, Affiliatly, plus SearchSpring's tracking beacons and the Zoho SalesIQ chat widget — and suppresses uncaught exceptions from third-party scripts so they don't fail tests. The block list was derived by auditing every host the live site loads; store-functional vendors (SearchSpring search API, Yotpo reviews, Zoho forms, PayPal, fonts, library CDNs, Klaviyo) are deliberately left loaded. See the `blockThirdParty()` doc comment in `checks.js` for the rationale.

### Anti-automation Countermeasures (`cypress.config.js`)

Chrome launches with a spoofed user-agent and `--disable-blink-features=AutomationControlled` to avoid bot-detection on the live site. Timeouts are set conservatively (15s default command, 60s page load, 30s response) to account for real network latency. Default viewport is 1920×1080.

### Payload Inspection Pattern

When verifying that form values are actually sent, tests use `getMultipartField(body, fieldName)` from `cypress/support/utils/getMultipartField.js` to parse the multipart/form-data request body from the intercepted Zoho POST.

### Mobile Testing Pattern

Mobile specs use `cy.viewport(width, height)` per device in `beforeEach`. The `footer.tcsFooter` element and `.categories-left` sidebar are `display:none` on mobile — tests assert DOM presence rather than visibility for these. Touch target tests use `cypress-real-events` (`cy.realHover()`) and check computed sizes against thresholds (44px for phones, 24px for tablets).

### Adding a New Form Test (see `architect-form.cy.js` / `ArchitectFormPage.js` for a recent example)

1. Create a page object in `cypress/support/pages/` extending `ZohoFormPage`; read its `path` from `getStore().forms.<name>.path` (`ArchitectFormPage.js` is the minimal case — just a few extra field methods; `BecomeVendorFormPage.js` overrides `submit()` for a custom-built form)
2. Fill the form's `{ path, submitUrlPattern }` in each store's `stores/<code>.json` that has the form (the `forms.architectInquiries` slot already exists as `null`); leave it `null` for stores without it
3. Create a spec in `cypress/e2e/` following the existing pattern: module-level `const site = getStore()`, outer `describeIfStore(site.forms && site.forms.<name>, ...)` gate, `before()` loads the personas fixture, `beforeEach()` instantiates the page, `describe('Happy path')` covers success + payload, `describe('Validation')` covers empty/malformed fields

### Adding a New Page/Layout Test

1. Create a spec in `cypress/e2e/` — no page object needed for read-only page checks
2. Read store data via `getStore()` from `cypress/support/store.js` at module level; gate the suite with `describeIfStore` on the config section it needs, and use `storePath()`/`homePath()` for visits so per-store quirks apply
3. For a matching mobile spec, reuse the same device matrix defined in the existing mobile specs
4. Block analytics and suppress third-party exceptions via the global `e2e.js` setup (already applied automatically)

### Onboarding a Scaffolded Store

1. Open the store's `stores/<code>.json` — the `_todo` key lists what's missing
2. Verify `branding.copyrightText` (and optionally `footerLocationText`, `warehousesLink`, `partnerLinks`) against the live footer
3. Fill `plp`, `products`, `forms`, `discovery`, and `pdp` using `stores/bestus.json` as the reference shape — each section you fill automatically enables its specs on the next run
4. For non-English stores (PDA), all user-visible text values in the config must be the localized strings from the live site
