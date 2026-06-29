#!/usr/bin/env node
/**
 * Run the Cypress suite against every store (or a subset), one store at a time.
 * Cypress cannot switch baseUrl mid-run, so each store gets its own process.
 * Failures don't stop the loop; a summary table prints at the end and the exit
 * code is nonzero if any store failed.
 *
 *   node scripts/run-all.js
 *   node scripts/run-all.js --stores bestus,bestca
 *   node scripts/run-all.js --stores bestus --spec "cypress/e2e/seo.cy.js"
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { SUMMARY_DIR } = require('./writeRunLog');

const storesDir = path.join(__dirname, '..', 'stores');
const LOG_FILE = path.join(__dirname, '..', 'results', 'test-results.log');
const RULE = '═'.repeat(60);

function availableStores() {
  return fs.readdirSync(storesDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''))
    .sort();
}

const args = process.argv.slice(2);
const all = availableStores();
let stores = all;
const cypressArgs = [];

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--stores') {
    stores = (args[++i] || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  } else {
    cypressArgs.push(args[i]);
  }
}

const unknown = stores.filter((s) => !all.includes(s));
if (unknown.length) {
  console.error(`Unknown store(s): ${unknown.join(', ')}. Available: ${all.join(', ')}`);
  process.exit(1);
}

// Default to Chrome unless the caller already passed --browser.
if (!cypressArgs.includes('--browser')) cypressArgs.push('--browser', 'chrome');

const results = [];

// Clear stale per-store sidecars so the aggregate only reflects this run.
for (const store of stores) {
  try { fs.rmSync(path.join(SUMMARY_DIR, `${store}.json`)); } catch { /* none yet */ }
}

const runStarted = Date.now();
console.log(`\n▶ Test run started ${new Date().toLocaleString()}  —  ${stores.length} store(s): ${stores.join(', ')}`);

for (const store of stores) {
  console.log(`\n${'═'.repeat(70)}\n▶ Store: ${store}  —  started ${new Date().toLocaleString()}\n${'═'.repeat(70)}\n`);
  const started = Date.now();
  const result = spawnSync('npx', ['cypress', 'run', ...cypressArgs], {
    stdio: 'inherit',
    shell: true, // required on Windows for npx
    env: { ...process.env, STORE: store },
  });
  results.push({
    store,
    ok: result.status === 0,
    minutes: ((Date.now() - started) / 60000).toFixed(1),
  });
}

// Pull each store's failure detail from the sidecar the after:run hook wrote.
function loadSummary(store) {
  try {
    return JSON.parse(fs.readFileSync(path.join(SUMMARY_DIR, `${store}.json`), 'utf8'));
  } catch {
    return null; // crashed before after:run, or logging failed
  }
}

const wallMinutes = ((Date.now() - runStarted) / 60000).toFixed(1);
const testSeconds = results.reduce((sum, r) => {
  const s = loadSummary(r.store);
  return sum + (s ? s.durationMs : 0) / 1000;
}, 0);
const testTime = `${Math.floor(testSeconds / 60)}m ${Math.round(testSeconds % 60)}s`;

// Build the aggregate summary (printed to console AND appended to the log).
const summary = [];
summary.push(RULE);
summary.push(`RUN-ALL SUMMARY  |  ${new Date().toLocaleString()}  |  ${stores.length} store(s)`);
summary.push(`Total test time: ${testTime}  |  Wall clock: ${wallMinutes} min`);
summary.push(RULE);
for (const { store, ok, minutes } of results) {
  const s = loadSummary(store);
  const totals = s ? `${s.totals.totalFailed} failed / ${s.totals.totalTests}` : '(no data)';
  summary.push(`  ${ok ? '✔ PASS' : '✘ FAIL'}  ${store.padEnd(10)} ${String(minutes).padStart(5)} min   ${totals}`);
  if (s && s.failedSpecs.length) {
    for (const spec of s.failedSpecs) {
      summary.push(`           ↳ ${spec.spec} (${spec.failures})`);
      for (const t of spec.tests) summary.push(`               • ${t}`);
    }
  }
}
summary.push(RULE);

const block = summary.join('\n');
console.log(`\n${block}\n`);
console.log(`▶ Test run finished ${new Date().toLocaleString()}\n`);

// Persist the aggregate alongside the per-store blocks (best-effort).
try {
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
  fs.appendFileSync(LOG_FILE, block + '\n\n', 'utf8');
} catch (err) {
  console.error(`run-all: failed to append summary to log — ${err.message}`);
}

process.exit(results.every((r) => r.ok) ? 0 : 1);
