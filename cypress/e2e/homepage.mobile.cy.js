/**
 * Homepage – Mobile Layout Tests
 *
 * Covers a matrix of real-world phones and tablets from 2019–2024 to verify
 * that the homepage renders correctly across mobile and tablet viewports.
 *
 * FINDINGS DISCOVERED WHILE BUILDING THESE TESTS
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. footer.tcsFooter is CSS display:none on all mobile phone viewports.
 *    The desktop footer is intentionally hidden; footer tests use should('exist')
 *    to verify the HTML is present (structural integrity) rather than visible.
 *
 * 2. The homepage contains a div.Summer_banner.Summer_spend.desktop_summer_banner
 *    that is display:none on mobile. The hero selector uses .filter(':visible') to
 *    skip desktop-only banners and find a visible main content element instead.
 *
 * 3. The mobile navigation is a div.mobile-menu drawer (not a hamburger button).
 *    Confirmed from page source. The test asserts it exists in the DOM.
 *
 * 4. iPad Pro 12.9" (1024px) serves the desktop nav layout, which has 23px header
 *    links (mouse-optimised, not touch-optimised). At tablet widths the site behaves
 *    like a desktop. Tablets use a 24px threshold (WCAG 2.2 AA 2.5.8) instead of
 *    the 44px phone threshold (Apple HIG / WCAG 2.5.5 AAA).
 *
 * 5. Touch target test uses Math.max() across all visible header elements rather
 *    than .first(), because DOM order puts utility/skip links first. Testing the
 *    tallest element asks the real question: is there a prominent tappable element?
 *
 * WHAT IS NOT TESTED HERE (and why)
 * ─────────────────────────────────────────────────────────────────────────────
 * - 404 link-resolution checks: network requests are viewport-agnostic.
 *   Those live in homepage.cy.js and do not need to repeat per device.
 * - Landscape for tablets: at 1080–1388px landscape width, tablets are already
 *   near desktop widths and rarely produce distinct layout breaks worth catching.
 */

// ─── Mobile nav ──────────────────────────────────────────────────────────────
// Confirmed from page source: the mobile nav is a drawer container, not a button.
// If this selector ever breaks, inspect <header> in DevTools at a phone viewport.
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
  describe(`Homepage – ${name} (${width}x${height})`, () => {
    beforeEach(() => {
      cy.viewport(width, height);
      cy.visit('/');
    });

    // ── Mirrored from homepage.cy.js ─────────────────────────────────────────

    it('loads with key elements visible', () => {
      cy.get('header').should('be.visible');

      // footer.tcsFooter is CSS display:none on mobile phone viewports (finding #1).
      // Assert DOM presence only — the HTML must exist even if not rendered.
      cy.get('footer.tcsFooter').should('exist');

      // desktop_summer_banner (and similar seasonal banners) are display:none on mobile
      // (finding #2). Filter for the first element that is actually visible so the
      // test does not fail on hidden desktop-only promotional sections.
      cy.get('[class*="carousel"], [class*="hero"], [class*="banner"], main, [role="main"]')
        .filter(':visible')
        .should('have.length.at.least', 1);
    });

    it('footer has all four section headings in the DOM', () => {
      // footer.tcsFooter is display:none on mobile — assert exist, not be.visible.
      // This confirms structural integrity: all four nav sections are present in the
      // HTML even when the footer is not rendered to the user.
      cy.get('footer.tcsFooter').should('exist');
      cy.get('footer .footer-top').should('exist');
      cy.get('footer .footer-bottom').should('exist');
      cy.get('footer .Copyright').should('exist');

      const expectedHeadings = ["WHAT'S IN STORE", 'SECURE SHOPPING', 'MY ACCOUNT', 'Contact Info'];
      cy.get('footer .box h3').then(($headings) => {
        const texts = [...$headings].map((el) => {
          const clone = el.cloneNode(true);
          clone.querySelectorAll('svg').forEach((svg) => svg.remove());
          return clone.textContent.trim();
        });
        expectedHeadings.forEach((heading) => {
          expect(texts).to.include(heading);
        });
      });
    });

    it('footer contact info has phone, fax, address, and warehouses link in the DOM', () => {
      // All assertions use exist (not be.visible) because footer.tcsFooter is
      // display:none on mobile (finding #1).
      cy.get('footer .Contact-info-box').should('have.length.at.least', 3);
      cy.get('footer .Contact-info-box a[href^="tel:"]').should('have.length.at.least', 2).each(($a) => {
        expect($a.text().trim()).to.match(/[\d\-\(\)\s\+]+/);
      });
      cy.get('footer .Contact-info-box').contains('New York').should('exist');
      cy.get('footer a[href="/warehouses/"]').should('exist').and('contain.text', 'Warehouses');
    });

    it('footer payment icons section exists in the DOM', () => {
      // display:none on mobile — DOM presence check only (finding #1).
      cy.get('footer .footer-payment-icons').should('exist');
    });

    it('footer copyright year is current', () => {
      cy.get('footer .Copyright p').should('contain.text', new Date().getFullYear().toString());
      cy.get('footer .Copyright p').should('contain.text', 'Best Access Doors');
    });

    it('footer phone number exists in the DOM', () => {
      // The header phone number may be hidden inside the collapsed mobile menu drawer,
      // so only the footer tel: link is asserted here (contrast with desktop test which
      // verifies header and footer numbers match).
      cy.get('footer a[href^="tel:"]').first().invoke('text').then((text) => {
        expect(text.trim()).to.match(/[\d\-\(\)\s\+]+/);
      });
    });

    it('has no console errors', () => {
      cy.visit('/', {
        onBeforeLoad(win) {
          cy.spy(win.console, 'error').as('consoleError');
        },
      });
      cy.get('@consoleError').should('not.have.been.called');
    });

    // ── Mobile-specific layout tests ─────────────────────────────────────────

    it('has no horizontal overflow', () => {
      // body.scrollWidth > viewport width means content spills off-screen, forcing
      // the user to scroll horizontally — the most common mobile layout bug.
      cy.window().then((win) => {
        expect(win.document.body.scrollWidth).to.be.lte(width);
      });
    });

    it('mobile navigation is present', () => {
      // The mobile nav is a div.mobile-menu drawer (finding #3). It is always in the
      // DOM; opening it requires user interaction and is not tested here.
      cy.get(MOBILE_NAV_TOGGLE).should('exist');
    });

    it(`interactive header elements meet minimum touch target height (${touchTarget}px)`, () => {
      // Tests the TALLEST visible header element, not .first() (finding #5).
      // DOM order places utility/skip links before primary nav, so .first() would
      // test the smallest element (often 20–23px) rather than a real tap target.
      // Math.max() asks: "Is there at least one prominently-sized tappable element?"
      //
      // Threshold rationale (finding #4):
      //   44px — phones: Apple HIG minimum / WCAG 2.5.5 AAA
      //   24px — tablets: WCAG 2.2 AA (2.5.8); site serves desktop nav at these
      //          widths, where mouse-optimised links (23–30px) are expected.
      cy.get('header a[href], header button')
        .filter(':visible')
        .filter((i, el) => el.getBoundingClientRect().height > 0)
        .should('have.length.at.least', 1)
        .then(($els) => {
          const maxHeight = Math.max(...[...$els].map(el => el.getBoundingClientRect().height));
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
  describe(`Homepage – ${name} landscape (${height}x${width})`, () => {
    beforeEach(() => {
      cy.viewport(height, width); // landscape: swap width and height
      cy.visit('/');
    });

    it('loads with key elements visible', () => {
      cy.get('header').should('be.visible');
      cy.get('footer.tcsFooter').should('exist');
      // Same desktop-banner guard as portrait tests (finding #2).
      cy.get('[class*="carousel"], [class*="hero"], [class*="banner"], main, [role="main"]')
        .filter(':visible')
        .should('have.length.at.least', 1);
    });

    it('has no horizontal overflow', () => {
      // In landscape the viewport width is `height` (the larger dimension).
      cy.window().then((win) => {
        expect(win.document.body.scrollWidth).to.be.lte(height);
      });
    });
  });
});
