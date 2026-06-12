import { ProClubFormPage } from '../support/pages/ProClubFormPage.js';
import { getMultipartField } from '../support/utils/getMultipartField.js';
import { getStore, describeIfStore, itIfStore } from '../support/store.js';

const site = getStore();
const proClubForm = site.forms && site.forms.proClub;
const submitPattern = proClubForm && proClubForm.submitUrlPattern;
// Some Pro Club forms have no country dropdown (BESTCA's Canada-only form) — gate the
// country-specific tests on it.
const hasCountry = proClubForm && proClubForm.hasCountry !== false;

describeIfStore(proClubForm, 'Pro Club Application form', () => {
  let page;
  let persona;

  before(() => {
    cy.fixture('personas').then((p) => { persona = p.primary; });
  });

  beforeEach(() => {
    page = new ProClubFormPage();
  });

  describe('Happy path', () => {
    it('submits successfully with all required fields filled', () => {
      cy.uniqueEmail().then((email) => {
        cy.interceptZoho('submit', submitPattern);
        page.visit().scrollToForm();
        cy.fillPersona(page, persona, email);
        page.submit();
        cy.wait('@submit').its('response.statusCode').should('be.oneOf', [200, 302]);
      });
    });

    itIfStore(hasCountry, 'submits successfully with a non-US country selected', () => {
      cy.uniqueEmail().then((email) => {
        cy.interceptZoho('submit', submitPattern);
        page.visit().scrollToForm();
        cy.fillPersona(page, { ...persona, country: 'Canada' }, email);
        page.submit();
        cy.wait('@submit').then((interception) => {
          const body = interception.request.body;
          expect(getMultipartField(body, 'Name_First')).to.equal(persona.firstName);
          expect(getMultipartField(body, 'Email')).to.equal(email);
        });
      });
    }, "store's Pro Club form has no country field (forms.proClub.hasCountry is false)");

    it('sends user-entered values in the request payload', () => {
      cy.uniqueEmail().then((email) => {
        cy.interceptZoho('submit', submitPattern);
        page.visit().scrollToForm();
        cy.fillPersona(page, persona, email);
        page.submit();
        cy.wait('@submit').then((interception) => {
          const body = interception.request.body;
          expect(getMultipartField(body, 'Name_First')).to.equal(persona.firstName);
          expect(getMultipartField(body, 'Name_Last')).to.equal(persona.lastName);
          expect(getMultipartField(body, 'Email')).to.equal(email);
        });
      });
    });
  });

  describe('Validation (negative paths)', () => {
    beforeEach(() => {
      page.visit().scrollToForm();
      cy.interceptZoho('submit', submitPattern);
    });

    itIfStore(hasCountry, 'defaults the country dropdown to a placeholder selection', () => {
      cy.get('select[name="Address_Country"]').should(($sel) => {
        const selected = $sel.val();
        expect(selected).to.satisfy(
          (v) => !v || v === '' || v === '-Select-' || v === '--',
          `Expected placeholder, got "${selected}"`
        );
      });
    }, "store's Pro Club form has no country field (forms.proClub.hasCountry is false)");

    it('shows an error when Email is empty', () => {
      cy.uniqueEmail().then((email) => {
        cy.fillPersona(page, { ...persona }, email);
        cy.get('input[name="Email"]').clear();
        page.submit();
        cy.get('@submit.all').should('have.length', 0);
        cy.expectFieldError('input[name="Email"]');
      });
    });

    // Pro Club form does not enforce client-side validation on Name fields or
    // malformed email — those tests are omitted as they reflect Zoho's form config,
    // not a gap in test coverage.

    it('does not submit the form when required fields are missing', () => {
      page.submit();
      cy.get('@submit.all').should('have.length', 0);
    });
  });
});
