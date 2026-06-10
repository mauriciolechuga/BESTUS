import { ZohoFormPage } from './ZohoFormPage.js';
import { getStore } from '../store.js';

export class QuoteFormPage extends ZohoFormPage {
  get path() { return getStore().forms.quoteRequest.path; }

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
    // Address field exists on the BESTUS quote form but not on every store's (ADAP omits it).
    cy.get('body').then(($body) => {
      if ($body.find('input[name="SingleLine3"]').length) {
        cy.get('input[name="SingleLine3"]').clear().type(v);
      }
    });
    return this;
  }
}
