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
