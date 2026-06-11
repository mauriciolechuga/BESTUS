const { defineConfig } = require("cypress");
const fs = require("fs");
const path = require("path");

// Store selection: every store ships its own JSON under stores/. The whole store
// object is injected into Cypress.env('site') so specs can read it synchronously
// at module-evaluation time (required for describe vs describe.skip gating).
const STORE = (process.env.STORE || "bestus").toLowerCase();
const storesDir = path.join(__dirname, "stores");
const storeFile = path.join(storesDir, `${STORE}.json`);
if (!fs.existsSync(storeFile)) {
  const available = fs.readdirSync(storesDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
    .sort();
  throw new Error(`Unknown STORE "${STORE}". Available stores: ${available.join(", ")}`);
}
const site = JSON.parse(fs.readFileSync(storeFile, "utf8"));
for (const key of ["storeCode", "baseUrl", "homePath"]) {
  if (!site[key]) throw new Error(`stores/${STORE}.json is missing required key "${key}"`);
}

module.exports = defineConfig({
  allowCypressEnv: true,
  // Retry failed tests in `cypress run` to absorb transient live-site flake; never retry
  // interactively (openMode) so failures stay visible while debugging.
  retries: { runMode: 2, openMode: 0 },
  // Cypress scrolls action targets to the viewport top by default, which lands them
  // under sticky headers (ADAP) and fails actionability with "hidden from view".
  // Centering keeps targets clear of sticky chrome on every store.
  scrollBehavior: 'center',
  e2e: {
    baseUrl: site.baseUrl,
    viewportWidth: 1920,
    viewportHeight: 1080,
    defaultCommandTimeout: 15000,
    pageLoadTimeout: 60000,
    responseTimeout: 30000,
    screenshotsFolder: `cypress/screenshots/${STORE}`,
    video: true,
    videosFolder: `cypress/videos/${STORE}`,
    env: { site, STORE },

    setupNodeEvents(on, config) {
      // Required inside setupNodeEvents so prepareAudit and lighthouse share the same
      // module instance (and thus the same internal launchArgs closure variable).
      const { lighthouse, prepareAudit } = require("@cypress-audit/lighthouse");

      on('before:browser:launch', (browser, launchOptions) => {
        prepareAudit(launchOptions);
        if (browser.name === 'chrome' || browser.name === 'chromium') {
          const version = browser.majorVersion;
          launchOptions.args.push(
            `--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version}.0.0.0 Safari/537.36`
          );
          launchOptions.args.push('--disable-blink-features=AutomationControlled');
        }
        return launchOptions;
      });
      on('task', { lighthouse: lighthouse() });
    }
  },
});
