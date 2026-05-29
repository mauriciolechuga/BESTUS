import { pickRandom } from '../support/checks.js';

// Lighthouse only works in Chrome. This describe block skips itself in any other browser
// so the spec can be included in a full run without breaking Firefox runs.

// Mirrors the PageSpeed Insights desktop preset: light network throttling (40 ms RTT,
// 10 Mbps) with no CPU slowdown, desktop viewport. Scores will be close to PageSpeed
// desktop but not identical — infrastructure differences always introduce some variance.
const DESKTOP_OPTS = {
  formFactor: 'desktop',
  screenEmulation: {
    mobile: false,
    width: 1350,
    height: 940,
    deviceScaleFactor: 1,
    disabled: false,
  },
  throttling: {
    rttMs: 40,
    throughputKbps: 10240,
    cpuSlowdownMultiplier: 1,
    requestLatencyMs: 0,
    downloadThroughputKbps: 0,
    uploadThroughputKbps: 0,
  },
  throttlingMethod: 'simulate',
};

// Thresholds reflect actual throttled-desktop scores with headroom for variance.
// Unthrottled runs score higher; PageSpeed mobile runs score lower.
// Adjust here if the site's baseline shifts.
const THRESHOLDS = { performance: 50, accessibility: 80, seo: 70 };

describe('Lighthouse audit', () => {
  before(function () {
    if (Cypress.browser.name !== 'chrome') this.skip();
  });

  it('homepage meets score thresholds', () => {
    cy.visit('/');
    cy.lighthouse(THRESHOLDS, DESKTOP_OPTS);
  });

  it('PLP meets score thresholds', () => {
    cy.visit('/products/');
    cy.lighthouse(THRESHOLDS, DESKTOP_OPTS);
  });

  it('a random PDP meets score thresholds', () => {
    cy.fixture('site').then((site) => {
      cy.visit(pickRandom(site.pdp.popular));
      cy.lighthouse(THRESHOLDS, DESKTOP_OPTS);
    });
  });
});
