import { ZohoFormPage } from './ZohoFormPage.js';

export class ProClubFormPage extends ZohoFormPage {
  get path() { return '/pro-club-application/'; }

  fillAddress1(v) {
    cy.get('input[name="Address_AddressLine1"]').clear().type(v);
    return this;
  }

  fillAddress2(v) {
    cy.get('input[name="Address_AddressLine2"]').clear().type(v);
    return this;
  }

  fillCity(v) {
    cy.get('input[name="Address_City"]').clear().type(v);
    return this;
  }

  fillRegion(v) {
    cy.get('input[name="Address_Region"]').clear().type(v);
    return this;
  }

  fillZip(v) {
    cy.get('input[name="Address_ZipCode"]').clear().type(v);
    return this;
  }

  selectCountry(v) {
    // Option text must match exactly. Verify "Canada" vs "CA" on first run.
    cy.get('select[name="Address_Country"]').select(v);
    return this;
  }
}
