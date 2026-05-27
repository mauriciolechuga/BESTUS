describe('Product Detail Page', () => {
  before(function () {
    cy.fixture('site').then((site) => {
      const urls = site.pdp.popular;
      this.url = urls[Math.floor(Math.random() * urls.length)];
    });
  });

  beforeEach(function () {
    cy.visit(this.url);
  });

  // ─── Page structure ────────────────────────────────────────────────────────

  it('loads without console errors', function () {
    cy.visit(this.url, {
      onBeforeLoad(win) {
        cy.spy(win.console, 'error').as('consoleError');
      },
    });
    cy.get('@consoleError').should('not.have.been.called');
  });

  it('renders breadcrumbs with Home and at least one category link', function () {
    cy.get('.breadcrumbs.new_breadcrumbs').should('be.visible').within(() => {
      cy.get('a.breadcrumb-home').should('be.visible');
      cy.get('.breadcrumb-label').should('have.length.at.least', 2);
    });
  });

  it('shows a non-empty product title', function () {
    cy.get('h1.productView-title')
      .invoke('text')
      .should('not.be.empty');
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
    cy.get('button[data-action="inc"]').should('be.visible');
    cy.get('button[data-action="dec"]').should('be.visible');
  });

  it('Add to Cart button is visible and not disabled', function () {
    cy.get('#form-action-addToCart')
      .should('be.visible')
      .and('not.be.disabled');
  });

  // ─── Content sections ──────────────────────────────────────────────────────

  it('spec sheet links open PDFs in a new tab', function () {
    cy.get('a[href*=".pdf"]').should('have.length.at.least', 1).each(($a) => {
      expect($a.attr('href')).to.match(/\.pdf$/i);
      expect($a.attr('target')).to.eq('_blank');
    });
  });

  it('description section is present and has content', function () {
    cy.get('.productView-description1').invoke('text').should('not.be.empty');
  });

  it('YouTube video iframe is present when a video section exists', function () {
    cy.get('body').then(($body) => {
      if ($body.find('.product-video').length) {
        cy.get('.product-video iframe[data-src*="youtube"]').should('exist');
      }
    });
  });

  it('related products carousel renders with items', function () {
    cy.get('.content-carousel .owl-carousel').should('exist').children().should('have.length.at.least', 1);
  });

  it('reviews section and Yotpo widget are present', function () {
    cy.get('#productreviewbox').should('exist');
    cy.get('.yotpo-widget-instance')
      .should('exist')
      .invoke('attr', 'data-yotpo-product-id')
      .should('not.be.empty');
  });

  it('recently viewed SearchSpring script tag is present', function () {
    cy.get('script[type="searchspring/personalized-recommendations"][profile="recently-viewed"]').should('exist');
  });

  // ─── Product info request form ─────────────────────────────────────────────

  it('product info request form is present with required fields', function () {
    cy.get('#have_a_product_question_request').should('exist').within(() => {
      cy.get('form[action*="zohopublic"]').should('exist');
      cy.get('input[name="Name_First"]').should('exist');
      cy.get('input[name="Name_Last"]').should('exist');
      cy.get('input[name="Email"]').should('exist');
    });
  });

  // ─── SKU and meta ──────────────────────────────────────────────────────────

  it('SKU is displayed', function () {
    cy.get('[data-product-sku]').invoke('text').should('not.be.empty');
  });

  it('lead time / stock status is displayed', function () {
    cy.get('.leadtime_value').invoke('text').should('not.be.empty');
  });
});
