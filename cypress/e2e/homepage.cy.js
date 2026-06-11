import { assertFooterHeadings, blockThirdParty, makeConsoleErrorSpy } from '../support/checks.js';
import { getStore, itIfStore, homePath, footerConfig, headerSelector } from '../support/store.js';

const { branding } = getStore();
const footer = footerConfig();
const header = headerSelector();

// All homepage checks are read-only, so the page is loaded once (testIsolation:false)
// and every assertion runs against that single visit instead of re-loading per test.
describe('Homepage', { testIsolation: false }, () => {
  const consoleErrors = makeConsoleErrorSpy();

  before(() => {
    blockThirdParty();
    cy.visit(homePath(), { onBeforeLoad: consoleErrors.onBeforeLoad });
  });

  // Runs first so it reflects load-time console errors only.
  it('has no console errors', () => {
    consoleErrors.assertClean();
  });

  it('loads with key elements visible', () => {
    cy.get(header).should('be.visible');
    cy.get('footer').should('be.visible');
    cy.get('[class*="carousel"], [class*="hero"], [class*="banner"], main, [role="main"]').first().should('be.visible');
  });

  it('header and nav links all resolve without 404', () => {
    cy.assertLinksResolve(`${header} a[href]`, { exclude: ['amazon', 'facebook'] });
  });

  it('footer is visible with all four section headings', () => {
    assertFooterHeadings('be.visible');
  });

  it('footer links all resolve without 404', () => {
    cy.assertLinksResolve('footer a[href]');
  });

  it('footer nav links have non-empty visible text', () => {
    cy.get(footer.navLinks).each(($a) => {
      expect($a.text().trim()).to.not.be.empty;
    });
  });

  it('footer contact info shows phone and fax links', () => {
    cy.get(footer.contactInfoBox).should('have.length.at.least', footer.minContactBoxes);

    // Phone and fax: verify tel: links exist and have non-empty text (not hardcoded)
    cy.get(footer.phoneLinks)
      .should('have.length.at.least', footer.minPhoneLinks)
      .each(($a) => {
        expect($a.text().trim()).to.match(/[\d\-\(\)\s\+]+/);
      });
  });

  itIfStore(branding.footerLocationText, 'footer shows the store location', () => {
    // Searched footer-wide: some themes put the address in text nodes that are
    // siblings of the contact-info elements, not inside them.
    cy.get('footer').contains(branding.footerLocationText).should('exist');
  });

  itIfStore(branding.warehousesLink, 'footer shows the warehouses link', () => {
    cy.get(`footer a[href="${branding.warehousesLink.href}"]`)
      .should('be.visible')
      .and('contain.text', branding.warehousesLink.text);
  });

  it('footer payment icons section is visible', () => {
    cy.get(footer.paymentIcons).should('be.visible');
  });

  it('footer copyright year is current', () => {
    const currentYear = new Date().getFullYear().toString();
    cy.get(footer.copyright).should('contain.text', currentYear);
    cy.get(footer.copyright).should('contain.text', branding.copyrightText);
  });

  itIfStore(branding.partnerLinks && branding.partnerLinks.length, 'footer partner logo links resolve without error', () => {
    branding.partnerLinks.forEach((url) => {
      cy.request({ url, failOnStatusCode: false }).its('status').should('not.eq', 404);
    });
  });

  it('phone number in header matches footer', () => {
    // First tel link can be a text-less icon, call-tracking scripts rewrite numbers at
    // runtime, and themes pad the text — so compare the first non-empty trimmed header
    // number against all footer numbers, retrying while the rewrites settle.
    const phoneTexts = ($links) =>
      [...$links].map((a) => a.textContent.trim()).filter((t) => t.length > 0);

    cy.get(`${header} [href^="tel:"]`)
      .should(($h) => expect(phoneTexts($h), 'header shows a phone number').to.not.be.empty)
      .then(($h) => {
        const headerPhone = phoneTexts($h)[0];
        cy.get('footer [href^="tel:"]').should(($f) => {
          expect(phoneTexts($f), 'footer phone numbers').to.include(headerPhone);
        });
      });
  });
});
