#!/usr/bin/env node
/**
 * Guard: validator/ste-validator.js (canonical) and demo/ste-validator.js
 * (bundled copy for static hosting) must stay byte-identical.
 *
 * Run: node scripts/check-validator-sync.mjs
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const PAIRS = [
  ['validator/ste-validator.js', 'demo/ste-validator.js'],
];

let failed = false;
for (const [canonical, copy] of PAIRS) {
  let a, b;
  try {
    a = readFileSync(canonical);
    b = readFileSync(copy);
  } catch (e) {
    console.error(`::error::sync check failed to read ${canonical} or ${copy}: ${e.message}`);
    failed = true;
    continue;
  }
  const ha = createHash('sha256').update(a).digest('hex');
  const hb = createHash('sha256').update(b).digest('hex');
  if (ha !== hb) {
    console.error(`::error::${copy} is out of sync with ${canonical} — copy the canonical file over the demo copy.`);
    failed = true;
  } else {
    console.log(`OK (in sync): ${canonical} == ${copy}`);
  }
}
process.exit(failed ? 1 : 0);
