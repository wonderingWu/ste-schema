#!/usr/bin/env node
/**
 * test-importer.mjs — regression test for scripts/import-osm-overpass.mjs.
 *
 * Replays the archived Overpass response (docs/compatibility/osm-bj-overpass-raw.json)
 * through the importer and asserts the exact expected outcome:
 *   - 6 entities converted, ALL passing ajv + reference validator
 *   - 8 records quarantined (1 wild start_date, 7 historic=yes)
 *
 * Run: node scripts/test-importer.mjs   (also wired into `npm test`)
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const rawPath = 'docs/compatibility/osm-bj-overpass-raw.json';
const tmp = mkdtempSync(join(tmpdir(), 'ste-import-test-'));
const outEntities = join(tmp, 'entities.json');
const outQuar = join(tmp, 'quarantine.json');

let failed = false;
const check = (label, cond, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${cond ? '' : '  ' + detail}`);
  if (!cond) failed = true;
};

let stdout = '';
try {
  stdout = execFileSync(process.execPath, ['scripts/import-osm-overpass.mjs', rawPath, outEntities, outQuar], { encoding: 'utf8' });
} catch (e) {
  stdout = (e.stdout || '') + (e.stderr || '');
  check('importer exits 0 (all converted entities dual-PASS)', false, `exit=${e.status}`);
}

const entities = JSON.parse(readFileSync(outEntities, 'utf8'));
const quarantine = JSON.parse(readFileSync(outQuar, 'utf8'));

check('converted count == 6', entities.length === 6, `got ${entities.length}`);
check('quarantine count == 8', quarantine.length === 8, `got ${quarantine.length}`);
check('quarantine: 1 wild start_date', quarantine.filter((q) => q.reason.includes('ohm_date')).length === 1);
check('quarantine: 7 historic=yes', quarantine.filter((q) => q.reason.includes('historic=yes')).length === 7);
check('all 6 entities dual-PASS in importer output', (stdout.match(/^PASS/gm) || []).length === 6);
check(
  'every entity carries external_ids.osm + R1 sources + description_provenance=imported',
  entities.every((e) =>
    e.external_ids?.osm?.id?.match(/^(node|way)\/[1-9]\d*$/) &&
    e.timeline?.[0]?.sources?.length >= 1 &&
    e.timeline?.[0]?.description_provenance === 'imported')
);
check('ste_version locked to "0.2"', entities.every((e) => e.ste_version === '0.2'));

rmSync(tmp, { recursive: true, force: true });
console.log(failed ? '\nRESULT: FAIL' : '\nRESULT: ALL GREEN');
process.exit(failed ? 1 : 0);
