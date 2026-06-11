import { storePath } from '../store.js';

export class ZohoFormPage {
  get path() {
    throw new Error('ZohoFormPage subclass must define path');
  }

  visit() {
    cy.visit(storePath(this.path));
    return this;
  }

  scrollToForm() {
    // The Zoho form's id varies by store theme (form#form on BESTUS, no id on ADAP) —
    // target it by its submit action instead.
    cy.get('form[action*="zohopublic"]').first().scrollIntoView();
    return this;
  }

  fillFirstName(v) {
    cy.get('input[name="Name_First"]').clear().type(v);
    return this;
  }

  fillLastName(v) {
    cy.get('input[name="Name_Last"]').clear().type(v);
    return this;
  }

  fillCompany(v) {
    cy.get('input[name="SingleLine"]').first().clear().type(v);
    return this;
  }

  fillEmail(v) {
    cy.get('input[name="Email"]').clear().type(v);
    return this;
  }

  fillPhone(code, number) {
    // Country code input is only present on some Zoho forms (e.g. quote form).
    cy.get('body').then(($body) => {
      if ($body.find('input[name="PhoneNumber_countrycodeval"]').length) {
        cy.get('input[name="PhoneNumber_countrycodeval"]').clear({ force: true }).type(code, { force: true });
      }
    });
    // force: Zoho's floating label fully overlays this input (and ADAP PDPs add a
    // sticky product bar), so Cypress actionability rejects a field real users can
    // fill normally. Forced typing still drives the real input and zf validation.
    cy.get('input[name="PhoneNumber_countrycode"]').scrollIntoView().clear({ force: true }).type(number, { force: true });
    return this;
  }

  submit() {
    cy.get('button.zf-submitColor').click({ force: true });
    return this;
  }

  expectSuccess() {
    cy.contains(/thank you|received|we'll be in touch/i).should('be.visible');
    return this;
  }
}
