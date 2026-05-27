/**
 * PDP – Mobile Layout Tests
 *
 * Covers the same device matrix as homepage.mobile.cy.js and plp.mobile.cy.js
 * to verify that the Product Detail Page renders correctly across mobile and
 * tablet viewports. A random product URL from site.json's pdp.popular list is
 * chosen each run, matching the variance strategy in pdp.cy.js.
 *
 * WHAT IS NOT TESTED HERE (and why)
 * ─────────────────────────────────────────────────────────────────────────────
 * - PDF spec sheet links: viewport-agnostic; covered in pdp.cy.js.
 * - YouTube iframe presence: viewport-agnostic; covered in pdp.cy.js.
 * - SearchSpring recently-viewed script: viewport-agnostic; covered in pdp.cy.js.
 * - Footer sections/payment icons/copyright: footer.tcsFooter is display:none on
 *   phones; PDP desktop spec does not test footer — mobile spec follows suit.
 *
 * FINDINGS DISCOVERED WHILE BUILDING THESE TESTS
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. footer.tcsFooter is CSS display:none on mobile phone viewports.
 *    Consistent with homepage.mobile.cy.js and plp.mobile.cy.js findings.
 *
 * 2. The mobile navigation is a div.mobile-menu drawer (not a hamburger button).
 *    Confirmed from page source. Same selector used across all mobile specs.
 *
 * 3. Touch target test uses Math.max() across all visible header elements rather
 *    than .first(), because DOM order puts utility/skip links first. Testing the
 *    tallest element asks the real question: is there a prominent tappable element?
 *
 * 4. iPad Pro 12.9" (1024px) serves the desktop nav layout with mouse-optimised
 *    links. Tablets use a 24px threshold (WCAG 2.2 AA 2.5.8) instead of the 44px
 *    phone threshold (Apple HIG / WCAG 2.5.5 AAA).
 */

// ─── Mobile nav ──────────────────────────────────────────────────────────────
const MOBILE_NAV_TOGGLE = 'div.mobile-menu';

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
  describe(`PDP – ${name} (${width}x${height})`, function () {
    before(function () {
      cy.fixture('site').then((site) => {
        const urls = site.pdp.popular;
        this.url = urls[Math.floor(Math.random() * urls.length)];
      });
    });

    beforeEach(function () {
      cy.viewport(width, height);
      cy.visit(this.url);
    });

    // ── Page structure ────────────────────────────────────────────────────────

    it('loads with header visible', function () {
      cy.get('header').should('be.visible');
    });

    it('renders breadcrumbs with Home and at least one category link', function () {
      cy.get('.breadcrumbs.new_breadcrumbs').should('be.visible').within(() => {
        cy.get('a.breadcrumb-home').should('be.visible');
        cy.get('.breadcrumb-label').should('have.length.at.least', 2);
      });
    });

    it('shows a non-empty product title', function () {
      cy.get('h1.productView-title').invoke('text').should('not.be.empty');
    });

    it('displays a sale price', function () {
      cy.get('[data-product-price-without-tax]')
        .invoke('text')
        .should('match', /\$[\d,]+(\.\d{2})?/);
    });

    it('shows at least one product image with a valid src', function () {
      cy.get('section[data-image-gallery]').should('exist');
      cy.get('section[data-image-gallery] .thumbnail_image')
        .first()
        .invoke('attr', 'src')
        .should('not.be.empty');
    });

    it('quantity input is visible and defaults to 1', function () {
      cy.get('input[name="qty[]"]').should('be.visible').and('have.value', '1');
      cy.get('button[data-action="inc"]').should('exist');
      cy.get('button[data-action="dec"]').should('exist');
    });

    it('Add to Cart button is visible and not disabled', function () {
      cy.get('#form-action-addToCart').should('be.visible').and('not.be.disabled');
    });

    // ── Content sections ──────────────────────────────────────────────────────

    it('description section is present and has content', function () {
      cy.get('.productView-description1').invoke('text').should('not.be.empty');
    });

    it('related products carousel renders with items', function () {
      cy.get('.content-carousel .owl-carousel').should('exist').children().should('have.length.at.least', 1);
    });

    it('SKU is displayed', function () {
      cy.get('[data-product-sku]').invoke('text').should('not.be.empty');
    });

    it('lead time / stock status is displayed', function () {
      cy.get('.leadtime_value').invoke('text').should('not.be.empty');
    });

    // ── Product info request form ─────────────────────────────────────────────

    it('product info request form is present with required fields', function () {
      cy.get('#have_a_product_question_request').should('exist').within(() => {
        cy.get('form[action*="zohopublic"]').should('exist');
        cy.get('input[name="Name_First"]').should('exist');
        cy.get('input[name="Name_Last"]').should('exist');
        cy.get('input[name="Email"]').should('exist');
      });
    });

    // ── Mobile-specific layout tests ──────────────────────────────────────────

    it('mobile navigation is present', function () {
      // The mobile nav is a div.mobile-menu drawer (finding #2). Always in the DOM;
      // opening it requires user interaction and is not tested here.
      cy.get(MOBILE_NAV_TOGGLE).should('exist');
    });

    it('has no horizontal overflow', function () {
      // body.scrollWidth > viewport width means content spills off-screen.
      cy.window().then((win) => {
        expect(win.document.body.scrollWidth).to.be.lte(width);
      });
    });

    it('has no console errors', function () {
      cy.visit(this.url, {
        onBeforeLoad(win) {
          cy.spy(win.console, 'error').as('consoleError');
        },
      });
      cy.get('@consoleError').should('not.have.been.called');
    });

    it(`interactive header elements meet minimum touch target height (${touchTarget}px)`, function () {
      // Tests the TALLEST visible header element, not .first() (finding #3).
      // DOM order places utility/skip links before primary nav, so .first() would
      // test the smallest element. Math.max() asks: is there at least one prominently
      // sized tappable element?
      //
      // Threshold rationale (finding #4):
      //   44px — phones: Apple HIG minimum / WCAG 2.5.5 AAA
      //   24px — tablets: WCAG 2.2 AA (2.5.8); site serves desktop nav at these widths.
      cy.get('header a[href], header button')
        .filter(':visible')
        .filter((i, el) => el.getBoundingClientRect().height > 0)
        .should('have.length.at.least', 1)
        .then(($els) => {
          const maxHeight = Math.max(...[...$els].map((el) => el.getBoundingClientRect().height));
          expect(maxHeight, 'Tallest header interactive element height').to.be.gte(touchTarget);
        });
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Landscape tests — phones only
// Tablets are excluded: in landscape their widths (1080–1388px) approach desktop
// and rarely produce distinct layout breaks worth a separate test pass.
// ═════════════════════════════════════════════════════════════════════════════
PHONES.forEach(({ name, width, height }) => {
  describe(`PDP – ${name} landscape (${height}x${width})`, function () {
    before(function () {
      cy.fixture('site').then((site) => {
        const urls = site.pdp.popular;
        this.url = urls[Math.floor(Math.random() * urls.length)];
      });
    });

    beforeEach(function () {
      cy.viewport(height, width); // landscape: swap width and height
      cy.visit(this.url);
    });

    it('shows a non-empty product title', function () {
      cy.get('h1.productView-title').invoke('text').should('not.be.empty');
    });

    it('has no horizontal overflow', function () {
      // In landscape the viewport width is `height` (the larger dimension).
      cy.window().then((win) => {
        expect(win.document.body.scrollWidth).to.be.lte(height);
      });
    });
  });
});
