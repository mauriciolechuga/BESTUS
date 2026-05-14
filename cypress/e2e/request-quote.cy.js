/**
 * ============================================================
 *  Cypress E2E Demo — Best Access Doors: Request a Quote
 * ============================================================
 *  Author : Mauricio Lechuga
 *  Purpose: Quick demo for the QA team showing how Cypress can
 *           automate a real-world form-fill-and-submit workflow.
 *
 *  What this test does:
 *    1. Visits the homepage and clicks "Request a Quote"
 *    2. Scrolls to the Zoho quote form and fills every field
 *    3. Intercepts the form POST, submits, and checks the response
 *    4. Screenshots each step and logs any errors
 *
 *  HOW TO RUN
 *    npx cypress open          (interactive / headed)
 *    npx cypress run            (headless CI mode)
 *    npx cypress run --browser chrome --headed   (watch it live)
 * ============================================================
 */

describe('Request a Quote — End-to-End', () => {

  // ── Test data (easy to change in one place) ──────────────
  const formData = {
    firstName   : 'Mauricio',
    lastName    : 'Testing',
    company     : 'ACME Inc.',
    email       : `test+${Date.now()}@email.com`,
    phoneCode   : '+1',
    phoneNumber : '5558880000',
    model       : 'BA-FRI',
    size        : '8" x 8"',
    quantity    : "I don't know",   // must match a <option> value exactly
    address     : 'Jurassic Park, Isla Nublar',
  };

  // ── The test ─────────────────────────────────────────────

  it('fills out and submits the Request a Quote form', () => {

    // ① Visit the homepage and wait for it to fully load
    cy.visit('https://www.bestaccessdoors.com/');
    cy.title().should('not.be.empty');

    // Dismiss the redirect popup if it appears
    cy.get('body', { timeout: 10000 }).then(($body) => {
      const popup = $body.find('#gt_redirectpopup_1645620295358_container');
      if (popup.length && popup.is(':visible')) {
        cy.log('Redirect popup detected — dismissing it');
        cy.get('[onclick*="gt_redirectpopup_1645620295358_close_function"]')
          .click({ force: true });
      } else {
        cy.log('No redirect popup — continuing');
      }
    });

    cy.screenshot('01-homepage');

    // ② Click "Request a Quote"
    cy.contains('a', /request a quote/i)
      .first()
      .click({ force: true });

    // Wait for the quote page to load
    cy.url().should('include', 'quote', { timeout: 15000 });
    cy.screenshot('02-quote-page-loaded');

    // ③ Scroll the form into view and fill it out
    cy.get('form#form').scrollIntoView();
    cy.log('Filling form fields…');

    // --- Contact fields ---
    cy.get('input[name="Name_First"]')
      .clear().type(formData.firstName);

    cy.get('input[name="Name_Last"]')
      .clear().type(formData.lastName);

    cy.get('input[name="SingleLine"]')          // Company Name
      .clear().type(formData.company);

    cy.get('input[name="Email"]')
      .clear().type(formData.email);

    // Phone is split: country code + number
    cy.get('input[name="PhoneNumber_countrycodeval"]')
      .clear().type(formData.phoneCode);

    cy.get('input[name="PhoneNumber_countrycode"]')
      .clear().type(formData.phoneNumber);

    // --- Product fields ---
    cy.get('input[name="SingleLine1"]')          // Model
      .clear().type(formData.model);

    cy.get('input[name="SingleLine2"]')          // Size
      .clear().type(formData.size);

    // Quantity is a <select> dropdown, not a text input
    cy.get('select[name="Dropdown"]')
      .select(formData.quantity);

    // --- Shipping ---
    cy.get('input[name="SingleLine3"]')          // Address
      .clear().type(formData.address);

    cy.screenshot('03-form-filled');

    // ④ Intercept the form POST before clicking Submit
    cy.intercept('POST', '**/htmlRecords/submit').as('formSubmit');

    cy.log('Submitting form…');
    cy.get('button.zf-submitColor')
      .click({ force: true });

    // ⑤ Wait for the server response and validate it
    cy.wait('@formSubmit', { timeout: 15000 }).then((interception) => {
      const status = interception.response.statusCode;
      cy.log(`Form submission status: ${status}`);

      if (status >= 400) {
        // Log the failure clearly so it stands out in the command log
        cy.log(`FORM ERROR — server returned ${status}`);
        cy.log(`Response body: ${JSON.stringify(interception.response.body)}`);

        // Optionally fail the test on server errors
        expect(status).to.be.lessThan(400);
      } else {
        cy.log('Form submitted successfully');
      }
    });

    cy.log('Test complete');
  });
});

// ── Capture uncaught JS errors for reporting ──────────────
Cypress.on('uncaught:exception', (err) => {
  Cypress.log({
    name: 'Uncaught Error',
    message: err.message,
  });

  // Return false so Cypress doesn't fail the test on 3rd-party errors
  return false;
});