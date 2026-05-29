const { defineConfig } = require("cypress");

module.exports = defineConfig({
  allowCypressEnv: true,
  // Retry failed tests in `cypress run` to absorb transient live-site flake; never retry
  // interactively (openMode) so failures stay visible while debugging.
  retries: { runMode: 2, openMode: 0 },
  e2e: {
    baseUrl: "https://www.bestaccessdoors.com",
    viewportWidth: 1920,
    viewportHeight: 1080,
    defaultCommandTimeout: 15000,
    pageLoadTimeout: 60000,
    responseTimeout: 30000,
    screenshotsFolder: "cypress/screenshots",
    video: true,
    videosFolder: "cypress/videos",

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
