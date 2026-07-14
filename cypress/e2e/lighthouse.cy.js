import { pickRandom } from "../support/checks.js";
import { getStore, itIfStore, storePath, homePath } from "../support/store.js";

const site = getStore();

// Lighthouse only works in Chrome. This describe block skips itself in any other browser
// so the spec can be included in a full run without breaking Firefox runs.

// Mirrors the PageSpeed Insights desktop preset: light network throttling (40 ms RTT,
// 10 Mbps) with no CPU slowdown, desktop viewport. Scores will be close to PageSpeed
// desktop but not identical — infrastructure differences always introduce some variance.
const DESKTOP_OPTS = {
  formFactor: "desktop",
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
  throttlingMethod: "simulate",
};

// One uniform floor for every page type on every store (throttled desktop, headroom
// for variance), calibrated against a full 27-audit sweep of all 9 live stores
// (July 2 2026):
// - performance 50: homepage/PDP conversion-critical, PLP heaviest (faceted nav,
//   filters, image/JS weight) but still expected to clear 50
// - accessibility 60: healthy themes score 80-98, but several fleet themes carry
//   structural a11y gaps (ADC/BESTCA/FSE "footer-new", AAP touch targets) scoring
//   in the mid-60s; 60 is the honest fleet-wide floor that lets those pass while a
//   drop below it flags a NEW regression
// - best-practices 60: every BigCommerce storefront scores 67-75 (third-party
//   cookies, console noise, legacy APIs are platform-level), so 60 is the honest floor
// - seo 70: typical live scores are 83-92 with dips to 75; 70 keeps the check
//   meaningful while letting healthy pages pass (FSE's missing homepage meta
//   description scores 67 and correctly still fails)
// This is the single source of truth — no per-store or per-page overrides.
const LIGHTHOUSE_THRESHOLDS = {
  performance: 50,
  accessibility: 60,
  "best-practices": 60,
  seo: 70,
};

describe("Lighthouse audit", () => {
  before(function () {
    if (Cypress.browser.name !== "chrome") this.skip();
  });

  it("homepage meets score thresholds", () => {
    cy.visit(homePath());
    cy.lighthouse(LIGHTHOUSE_THRESHOLDS, DESKTOP_OPTS);
  });

  itIfStore(site.plp, "PLP meets score thresholds", () => {
    cy.visit(storePath(site.plp.main));
    cy.lighthouse(LIGHTHOUSE_THRESHOLDS, DESKTOP_OPTS);
  });

  itIfStore(site.pdp, "a random PDP meets score thresholds", () => {
    cy.visit(storePath(pickRandom(site.pdp.popular)));
    cy.lighthouse(LIGHTHOUSE_THRESHOLDS, DESKTOP_OPTS);
  });
});
