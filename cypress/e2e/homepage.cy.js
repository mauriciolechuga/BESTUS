import { assertFooterHeadings, makeConsoleErrorSpy } from '../support/checks.js';

// All homepage checks are read-only, so the page is loaded once (testIsolation:false)
// and every assertion runs against that single visit instead of re-loading per test.
describe('Homepage', { testIsolation: false }, () => {
  const consoleErrors = makeConsoleErrorSpy();

  before(() => {
    cy.visit('/', { onBeforeLoad: consoleErrors.onBeforeLoad });
  });

  // Runs first so it reflects load-time console errors only.
  it('has no console errors', () => {
    consoleErrors.assertClean();
  });

  it('loads with key elements visible', () => {
    cy.get('header').should('be.visible');
    cy.get('footer').should('be.visible');
    cy.get('[class*="carousel"], [class*="hero"], [class*="banner"], main, [role="main"]').first().should('be.visible');
  });

  it('header and nav links all resolve without 404', () => {
    cy.assertLinksResolve('header a[href]', { exclude: ['amazon', 'facebook'] });
  });

  it('footer is visible with all four section headings', () => {
    assertFooterHeadings('be.visible');
  });

  it('footer links all resolve without 404', () => {
    cy.assertLinksResolve('footer a[href]');
  });

  it('footer nav links have non-empty visible text', () => {
    cy.get('footer .box ul li a').each(($a) => {
      expect($a.text().trim()).to.not.be.empty;
    });
  });

  it('footer contact info shows phone, fax, address, and warehouses link', () => {
    cy.get('footer .Contact-info-box').should('have.length.at.least', 3);

    // Phone and fax: verify tel: links exist and have non-empty text (not hardcoded)
    cy.get('footer .Contact-info-box a[href^="tel:"]').should('have.length.at.least', 2).each(($a) => {
      expect($a.text().trim()).to.match(/[\d\-\(\)\s\+]+/);
    });

    cy.get('footer .Contact-info-box').contains('New York').should('exist');

    cy.get('footer a[href="/warehouses/"]').should('be.visible').and('contain.text', 'Warehouses');
  });

  it('footer payment icons section is visible', () => {
    cy.get('footer .footer-payment-icons').should('be.visible');
  });

  it('footer copyright year is current', () => {
    const currentYear = new Date().getFullYear().toString();
    cy.get('footer .Copyright p').should('contain.text', currentYear);
    cy.get('footer .Copyright p').should('contain.text', 'Best Access Doors');
  });

  it('footer partner logo links resolve without error', () => {
    const partnerLinks = [
      'https://www.bimobject.com/en/best-access-doors?location=us',
      'https://www.rib-software.com/en/rib-speclink',
    ];
    partnerLinks.forEach((url) => {
      cy.request({ url, failOnStatusCode: false }).its('status').should('not.eq', 404);
    });
  });

  it('phone number in header matches footer', () => {
    cy.get('header [href^="tel:"]').first().invoke('text').then((headerPhone) => {
      cy.get('footer [href^="tel:"]').first().invoke('text').should('eq', headerPhone.trim());
    });
  });
});
