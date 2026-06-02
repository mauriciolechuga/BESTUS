/**
 * Homepage – Mobile Layout Tests
 *
 * Runs the shared device matrix (see cypress/support/devices.js) against the homepage.
 * Each device loads the page once (testIsolation:false) and every assertion runs against
 * that single visit. Layout findings — hidden desktop footer, desktop-only seasonal
 * banners, the div.mobile-menu drawer, and the 44px/24px touch-target thresholds — are
 * documented in devices.js.
 *
 * Not retested here (viewport-agnostic, covered in homepage.cy.js): 404 link-resolution.
 */
import { ALL_DEVICES, PHONES, MOBILE_NAV } from '../support/devices.js';
import {
  assertFooterHeadings,
  assertNoHorizontalOverflow,
  assertMaxTouchTarget,
  blockThirdParty,
  makeConsoleErrorSpy,
} from '../support/checks.js';

// ═════════════════════════════════════════════════════════════════════════════
// Portrait tests — all devices
// ═════════════════════════════════════════════════════════════════════════════
ALL_DEVICES.forEach(({ name, width, height, touchTarget }) => {
  describe(`Homepage – ${name} (${width}x${height})`, { testIsolation: false }, () => {
    const consoleErrors = makeConsoleErrorSpy();

    before(() => {
      blockThirdParty();
      cy.viewport(width, height);
      cy.visit('/', { onBeforeLoad: consoleErrors.onBeforeLoad });
    });

    // Cypress resets the viewport to the config default (1920x1080) before each test —
    // even under testIsolation:false — so re-assert the device viewport here. The page
    // was loaded at this width in before(); this just reflows it back to mobile.
    beforeEach(() => {
      cy.viewport(width, height);
    });

    it('has no console errors', () => {
      consoleErrors.assertClean();
    });

    it('loads with key elements visible', () => {
      cy.get('header').should('be.visible');
      // footer.tcsFooter is display:none on phone viewports — assert DOM presence only.
      cy.get('footer.tcsFooter').should('exist');
      // Desktop-only seasonal banners are display:none on mobile — find a visible main element.
      cy.get('[class*="carousel"], [class*="hero"], [class*="banner"], main, [role="main"]')
        .filter(':visible')
        .should('have.length.at.least', 1);
    });

    it('footer has all four section headings in the DOM', () => {
      assertFooterHeadings('exist');
    });

    it('footer contact info has phone, fax, address, and warehouses link in the DOM', () => {
      cy.get('footer .Contact-info-box').should('have.length.at.least', 3);
      cy.get('footer .Contact-info-box a[href^="tel:"]').should('have.length.at.least', 2).each(($a) => {
        expect($a.text().trim()).to.match(/[\d\-\(\)\s\+]+/);
      });
      cy.get('footer .Contact-info-box').contains('New York').should('exist');
      cy.get('footer a[href="/warehouses/"]').should('exist').and('contain.text', 'Warehouses');
    });

    it('footer payment icons section exists in the DOM', () => {
      cy.get('footer .footer-payment-icons').should('exist');
    });

    it('footer copyright year is current', () => {
      cy.get('footer .Copyright p').should('contain.text', new Date().getFullYear().toString());
      cy.get('footer .Copyright p').should('contain.text', 'Best Access Doors');
    });

    it('footer phone number exists in the DOM', () => {
      cy.get('footer a[href^="tel:"]').first().invoke('text').then((text) => {
        expect(text.trim()).to.match(/[\d\-\(\)\s\+]+/);
      });
    });

    it('has no horizontal overflow', () => {
      assertNoHorizontalOverflow(width);
    });

    it('mobile navigation is present', () => {
      cy.get(MOBILE_NAV).should('exist');
    });

    it(`interactive header elements meet minimum touch target height (${touchTarget}px)`, () => {
      assertMaxTouchTarget(touchTarget);
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Landscape tests — phones only (tablet landscape widths approach desktop)
// ═════════════════════════════════════════════════════════════════════════════
PHONES.forEach(({ name, width, height }) => {
  describe(`Homepage – ${name} landscape (${height}x${width})`, { testIsolation: false }, () => {
    before(() => {
      cy.viewport(height, width); // landscape: swap width and height
      cy.visit('/');
    });

    beforeEach(() => {
      cy.viewport(height, width);
    });

    it('loads with key elements visible', () => {
      cy.get('header').should('be.visible');
      cy.get('footer.tcsFooter').should('exist');
      cy.get('[class*="carousel"], [class*="hero"], [class*="banner"], main, [role="main"]')
        .filter(':visible')
        .should('have.length.at.least', 1);
    });

    it('has no horizontal overflow', () => {
      // In landscape the viewport width is `height` (the larger dimension).
      assertNoHorizontalOverflow(height);
    });
  });
});
