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

const storesDir = path.join(__dirname, '..', 'stores');

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

const results = [];

for (const store of stores) {
  console.log(`\n${'═'.repeat(70)}\n▶ Store: ${store}\n${'═'.repeat(70)}\n`);
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

console.log(`\n${'═'.repeat(70)}\nSummary\n${'═'.repeat(70)}`);
for (const { store, ok, minutes } of results) {
  console.log(`  ${ok ? '✔ PASS' : '✘ FAIL'}  ${store.padEnd(10)} ${minutes} min`);
}
console.log('');

process.exit(results.every((r) => r.ok) ? 0 : 1);
