/**
 * Store config access + per-store gating helpers.
 *
 * The active store's JSON (stores/<STORE>.json) is injected into Cypress.env('site')
 * by cypress.config.js, so it is available synchronously when spec files are
 * evaluated — which is what lets describeIfStore choose describe vs describe.skip
 * at collection time. This module is the only place that should read Cypress.env('site').
 */

export function getStore() {
  const site = Cypress.env('site');
  if (!site) {
    throw new Error(
      'Store config missing — was Cypress launched via cypress.config.js with a valid STORE env var?'
    );
  }
  return site;
}

/**
 * Conditional suite: when `condition` is falsy (store lacks the feature or it is
 * not configured yet), the suite runs as describe.skip so it shows up as pending
 * in the results instead of silently disappearing.
 */
export function describeIfStore(condition, title, options, fn) {
  if (typeof options === 'function') {
    fn = options;
    options = undefined;
  }
  const block = condition ? describe : describe.skip;
  const fullTitle = condition
    ? title
    : `${title} [skipped: not configured for ${getStore().storeCode}]`;
  return options ? block(fullTitle, options, fn) : block(fullTitle, fn);
}

/** Same as describeIfStore, at the individual-test level. */
export function itIfStore(condition, title, fn) {
  const block = condition ? it : it.skip;
  const fullTitle = condition
    ? title
    : `${title} [skipped: not configured for ${getStore().storeCode}]`;
  return block(fullTitle, fn);
}

// Footer markup for the BESTUS theme ("tcs" footer). Other stores run different
// BigCommerce themes (e.g. BESTCA uses footer.footer with h5.footer-info-heading),
// so any of these can be overridden per store via branding.footer in stores/<code>.json.
const FOOTER_DEFAULTS = {
  rootSelector: 'footer.tcsFooter',
  sections: ['footer .footer-top', 'footer .footer-bottom', 'footer .Copyright'],
  headingSelector: 'footer .box h3',
  headings: ["WHAT'S IN STORE", 'SECURE SHOPPING', 'MY ACCOUNT', 'Contact Info'],
  navLinks: 'footer .box ul li a',
  contactInfoBox: 'footer .Contact-info-box',
  minContactBoxes: 3,
  minPhoneLinks: 2,
  copyright: 'footer .Copyright p',
  paymentIcons: 'footer .footer-payment-icons',
};

/** The store's footer selectors/expectations: BESTUS defaults merged with branding.footer. */
export function footerConfig() {
  const { branding } = getStore();
  return { ...FOOTER_DEFAULTS, ...((branding && branding.footer) || {}) };
}

/**
 * Builds a visitable URL from a store-relative path, honoring the store's
 * visitQuery quirk (e.g. AAP requires ?redirect=disable on every visit).
 */
export function storePath(p) {
  const { visitQuery } = getStore();
  if (!visitQuery) return p;
  return p + (p.includes('?') ? '&' : '?') + visitQuery;
}

/** The store's homepage path (FSE's homepage is /new-home/, not /). */
export function homePath() {
  return storePath(getStore().homePath || '/');
}
