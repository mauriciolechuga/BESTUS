import { uniqueEmail } from './utils/uniqueEmail.js';
import { setupZohoIntercept } from './utils/zohoIntercept.js';

Cypress.Commands.add('uniqueEmail', () => {
  return cy.fixture('site').then((site) => uniqueEmail(site.testEmailTemplate));
});

/**
 * Fills all persona fields that the page object supports.
 * Duck-typed: calls a fill method only if it exists on the page object.
 */
Cypress.Commands.add('fillPersona', (formPage, persona, email) => {
  if (typeof formPage.fillFirstName     === 'function') formPage.fillFirstName(persona.firstName);
  if (typeof formPage.fillLastName      === 'function') formPage.fillLastName(persona.lastName);
  if (typeof formPage.fillCompany       === 'function') formPage.fillCompany(persona.company);
  if (typeof formPage.fillEmail         === 'function') formPage.fillEmail(email);
  if (typeof formPage.fillPhone         === 'function') formPage.fillPhone(persona.phoneCode, persona.phoneNumber);
  if (typeof formPage.fillDetails       === 'function') formPage.fillDetails(persona.details);
  if (typeof formPage.fillMessage       === 'function') formPage.fillMessage(persona.details);
  if (typeof formPage.selectInquiryType === 'function') formPage.selectInquiryType(persona.inquiryType);
  if (typeof formPage.fillAddress1      === 'function') formPage.fillAddress1(persona.address1);
  if (typeof formPage.fillAddress2      === 'function' && persona.address2) formPage.fillAddress2(persona.address2);
  if (typeof formPage.fillCity          === 'function') formPage.fillCity(persona.city);
  if (typeof formPage.fillRegion        === 'function') formPage.fillRegion(persona.region);
  if (typeof formPage.fillZip           === 'function') formPage.fillZip(persona.zip);
  if (typeof formPage.selectCountry     === 'function') formPage.selectCountry(persona.country);
  if (typeof formPage.fillModel         === 'function') formPage.fillModel(persona.model);
  if (typeof formPage.fillSize          === 'function') formPage.fillSize(persona.size);
  if (typeof formPage.selectQuantity    === 'function') formPage.selectQuantity(persona.quantity);
  if (typeof formPage.fillAddress       === 'function') formPage.fillAddress(persona.address1);
});

Cypress.Commands.add('interceptZoho', (alias, urlPattern) => {
  const liveSubmit =
    Cypress.env('LIVE_SUBMIT') === true &&
    Cypress.env('I_KNOW_THIS_IS_LIVE') === true;
  setupZohoIntercept(alias, urlPattern, liveSubmit);
});
