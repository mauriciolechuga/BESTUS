import { assertBreadcrumbs, assertProductInfoForm, blockThirdParty, makeConsoleErrorSpy, pickRandom } from '../support/checks.js';
import { getStore, describeIfStore, storePath } from '../support/store.js';

const site = getStore();

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

  it('displays a sale price', () => {
    cy.get('[data-product-price-without-tax]').invoke('text').should('match', /\$[\d,]+(\.\d{2})?/);
  });

  it('shows at least one product image with a valid src', () => {
    cy.get('section[data-image-gallery]').should('exist');
    cy.get('section[data-image-gallery] .thumbnail_image').first().invoke('attr', 'src').should('not.be.empty');
  });

  it('quantity input is visible and defaults to 1', () => {
    cy.get('input[name="qty[]"]').should('be.visible').and('have.value', '1');
    cy.get('button[data-action="inc"]').should('be.visible');
    cy.get('button[data-action="dec"]').should('be.visible');
  });

  it('Add to Cart button is visible and not disabled', () => {
    cy.get('#form-action-addToCart').should('be.visible').and('not.be.disabled');
  });

  // ─── Content sections ──────────────────────────────────────────────────────

  it('spec sheet links open PDFs in a new tab', () => {
    cy.get('a[href*=".pdf"]').should('have.length.at.least', 1).each(($a) => {
      expect($a.attr('href')).to.match(/\.pdf$/i);
      expect($a.attr('target')).to.eq('_blank');
    });
  });

  it('description section is present and has content', () => {
    cy.get('.productView-description1').invoke('text').should('not.be.empty');
  });

  it('YouTube video iframe is present when a video section exists', () => {
    cy.get('body').then(($body) => {
      if ($body.find('.product-video').length) {
        cy.get('.product-video iframe[data-src*="youtube"]').should('exist');
      }
    });
  });

  it('related products carousel renders with items', () => {
    cy.get('.content-carousel .owl-carousel').should('exist').children().should('have.length.at.least', 1);
  });

  it('reviews section and Yotpo widget are present', () => {
    cy.get('#productreviewbox').should('exist');
    cy.get('.yotpo-widget-instance')
      .should('exist')
      .invoke('attr', 'data-yotpo-product-id')
      .should('not.be.empty');
  });

  it('recently viewed SearchSpring script tag is present', () => {
    cy.get('script[type="searchspring/personalized-recommendations"][profile="recently-viewed"]').should('exist');
  });

  // ─── Product info request form ─────────────────────────────────────────────

  it('product info request form is present with required fields', () => {
    assertProductInfoForm();
  });

  // ─── SKU and meta ──────────────────────────────────────────────────────────

  it('SKU is displayed', () => {
    cy.get('[data-product-sku]').invoke('text').should('not.be.empty');
  });

  it('lead time / stock status is displayed', () => {
    cy.get('.leadtime_value').invoke('text').should('not.be.empty');
  });
});
