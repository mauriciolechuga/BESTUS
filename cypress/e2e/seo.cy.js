import { assertMetaTags, assertProductJsonLd, pickRandom } from '../support/checks.js';

const PLP = '/products/';

// ─── Homepage ──────────────────────────────────────────────────────────────────
describe('SEO – Homepage', { testIsolation: false }, () => {
  before(() => {
    cy.visit('/');
  });

  it('has a non-empty <title>', () => {
    cy.title().should('not.be.empty');
  });

  it('has a non-empty meta description', () => {
    cy.get('meta[name="description"]').invoke('attr', 'content').should('not.be.empty');
  });
});

// ─── Product Listing Page ──────────────────────────────────────────────────────
describe('SEO – PLP', { testIsolation: false }, () => {
  before(() => {
    cy.visit(PLP);
  });

  it('has a non-empty <title>', () => {
    cy.title().should('not.be.empty');
  });

  it('has a non-empty meta description', () => {
    cy.get('meta[name="description"]').invoke('attr', 'content').should('not.be.empty');
  });
});

// ─── Product Detail Page ───────────────────────────────────────────────────────
describe('SEO – PDP', { testIsolation: false }, () => {
  before(() => {
    cy.fixture('site').then((site) => {
      cy.visit(pickRandom(site.pdp.popular));
    });
  });

  it('has a non-empty <title>', () => {
    cy.title().should('not.be.empty');
  });

  it('has a non-empty meta description', () => {
    cy.get('meta[name="description"]').invoke('attr', 'content').should('not.be.empty');
  });

  it('has a JSON-LD Product block with name, sku, price, currency, and availability', () => {
    assertProductJsonLd();
  });
});
