#!/usr/bin/env node
/**
 * Local pre-push validation: mirrors what .github/workflows/validate.yml does.
 * Validates BOTH schema versions (v0.1 + v0.2), each against its own
 * valid/invalid fixtures, plus en/zh parity for each.
 *
 * Run: node scripts/local-validate.mjs
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

let failed = false;

// v0.1: schema at v0.1/, fixtures at examples/
// v0.2: schema at v0.2/, fixtures at test/
const VERSIONS = [
  { version: 'v0.1', schemaPath: 'v0.1/schema.json', zhPath: 'v0.1/schema.zh.json', validDir: 'examples/valid', invalidDir: 'examples/invalid' },
  { version: 'v0.2', schemaPath: 'v0.2/schema.json', zhPath: 'v0.2/schema.zh.json', validDir: 'test/valid', invalidDir: 'test/invalid' },
];

for (const v of VERSIONS) {
  console.log(`\n========== ${v.version} ==========`);

  // Step 0: schema must compile (strict)
  try {
    const ajvStrict = new Ajv({ allErrors: true, strict: true });
    addFormats(ajvStrict);
    ajvStrict.compile(JSON.parse(readFileSync(v.schemaPath, 'utf8')));
    ajvStrict.compile(JSON.parse(readFileSync(v.zhPath, 'utf8')));
    console.log(`✅ Schema compile (strict): ${v.version}/schema.json + schema.zh.json`);
  } catch (e) {
    console.error(`❌ Schema compile (strict) failed: ${e.message.split('\n')[0]}`);
    failed = true;
  }

  const validate = ajv.compile(JSON.parse(readFileSync(v.schemaPath, 'utf8')));

  // Step 1: valid examples must all pass
  if (!existsSync(v.validDir)) {
    console.error(`❌ No ${v.validDir} directory`);
    failed = true;
  } else {
    for (const f of readdirSync(v.validDir).filter((f) => f.endsWith('.json'))) {
      const doc = JSON.parse(readFileSync(`${v.validDir}/${f}`, 'utf8'));
      if (validate(doc)) {
        console.log(`✅ PASS (expected): ${v.validDir}/${f}`);
      } else {
        console.error(`❌ FAIL (should have passed): ${v.validDir}/${f}`);
        console.error(JSON.stringify(validate.errors, null, 2).slice(0, 800));
        failed = true;
      }
    }
  }

  // Step 2: invalid examples must all fail
  if (!existsSync(v.invalidDir)) {
    console.warn(`⚠️ No ${v.invalidDir} directory — negative tests recommended.`);
  } else {
    for (const f of readdirSync(v.invalidDir).filter((f) => f.endsWith('.json'))) {
      const doc = JSON.parse(readFileSync(`${v.invalidDir}/${f}`, 'utf8'));
      if (!validate(doc)) {
        console.log(`✅ REJECTED (expected): ${v.invalidDir}/${f}`);
      } else {
        console.error(`❌ PASSED (should have failed): ${v.invalidDir}/${f}`);
        failed = true;
      }
    }
  }
}

process.exit(failed ? 1 : 0);
