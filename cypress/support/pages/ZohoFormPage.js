export class ZohoFormPage {
  get path() {
    throw new Error('ZohoFormPage subclass must define path');
  }

  visit() {
    cy.visit(this.path);
    return this;
  }

  scrollToForm() {
    cy.get('form#form').scrollIntoView();
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
        cy.get('input[name="PhoneNumber_countrycodeval"]').clear().type(code);
      }
    });
    cy.get('input[name="PhoneNumber_countrycode"]').clear().type(number);
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
