import { ZohoFormPage } from './ZohoFormPage.js';

export class QuoteFormPage extends ZohoFormPage {
  get path() { return '/request-a-quote/'; }
  get submitUrlPattern() { return '**/forms.zohopublic.com/**/submit'; }

  fillModel(v) {
    cy.get('input[name="SingleLine1"]').clear().type(v);
    return this;
  }

  fillSize(v) {
    cy.get('input[name="SingleLine2"]').clear().type(v);
    return this;
  }

  selectQuantity(v) {
    cy.get('select[name="Dropdown"]').select(v);
    return this;
  }

  fillAddress(v) {
    cy.get('input[name="SingleLine3"]').clear().type(v);
    return this;
  }
}
