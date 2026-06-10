import { assertMetaTags, assertProductJsonLd, pickRandom } from '../support/checks.js';
import { getStore, describeIfStore, storePath, homePath } from '../support/store.js';

const site = getStore();
const PLP = site.plp && storePath(site.plp.main);

// ─── Homepage ──────────────────────────────────────────────────────────────────
describe('SEO – Homepage', { testIsolation: false }, () => {
  before(() => {
    cy.visit(homePath());
  });

  it('has a non-empty <title>', () => {
    cy.title().should('not.be.empty');
  });

  it('has a non-empty meta description', () => {
    cy.get('meta[name="description"]').invoke('attr', 'content').should('not.be.empty');
  });
});

// ─── Product Listing Page ──────────────────────────────────────────────────────
describeIfStore(site.plp, 'SEO – PLP', { testIsolation: false }, () => {
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
describeIfStore(site.pdp, 'SEO – PDP', { testIsolation: false }, () => {
  before(() => {
    cy.visit(storePath(pickRandom(site.pdp.popular)));
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
