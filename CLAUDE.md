# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A Cypress end-to-end test suite that verifies customer-facing forms on [bestaccessdoors.com](https://www.bestaccessdoors.com) are working correctly. Tests run against the live website. No application code lives here — only test code.

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

## Architecture

### Stub vs. Live Mode

By default, all Zoho form POST requests are intercepted and replaced with a fake success response. No real data reaches the CRM. Live mode requires **both** `LIVE_SUBMIT=true` and `I_KNOW_THIS_IS_LIVE=true` environment variables set simultaneously — this double-gate is intentional.

The `cy.interceptZoho(alias, urlPattern)` custom command handles this via `setupZohoIntercept()` in `cypress/support/utils/zohoIntercept.js`.

### Page Object Hierarchy

All form page objects extend `ZohoFormPage` (the base class in `cypress/support/pages/ZohoFormPage.js`), which provides common Zoho field selectors (`input[name="Name_First"]`, `input[name="Email"]`, etc.) and a `submit()` / `expectSuccess()` method.

Subclasses add form-specific fields:
- `ContactFormPage` — adds address fields, inquiry type dropdown, file attachment
- `QuoteFormPage` — adds model, size, quantity, address
- `ProClubFormPage` — adds address fields and country dropdown
- `ProductFormPage` — takes `site`, `productUrlOverride`, and `randomize` constructor args; uses `pickProduct()` to resolve the product URL

### Custom Commands (`cypress/support/commands.js`)

- `cy.uniqueEmail()` — generates a timestamped test email from `site.json`'s `testEmailTemplate`
- `cy.fillPersona(formPage, persona, email)` — duck-typed: calls fill methods on the page object only if they exist, so the same persona object works across all forms
- `cy.interceptZoho(alias, urlPattern)` — sets up stub or passthrough intercept based on env flags

### Fixtures

- `site.json` — canonical source for URLs, form paths, and Zoho submit URL glob patterns
- `personas.json` — fake customer data used as form input; `primary` is the only persona currently defined

### Environment Variables

| Variable | Purpose |
|---|---|
| `LIVE_SUBMIT` | Set to `true` to allow real form submissions |
| `I_KNOW_THIS_IS_LIVE` | Must also be `true` to enable live mode (second safety gate) |
| `PRODUCT_URL` | Override which product page the product-form tests use |
| `RANDOMIZE_PRODUCT` | Pick a random URL from `site.json`'s `products.known` list |

### Global Setup (`cypress/support/e2e.js`)

Runs before every test: blocks Google Analytics / Tag Manager requests (returns 204), and suppresses uncaught exceptions from third-party scripts so they don't fail tests.

### Anti-automation Countermeasures (`cypress.config.js`)

Chrome launches with a spoofed user-agent and `--disable-blink-features=AutomationControlled` to avoid bot-detection on the live site. Timeouts are set conservatively (15s default command, 60s page load) to account for real network latency.

### Payload Inspection Pattern

When verifying that form values are actually sent, tests use `getMultipartField(body, fieldName)` from `cypress/support/utils/getMultipartField.js` to parse the multipart/form-data request body from the intercepted Zoho POST.

### Adding a New Form Test

1. Create a page object in `cypress/support/pages/` extending `ZohoFormPage`
2. Add the form path and `submitUrlPattern` to `site.json` under `forms`
3. Create a spec in `cypress/e2e/` following the existing pattern: `before()` loads fixtures, `beforeEach()` instantiates the page, `describe('Happy path')` covers success + payload, `describe('Validation')` covers empty/malformed fields
