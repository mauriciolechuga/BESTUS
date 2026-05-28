/**
 * PLP – Mobile Layout Tests
 *
 * Runs the shared device matrix (see cypress/support/devices.js) against the Product
 * Listing Page. Each device loads the page once (testIsolation:false). Layout findings —
 * the collapsed .categories-left sidebar and the div.mobile-menu drawer — are documented
 * in devices.js.
 *
 * Not retested here (viewport-agnostic, covered in plp.cy.js): 404 link-resolution,
 * pagination JSON blob, card→PDP navigation, SearchSpring subcategory sidebar.
 */
import { ALL_DEVICES, PHONES, MOBILE_NAV } from '../support/devices.js';
import {
  waitForProducts,
  assertProductCards,
  assertNoHorizontalOverflow,
  makeConsoleErrorSpy,
} from '../support/checks.js';

const PLP = '/products/';

// ═════════════════════════════════════════════════════════════════════════════
// Portrait tests — all devices
// ═════════════════════════════════════════════════════════════════════════════
ALL_DEVICES.forEach(({ name, width, height }) => {
  describe(`PLP – ${name} (${width}x${height})`, { testIsolation: false }, () => {
    const consoleErrors = makeConsoleErrorSpy();

    before(() => {
      cy.viewport(width, height);
      cy.visit(PLP, { onBeforeLoad: consoleErrors.onBeforeLoad });
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

    it('loads with correct heading and breadcrumb', () => {
      cy.get('h1.page-heading').should('contain.text', 'Products');
      cy.get('.breadcrumbs.new_breadcrumbs').within(() => {
        cy.get('a.breadcrumb-home').should('be.visible');
        cy.contains('a', 'Products').should('be.visible');
      });
    });

    it('product grid renders', () => {
      waitForProducts(1);
    });

    it('each product card has an image, title, price, and link', () => {
      waitForProducts();
      assertProductCards(3);
    });

    it('subcategory boxes render with non-empty titles and valid links', () => {
      cy.get('.subCategoriesBox').should('have.length.at.least', 1).each(($box) => {
        expect($box.find('.nameTitle').text().trim()).to.not.be.empty;
        const href = $box.find('a.navList-action').attr('href');
        expect(href).to.not.be.empty;
        expect(href).to.include('/');
      });
    });

    it('sidebar is present in the DOM', () => {
      // .categories-left is collapsed/hidden on mobile — assert DOM presence only.
      cy.get('.categories-left').should('exist');
    });

    it('has no horizontal overflow', () => {
      assertNoHorizontalOverflow(width);
    });

    it('mobile navigation is present', () => {
      cy.get(MOBILE_NAV).should('exist');
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Landscape tests — phones only
// ═════════════════════════════════════════════════════════════════════════════
PHONES.forEach(({ name, width, height }) => {
  describe(`PLP – ${name} landscape (${height}x${width})`, { testIsolation: false }, () => {
    before(() => {
      cy.viewport(height, width); // landscape: swap width and height
      cy.visit(PLP);
    });

    beforeEach(() => {
      cy.viewport(height, width);
    });

    it('loads with correct heading', () => {
      cy.get('h1.page-heading').should('contain.text', 'Products');
    });

    it('has no horizontal overflow', () => {
      assertNoHorizontalOverflow(height);
    });
  });
});
