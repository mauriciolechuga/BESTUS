import './commands';
import 'cypress-real-events';
import '@cypress-audit/lighthouse/commands';
import { blockThirdParty } from './checks';

// Block analytics/tracking before every test. Mobile specs (testIsolation:false) also call
// blockThirdParty() in their before() hooks, since that hook runs before this beforeEach.
beforeEach(() => {
  blockThirdParty();
});

// Suppress uncaught errors from third-party scripts
Cypress.on('uncaught:exception', (err) => {
  Cypress.log({ name: 'Uncaught Error', message: err.message });
  return false;
});

