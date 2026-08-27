#!/usr/bin/env node
/**
 * import-osm-overpass.mjs — third-party data compatibility importer (N3).
 *
 * Converts OSM elements fetched via the Overpass API (historic features with
 * name + start_date) into STE v0.2 entities, then validates each entity with
 * BOTH ajv (v0.2/schema.json) and the reference validator
 * (validator/ste-validator.js, globalThis.validateSTE).
 *
 * Conversion policy (no invention; anything not mappable is quarantined):
 *   - coordinates  <- element lat/lon (node) or center (way)
 *   - timeline[0]  <- { start_date, name, type: historic tag value, sources }
 *   - start_date   <- OSM start_date, but MUST match the ohm_date pattern;
 *                     e.g. "2004.7" is rejected to quarantine, not "fixed"
 *   - historic=yes <- quarantined: no meaningful type value
 *   - sources      <- the OSM element URL (R1)
 *   - description  <- import note, description_provenance: "imported"
 *   - external_ids.osm <- { id: "type/id", verified: false }
 *   - tags         <- original OSM tags; non-OSM keys carry the ste: prefix
 *
 * Usage:
 *   node scripts/import-osm-overpass.mjs <overpass.json> <out-entities.json> <out-quarantine.json>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
require('../validator/ste-validator.js'); // registers globalThis.validateSTE
const validateSTE = globalThis.validateSTE;

const OHM_DATE = /^-?\d{4}(-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?)?$/;

const [inPath, outPath, quarPath] = process.argv.slice(2);
if (!inPath || !outPath || !quarPath) {
  console.error('usage: node scripts/import-osm-overpass.mjs <overpass.json> <out-entities.json> <out-quarantine.json>');
  process.exit(2);
}

const raw = JSON.parse(readFileSync(inPath, 'utf8'));
const elements = raw.elements || [];
const today = new Date().toISOString().slice(0, 10);

const entities = [];
const quarantine = [];

for (const el of elements) {
  const tags = el.tags || {};
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  const osmId = `${el.type}/${el.id}`;
  const fail = (reason) => quarantine.push({ osm: osmId, name: tags.name || null, reason });

  if (!tags.name) { fail('missing name tag'); continue; }
  if (lat == null || lon == null) { fail('missing coordinates'); continue; }
  if (!tags.start_date || !OHM_DATE.test(tags.start_date)) {
    fail(`start_date "${tags.start_date}" does not match ohm_date pattern (not normalized — policy: no invention)`);
    continue;
  }
  if (!tags.historic || tags.historic === 'yes') {
    fail('historic=yes carries no usable type value');
    continue;
  }

  const osmTags = {};
  for (const [k, v] of Object.entries(tags)) {
    if (k === 'name' || k === 'start_date') continue; // promoted to timeline
    osmTags[k] = String(v);
  }
  osmTags['ste:import_batch'] = `osm-overpass-${today}`;

  const entity = {
    ste_id: randomUUID(),
    ste_version: '0.2',
    name: { primary: tags.name, localized: { zh: tags.name } },
    coordinates: { lat, lon },
    external_ids: {
      osm: { id: osmId, verified: false, note: `Imported from Overpass API ${today}` },
    },
    tags: osmTags,
    timeline: [
      {
        start_date: tags.start_date,
        name: tags.name,
        type: tags.historic,
        description: `Imported from OpenStreetMap ${osmId} (historic=${tags.historic}, start_date=${tags.start_date}) via Overpass API.`,
        description_provenance: 'imported',
        sources: [`https://www.openstreetmap.org/${osmId}`],
      },
    ],
  };
  entities.push(entity);
}

// ---- dual validation: ajv (schema) + reference validator (application rules)
const schema = JSON.parse(readFileSync(new URL('../v0.2/schema.json', import.meta.url), 'utf8'));
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const ajvValidate = ajv.compile(schema);

const results = [];
for (const e of entities) {
  const ajvOk = ajvValidate(e);
  const ref = validateSTE(e);
  results.push({
    ste_id: e.ste_id,
    name: e.name.primary,
    ajv: ajvOk ? 'PASS' : `FAIL: ${JSON.stringify(ajvValidate.errors)}`,
    reference_validator: ref.ok ? 'PASS' : `FAIL: ${JSON.stringify(ref.errors)}`,
  });
}

writeFileSync(outPath, JSON.stringify(entities, null, 2));
writeFileSync(quarPath, JSON.stringify(quarantine, null, 2));

console.log(`converted: ${entities.length}  quarantined: ${quarantine.length}`);
for (const r of results) console.log(`${r.ajv === 'PASS' && r.reference_validator === 'PASS' ? 'PASS' : 'FAIL'}  ${r.name}  ajv=${r.ajv}  ref=${r.reference_validator}`);
if (quarantine.length) {
  console.log('--- quarantine ---');
  for (const q of quarantine) console.log(`HOLD  ${q.osm}  ${q.name}  ${q.reason}`);
}
const anyFail = results.some((r) => r.ajv !== 'PASS' || r.reference_validator !== 'PASS');
process.exit(anyFail ? 1 : 0);
