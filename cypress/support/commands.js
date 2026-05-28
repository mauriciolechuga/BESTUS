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

/**
 * Asserts a Zoho validation error is shown for the field matched by `selector`.
 * Zoho renders errors in a sibling or ancestor container (not always an <li>), so we
 * scan all ancestors for an error/invalid class.
 */
Cypress.Commands.add('expectFieldError', (selector) => {
  cy.get(selector)
    .parents()
    .find('[class*="error"], [class*="invalid"], [class*="Error"]')
    .should('exist');
});

/**
 * Asserts every href under `selector` resolves without a 404. Skips in-page (#),
 * tel:, and mailto: links, plus any href containing a token in `exclude`.
 * @param {string} selector — e.g. 'header a[href]'
 * @param {{ exclude?: string[] }} options — extra substrings to skip (e.g. ['amazon','facebook'])
 */
Cypress.Commands.add('assertLinksResolve', (selector, options = {}) => {
  const exclude = options.exclude || [];
  cy.get(selector).then(($links) => {
    const hrefs = [
      ...new Set(
        [...$links]
          .map((a) => a.getAttribute('href'))
          .filter(
            (href) =>
              href &&
              !href.startsWith('#') &&
              !href.startsWith('tel:') &&
              !href.startsWith('mailto:') &&
              !exclude.some((token) => href.includes(token))
          )
      ),
    ];
    hrefs.forEach((href) => {
      const url = href.startsWith('http') ? href : `${Cypress.config('baseUrl')}${href}`;
      cy.request({ url, failOnStatusCode: false }).its('status').should('not.eq', 404);
    });
  });
});
