#!/usr/bin/env node
/**
 * Local pre-push validation: mirrors what .github/workflows/validate.yml does.
 * Run: node scripts/local-validate.mjs
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const schema = JSON.parse(readFileSync('v0.1/schema.json', 'utf8'));
const validate = ajv.compile(schema);

let failed = false;

// Step 1: valid examples must all pass
const validDir = 'examples/valid';
if (!existsSync(validDir)) {
  console.error('❌ No examples/valid directory');
  process.exit(1);
}
for (const f of readdirSync(validDir).filter((f) => f.endsWith('.json'))) {
  const doc = JSON.parse(readFileSync(`${validDir}/${f}`, 'utf8'));
  if (validate(doc)) {
    console.log(`✅ PASS (expected): examples/valid/${f}`);
  } else {
    console.error(`❌ FAIL (should have passed): examples/valid/${f}`);
    console.error(JSON.stringify(validate.errors, null, 2));
    failed = true;
  }
}

// Step 2: invalid examples must all fail
const invalidDir = 'examples/invalid';
if (!existsSync(invalidDir)) {
  console.warn('⚠️ No examples/invalid directory — negative tests recommended.');
} else {
  for (const f of readdirSync(invalidDir).filter((f) => f.endsWith('.json'))) {
    const doc = JSON.parse(readFileSync(`${invalidDir}/${f}`, 'utf8'));
    if (!validate(doc)) {
      console.log(`✅ REJECTED (expected): examples/invalid/${f}`);
    } else {
      console.error(`❌ PASSED (should have failed): examples/invalid/${f}`);
      failed = true;
    }
  }
}

process.exit(failed ? 1 : 0);
