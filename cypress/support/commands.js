import { uniqueEmail } from './utils/uniqueEmail.js';
import { setupZohoIntercept } from './utils/zohoIntercept.js';
import { getStore } from './store.js';

Cypress.Commands.add('uniqueEmail', () => {
  return cy.wrap(uniqueEmail(getStore().testEmailTemplate), { log: false });
});

/**
 * Fills all persona fields that the page object supports.
 * Duck-typed: calls a fill method only if it exists on the page object.
 */
Cypress.Commands.add('fillPersona', (formPage, persona, email) => {
  if (typeof formPage.fillFirstName     === 'function') formPage.fillFirstName(persona.firstName);
  if (typeof formPage.fillLastName      === 'function') formPage.fillLastName(persona.lastName);
  if (typeof formPage.fillCompany       === 'function') formPage.fillCompany(persona.company);
  if (typeof formPage.fillWebsite       === 'function') formPage.fillWebsite(persona.website);
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
 * Asserts hrefs under `selector` resolve without a 404. Skips in-page (#), tel:,
 * mailto:, and non-http(s) (javascript: etc.) links, plus any href containing a
 * token in `exclude`. Links are deduplicated by origin+path+query (hash dropped).
 *
 * Mega-menu headers can hold 1,000+ unique links, and serial cy.request calls made
 * this take many minutes — so same-origin links are checked with parallel fetch()
 * batches (no CORS same-origin), and when they exceed `sample` a random sample is
 * checked instead: each run samples differently, so coverage accumulates across runs.
 * External links are few and stay on serial cy.request (fetch would hit CORS).
 *
 * @param {string} selector — e.g. 'header a[href]'
 * @param {{ exclude?: string[], sample?: number|false }} options — `exclude`: substrings
 *   to skip (e.g. ['amazon','facebook']); `sample`: max same-origin links per run
 *   (default 50, pass false to always check all)
 */
Cypress.Commands.add('assertLinksResolve', (selector, options = {}) => {
  const exclude = options.exclude || [];
  const sample = options.sample === undefined ? 50 : options.sample;

  cy.get(selector).then(($links) => {
    const baseOrigin = new URL(Cypress.config('baseUrl')).origin;
    const seen = new Set();
    const sameOrigin = [];
    const external = [];

    [...$links].forEach((a) => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('tel:') || href.startsWith('mailto:')) return;
      if (exclude.some((token) => href.includes(token))) return;
      let url;
      try {
        url = new URL(href, Cypress.config('baseUrl'));
      } catch {
        return;
      }
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
      const target = url.origin + url.pathname + url.search;
      if (seen.has(target)) return;
      seen.add(target);
      (url.origin === baseOrigin ? sameOrigin : external).push(target);
    });

    const toCheck =
      sample && sameOrigin.length > sample
        ? [...sameOrigin].sort(() => Math.random() - 0.5).slice(0, sample)
        : sameOrigin;

    cy.then({ timeout: 120000 }, async () => {
      const broken = [];
      for (let i = 0; i < toCheck.length; i += 10) {
        await Promise.all(
          toCheck.slice(i, i + 10).map(async (url) => {
            try {
              const res = await fetch(url, { redirect: 'follow' });
              if (res.status === 404) broken.push(`${url} -> 404`);
            } catch (e) {
              broken.push(`${url} -> ${e.message}`);
            }
          })
        );
      }
      expect(
        broken,
        `broken links (checked ${toCheck.length} of ${sameOrigin.length} same-origin)`
      ).to.be.empty;
    });

    external.forEach((url) => {
      cy.request({ url, failOnStatusCode: false }).its('status').should('not.eq', 404);
    });
  });
});
