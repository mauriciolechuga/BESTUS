import { ZohoFormPage } from './ZohoFormPage.js';

export class ContactFormPage extends ZohoFormPage {
  get path() { return '/contact-us/'; }
  get submitUrlPattern() { return '**/forms.zohopublic.com/**/submit'; }

  selectInquiryType(v) {
    // Zoho may use name="Dropdown" or a label-relative selector.
    // If this is ambiguous on first run, scope with .first() or switch to:
    //   cy.contains('label', /inquiry/i).next('select').select(v)
    cy.get('select[name="Dropdown"]').first().select(v);
    return this;
  }

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

  fillMessage(v) {
    cy.get('textarea[name="MultiLine"]').clear().type(v);
    return this;
  }

  attachFile(fixturePath) {
    cy.get('input[type="file"]').selectFile(`cypress/fixtures/${fixturePath}`, { force: true });
    return this;
  }
}
