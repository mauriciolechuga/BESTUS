import './commands';
import 'cypress-real-events';
import '@cypress-audit/lighthouse/commands';

// Block analytics before every test
beforeEach(() => {

  cy.intercept('**/google-analytics.com/**', { statusCode: 204, body: '' });
  cy.intercept('**/googletagmanager.com/**', { statusCode: 204, body: '' });
  cy.intercept('**/analytics.google.com/**', { statusCode: 204, body: '' });
});

// Suppress uncaught errors from third-party scripts
Cypress.on('uncaught:exception', (err) => {
  Cypress.log({ name: 'Uncaught Error', message: err.message });
  return false;
});

