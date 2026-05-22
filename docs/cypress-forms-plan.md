# Cypress Forms Testing — Implementation Plan

**Project:** `forms-bestaccessdoors`
**Target site:** https://www.bestaccessdoors.com
**Scope:** End-to-end Cypress tests for four public-facing forms.

---

## 1. Scope

### Forms in scope

| Form | URL | Notes |
|---|---|---|
| Product information form | Embedded on each product page, section *"Have a product question?"* | Unique per product; we use a configurable default. |
| Contact Us | `/contact-us/` | Includes optional file upload. |
| Request a Quote | `/request-a-quote/` | Includes quantity dropdown. |
| Pro Club Application | `/pro-club-application/` | Full address block with country dropdown. |

All four forms post to `forms.zohopublic.com` and share the same Zoho field naming conventions (`Name_First`, `Name_Last`, `SingleLine`, `Email`, `PhoneNumber_countrycode`, etc.), which enables a shared Page Object base class.

### Default product
/24-x-24-fire-rated-insulated-access-door-with-exposed-flange/

Tests run against this product by default. Override via env var or rotate through a list (see §6).

### Out of scope (v1)

- Checkout / add-to-cart flows.
- Login or `testAccount` usage.
- Accessibility audits (`cypress-axe` can be added later).
- CAPTCHA bypass (none observed at time of planning).
- `becomeVendor` and `architectInquiries` forms — placeholders in fixtures only.

---

## 2. Tech stack

- **Cypress 13.x** (latest stable line)
- **TypeScript**
- **Node 20 LTS**
- **ESLint** + **Prettier** + `eslint-plugin-cypress`
- Mocha `describe` / `it` titles written in plain business English so non-technical users can read the runner output.

---

## 3. Repository layout
forms-bestaccessdoors/
├─ cypress.config.ts
├─ package.json
├─ tsconfig.json
├─ .env.example
├─ README.md
└─ cypress/
├─ e2e/
│  ├─ product-form.cy.ts
│  ├─ contact-form.cy.ts
│  ├─ quote-form.cy.ts
│  └─ pro-club-form.cy.ts
├─ fixtures/
│  ├─ site.json
│  ├─ personas.json
│  └─ files/sample.pdf          # TODO: add before running Contact upload test
├─ support/
│  ├─ e2e.ts
│  ├─ commands.ts
│  ├─ pages/
│  │  ├─ ZohoFormPage.ts        # base class — shared field helpers
│  │  ├─ ProductFormPage.ts
│  │  ├─ ContactFormPage.ts
│  │  ├─ QuoteFormPage.ts
│  │  └─ ProClubFormPage.ts
│  └─ utils/
│     ├─ uniqueEmail.ts
│     ├─ pickProduct.ts
│     └─ zohoIntercept.ts
└─ tsconfig.json

---

## 4. Confirmed form fields

### 4.1 Product information form (`BEST - Product Form`)

Submits to:
`https://forms.zohopublic.com/bestaccessdoors/form/BESTProductForm/formperma/.../htmlRecords/submit`

| Field | Selector | Required | Label |
|---|---|---|---|
| First name | `input[name="Name_First"]` | yes | Name → First |
| Last name | `input[name="Name_Last"]` | yes | Name → Last |
| Company | `input[name="SingleLine"]` | yes | Company |
| Phone | `input[name="PhoneNumber_countrycode"]` | no | Phone → Number |
| Email | `input[name="Email"]` | yes | Email |
| Details | `textarea[name="MultiLine"]` | yes | Details |
| Lead Website | `input[name="SingleLine2"]` | yes (likely auto-filled) | Lead Website |
| Hidden tracking | `zf_*`, `utm_*`, `referrername` | — | — |

### 4.2 Contact Us form

Inquiry type dropdown (`Sales & Products` / `Customer Service & Existing Orders`), name, company, email, phone, full address block, multi-line message, file upload, submit.

### 4.3 Request a Quote form

Name, company, email, phone, model, size, quantity dropdown (`I don't know`, `1`, `2`, `3`, `4`, `5+`), shipping field, submit. Includes hidden UTM fields.

### 4.4 Pro Club Application form

Name, company, email, phone, full address block (`Address_AddressLine1/2/City/Region/ZipCode`), `Address_Country` dropdown, submit.

---

## 5. Fixtures

### 5.1 `cypress/fixtures/site.json`

One file per store. Portable: replicating for a new store = copy repo + edit this file.

```json
{
  "baseUrl": "https://www.bestaccessdoors.com",
  "products": {
    "default": "/24-x-24-fire-rated-insulated-access-door-with-exposed-flange/",
    "known": [
      "/24-x-24-fire-rated-insulated-access-door-with-exposed-flange/"
    ]
  },
  "forms": {
    "productInfo": {
      "path": "default-product",
      "submitUrlPattern": "**/forms.zohopublic.com/**/BESTProductForm/**/submit"
    },
    "quoteRequest": {
      "path": "/request-a-quote/",
      "submitUrlPattern": "**/forms.zohopublic.com/**/submit"
    },
    "contact": {
      "path": "/contact-us/",
      "submitUrlPattern": "**/forms.zohopublic.com/**/submit"
    },
    "proClub": {
      "path": "/pro-club-application/",
      "submitUrlPattern": "**/forms.zohopublic.com/**/submit"
    },
    "becomeVendor": null,
    "architectInquiries": null
  },
  "testEmailTemplate": "mauricio+{ts}@bestaccessdoors.com"
}
```

### 5.2 `cypress/fixtures/personas.json`

Fake users Sales/CS recognize. Email is **not** stored here — generated at runtime.

```json
{
  "primary": {
    "firstName": "Mauricio",
    "lastName": "Testing",
    "company": "Testing LLC",
    "phone": "+15551234567",
    "address1": "123 Test Lane",
    "address2": "",
    "city": "Waterloo",
    "region": "ON",
    "zip": "N2L4T8",
    "country": "Canada",
    "details": "Automated test submission — please ignore."
  }
}
```

---

## 6. Environment flags

Documented in `.env.example` and `README.md`.

| Variable | Default | Effect |
|---|---|---|
| `CYPRESS_LIVE_SUBMIT` | `false` | `true` → real submission to Zoho (spy mode). `false` → stubbed 200 response. |
| `CYPRESS_I_KNOW_THIS_IS_LIVE` | `false` | Safety guard. Required alongside `CYPRESS_LIVE_SUBMIT=true` to prevent accidental CI floods. |
| `CYPRESS_PRODUCT_URL` | unset | If set, overrides the default product URL. |
| `CYPRESS_RANDOMIZE_PRODUCT` | `false` | If `true`, picks a random entry from `products.known`. Ignored if `CYPRESS_PRODUCT_URL` is set. |

`pickProduct()` precedence: explicit env var → random (if enabled) → default.

---

## 7. Hybrid `cy.intercept` strategy

The same helper (`utils/zohoIntercept.ts`) backs every spec. It switches between **spy** (live submit) and **stub** (default).

```ts
export function setupZohoIntercept(alias: string, urlPattern: string) {
  const live =
    Cypress.env('LIVE_SUBMIT') === true &&
    Cypress.env('I_KNOW_THIS_IS_LIVE') === true;

  if (live) {
    cy.intercept('POST', urlPattern).as(alias); // real request, real response
  } else {
    cy.intercept('POST', urlPattern, {
      statusCode: 200,
      body: '<html>OK</html>',
      headers: { 'content-type': 'text/html' }
    }).as(alias);
  }
}
```

Every happy-path test asserts:

1. **Payload** — the request body contains the expected fields and the timestamped email.
2. **Response code** — `200` or `302` (Zoho 302-redirects to its thank-you page on success).
3. **User-visible success** — a regex match against the page's thank-you message: `/thank you|received|we'll be in touch/i`. Pinned to exact text after first live run.

Negative-path tests assert **no network request fires**: `cy.get('@submit.all').should('have.length', 0)`.

---

## 8. Page Object design

`ZohoFormPage` is an abstract base class providing the field helpers shared across all four forms:

```ts
abstract class ZohoFormPage {
  abstract path: string;
  abstract submitUrlPattern: string;

  visit()                 { cy.visit(this.path); return this; }
  fillFirstName(v: string){ cy.get('input[name="Name_First"]').type(v); return this; }
  fillLastName(v: string) { cy.get('input[name="Name_Last"]').type(v); return this; }
  fillEmail(v: string)    { cy.get('input[name="Email"]').type(v); return this; }
  fillPhone(v: string)    { cy.get('input[name="PhoneNumber_countrycode"]').type(v); return this; }
  fillCompany(v: string)  { cy.get('input[name="SingleLine"]').first().type(v); return this; }
  submit()                { cy.get('button[type="submit"]').click(); return this; }
  expectSuccess()         { cy.contains(/thank you|received|we'll be in touch/i).should('be.visible'); return this; }
}
```

Subclasses add the form-specific bits:

- **ProductFormPage** — `fillDetails()`; `visit()` calls `pickProduct()` to resolve which URL to load.
- **ContactFormPage** — `selectInquiryType()`, `fillMessage()`, `attachFile()`, full address block.
- **QuoteFormPage** — `fillModel()`, `fillSize()`, `selectQuantity()`, shipping field.
- **ProClubFormPage** — full address block + `selectCountry()`.

---

## 9. Custom Cypress commands (`support/commands.ts`)

- `cy.uniqueEmail()` → `mauricio+<Date.now()>@bestaccessdoors.com`
- `cy.fillPersona(formPage, persona)` → walks the page object's `fill*` methods with fixture data
- `cy.interceptZoho(alias, pattern)` → wraps `setupZohoIntercept`

These keep each `it` block short and readable.

---

## 10. Test matrix

Every spec follows the same readable shape so non-technical viewers can understand the runner output.

### 10.1 Product form (`product-form.cy.ts`)
describe('Product information form', () => {
describe('Happy path', () => {
it('submits successfully with all required fields filled');
it('sends the user-entered values in the request payload');
});
describe('Validation (negative paths)', () => {
it('shows an error when First Name is empty');
it('shows an error when Last Name is empty');
it('shows an error when Company is empty');
it('shows an error when Email is empty');
it('shows an error when Email is malformed');
it('shows an error when Details are empty');
it('does not submit the form when validation fails');
});
});

### 10.2 Contact form (`contact-form.cy.ts`)

Same shape as above, plus:

- `it('accepts an optional file attachment')` — uses `cypress/fixtures/files/sample.pdf` + `cy.selectFile()`.
- `it('lists both inquiry types in the dropdown')`.

### 10.3 Quote form (`quote-form.cy.ts`)

Same shape, plus:

- `it('lists the expected quantity options', () => { ... ['I don't know','1','2','3','4','5+'] })`.

### 10.4 Pro Club form (`pro-club-form.cy.ts`)

Same shape, plus:

- `it('submits successfully with a non-US country selected')`.
- `it('defaults the country dropdown to the placeholder selection')`.

---

## 11. NPM scripts

```json
{
  "scripts": {
    "test": "cypress run",
    "open": "cypress open",
    "test:live": "CYPRESS_LIVE_SUBMIT=true CYPRESS_I_KNOW_THIS_IS_LIVE=true cypress run",
    "lint": "eslint . --ext .ts"
  }
}
```

---

## 12. README contents (for Sales/CS runners)

The `README.md` is written for non-technical users and includes:

1. One-paragraph "what this does."
2. Install: `npm install`.
3. Run all tests headless: `npm test`.
4. Run interactively: `npm run open`, then click a spec.
5. Run a real live submission (weekly smoke): `npm run test:live`.
6. Temporarily target a different product: `CYPRESS_PRODUCT_URL=/some-other-product/ npm test`.
7. Add a new product to the rotation: edit `cypress/fixtures/site.json` → `products.known`.
8. Replicate for a new store: copy the repo, edit `cypress/fixtures/site.json`.
9. Troubleshooting:
   - Email blocked → already handled via timestamp.
   - Thank-you message changed → update the regex in `ZohoFormPage.expectSuccess`.
   - Zoho form moved → update the relevant `submitUrlPattern` in `site.json`.

---

## 13. Known unknowns to resolve during implementation

These don't block the plan; Claude Code should resolve them on first run and update the code/docs accordingly.

1. **`SingleLine2` ("Lead Website") on the Product form** — labeled required but may be auto-filled by JS with the current URL. Verify at runtime; if user-visible, treat as required and add to persona.
2. **Exact thank-you wording / redirect URL** — first live run will reveal it. Pin the assertion to that exact string afterward.
3. **Phone format compatibility** — persona uses `+15551234567`. Verify Zoho accepts the leading `+`; fall back to `5551234567` if not.

---

## 14. Acceptance criteria

- `npm test` runs all four specs green against production with stubbed submissions.
- `npm run test:live` runs all four specs green with real Zoho submissions; resulting test leads visible in Zoho with `mauricio+<ts>@bestaccessdoors.com`.
- A new product URL can be added/swapped without touching any `.ts` file.
- A new store can be onboarded by editing only `cypress/fixtures/site.json`.
- All `describe`/`it` titles are readable as plain English by a non-developer.