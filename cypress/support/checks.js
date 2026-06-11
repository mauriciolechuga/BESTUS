/**
 * Shared, importable assertion helpers used across specs. Each issues Cypress commands
 * and is safe to call inside an `it`. Grouped assertions live here (rather than as custom
 * commands) so they read as plain functions with their rationale documented alongside.
 */

import { getStore, homePath, footerConfig, pdpSelectors, anyHeaderSelector } from './store.js';

const PRODUCT_CARD = 'ul.productGrid li.product';
const PRODUCT_TITLE = '.card-title';
const PRODUCT_PRICE = '[class*="price"]';
// Container that holds a card's price(s). We read EVERY $-amount inside it and take the minimum
// (see readCardPrice) rather than targeting one element, because the live store's price markup
// varies by product: a sale card glues RRP+sale ("$75.96$54.25"), a multi-variant/range card shows
// a "from–to" span ("$27.98 – $50.08"), and a plain card shows one price. In all three the value
// SearchSpring sorts on (calculated_price) is the *lowest* amount shown, so min is correct and
// markup-agnostic — and it naturally skips the higher RRP without needing the effective-price node.
const CARD_PRICE_CONTAINER = '.product-item-price, .price-section, [data-product-price-without-tax], [class*="price"]';
const SEARCH_INPUT =
  'input[name="search_query"], input[type="search"], input[placeholder*="Search"], input[aria-label*="Search"]';
// The live store sorts via a native SearchSpring select (name/id "ss__sort--select"). The generic
// fallbacks are kept for other BAD stores that may render BigCommerce-native sort controls.
const SORT_SELECT =
  'select[name="ss__sort--select"], select#ss__sort--select, select[name*="sort"], select[id*="sort"], select[name="sort"], select#sort, .actionBar select, .ss__sort select, select[aria-label*="Sort"], select[title*="Sort"]';
const SORT_ACTION =
  'a[href*="sort."], a[href*="sort="], button, [role="button"], [role="option"], [data-sort], [class*="sort"] a';

const normaliseText = (text) => text.replace(/\s+/g, ' ').trim();

// Returns a card's effective/sort price as a number: the minimum $-amount found in its price
// container (handles sale RRP+price, "from–to" ranges, and plain prices — see CARD_PRICE_CONTAINER).
// Returns null when the card shows no parseable price (e.g. quote-only items).
const readCardPrice = (card) => {
  const el = card.querySelector(CARD_PRICE_CONTAINER);
  if (!el) return null;
  const amounts = (el.textContent.replace(/,/g, '').match(/\$\s*\d+(?:\.\d{1,2})?/g) || [])
    .map((m) => Number(m.replace(/[^0-9.]/g, '')))
    .filter((n) => !Number.isNaN(n));
  return amounts.length ? Math.min(...amounts) : null;
};

/** Waits for the product grid to populate. */
export const waitForProducts = (min = 1) =>
  cy.get(PRODUCT_CARD, { timeout: 20000 }).should('have.length.at.least', min);

/** Picks a random element from a non-empty list. */
export const pickRandom = (list) => list[Math.floor(Math.random() * list.length)];

/**
 * Stubs noisy third-party analytics / ad / visitor-tracking beacons (GA, GTM, Meta, Reddit,
 * Spotify, Taboola, leadsy, PageSense, Geotargetly, etc. — full list inline below) with an empty
 * 204 so their fetches resolve cleanly instead of rejecting and logging "Failed to fetch" to
 * console.error. The host list was derived by auditing every resource the live site loads (see the
 * throwaway cypress/e2e/_audit-hosts.cy.js). Store-functional vendors (SearchSpring search API,
 * Yotpo reviews, Zoho forms, PayPal, fonts, library CDNs) are deliberately NOT blocked.
 * Regexes (not globs) are used so they match the request's subdomain host, e.g.
 * www.google-analytics.com or wvbknd.leadsy.ai — a glob matching the host as a path segment would
 * not, because the host is a single URL authority segment, not a path segment.
 *
 * Registered globally in e2e.js `beforeEach` for specs that visit inside each test. Mobile specs
 * that share one visit under `testIsolation:false` must ALSO call this at the top of their `before()`
 * — that hook runs before the global `beforeEach`, so without it the initial visit's beacons fire
 * unintercepted and fail the console-error check.
 */
export function blockThirdParty() {
  const stub = { statusCode: 204, body: '' };

  // Analytics / tag managers
  cy.intercept(/google-analytics\.com/, stub);
  cy.intercept(/googletagmanager\.com/, stub);
  cy.intercept(/analytics\.google\.com/, stub);
  cy.intercept(/gaconnector\.com/, stub);            // GA Connector — lead-source tracking
  cy.intercept(/pagesense/, stub);                   // Zoho PageSense heatmaps (cdn.pagesense.io + *.zoho.com collectors)

  // Ad / social pixels
  cy.intercept(/facebook\.(com|net)/, stub);         // Meta pixel (fbevents.js + www.facebook.com)
  cy.intercept(/reddit\.com/, stub);                 // Reddit Ads pixel
  cy.intercept(/redditstatic\.com/, stub);
  cy.intercept(/spotify\.com/, stub);                // Spotify ad pixel (pixels.spotify.com + pixel.byspotify.com)
  cy.intercept(/taboola\.com/, stub);                // Taboola content/ad network

  // Visitor tracking / fingerprinting / affiliate
  cy.intercept(/leadsy\.ai/, stub);
  cy.intercept(/iesnare\.com/, stub);                // iovation/LexisNexis device fingerprinting
  cy.intercept(/geotargetly/, stub);                 // Geotargetly geo personalization
  cy.intercept(/affiliatly\.com/, stub);             // Affiliatly affiliate tracking

  // Vendor sub-trackers — the functional API/UI for each vendor stays loaded, only its
  // tracking beacons are stubbed.
  cy.intercept(/analytics\.searchspring\.net/, stub); // SearchSpring analytics (search API kept)
  cy.intercept(/beacon\.searchspring\.io/, stub);     // SearchSpring beacon (search API kept)
  cy.intercept(/salesiq\.zohopublic\.com/, stub);     // Zoho SalesIQ live-chat widget
}

/** Asserts the first `limit` product cards each have an image, title, price, and link. */
export function assertProductCards(limit = 3) {
  cy.get(PRODUCT_CARD).each(($li, i) => {
    if (i >= limit) return false;
    cy.wrap($li).within(() => {
      cy.get('.card-figure img').should('exist').invoke('attr', 'src').should('not.be.empty');
      cy.get(PRODUCT_TITLE).invoke('text').should('not.be.empty');
      cy.get(PRODUCT_PRICE).invoke('text').should('match', /\$[\d,]+(\.\d{2})?/);
      cy.get('.card-figure a, .card-title a')
        .first()
        .invoke('attr', 'href')
        .should('not.be.empty')
        .and('include', '/');
    });
  });
}

export function getVisibleProductTitles(limit = 12) {
  return cy.get(PRODUCT_CARD).then(($cards) =>
    [...$cards].slice(0, limit).map((card) => normaliseText(card.querySelector(PRODUCT_TITLE)?.textContent || ''))
  );
}

export function performHeaderSearch(term) {
  cy.visit(homePath());
  cy.get(SEARCH_INPUT, { timeout: 15000 }).then(($inputs) => {
    const input = $inputs.filter(':visible').first()[0] || $inputs.first()[0];
    cy.wrap(input).clear({ force: true }).type(term, { force: true });
    const $form = Cypress.$(input).closest('form');
    if ($form.length) {
      cy.wrap($form).submit();
    } else {
      cy.wrap(input).type('{enter}', { force: true });
    }
  });
  // Confirm we actually navigated to a search-results URL. `products` is deliberately not
  // accepted here — almost every BigCommerce URL contains it, so it would mask a search that
  // never fired. SearchSpring/BigCommerce search uses search_query or the _bc_fsnf facet param.
  cy.location('href', { timeout: 20000 }).should('match', /search_query|\/search|_bc_fsnf/i);
}

export function assertSearchResults(expectedTokens = []) {
  waitForProducts();
  assertProductCards(3);
  if (!expectedTokens.length) return;

  cy.get(PRODUCT_CARD).then(($cards) => {
    const text = normaliseText([...$cards].map((card) => card.textContent).join(' ')).toLowerCase();
    const matched = expectedTokens.some((token) => text.includes(token.toLowerCase()));
    expect(matched, `At least one result contains one of: ${expectedTokens.join(', ')}`).to.eq(true);
  });
}

export function assertNoSearchResults() {
  // The empty-state is rendered client-side by SearchSpring; its exact wording should be
  // confirmed against the live site. To stay robust we accept EITHER a recognised no-results
  // message OR an empty product grid, while still rejecting hard error pages.
  cy.get('body', { timeout: 20000 }).should(($body) => {
    const text = normaliseText($body.text());
    expect(text, 'page body is not blank').to.not.equal('');
    // \b404\b: product model numbers like "W4048" in mega-menu text contain "404".
    expect(text, 'not a generic error page').not.to.match(/\b404\b|page not found|server error|forbidden/i);

    const hasNoResultsMessage =
      /no (products|results|matches)|0 results|did not match|could not find|couldn't find|nothing matches|try (again|a different)/i.test(
        text
      );
    const hasNoProducts = $body.find(PRODUCT_CARD).length === 0;
    expect(
      hasNoResultsMessage || hasNoProducts,
      'shows a no-results message or an empty product grid'
    ).to.eq(true);
  });
}

export function assertDiscoveryPage({ heading } = {}) {
  // filter(':visible'): some themes (ADAP) render a hidden mobile-only h1 first.
  // Include bare .page-heading: ADAP's desktop title is <p class="h1 page-heading
  // page-heading--desktopOnly"> — its only real <h1> is the hidden mobile-only one.
  cy.get('h1.page-heading, .page-heading, h1').filter(':visible').first().should('be.visible').invoke('text').should('not.be.empty');
  if (heading) cy.get('h1.page-heading, .page-heading, h1').filter(':visible').first().should('contain.text', heading);
  cy.get('.breadcrumbs.new_breadcrumbs, .breadcrumbs').should('exist');
  cy.get('.categories-left, #searchspring-sidebar, [class*="facets"], [class*="filter"]').should('exist');
  waitForProducts();
  assertProductCards(3);
}

export function applySortOption(label, urlFallback = { urlHash: '#/ps:calculated_price:asc' }) {
  // Normalise to a space-separated, alphanumeric phrase so "Price (Low to High)",
  // "Price: Low to High", etc. all reduce to "price low to high". Matching the contiguous
  // phrase (not loose tokens) is what distinguishes "low to high" from "high to low".
  const normalise = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const phrase = normalise(label);
  const tokens = phrase.split(' ').filter(Boolean);
  const matchesPhrase = (text) => {
    const t = normalise(text);
    return t.includes(phrase) || tokens.every((token) => t.includes(token) && !t.includes('high to low'));
  };

  return cy.get('body', { timeout: 15000 }).then(($body) => {
    // SORT_SELECT can match non-sort selects too (ADAP's per-page "20/40/60" select
    // sits before the real sort select in the DOM), so scan every match — visible
    // ones first — for the select that actually contains a matching option.
    const selects = [...$body.find(SORT_SELECT)].sort(
      (a, b) => (Cypress.$(b).is(':visible') ? 1 : 0) - (Cypress.$(a).is(':visible') ? 1 : 0)
    );
    for (const select of selects) {
      const option = [...select.options].find((o) => matchesPhrase(`${o.textContent} ${o.value}`));
      if (option) {
        return cy.wrap(select).select(option.value || option.textContent, { force: true }).then(() => waitForProducts());
      }
      // No option label in this select matches the store's wording — try the next
      // matched select, then the action links / URL fallback below.
    }

    const actions = [...$body.find(SORT_ACTION)].filter((el) =>
      matchesPhrase(`${el.textContent} ${el.getAttribute('href') || ''} ${el.getAttribute('data-sort') || ''}`)
    );
    const action = actions.find((el) => Cypress.$(el).is(':visible')) || actions[0];
    if (action) {
      return cy.wrap(action).click({ force: true }).then(() => waitForProducts());
    }

    // Fallback: drive the sort via the URL. The live store is hash-routed
    // (…/products/#/ps:calculated_price:asc); other stores may use a query param.
    return cy.location('href').then((href) => {
      const url = new URL(href);
      if (urlFallback.urlHash) {
        url.hash = urlFallback.urlHash;
      } else if (urlFallback.queryParam) {
        url.searchParams.set(urlFallback.queryParam, urlFallback.queryValue);
      }
      return cy.visit(`${url.pathname}${url.search}${url.hash}`).then(() => waitForProducts());
    });
  });
}

/**
 * Verifies a sort actually applied, without depending on readable prices. Many products show
 * "Call for pricing" (no $ amount) and sort to the TOP of an ascending price sort, so the visible
 * grid can carry zero numeric prices — making a strict price-order assertion impossible. Instead:
 *   1. the URL hash reflects the chosen sort (proves the price-asc sort is active), and
 *   2. the grid re-rendered to a different product order than `previousTitles` (proves it took effect).
 * As a bonus, IF any priced products are visible, they must be ascending — but this never fails the
 * test when the page is all price-less. cy.get(...).should(cb) retries to wait out the re-render.
 */
export function assertSortApplied(previousTitles, { expectedHash } = {}) {
  if (expectedHash) {
    const key = expectedHash.replace(/^#\/?/, '');
    cy.location('hash', { timeout: 20000 }).should('include', key);
  }
  cy.get(PRODUCT_CARD, { timeout: 20000 }).should(($cards) => {
    const cards = [...$cards];
    const titles = cards
      .slice(0, previousTitles.length)
      .map((c) => normaliseText(c.querySelector(PRODUCT_TITLE)?.textContent || ''));
    expect(titles, 'grid re-rendered to a different product order after sorting').to.not.deep.eq(previousTitles);

    const prices = cards.map((c) => readCardPrice(c)).filter((p) => p !== null);
    if (prices.length >= 2) {
      expect(prices, 'visible priced products ordered low to high').to.deep.eq([...prices].sort((a, b) => a - b));
    }
  });
}

export function assertPaginationAdvanced(previousTitles) {
  // BESTUS paginates with pp=2; other SearchSpring templates use p=2 (ADAP), page=2, or #...page:2.
  cy.location('href', { timeout: 20000 }).should('match', /\b(?:pp|page|p)[=:]2\b/);
  cy.get('.ss__pagination, .ss-pagination-container').filter(':visible').first().within(() => {
    cy.get('.ss-page.ss-active, [aria-current="page"], .pagination-item--current')
      .should('contain.text', '2');
  });
  waitForProducts();
  getVisibleProductTitles().then((currentTitles) => {
    expect(currentTitles, 'page 2 products differ from page 1').not.to.deep.eq(previousTitles);
  });
}

/** Asserts the page does not overflow horizontally beyond `maxWidth + 15px tolerance`. */
export function assertNoHorizontalOverflow(maxWidth) {
  // body.scrollWidth > viewport width means content spills off-screen, forcing the user
  // to scroll horizontally — the most common mobile layout bug. Allow 15px tolerance for
  // scrollbar width (6–15px varies by OS/browser), subpixel rendering, and carousel settle.
  cy.window().then((win) => {
    // Wait for content to stabilize by checking if document.body has finished laying out
    cy.get('body').should('exist');
    cy.get('html').should('exist');
    const doc = win.document;
    if (doc.body.scrollWidth <= maxWidth + 15) return;

    // body.scrollWidth also counts content clipped by an overflow-x:hidden/auto
    // ancestor — content the user can never scroll to (ADAP's slick-carousel tracks
    // are thousands of px wide inside clipped .slick-list wrappers). Only elements
    // whose overflow escapes every clipping ancestor produce user-visible overflow,
    // so fail on those — and name them, so a failure pinpoints the broken element.
    const isClipped = (el) => {
      for (let p = el.parentElement; p && p !== doc.documentElement; p = p.parentElement) {
        const ox = win.getComputedStyle(p).overflowX;
        if (ox === 'hidden' || ox === 'clip' || ox === 'auto' || ox === 'scroll') return true;
      }
      return false;
    };
    const describe = (el) => {
      const id = el.id ? `#${el.id}` : '';
      const cls = String(el.className).trim().split(/\s+/).slice(0, 2).filter(Boolean).join('.');
      return `${el.tagName.toLowerCase()}${id}${cls ? '.' + cls : ''}@${Math.round(el.getBoundingClientRect().right)}px`;
    };
    // Per-store exclusions (branding.overflowIgnore) for third-party widgets that
    // mis-size themselves under Cypress's per-test viewport reset (1920 → device)
    // but render correctly on real devices — ADAP's Yotpo carousel .scroller was
    // verified overflow-free in a live browser at these widths.
    const ignore = (getStore().branding && getStore().branding.overflowIgnore) || [];
    const offenders = [...doc.body.querySelectorAll('*')]
      .filter((el) => el.getBoundingClientRect().right > maxWidth + 15 && !isClipped(el))
      .filter((el) => !ignore.some((s) => el.closest(s)))
      .slice(0, 5)
      .map(describe);
    expect(
      offenders,
      `unclipped elements extending past the ${maxWidth}px viewport (body.scrollWidth=${doc.body.scrollWidth})`
    ).to.be.empty;
  });
}

/**
 * Asserts the tallest visible interactive header element is at least `minHeight` px.
 * Uses Math.max (not .first()) because DOM order puts small utility/skip links first;
 * the real question is whether there is at least one prominently-sized tappable element.
 */
export function assertMaxTouchTarget(minHeight) {
  // Whichever header the theme shows at this width (mobile or desktop) is the
  // one the user taps, so measure interactive elements across both containers.
  const selector = anyHeaderSelector()
    .split(', ')
    .map((h) => `${h} a[href], ${h} button`)
    .join(', ');
  cy.get(selector)
    .filter(':visible')
    .filter((i, el) => el.getBoundingClientRect().height > 0)
    .should('have.length.at.least', 1)
    .then(($els) => {
      const maxHeight = Math.max(...[...$els].map((el) => el.getBoundingClientRect().height));
      expect(maxHeight, 'Tallest header interactive element height').to.be.gte(minHeight);
    });
}

/** Asserts the breadcrumb trail has a Home link and at least two labels. */
export function assertBreadcrumbs() {
  // Selectors are theme-dependent (see PDP_SELECTOR_DEFAULTS in store.js); home/label
  // checks only run when the store's theme has those elements.
  const sel = pdpSelectors();
  cy.get(sel.breadcrumbs).should('be.visible').within(() => {
    if (sel.breadcrumbHome) cy.get(sel.breadcrumbHome).should('be.visible');
    if (sel.breadcrumbLabel) cy.get(sel.breadcrumbLabel).should('have.length.at.least', 2);
  });
}

/** Asserts the on-PDP "have a product question" Zoho form is present with its required fields. */
export function assertProductInfoForm() {
  cy.get(pdpSelectors().productInfoForm).should('exist').within(() => {
    cy.get('form[action*="zohopublic"]').should('exist');
    cy.get('input[name="Name_First"]').should('exist');
    cy.get('input[name="Name_Last"]').should('exist');
    cy.get('input[name="Email"]').should('exist');
  });
}

/**
 * Asserts the footer's sections are present along with their heading text.
 * Selectors and expected headings come from the store's footer config (theme-dependent —
 * see FOOTER_DEFAULTS in store.js and branding.footer in stores/<code>.json).
 * @param {'exist'|'be.visible'} mode — desktop footer is visible; mobile footer is display:none.
 */
export function assertFooterHeadings(mode = 'exist') {
  const footer = footerConfig();
  cy.get(footer.rootSelector).should(mode);
  footer.sections.forEach((selector) => cy.get(selector).should(mode));

  cy.get(footer.headingSelector).then(($headings) => {
    const texts = [...$headings].map((el) => {
      const clone = el.cloneNode(true);
      clone.querySelectorAll('svg').forEach((svg) => svg.remove());
      return clone.textContent.trim();
    });
    footer.headings.forEach((heading) => expect(texts).to.include(heading));
  });
}

/** Asserts <title> and <meta name="description"> are present and non-empty. */
export function assertMetaTags() {
  cy.title().should('not.be.empty');
  cy.get('meta[name="description"]')
    .invoke('attr', 'content')
    .should('not.be.empty');
}

/**
 * Finds the JSON-LD block with @type "Product" and asserts the key fields observed on
 * live PDPs: name, sku, description, image, offers.price, offers.priceCurrency,
 * offers.availability.
 */
export function assertProductJsonLd() {
  cy.get('script[type="application/ld+json"]').then(($scripts) => {
    const blocks = [...$scripts].map((el) => {
      try { return JSON.parse(el.textContent); } catch { return null; }
    }).filter(Boolean);
    // Third-party widgets (Yotpo, etc.) can inject their own Product blocks at runtime
    // that omit fields like sku. Require sku to ensure we match the site-rendered block.
    const product = blocks.find((b) => b['@type'] === 'Product' && typeof b.sku === 'string');
    expect(product, 'JSON-LD Product block with sku').to.exist;
    expect(product.name, 'product name').to.be.a('string').and.not.be.empty;
    expect(product.sku, 'product sku').to.be.a('string').and.not.be.empty;
    expect(product.description, 'product description').to.be.a('string').and.not.be.empty;
    expect(product.image, 'product image').to.be.a('string').and.not.be.empty;
    expect(product.offers?.price, 'offers.price').to.match(/^\d+(\.\d+)?$/);
    expect(product.offers?.priceCurrency, 'offers.priceCurrency').to.equal('USD');
    expect(product.offers?.availability, 'offers.availability').to.be.a('string').and.not.be.empty;
  });
}

/**
 * Creates a console.error spy to attach at page-load time and assert on later.
 * Returns { onBeforeLoad, assertClean }. Uses a closure ref (not a cy alias) so it
 * survives across tests that share a single visit under testIsolation:false.
 *
 *   const consoleErrors = makeConsoleErrorSpy();
 *   before(() => cy.visit(url, { onBeforeLoad: consoleErrors.onBeforeLoad }));
 *   it('has no console errors', () => consoleErrors.assertClean());
 */
// Known noisy third-party beacons (GA/GTM/analytics/leadsy) are blocked at the network layer
// in e2e.js — returning 204 so their fetch resolves and never logs "Failed to fetch". We prefer
// blocking by URL over string-ignoring here, so this list is empty by default and a real fetch
// failure surfaces. Add a substring only for console noise that can't be blocked by URL.
const DEFAULT_IGNORE = [];

/**
 * @param {string[]} [ignore] - extra substrings; merged with DEFAULT_IGNORE. Calls whose
 *   first arg contains any matching substring are excluded from the assertion.
 */
export function makeConsoleErrorSpy({ ignore = [] } = {}) {
  const ignoreList = [...DEFAULT_IGNORE, ...ignore];
  const ref = {};
  return {
    onBeforeLoad: (win) => {
      ref.spy = cy.spy(win.console, 'error');
      // Wrap fetch so failed requests are re-logged with their URL, making it easy
      // to identify which script triggered "Failed to fetch" in assertClean output.
      const origFetch = win.fetch.bind(win);
      win.fetch = (...args) =>
        origFetch(...args).catch((err) => {
          win.console.error(`[fetch failed] ${args[0]}`, err);
          return Promise.reject(err);
        });
    },
    assertClean: () =>
      cy.then(() => {
        // Build the full text of a console.error call from ALL its args. The fetch wrapper logs
        // "[fetch failed] <url>" as the first arg and the Error (whose message is "Failed to
        // fetch") as the second, so the ignore list must scan every arg — not just args[0] — or
        // DEFAULT_IGNORE's "Failed to fetch" never matches third-party beacon noise (leadsy.ai, etc).
        const callText = (args) =>
          args.map((a) => (a instanceof Error ? `${a.message} ${a.stack || ''}` : String(a))).join(' ');
        const calls = (ref.spy.args || []).filter(
          (args) => !ignoreList.some((substr) => callText(args).includes(substr))
        );
        if (calls.length) {
          const summary = calls.map((args) => {
            const first = args[0];
            const msg = (first instanceof Error && first.stack)
              ? first.stack
              : args.map(String).join(' ');
            return msg;
          }).join('\n\n  ');
          throw new Error(`Expected no console.error calls, but got ${calls.length}:\n  ${summary}`);
        }
      }),
  };
}
