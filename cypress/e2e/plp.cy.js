import { waitForProducts, assertProductCards, makeConsoleErrorSpy } from '../support/checks.js';

const PLP = '/products/';
const SUBCAT = '/products/popular-picks/fire-rated/';

// Read-only PLP checks share one page load (testIsolation:false). The navigation test
// (which leaves the page) lives in its own default-isolation block at the bottom.
describe('Product Listing Page', { testIsolation: false }, () => {
  const consoleErrors = makeConsoleErrorSpy();

  before(() => {
    cy.visit(PLP, { onBeforeLoad: consoleErrors.onBeforeLoad });
  });

  it('has no console errors on page load', () => {
    consoleErrors.assertClean();
  });

  // ─── Page structure ────────────────────────────────────────────────────────

  it('loads with correct heading and breadcrumb', () => {
    cy.get('h1.page-heading').should('contain.text', 'Products');
    cy.get('.breadcrumbs.new_breadcrumbs').within(() => {
      cy.get('a.breadcrumb-home').should('be.visible');
      cy.contains('a', 'Products').should('be.visible');
    });
  });

  it('sidebar is visible with category navigation', () => {
    cy.get('.categories-left').should('be.visible');
    cy.get('.categories-left .sidebarBlock').should('have.length.at.least', 2);
    cy.get('.categories-left .navList-item a').each(($a) => {
      expect($a.text().trim()).to.not.be.empty;
    });
  });

  it('best sellers sidebar block renders with labelled links', () => {
    cy.get('#treeView li a').should('have.length.at.least', 1).each(($a) => {
      expect($a.text().trim()).to.not.be.empty;
    });
  });

  it('subcategory boxes render with non-empty titles and valid links', () => {
    cy.get('.subCategoriesBox').should('have.length.at.least', 1).each(($box) => {
      expect($box.find('.nameTitle').text().trim()).to.not.be.empty;
      const href = $box.find('a.navList-action').attr('href');
      expect(href).to.not.be.empty;
      expect(href).to.include('/');
    });
  });

  // ─── Product grid ──────────────────────────────────────────────────────────

  it('renders products on the top-level PLP', () => {
    waitForProducts(1);
  });

  it('each product card has an image, title, price, and link', () => {
    waitForProducts();
    assertProductCards(3);
  });

  // ─── Pagination ────────────────────────────────────────────────────────────

  it('pagination controls are present after products load', () => {
    waitForProducts();
    cy.get('[class*="pagination"], [class*="Pagination"], [aria-label*="pagination"], [aria-label*="page"]')
      .should('exist');
  });

  it('pagination marks page 1 active and links to further pages including page 2', () => {
    // Pagination is rendered more than once (top + bottom of the grid); scope to the
    // first visible copy so .within() gets a single element.
    cy.get('.ss__pagination').filter(':visible').should('have.length.at.least', 1).first().within(() => {
      // Current page (1) is marked active and rendered as a non-clickable label.
      cy.get('.ss-page.ss-active').should('contain.text', '1');
      // Multiple pages are linked.
      cy.get('a.ss-page-link').should('have.length.at.least', 2);
      // The "Next" control points to page 2. SearchSpring uses the `pp` query param,
      // not `page` — don't "correct" this to page=2.
      cy.get('.ss-page-next a.ss-page-link').should('have.attr', 'href').and('include', 'pp=2');
    });
  });

  // ─── Link health ───────────────────────────────────────────────────────────

  it('sidebar category links all resolve without 404', () => {
    cy.assertLinksResolve('.categories-left .navList-item a[href]');
  });
});

// ─── Subcategory page (separate URL, read-only) ────────────────────────────────
describe('PLP subcategory page', { testIsolation: false }, () => {
  before(() => {
    cy.visit(SUBCAT);
  });

  it('shows correct heading and breadcrumb trail', () => {
    cy.get('h1.page-heading').invoke('text').should('not.be.empty');
    cy.get('.breadcrumbs.new_breadcrumbs').within(() => {
      cy.contains('a', 'Products').should('be.visible');
    });
  });

  it('loads products and SearchSpring sidebar', () => {
    waitForProducts();
    cy.get('#searchspring-sidebar').should('exist');
  });
});

// ─── Navigation (leaves the page → needs fresh isolation) ──────────────────────
describe('PLP navigation', () => {
  it('clicking a product card navigates to the PDP', () => {
    cy.visit(PLP);
    waitForProducts();
    cy.get('ul.productGrid li.product').first().find('.card-title a').click();
    cy.url().should('not.include', '/products/');
    cy.get('h1').should('be.visible');
  });
});
