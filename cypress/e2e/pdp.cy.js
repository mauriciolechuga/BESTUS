import { assertBreadcrumbs, assertProductInfoForm, blockThirdParty, makeConsoleErrorSpy, pickRandom } from '../support/checks.js';
import { getStore, describeIfStore, itIfStore, storePath, pdpSelectors } from '../support/store.js';

const site = getStore();
const sel = pdpSelectors();

// A random product URL from the store's pdp.popular list is chosen each run. All checks
// are read-only, so the page is loaded once (testIsolation:false) and shared across tests.
describeIfStore(site.pdp, 'Product Detail Page', { testIsolation: false }, () => {
  const consoleErrors = makeConsoleErrorSpy();

  before(() => {
    blockThirdParty();
    cy.visit(storePath(pickRandom(site.pdp.popular)), { onBeforeLoad: consoleErrors.onBeforeLoad });
  });

  // ─── Page structure ────────────────────────────────────────────────────────

  it('loads without console errors', () => {
    consoleErrors.assertClean();
  });

  it('renders breadcrumbs with Home and at least one category link', () => {
    assertBreadcrumbs();
  });

  it('shows a non-empty product title', () => {
    cy.get('h1.productView-title').invoke('text').should('not.be.empty');
  });

  itIfStore(!(site.pdp && site.pdp.quoteOnly), 'displays a sale price', () => {
    cy.get('[data-product-price-without-tax]').invoke('text').should('match', /\$[\d,]+(\.\d{2})?/);
  }, 'store is quote-only — no price, no cart, no lead-time widget (pdp.quoteOnly)');

  it('shows at least one product image with a valid src', () => {
    cy.get('section[data-image-gallery]').should('exist');
    cy.get(sel.galleryImage).first().invoke('attr', 'src').should('not.be.empty');
  });

  itIfStore(!(site.pdp && site.pdp.quoteOnly), 'quantity input is visible and defaults to 1', () => {
    cy.get('input[name="qty[]"]').should('be.visible').and('have.value', '1');
    // Stepper buttons are nullable — BESTCA's Snap theme has none (see PDP_SELECTOR_DEFAULTS).
    if (sel.qtyIncrement) cy.get(sel.qtyIncrement).should('be.visible');
    if (sel.qtyDecrement) cy.get(sel.qtyDecrement).should('be.visible');
  }, 'store is quote-only — no price, no cart, no lead-time widget (pdp.quoteOnly)');

  itIfStore(!(site.pdp && site.pdp.quoteOnly), 'Add to Cart button is visible and not disabled', () => {
    cy.get('#form-action-addToCart').should('be.visible').and('not.be.disabled');
  }, 'store is quote-only — no price, no cart, no lead-time widget (pdp.quoteOnly)');

  // ─── Content sections ──────────────────────────────────────────────────────

  it('spec sheet links open PDFs in a new tab', () => {
    cy.get('a[href*=".pdf"]').should('have.length.at.least', 1).each(($a) => {
      expect($a.attr('href')).to.match(/\.pdf$/i);
      // Some stores (ADAP) don't set target="_blank" on every spec-sheet link.
      if (sel.pdfNewTab) expect($a.attr('target')).to.eq('_blank');
    });
  });

  it('description section is present and has content', () => {
    cy.get(sel.description).invoke('text').should('not.be.empty');
  });

  it('YouTube video iframe is present when a video section exists', () => {
    cy.get('body').then(($body) => {
      if ($body.find('.product-video').length) {
        cy.get('.product-video iframe[data-src*="youtube"]').should('exist');
      }
    });
  });

  itIfStore(sel.relatedCarousel, 'related products carousel renders with items', () => {
    cy.get(sel.relatedCarousel).should('exist').children().should('have.length.at.least', 1);
  }, "store theme has no related-products carousel (pdp.selectors.relatedCarousel is null)");

  itIfStore(sel.reviewsContainer, 'reviews section and Yotpo widget are present', () => {
    cy.get(sel.reviewsContainer).should('exist');
    cy.get('.yotpo-widget-instance')
      .should('exist')
      .invoke('attr', 'data-yotpo-product-id')
      .should('not.be.empty');
  }, "store theme has no reviews widget (pdp.selectors.reviewsContainer is null)");

  // Profile is store-dependent — BESTCA's Snap theme emits "similar" rather than "recently-viewed".
  // ADC's theme ships no SearchSpring recommendations script at all, so it sets
  // pdp.recentlyViewedProfile:null to skip this check.
  itIfStore(!(site.pdp && site.pdp.recentlyViewedProfile === null), 'recently viewed SearchSpring script tag is present', () => {
    const profile = (site.pdp && site.pdp.recentlyViewedProfile) || 'recently-viewed';
    cy.get(`script[type="searchspring/personalized-recommendations"][profile="${profile}"]`).should('exist');
  }, "store theme ships no SearchSpring recommendations script (pdp.recentlyViewedProfile is null)");

  // ─── Product info request form ─────────────────────────────────────────────

  itIfStore(sel.productInfoForm, 'product info request form is present with required fields', () => {
    assertProductInfoForm();
  }, "store theme has no product-info request form (pdp.selectors.productInfoForm is null)");

  // ─── SKU and meta ──────────────────────────────────────────────────────────

  it('SKU is displayed', () => {
    cy.get('[data-product-sku]').invoke('text').should('not.be.empty');
  });

  itIfStore(!(site.pdp && site.pdp.quoteOnly), 'lead time / stock status is displayed', () => {
    cy.get('.leadtime_value').invoke('text').should('not.be.empty');
  }, 'store is quote-only — no price, no cart, no lead-time widget (pdp.quoteOnly)');
});
