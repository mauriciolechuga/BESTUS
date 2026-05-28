# BESTUS — Automated Testing for BestAccessDoors.com

This project automatically checks that the customer-facing forms and key pages on [bestaccessdoors.com](https://www.bestaccessdoors.com) are working correctly. It acts like a robot customer: it opens the website, fills out forms, clicks submit, and verifies that everything behaves as expected — all without a human having to do it by hand.

---

## Why This Exists

When a form breaks on the website — say, the "Request a Quote" button stops working — real customers can't reach the sales team. These tests catch those problems early, before anyone notices, so they can be fixed quickly.

Running the tests takes a few minutes instead of an hour of manual clicking. And because they run the same way every time, nothing gets accidentally skipped.

---

## What Gets Tested

### Forms

| Form | Where to find it | What it does |
|------|-----------------|--------------|
| **Product Information** | On individual product pages | Lets customers ask a question about a specific product |
| **Contact Us** | `/contact-us/` | General inquiries, supports optional file attachment |
| **Request a Quote** | `/request-a-quote/` | Customers request pricing for a product |
| **Pro Club Application** | `/pro-club-application/` | Contractors and resellers apply for trade pricing |

For each form, the tests verify:
- The form submits successfully when filled out correctly
- The right information is actually sent when the form is submitted
- Error messages appear when required fields are left blank
- Error messages appear when an email address is typed in the wrong format

### Pages

| Page | What's checked |
|------|---------------|
| **Homepage** | Header/footer links work (no broken links), phone number is consistent, no browser errors |
| **Homepage (mobile)** | Layout looks correct on 6 phone sizes and 4 tablet sizes, nothing overflows, touch targets are large enough to tap |
| **Product Listing Page (PLP)** | Product grid loads, cards have images/titles/prices/links, pagination works, sidebar categories link correctly |
| **PLP (mobile)** | Same device range as homepage mobile — grid, cards, and sidebar all present |
| **Product Detail Page (PDP)** | Breadcrumbs, title, price, images, qty input, Add to Cart, PDF spec links, description, video, related products carousel, Yotpo reviews widget, product info form, SKU, lead time |
| **PDP (mobile)** | Same 6 phones + 4 tablets device matrix; title, price, images, qty, Add to Cart, description, carousel, form, SKU, lead time, mobile nav, no horizontal overflow, touch targets, no console errors; landscape pass for phones |

---

## Requirements

You need **Node.js** installed on your computer. Node.js is a tool that lets you run JavaScript programs outside of a web browser — it's what powers the test runner.

**To check if you already have it:**

Open a terminal (on Windows: press `Win + R`, type `cmd`, press Enter) and run:

```
node --version
```

If you see a version number like `v20.11.0`, you're good. If you get an error, download and install Node.js from [nodejs.org](https://nodejs.org) — choose the "LTS" (recommended) version.

---

## Setup

**Do this once** after downloading the project:

1. Open a terminal and navigate to the folder where you downloaded this project:
   ```
   cd "path/to/BESTUS"
   ```

2. Install the project's dependencies (this downloads Cypress and other tools):
   ```
   npm install
   ```

   This may take a minute or two. You only need to do it once (or again if the project's dependencies change).

---

## Running the Tests

> **Note:** The `npm` shortcuts below are configured in `package.json`. You can also call `npx cypress` directly if you prefer.

### Option 1 — Fast & Safe (recommended for daily use)

```
npm test
```

This runs all tests in the background (no browser window opens). It does **not** submit real forms — it intercepts the form submissions and fakes a successful response so no leads are created in the CRM.

Best for: quickly checking that nothing is broken.

### Option 2 — Interactive (watch the tests run)

```
npm run test:open
```

This opens the Cypress app where you can pick which tests to run and watch them execute in a real browser window. Useful when you want to see exactly what's happening or when debugging a failing test.

### Option 3 — Run a single test file

```
npm test -- --spec "cypress/e2e/contact-form.cy.js"
```

### Option 4 — Live Submission (weekly smoke test only)

```
npm run test:live
```

This runs the tests and submits **real forms** to the CRM. Use this sparingly — it creates actual leads in Zoho. Both environment variables must be set at the same time as a double safety gate against accidental use.

---

## Reading the Results

After running `npx cypress run`, you'll see a summary like this:

```
  5 passing (12s)
  1 failing

  1) Contact Form > shows error when email is blank
     AssertionError: expected element to be visible
```

- **passing** — tests that worked correctly
- **failing** — tests that found a problem (the name tells you which form/page and what failed)

If any tests fail, Cypress automatically saves a **screenshot** of the browser at the moment of failure. You can find these in the `cypress/screenshots/` folder.

Video recordings of each test run are saved to `cypress/videos/`.

---

## Project Structure

```
BESTUS/
├── cypress.config.js              Configuration (which website to test, timeouts, etc.)
│
├── cypress/
│   ├── e2e/                       The actual tests
│   │   ├── homepage.cy.js         Checks the homepage header and footer
│   │   ├── homepage.mobile.cy.js  Checks the homepage on phones and tablets
│   │   ├── plp.cy.js              Checks the product listing page
│   │   ├── plp.mobile.cy.js       Checks the product listing page on phones and tablets
│   │   ├── pdp.cy.js              Checks the product detail page
│   │   ├── pdp.mobile.cy.js       Checks the product detail page on phones and tablets
│   │   ├── product-form.cy.js     Tests the Product Information form
│   │   ├── contact-form.cy.js     Tests the Contact Us form
│   │   ├── quote-form.cy.js       Tests the Request a Quote form
│   │   └── pro-club-form.cy.js    Tests the Pro Club Application form
│   │
│   ├── fixtures/                  Test data (fake customer info, URLs, etc.)
│   │   ├── site.json              Website URLs and form submission patterns
│   │   ├── personas.json          Fake customer profiles used during testing
│   │   └── files/                 Sample files used to test file upload
│   │
│   └── support/                   Shared helper code (reused across tests)
│       ├── pages/                 Page Objects — one per form, handles form interactions
│       ├── utils/                 Utility functions (email generation, URL picking, etc.)
│       ├── commands.js            Custom test shortcuts
│       └── e2e.js                 Global setup (runs before every test)
```

---

## Glossary

**End-to-end test** — A test that simulates a real user interacting with the actual website, from start to finish (as opposed to testing individual pieces of code in isolation).

**Headless** — Running a browser without a visible window. The tests work exactly the same but faster, since nothing needs to be drawn on screen.

**Fixture** — A file containing test data (like a fake customer's name and email) that tests use as input.

**Stub** — A fake response. When tests run in stub mode, form submissions are intercepted before reaching Zoho and replaced with a fake "success" response. This means no real data is sent anywhere.

**Page Object** — A reusable piece of code that knows how to interact with a specific form (find the fields, fill them in, click submit). Test files use these instead of repeating the same steps.

**CRM** — Customer Relationship Management system. Best Access Doors uses Zoho CRM to receive and manage form submissions from the website.

---

## Questions or Problems?

If a test fails unexpectedly or you're unsure what a result means, check the screenshot in `cypress/screenshots/` first — it usually shows exactly what the browser looked like when things went wrong.
