# BESTUS — Automated Form Testing for BestAccessDoors.com

This project automatically checks that the customer-facing forms on [bestaccessdoors.com](https://www.bestaccessdoors.com) are working correctly. It acts like a robot customer: it opens the website, fills out forms, clicks submit, and verifies that everything behaves as expected — all without a human having to do it by hand.

---

## Why This Exists

When a form breaks on the website — say, the "Request a Quote" button stops working — real customers can't reach the sales team. These tests catch those problems early, before anyone notices, so they can be fixed quickly.

Running the tests takes a few minutes instead of an hour of manual clicking. And because they run the same way every time, nothing gets accidentally skipped.

---

## What Gets Tested

The tests cover four forms on the website:

| Form | Where to find it | What it does |
|------|-----------------|--------------|
| **Product Information** | On individual product pages | Lets customers ask a question about a specific product |
| **Contact Us** | `/contact-us/` | General inquiries, supports optional file attachment |
| **Request a Quote** | `/request-a-quote/` | Customers request pricing for a product |
| **Pro Club Application** | `/pro-club-application/` | Contractors and resellers apply for trade pricing |

The tests also check the **homepage** — verifying that header and footer links work, that the phone number is consistent, and that no errors appear in the browser.

For each form, the tests verify:
- The form submits successfully when filled out correctly
- The right information is sent when the form is submitted
- Error messages appear when required fields are left blank
- Error messages appear when an email address is typed in the wrong format

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

1. Open a terminal and navigate to this folder:
   ```
   cd "c:\Users\mauri\Documents\Github Projects\BESTUS"
   ```

2. Install the project's dependencies (this downloads Cypress and other tools):
   ```
   npm install
   ```

   This may take a minute or two. You only need to do it once (or again if the project's dependencies change).

---

## Running the Tests

### Option 1 — Fast & Safe (recommended for daily use)

```
npm test
```

This runs all tests in the background (no browser window opens). It does **not** submit real forms — it intercepts the form submissions and fakes a successful response so no leads are created in the CRM.

Best for: quickly checking that nothing is broken.

### Option 2 — Interactive (watch the tests run)

```
npm run open
```

This opens the Cypress app where you can pick which tests to run and watch them execute in a real browser window. Useful when you want to see exactly what's happening or when debugging a failing test.

### Option 3 — Live Submission (weekly smoke test only)

```
npm run test:live
```

This runs the tests and submits **real forms** to the CRM. Use this sparingly — it creates actual leads in Zoho. It requires two safety settings to be enabled at the same time to prevent accidental use.

---

## Reading the Results

After running `npm test`, you'll see a summary like this:

```
  5 passing (12s)
  1 failing

  1) Contact Form > shows error when email is blank
     AssertionError: expected element to be visible
```

- **passing** — tests that worked correctly
- **failing** — tests that found a problem (the name tells you which form and what failed)

If any tests fail, Cypress automatically saves a **screenshot** of the browser at the moment of failure. You can find these in the `cypress/screenshots/` folder.

Video recordings of each test run are saved to `cypress/videos/`.

---

## Project Structure

```
BESTUS/
├── cypress.config.js          Configuration (which website to test, timeouts, etc.)
│
├── cypress/
│   ├── e2e/                   The actual tests (one file per form)
│   │   ├── homepage.cy.js     Checks the homepage header and footer
│   │   ├── product-form.cy.js Tests the Product Information form
│   │   ├── contact-form.cy.js Tests the Contact Us form
│   │   ├── quote-form.cy.js   Tests the Request a Quote form
│   │   └── pro-club-form.cy.js Tests the Pro Club Application form
│   │
│   ├── fixtures/              Test data (fake customer info, URLs, etc.)
│   │   ├── site.json          Website URLs and form submission patterns
│   │   ├── personas.json      Fake customer profiles used during testing
│   │   └── files/             Sample files used to test file upload
│   │
│   └── support/               Shared helper code (reused across tests)
│       ├── pages/             Page Objects — one per form, handles form interactions
│       ├── utils/             Utility functions (email generation, URL picking, etc.)
│       ├── commands.js        Custom test shortcuts
│       └── e2e.js             Global setup (runs before every test)
│
└── docs/
    └── cypress-forms-plan.md  Detailed technical planning document
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
