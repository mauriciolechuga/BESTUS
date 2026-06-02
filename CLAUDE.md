# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A Cypress end-to-end test suite that verifies customer-facing forms and pages on [bestaccessdoors.com](https://www.bestaccessdoors.com) are working correctly. Tests run against the live website. No application code lives here — only test code.

## Commands

```bash
# Install dependencies (once)
npm install

# Run all tests headlessly (stub mode — no real leads created)
npx cypress run

# Run a single spec file
npx cypress run --spec "cypress/e2e/contact-form.cy.js"

# Open interactive Cypress app
npx cypress open

# Live submission mode (creates real Zoho CRM leads — use sparingly)
LIVE_SUBMIT=true I_KNOW_THIS_IS_LIVE=true npx cypress run
```

Note: `package.json` has no `scripts` section, so the `npm test` / `npm run open` commands in the README will not work. Use `npx cypress` directly.

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

- `cy.uniqueEmail()` — generates a timestamped test email from `site.json`'s `testEmailTemplate`
- `cy.fillPersona(formPage, persona, email)` — duck-typed: calls fill methods on the page object only if they exist, so the same persona object works across all forms
- `cy.interceptZoho(alias, urlPattern)` — sets up stub or passthrough intercept based on env flags

### Spec Files (`cypress/e2e/`)

**Form tests** (all follow: `before()` loads fixtures → `beforeEach()` instantiates page → `describe('Happy path')` → `describe('Validation')`):
- `contact-form.cy.js` — submission success, payload validation, optional file attachment; validates inquiry type options and required fields
- `quote-form.cy.js` — submission success, payload validation; validates quantity options and required fields
- `pro-club-form.cy.js` — submission success, non-US country support, payload validation; validates country dropdown default and required fields
- `product-form.cy.js` — submission success, payload validation; validates required fields including details textarea

**Page/layout tests:**
- `homepage.cy.js` — header/footer visibility, nav link health (no 404s), footer sections/contact info/payment icons/copyright/partner logos, phone number consistency, no console errors
- `homepage.mobile.cy.js` — 6 phones + 4 tablets (portrait + phone landscape); key elements, footer, contact info, payment icons, copyright, no horizontal overflow, mobile nav present, touch target sizes (≥44px phones, ≥24px tablets)
- `plp.cy.js` — heading, breadcrumb, sidebar categories, best sellers, subcategory boxes, product grid (image/title/price/link on first 3 cards), PDP navigation, pagination controls + JSON blob validity, sidebar category link health, no console errors
- `plp.mobile.cy.js` — same device matrix as homepage.mobile; heading, breadcrumb, product grid, product cards, subcategory boxes, sidebar DOM presence, no horizontal overflow, mobile nav, no console errors
- `pdp.cy.js` — picks a random URL from `site.json`'s `pdp.popular` list each run; checks breadcrumbs, product title (`h1.productView-title`), price (`[data-product-price-without-tax]`), image gallery, quantity input + inc/dec buttons, Add to Cart button, PDF spec sheet links (open in `_blank`), description section, optional YouTube iframe, related products carousel (`.content-carousel .owl-carousel`), Yotpo reviews widget, SearchSpring recently-viewed script tag, product info request form fields, SKU, and lead time / stock status; no console errors
- `pdp.mobile.cy.js` — same 6 phones + 4 tablets device matrix as other mobile specs; portrait pass per device covers header visible, breadcrumbs, title, price, image gallery, qty input, Add to Cart, description, carousel, SKU, lead time, product info form, mobile nav DOM presence, no horizontal overflow, no console errors, touch target height (44px phones / 24px tablets); landscape pass for phones only covers title and no horizontal overflow
- `discovery.cy.js` — search (known term returns relevant products checked against `expectedTokens`; nonsense term shows a no-results message or an empty grid), category/refinement pages render, sort by price low-to-high verified by `assertSortApplied` (the URL hash becomes `#/ps:calculated_price:asc` AND the grid re-renders to a different order than the default) rather than by asserting numeric price order — the cheapest items are "Call for pricing" with no price and sort to the top, so the visible grid often shows no prices; numeric ascending order is only checked opportunistically if priced products happen to be visible. Pagination advances to page 2 (`pp=2`) with a different product set, PDP handoff from results; one console-error check on a category load. Cross-page logic lives in `checks.js` helpers (`performHeaderSearch`, `assertSearchResults`, `assertNoSearchResults`, `assertDiscoveryPage`, `applySortOption`, `assertSortApplied`, `assertPaginationAdvanced`)
- `discovery.mobile.cy.js` — same 6 phones + 4 tablets device matrix; per device, a category page (portrait) and a search-results page render with no horizontal overflow and no console errors

**SEO, accessibility & performance tests:**
- `seo.cy.js` — on homepage, PLP, and a random PDP: asserts `<title>` and `<meta name="description">` are present and non-empty; on PDP also validates the `Product` JSON-LD block (name, sku, description, image, price, currency, availability)
- `images.cy.js` — on a random PDP: asserts all product gallery images have non-empty `alt` attributes; on homepage and a random PDP: requests all same-domain images and asserts none return 4xx/5xx
- `lighthouse.cy.js` — Chrome only (auto-skipped in Firefox); runs Lighthouse on homepage, PLP, and a random PDP and fails if Performance < 50, Accessibility < 80, or SEO < 70

### Fixtures

- `site.json` — canonical source for base URL, form paths, Zoho submit URL glob patterns, product URLs (`products.known`), PDP URLs (`pdp.popular`), discovery inputs (`discovery`: search terms/`expectedTokens`, representative `categories`, `mobileCategory`, `multiPageCategory`, and `sort` label/param/value), and `testEmailTemplate`
- `personas.json` — fake customer data used as form input; `primary` is the only persona currently defined

### Environment Variables

| Variable | Purpose |
|---|---|
| `LIVE_SUBMIT` | Set to `true` to allow real form submissions |
| `I_KNOW_THIS_IS_LIVE` | Must also be `true` to enable live mode (second safety gate) |
| `PRODUCT_URL` | Override which product page the product-form tests use |
| `RANDOMIZE_PRODUCT` | Pick a random URL from `site.json`'s `products.known` list |

### Global Setup (`cypress/support/e2e.js`)

Runs before every test: imports `cypress-real-events`, calls `blockThirdParty()` (from `checks.js`) to stub ~17 third-party analytics/ad/tracking vendors with an empty 204 — GA, GTM, GA Connector, Zoho PageSense, Meta, Reddit, Spotify, Taboola, leadsy, iovation, Geotargetly, Affiliatly, plus SearchSpring's tracking beacons and the Zoho SalesIQ chat widget — and suppresses uncaught exceptions from third-party scripts so they don't fail tests. The block list was derived by auditing every host the live site loads; store-functional vendors (SearchSpring search API, Yotpo reviews, Zoho forms, PayPal, fonts, library CDNs, Klaviyo) are deliberately left loaded. See the `blockThirdParty()` doc comment in `checks.js` for the rationale.

### Anti-automation Countermeasures (`cypress.config.js`)

Chrome launches with a spoofed user-agent and `--disable-blink-features=AutomationControlled` to avoid bot-detection on the live site. Timeouts are set conservatively (15s default command, 60s page load, 30s response) to account for real network latency. Default viewport is 1920×1080.

### Payload Inspection Pattern

When verifying that form values are actually sent, tests use `getMultipartField(body, fieldName)` from `cypress/support/utils/getMultipartField.js` to parse the multipart/form-data request body from the intercepted Zoho POST.

### Mobile Testing Pattern

Mobile specs use `cy.viewport(width, height)` per device in `beforeEach`. The `footer.tcsFooter` element and `.categories-left` sidebar are `display:none` on mobile — tests assert DOM presence rather than visibility for these. Touch target tests use `cypress-real-events` (`cy.realHover()`) and check computed sizes against thresholds (44px for phones, 24px for tablets).

### Adding a New Form Test

1. Create a page object in `cypress/support/pages/` extending `ZohoFormPage`
2. Add the form path and `submitUrlPattern` to `site.json` under `forms`
3. Create a spec in `cypress/e2e/` following the existing pattern: `before()` loads fixtures, `beforeEach()` instantiates the page, `describe('Happy path')` covers success + payload, `describe('Validation')` covers empty/malformed fields

### Adding a New Page/Layout Test

1. Create a spec in `cypress/e2e/` — no page object needed for read-only page checks
2. For a matching mobile spec, reuse the same device matrix defined in the existing mobile specs
3. Block analytics and suppress third-party exceptions via the global `e2e.js` setup (already applied automatically)
