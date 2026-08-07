#!/usr/bin/env node
/**
 * Check structural parity between the English (canonical) schema
 * and the Chinese translation. Only these keys may differ:
 * description / title / examples.
 *
 * Usage: node scripts/check-parity.mjs v0.1/schema.json v0.1/schema.zh.json
 */
import { readFileSync } from 'node:fs';

const IGNORED_KEYS = new Set(['description', 'title', 'examples']);

const [, , enPath, zhPath] = process.argv;
if (!enPath || !zhPath) {
  console.error('Usage: check-parity.mjs <en-schema> <zh-schema>');
  process.exit(2);
}

const en = JSON.parse(readFileSync(enPath, 'utf8'));
const zh = JSON.parse(readFileSync(zhPath, 'utf8'));

const errors = [];

function typeOf(v) {
  if (Array.isArray(v)) return 'array';
  if (v === null) return 'null';
  return typeof v;
}

function compare(a, b, path) {
  const ta = typeOf(a);
  const tb = typeOf(b);

  if (ta !== tb) {
    errors.push(`${path}: type mismatch (en=${ta}, zh=${tb})`);
    return;
  }

  if (ta === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    for (const k of keysA) {
      if (!(k in b)) errors.push(`${path}/${k}: missing in zh`);
    }
    for (const k of keysB) {
      if (!(k in a)) errors.push(`${path}/${k}: missing in en (extra in zh)`);
    }
    for (const k of keysA) {
      if (!(k in b)) continue;
      if (IGNORED_KEYS.has(k)) continue; // 允许翻译差异
      compare(a[k], b[k], `${path}/${k}`);
    }
    return;
  }

  if (ta === 'array') {
    if (a.length !== b.length) {
      errors.push(`${path}: array length mismatch (en=${a.length}, zh=${b.length})`);
      return;
    }
    a.forEach((item, i) => compare(item, b[i], `${path}[${i}]`));
    return;
  }

  // 原始值必须完全相等（pattern、enum、minimum 等）
  if (a !== b) {
    errors.push(`${path}: value mismatch (en=${JSON.stringify(a)}, zh=${JSON.stringify(b)})`);
  }
}

compare(en, zh, '#');

if (errors.length > 0) {
  console.error(`❌ Schema parity check FAILED (${errors.length} issue(s)):\n`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
} else {
  console.log('✅ en/zh schemas are structurally identical (only description/title/examples differ).');
}
