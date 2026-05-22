import { ZohoFormPage } from './ZohoFormPage.js';
import { pickProduct } from '../utils/pickProduct.js';

export class ProductFormPage extends ZohoFormPage {
  /**
   * @param {object} site — parsed site.json fixture
   * @param {string|null} productUrlOverride — Cypress.env('PRODUCT_URL'), resolved by caller
   * @param {boolean} randomize — Cypress.env('RANDOMIZE_PRODUCT'), resolved by caller
   */
  constructor(site, productUrlOverride, randomize) {
    super();
    this._site = site;
    this._path = pickProduct(site, productUrlOverride || null, !!randomize);
  }

  get path() { return this._path; }
  get submitUrlPattern() { return this._site.forms.productInfo.submitUrlPattern; }

  fillDetails(v) {
    cy.get('textarea[name="MultiLine"]').clear().type(v);
    return this;
  }

  // SingleLine2 = Lead Website — intentionally not provided.
  // Expected to be auto-populated by the page's JS on load.
  // If validation fails on first run, add fillLeadWebsite() here.
}
