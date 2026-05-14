/**
 * ============================================================
 *  Cypress E2E Demo — Request a Quote (Mobile View)
 * ============================================================
 *  Author : Mauricio Lechuga
 *  Purpose: Same quote form test but on a mobile viewport.
 *           Great for demoing responsive QA checks.
 *
 *  HOW TO RUN
 *    npx cypress open          (interactive / headed)
 *    npx cypress run            (headless CI mode)
 * ============================================================
 */

describe('Request a Quote — Mobile View', () => {

  // ── Test data ────────────────────────────────────────────
  const formData = {
    firstName   : 'Mauricio',
    lastName    : 'Testing',
    company     : 'ACME Inc.',
    email       : `test+${Date.now()}@email.com`,
    phoneCode   : '+1',
    phoneNumber : '5558880000',
    model       : 'BA-FRI',
    size        : '8" x 8"',
    quantity    : "I don't know",
    address     : 'Jurassic Park, Isla Nublar',
  };

  // ── The test ─────────────────────────────────────────────

  it('fills out the quote form on a mobile screen', () => {

    // Set mobile viewport
    cy.viewport('iphone-x');

    // ① Visit the homepage
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

    cy.screenshot('mobile-01-homepage');

    // ② Navigate to Request a Quote
    //    On mobile the nav may be inside a hamburger menu
    cy.get('body').then(($body) => {
      // Check if the "Request a Quote" link is visible
      const quoteLink = $body.find('a').filter(function () {
        return /request a quote/i.test(this.textContent);
      });

      if (quoteLink.length && quoteLink.first().is(':visible')) {
        cy.wrap(quoteLink.first()).click({ force: true });
      } else {
        // Try opening the mobile menu first (hamburger icon)
        const hamburger = $body.find(
          '.mobileMenu-toggle, .navPages-toggle, [aria-label="Toggle menu"], .header-menu-toggle, button.menu-toggle'
        );
        if (hamburger.length) {
          cy.wrap(hamburger.first()).click({ force: true });
          // eslint-disable-next-line cypress/no-unnecessary-waiting
          cy.wait(1000);
        }
        cy.contains('a', /request a quote/i)
          .first()
          .click({ force: true });
      }
    });

    // Wait for the quote page to load
    cy.url().should('include', 'quote', { timeout: 15000 });
    cy.screenshot('mobile-02-quote-page');

    // ③ Fill the form
    cy.get('form#form').scrollIntoView();

    cy.get('input[name="Name_First"]').clear().type(formData.firstName);
    cy.get('input[name="Name_Last"]').clear().type(formData.lastName);
    cy.get('input[name="SingleLine"]').clear().type(formData.company);
    cy.get('input[name="Email"]').clear().type(formData.email);
    cy.get('input[name="PhoneNumber_countrycodeval"]').clear().type(formData.phoneCode);
    cy.get('input[name="PhoneNumber_countrycode"]').clear().type(formData.phoneNumber);
    cy.get('input[name="SingleLine1"]').clear().type(formData.model);
    cy.get('input[name="SingleLine2"]').clear().type(formData.size);
    cy.get('select[name="Dropdown"]').select(formData.quantity);
    cy.get('input[name="SingleLine3"]').clear().type(formData.address);

    cy.screenshot('mobile-03-form-filled');

    // ④ Submit and validate
    cy.intercept('POST', '**/htmlRecords/submit').as('formSubmit');

    cy.get('button.zf-submitColor').click({ force: true });

    cy.wait('@formSubmit', { timeout: 15000 }).then((interception) => {
      const status = interception.response.statusCode;
      cy.log(`Form submission status: ${status}`);

      if (status >= 400) {
        cy.log(`FORM ERROR — server returned ${status}`);
        expect(status).to.be.lessThan(400);
      } else {
        cy.log('Form submitted successfully');
      }
    });

    cy.log('Mobile test complete');
  });
});

// ── Capture uncaught JS errors ────────────────────────────
Cypress.on('uncaught:exception', (err) => {
  Cypress.log({
    name: 'Uncaught Error',
    message: err.message,
  });
  return false;
});