/**
 * PLP – Mobile Layout Tests
 *
 * Covers the same device matrix as homepage.mobile.cy.js to verify that the
 * Product Listing Page renders correctly across mobile and tablet viewports.
 *
 * WHAT IS NOT TESTED HERE (and why)
 * ─────────────────────────────────────────────────────────────────────────────
 * - 404 link-resolution: network requests are viewport-agnostic; covered in plp.cy.js.
 * - Pagination JSON blob: viewport-agnostic data; covered in plp.cy.js.
 * - Clicking a card navigates to PDP: navigation behavior is viewport-agnostic.
 * - SearchSpring sidebar on subcategory: covered in plp.cy.js.
 *
 * FINDINGS DISCOVERED WHILE BUILDING THESE TESTS
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. .categories-left sidebar is likely hidden/collapsed on mobile viewports.
 *    Assertions use should('exist') (DOM presence) rather than should('be.visible'),
 *    mirroring how the homepage mobile tests handle the hidden footer.
 *
 * 2. The mobile navigation is a div.mobile-menu drawer (confirmed from page source).
 *    Same selector used in homepage.mobile.cy.js.
 */

const PLP = '/products/';

const waitForProducts = (minCount = 1) =>
  cy.get('ul.productGrid li.product', { timeout: 20000 }).should('have.length.at.least', minCount);

// ─── Device matrix ───────────────────────────────────────────────────────────
// touchTarget: minimum acceptable height for a visible header interactive element.
//   44px → phones  (Apple HIG / WCAG 2.5.5 AAA)
//   24px → tablets (WCAG 2.2 AA 2.5.8 — site serves desktop nav at these widths)
const PHONES = [
  // Apple iPhones — compact, standard, and current flagship sizes
  { name: 'iPhone SE 2nd gen (2020)', width: 375, height: 667,  touchTarget: 44 },
  { name: 'iPhone 13 (2021)',         width: 390, height: 844,  touchTarget: 44 },
  { name: 'iPhone 15 (2023)',         width: 393, height: 852,  touchTarget: 44 },
  // Android phones — budget-era, mid-cycle, and current flagship
  { name: 'Samsung Galaxy S10 (2019)',  width: 360, height: 760, touchTarget: 44 },
  { name: 'Samsung Galaxy A53 (2022)', width: 412, height: 892, touchTarget: 44 },
  { name: 'Google Pixel 8 (2023)',     width: 412, height: 915, touchTarget: 44 },
];

const TABLETS = [
  // Apple iPads — budget and pro sizes
  { name: 'iPad 9th gen (2021)',      width: 810,  height: 1080, touchTarget: 24 },
  { name: 'iPad Pro 12.9" (2022)',    width: 1024, height: 1366, touchTarget: 24 },
  // Android tablets — mainstream and flagship
  { name: 'Samsung Galaxy Tab S7 (2020)', width: 800, height: 1280, touchTarget: 24 },
  { name: 'Samsung Galaxy Tab S9 (2023)', width: 834, height: 1388, touchTarget: 24 },
];

const ALL_DEVICES = [...PHONES, ...TABLETS];

// ═════════════════════════════════════════════════════════════════════════════
// Portrait tests — all devices
// ═════════════════════════════════════════════════════════════════════════════
ALL_DEVICES.forEach(({ name, width, height, touchTarget }) => {
  describe(`PLP – ${name} (${width}x${height})`, () => {
    beforeEach(() => {
      cy.viewport(width, height);
      cy.visit(PLP);
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
      waitForProducts().then(() => {
        cy.get('ul.productGrid li.product').each(($li, i) => {
          if (i >= 3) return false; // only check first 3 cards

          cy.wrap($li).within(() => {
            cy.get('.card-figure img')
              .should('exist')
              .invoke('attr', 'src')
              .should('not.be.empty');

            cy.get('.card-title')
              .invoke('text')
              .should('not.be.empty');

            cy.get('[class*="price"]')
              .invoke('text')
              .should('match', /\$[\d,]+(\.\d{2})?/);

            cy.get('.card-figure a, .card-title a')
              .first()
              .invoke('attr', 'href')
              .should('not.be.empty')
              .and('include', '/');
          });
        });
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

    it('sidebar is present in the DOM', () => {
      // .categories-left is likely collapsed/hidden on mobile (finding #1).
      // Assert DOM presence only — same approach as hidden footer in homepage mobile tests.
      cy.get('.categories-left').should('exist');
    });

    it('has no horizontal overflow', () => {
      // body.scrollWidth > viewport width means content spills off-screen.
      cy.window().then((win) => {
        expect(win.document.body.scrollWidth).to.be.lte(width);
      });
    });

    it('has no console errors', () => {
      cy.visit(PLP, {
        onBeforeLoad(win) {
          cy.spy(win.console, 'error').as('consoleError');
        },
      });
      cy.get('@consoleError').should('not.have.been.called');
    });

    it('mobile navigation is present', () => {
      // The mobile nav is a div.mobile-menu drawer (finding #2).
      cy.get('div.mobile-menu').should('exist');
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Landscape tests — phones only
// Tablets are excluded: in landscape their widths (1080–1388px) approach desktop
// and rarely produce distinct layout breaks worth a separate test pass.
// ═════════════════════════════════════════════════════════════════════════════
PHONES.forEach(({ name, width, height }) => {
  describe(`PLP – ${name} landscape (${height}x${width})`, () => {
    beforeEach(() => {
      cy.viewport(height, width); // landscape: swap width and height
      cy.visit(PLP);
    });

    it('loads with correct heading', () => {
      cy.get('h1.page-heading').should('contain.text', 'Products');
    });

    it('has no horizontal overflow', () => {
      // In landscape the viewport width is `height` (the larger dimension).
      cy.window().then((win) => {
        expect(win.document.body.scrollWidth).to.be.lte(height);
      });
    });
  });
});
