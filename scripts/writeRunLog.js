/**
 * Append a human-readable proof-of-run block to results/test-results.log.
 *
 * Called from the Cypress `after:run` Node event (registered in
 * cypress.config.js), which fires once per `cypress run` process with the run
 * results object. Single-store runs and each store in `npm run test:all`
 * (one process per store) therefore each append their own block automatically.
 *
 * History is preserved — every run appends; the latest run is the last block.
 * The log is local-only (results/ is gitignored): proof for the operator, not
 * a CI artifact. Any failure here is swallowed so logging never breaks a run.
 */
const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'results');
const LOG_FILE = path.join(LOG_DIR, 'test-results.log');
const RULE = '═'.repeat(60);
const SUBRULE = '─'.repeat(60);

// ms -> "Xm Ys" (or "Ys" under a minute)
function formatDuration(ms) {
  const totalSeconds = Math.round((ms || 0) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

// Local timestamp "YYYY-MM-DD HH:MM:SS"
function formatTimestamp(value) {
  const d = value ? new Date(value) : new Date();
  const p = (n) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ` +
    `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
  );
}

// "12 passed, 1 pending" — only non-zero buckets, in a stable order
function describeStats(stats) {
  const parts = [];
  if (stats.passes) parts.push(`${stats.passes} passed`);
  if (stats.failures) parts.push(`${stats.failures} failed`);
  if (stats.pending) parts.push(`${stats.pending} pending`);
  if (stats.skipped) parts.push(`${stats.skipped} skipped`);
  return parts.length ? parts.join(', ') : 'no tests';
}

function appendRunLog(results, store) {
  try {
    const runs = Array.isArray(results.runs) ? results.runs : [];

    const browser = [results.browserName, results.browserVersion]
      .filter(Boolean)
      .join(' ') || 'unknown browser';
    const cypressVersion = results.cypressVersion
      ? `Cypress ${results.cypressVersion}`
      : 'Cypress';

    const totalPassed = results.totalPassed ?? 0;
    const totalFailed = results.totalFailed ?? 0;
    const totalPending = results.totalPending ?? 0;
    const totalSkipped = results.totalSkipped ?? 0;
    const totalTests = results.totalTests ?? 0;
    const outcome = totalFailed === 0 ? 'PASS' : 'FAIL';

    const lines = [];
    lines.push(RULE);
    lines.push(
      `Run: ${formatTimestamp(results.startedTestsAt)}  |  ` +
      `Store: ${store}  |  ${browser}  |  ${cypressVersion}`
    );
    lines.push(
      `Result: ${outcome}  |  Duration: ${formatDuration(results.totalDuration)}`
    );
    lines.push(
      `Totals: ${totalTests} tests — ${totalPassed} passed, ` +
      `${totalFailed} failed, ${totalPending} pending, ${totalSkipped} skipped`
    );
    lines.push(SUBRULE);

    for (const run of runs) {
      const spec = (run.spec && run.spec.relative) || '(unknown spec)';
      const stats = run.stats || {};
      const specOutcome = (stats.failures ?? 0) === 0 ? 'PASS' : 'FAIL';
      lines.push(`  ${specOutcome}  ${spec.padEnd(40)} ${describeStats(stats)}`);
    }

    lines.push(RULE);
    lines.push('');

    fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(LOG_FILE, lines.join('\n') + '\n', 'utf8');
    // eslint-disable-next-line no-console
    console.log(`\n📝 Run logged to results/test-results.log (${outcome})`);
  } catch (err) {
    // Never let logging break the run.
    // eslint-disable-next-line no-console
    console.error(`writeRunLog: failed to append run log — ${err.message}`);
  }
}

module.exports = { appendRunLog };
