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
  // Some themes (BESTCA) render tel links as siblings of the contact-info label
  // elements rather than inside them, so the phone-link selector is independent.
  phoneLinks: 'footer .Contact-info-box a[href^="tel:"]',
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
 * Header container selector. The BESTUS theme uses a semantic <header> element, but
 * ADAP's theme has none — its desktop header is div.desktop-header-section and its
 * mobile header div.iPad_header — so stores override via branding.headerSelector
 * and branding.mobileHeaderSelector (the latter falls back to the former).
 */
export function headerSelector() {
  const { branding } = getStore();
  return (branding && branding.headerSelector) || 'header';
}

/** Mobile header container selector (defaults to headerSelector()). */
export function mobileHeaderSelector() {
  const { branding } = getStore();
  return (branding && branding.mobileHeaderSelector) || headerSelector();
}

/**
 * Selector matching the mobile AND desktop header containers (deduplicated).
 * Mobile specs assert on this with .filter(':visible') because themes switch
 * headers at their own breakpoints — ADAP hides .iPad_header above ~1000px
 * (iPad Pro portrait is 1024px wide) and shows its desktop header instead.
 */
export function anyHeaderSelector() {
  return [...new Set([mobileHeaderSelector(), headerSelector()])].join(', ');
}

/**
 * Mobile navigation drawer selector. BESTUS renders div.mobile-menu; ADAP's theme
 * uses a #mySidenav slide-out instead. Overridden via branding.mobileNavSelector.
 */
export function mobileNavSelector() {
  const { branding } = getStore();
  return (branding && branding.mobileNavSelector) || 'div.mobile-menu';
}

// PLP structure selectors for the BESTUS theme. Nullable keys (breadcrumbHome, sidebar,
// bestSellers, subcategoryBox) make their tests skip when a store sets them to null.
// Overridden per store via plp.selectors (see stores/adap.json).
const PLP_SELECTOR_DEFAULTS = {
  breadcrumbs: '.breadcrumbs.new_breadcrumbs',
  breadcrumbHome: 'a.breadcrumb-home',
  sidebar: '.categories-left',
  sidebarBlocks: '.categories-left .sidebarBlock',
  sidebarLinks: '.categories-left .navList-item a',
  bestSellers: '#treeView li a',
  subcategoryBox: '.subCategoriesBox',
  // Detailed pagination markup (BESTUS SearchSpring template). Stores on the older
  // template (ADAP: .ss-pagination-container/.pagination-item) set this to null —
  // the generic pagination-presence test and the discovery page-2 test still run.
  pagination: {
    container: '.ss__pagination',
    active: '.ss-page.ss-active',
    links: 'a.ss-page-link',
    next: '.ss-page-next a.ss-page-link',
    pageTwoToken: 'pp=2',
  },
};

/** The store's PLP structure selectors: BESTUS defaults merged with plp.selectors. */
export function plpSelectors() {
  const { plp } = getStore();
  return { ...PLP_SELECTOR_DEFAULTS, ...((plp && plp.selectors) || {}) };
}

// PDP structure selectors for the BESTUS theme. Nullable keys (breadcrumbHome,
// breadcrumbLabel, relatedCarousel, productInfoForm) make their checks skip when null.
// Overridden per store via pdp.selectors (see stores/adap.json).
const PDP_SELECTOR_DEFAULTS = {
  breadcrumbs: '.breadcrumbs.new_breadcrumbs',
  breadcrumbHome: 'a.breadcrumb-home',
  breadcrumbLabel: '.breadcrumb-label',
  galleryImage: 'section[data-image-gallery] .thumbnail_image',
  description: '.productView-description1',
  relatedCarousel: '.content-carousel .owl-carousel',
  productInfoForm: '#have_a_product_question_request',
  pdfNewTab: true,
};

/** The store's PDP structure selectors: BESTUS defaults merged with pdp.selectors. */
export function pdpSelectors() {
  const { pdp } = getStore();
  return { ...PDP_SELECTOR_DEFAULTS, ...((pdp && pdp.selectors) || {}) };
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
