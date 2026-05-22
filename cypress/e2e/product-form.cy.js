import { ProductFormPage } from '../support/pages/ProductFormPage.js';

function getMultipartField(body, fieldName) {
  const re = new RegExp(`name="${fieldName}"\\r\\n\\r\\n([^\\r]*)`, '');
  const match = body.match(re);
  return match ? match[1] : null;
}

describe('Product information form', () => {
  let page;
  let persona;
  let submitPattern;
  let site;

  before(() => {
    cy.fixture('site').then((s) => {
      site = s;
      submitPattern = s.forms.productInfo.submitUrlPattern;
    });
    cy.fixture('personas').then((p) => { persona = p.primary; });
  });

  beforeEach(() => {
    page = new ProductFormPage(
      site,
      Cypress.env('PRODUCT_URL') || null,
      !!Cypress.env('RANDOMIZE_PRODUCT')
    );
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

    function expectFieldError(selector) {
      cy.get(selector)
        .parents()
        .find('[class*="error"], [class*="invalid"], [class*="Error"]')
        .should('exist');
    }

    it('shows an error when First Name is empty', () => {
      cy.uniqueEmail().then((email) => {
        cy.fillPersona(page, { ...persona, firstName: 'SKIP' }, email);
        cy.get('input[name="Name_First"]').clear();
        page.submit();
        cy.get('@submit.all').should('have.length', 0);
        expectFieldError('input[name="Name_First"]');
      });
    });

    it('shows an error when Last Name is empty', () => {
      cy.uniqueEmail().then((email) => {
        cy.fillPersona(page, { ...persona, lastName: 'SKIP' }, email);
        cy.get('input[name="Name_Last"]').clear();
        page.submit();
        cy.get('@submit.all').should('have.length', 0);
        expectFieldError('input[name="Name_Last"]');
      });
    });

    it('shows an error when Email is empty', () => {
      cy.uniqueEmail().then((email) => {
        cy.fillPersona(page, { ...persona }, email);
        cy.get('input[name="Email"]').clear();
        page.submit();
        cy.get('@submit.all').should('have.length', 0);
        expectFieldError('input[name="Email"]');
      });
    });

    it('shows an error when Email is malformed', () => {
      cy.fillPersona(page, persona, 'not-an-email');
      page.submit();
      cy.get('@submit.all').should('have.length', 0);
      expectFieldError('input[name="Email"]');
    });

    it('shows an error when Details are empty', () => {
      cy.uniqueEmail().then((email) => {
        cy.fillPersona(page, { ...persona, details: 'SKIP' }, email);
        cy.get('textarea[name="MultiLine"]').clear();
        page.submit();
        cy.get('@submit.all').should('have.length', 0);
        expectFieldError('textarea[name="MultiLine"]');
      });
    });

    it('does not submit the form when required fields are missing', () => {
      page.submit();
      cy.get('@submit.all').should('have.length', 0);
    });
  });
});
