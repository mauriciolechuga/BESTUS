import { assertFooterHeadings, blockThirdParty, makeConsoleErrorSpy } from '../support/checks.js';
import { getStore, itIfStore, homePath, footerConfig } from '../support/store.js';

const { branding } = getStore();
const footer = footerConfig();

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
    cy.get(footer.navLinks).each(($a) => {
      expect($a.text().trim()).to.not.be.empty;
    });
  });

  it('footer contact info shows phone and fax links', () => {
    cy.get(footer.contactInfoBox).should('have.length.at.least', footer.minContactBoxes);

    // Phone and fax: verify tel: links exist and have non-empty text (not hardcoded)
    cy.get(`${footer.contactInfoBox} a[href^="tel:"]`)
      .should('have.length.at.least', footer.minPhoneLinks)
      .each(($a) => {
        expect($a.text().trim()).to.match(/[\d\-\(\)\s\+]+/);
      });
  });

  itIfStore(branding.footerLocationText, 'footer contact info shows the store location', () => {
    cy.get(footer.contactInfoBox).contains(branding.footerLocationText).should('exist');
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
    cy.get('header [href^="tel:"]').first().invoke('text').then((headerPhone) => {
      cy.get('footer [href^="tel:"]').first().invoke('text').should('eq', headerPhone.trim());
    });
  });
});
