import './commands';
import 'cypress-real-events';
import '@cypress-audit/lighthouse/commands';
import { blockThirdParty, THIRD_PARTY_HOSTS, KNOWN_BUGGY_SCRIPTS } from './checks';

// Block analytics/tracking before every test. Mobile specs (testIsolation:false) also call
// blockThirdParty() in their before() hooks, since that hook runs before this beforeEach.
beforeEach(() => {
  blockThirdParty();
});

// Suppress uncaught exceptions, but only when they're attributable to a third party (or a known,
// already-triaged first-party defect) rather than a first-party regression. Three cases:
//  1. A cross-origin script (no CORS headers) throws — the browser redacts all detail per the
//     Same-Origin Policy. Cypress wraps that redaction into its own fixed explanatory message
//     ("...error was thrown from a cross origin script...") rather than the browser's bare
//     "Script error.", so match on Cypress's wording, not the raw browser message. On these live
//     storefronts this fires constantly from vendor scripts we don't control, so it's expected
//     noise. (Note: same-origin scripts CAN also lose their stack this way — see case 3.)
//  2. A real, attributable error (message + stack) whose stack traces back to a known third-party
//     host blockThirdParty() stubs at the network layer (THIRD_PARTY_HOSTS).
//  3. An error matching a KNOWN_BUGGY_SCRIPTS entry — either by stack (a vendor script we
//     deliberately leave running for real, e.g. Zoho SalesIQ) or by message (a same-origin script
//     loaded as a raw external <script src>, e.g. BESTUS's tracking_code.js, whose own parse-time
//     SyntaxError comes back with no stack at all, same redacted shape as case 1).
// Anything else — including any exception with a real, attributable stack that isn't one of our
// known vendors/defects — is treated as first-party and allowed to fail the test as normal.
Cypress.on('uncaught:exception', (err) => {
  Cypress.log({ name: 'Uncaught Error', message: err.message });
  const isRedactedCrossOrigin = /cross origin script/i.test(err.message);
  const stack = err.stack || '';
  const isKnownThirdParty = THIRD_PARTY_HOSTS.some(({ pattern }) => pattern.test(stack));
  const isKnownBuggyScript = KNOWN_BUGGY_SCRIPTS.some(
    ({ stackPattern, messagePattern }) =>
      (stackPattern && stackPattern.test(stack)) ||
      (messagePattern && messagePattern.test(err.message))
  );
  return !(isRedactedCrossOrigin || isKnownThirdParty || isKnownBuggyScript);
});

