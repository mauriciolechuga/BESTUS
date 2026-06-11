/**
 * PDP – Mobile Layout Tests
 *
 * Runs the shared device matrix (see cypress/support/devices.js) against the Product
 * Detail Page. A random product URL from site.json's pdp.popular is chosen per device,
 * and each device loads the page once (testIsolation:false). Layout findings — the hidden
 * desktop footer, the div.mobile-menu drawer, and the 44px/24px touch-target thresholds —
 * are documented in devices.js.
 *
 * Not retested here (viewport-agnostic, covered in pdp.cy.js): PDF spec links, YouTube
 * iframe, SearchSpring recently-viewed script, footer sections.
 */
import { ALL_DEVICES, PHONES, MOBILE_NAV } from '../support/devices.js';
import {
  assertBreadcrumbs,
  assertProductInfoForm,
  assertNoHorizontalOverflow,
  assertMaxTouchTarget,
  blockThirdParty,
  makeConsoleErrorSpy,
  pickRandom,
} from '../support/checks.js';
import { getStore, describeIfStore, itIfStore, storePath, pdpSelectors, anyHeaderSelector } from '../support/store.js';

const site = getStore();
const sel = pdpSelectors();
// Mobile OR desktop header — themes switch at their own breakpoints (see store.js).
const header = anyHeaderSelector();

// ─── Shared URL ──────────────────────────────────────────────────────────────
// One product URL is picked once per spec run and reused across all devices so
// that the overflow check is consistent. If each device picked independently via
// pickRandom(), different products could produce different overflow results —
// masking real bugs on some products and producing false failures on others
// (confirmed: two 412px devices can disagree when testing different products).
const pdpUrl = site.pdp && storePath(pickRandom(site.pdp.popular));

// ═════════════════════════════════════════════════════════════════════════════
// Portrait tests — all devices
// ═════════════════════════════════════════════════════════════════════════════
ALL_DEVICES.forEach(({ name, width, height, touchTarget }) => {
  describeIfStore(site.pdp, `PDP – ${name} (${width}x${height})`, { testIsolation: false }, () => {
    const consoleErrors = makeConsoleErrorSpy();

    before(() => {
      blockThirdParty();
      cy.viewport(width, height);
      cy.visit(pdpUrl, { onBeforeLoad: consoleErrors.onBeforeLoad });
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

    it('loads with header visible', () => {
      cy.get(header).filter(':visible').should('have.length.at.least', 1);
    });

    it('renders breadcrumbs with Home and at least one category link', () => {
      assertBreadcrumbs();
    });

    it('shows a non-empty product title', () => {
      cy.get('h1.productView-title').invoke('text').should('not.be.empty');
    });

    it('displays a sale price', () => {
      cy.get('[data-product-price-without-tax]').invoke('text').should('match', /\$[\d,]+(\.\d{2})?/);
    });

    it('shows at least one product image with a valid src', () => {
      cy.get('section[data-image-gallery]').should('exist');
      cy.get(sel.galleryImage).first().invoke('attr', 'src').should('not.be.empty');
    });

    it('quantity input is visible and defaults to 1', () => {
      cy.get('input[name="qty[]"]').should('be.visible').and('have.value', '1');
      cy.get('button[data-action="inc"]').should('exist');
      cy.get('button[data-action="dec"]').should('exist');
    });

    it('Add to Cart button is visible and not disabled', () => {
      cy.get('#form-action-addToCart').should('be.visible').and('not.be.disabled');
    });

    it('description section is present and has content', () => {
      cy.get(sel.description).invoke('text').should('not.be.empty');
    });

    itIfStore(sel.relatedCarousel, 'related products carousel renders with items', () => {
      cy.get(sel.relatedCarousel).should('exist').children().should('have.length.at.least', 1);
    });

    it('SKU is displayed', () => {
      cy.get('[data-product-sku]').invoke('text').should('not.be.empty');
    });

    it('lead time / stock status is displayed', () => {
      cy.get('.leadtime_value').invoke('text').should('not.be.empty');
    });

    itIfStore(sel.productInfoForm, 'product info request form is present with required fields', () => {
      assertProductInfoForm();
    });

    it('mobile navigation is present', () => {
      cy.get(MOBILE_NAV).should('exist');
    });

    it('has no horizontal overflow', () => {
      assertNoHorizontalOverflow(width);
    });

    it(`interactive header elements meet minimum touch target height (${touchTarget}px)`, () => {
      assertMaxTouchTarget(touchTarget);
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Landscape tests — phones only
// ═════════════════════════════════════════════════════════════════════════════
PHONES.forEach(({ name, width, height }) => {
  describeIfStore(site.pdp, `PDP – ${name} landscape (${height}x${width})`, { testIsolation: false }, () => {
    before(() => {
      blockThirdParty();
      cy.viewport(height, width); // landscape: swap width and height
      cy.visit(pdpUrl);
    });

    beforeEach(() => {
      cy.viewport(height, width);
    });

    it('shows a non-empty product title', () => {
      cy.get('h1.productView-title').invoke('text').should('not.be.empty');
    });

    it('has no horizontal overflow', () => {
      assertNoHorizontalOverflow(height);
    });
  });
});
