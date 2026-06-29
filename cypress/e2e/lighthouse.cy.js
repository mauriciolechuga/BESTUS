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

// Thresholds reflect actual throttled-desktop scores with headroom for variance.
// Unthrottled runs score higher; PageSpeed mobile runs score lower.
// These BESTUS-baseline defaults are overridable per store via the top-level `lighthouse.thresholds`
// in stores/<code>.json — different store themes have different baselines (e.g. ADC's "footer-new"
// theme has real accessibility deficiencies that floor it in the high 60s/low 70s). Adjust the
// per-store override (not these defaults) when a store's live-site baseline differs.
const THRESHOLD_DEFAULTS = { performance: 50, accessibility: 80, seo: 70 };
const THRESHOLDS = {
  ...THRESHOLD_DEFAULTS,
  ...((site.lighthouse && site.lighthouse.thresholds) || {}),
};

describe("Lighthouse audit", () => {
  before(function () {
    if (Cypress.browser.name !== "chrome") this.skip();
  });

  it.skip("homepage meets score thresholds", () => {
    cy.visit(homePath());
    cy.lighthouse(THRESHOLDS, DESKTOP_OPTS);
  });

  itIfStore.skip(site.plp, "PLP meets score thresholds", () => {
    cy.visit(storePath(site.plp.main));
    cy.lighthouse(THRESHOLDS, DESKTOP_OPTS);
  });

  itIfStore.skip(site.pdp, "a random PDP meets score thresholds", () => {
    cy.visit(storePath(pickRandom(site.pdp.popular)));
    cy.lighthouse(THRESHOLDS, DESKTOP_OPTS);
  });
});
