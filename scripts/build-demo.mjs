#!/usr/bin/env node
/**
 * build-demo.mjs — 生成 demo/index.html（单文件，可直接扔 GitHub Pages）。
 *
 * 数据注入策略：
 *   - 默认：仅注入代表性学校（当前 = 北师大附中，examples/valid/old-school.json）
 *   - 可选：node scripts/build-demo.mjs --ids <ste_id>,<ste_id>   从 demo/data/schools.json 按 ste_id 精选
 *   - 可选：node scripts/build-demo.mjs --all                     注入全部 77 所（全量视图）
 *
 * 注入前强制 schema 校验；时间轴范围由数据自动计算。
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('.');
const tpl = readFileSync(path.join(ROOT, 'demo', 'template.html'), 'utf8');
const Ajv = (await import('ajv')).default;
const addFormats = (await import('ajv-formats')).default;
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const schema = JSON.parse(readFileSync(path.join(ROOT, 'v0.1', 'schema.json'), 'utf8'));
const validate = ajv.compile(schema);

const args = process.argv.slice(2);
const ALL = args.includes('--all');
const ids = args.includes('--ids') ? args[args.indexOf('--ids') + 1].split(',').map((s) => s.trim()) : [];

let entities;
if (ALL) {
  entities = JSON.parse(readFileSync(path.join(ROOT, 'demo', 'data', 'schools.json'), 'utf8'));
} else if (ids.length > 0) {
  const pool = JSON.parse(readFileSync(path.join(ROOT, 'demo', 'data', 'schools.json'), 'utf8'));
  entities = pool.filter((e) => ids.includes(e.ste_id) || ids.includes(e.name.primary));
  if (entities.length === 0) {
    console.error(`❌ 未在 schools.json 中找到 ste_id 匹配: ${ids.join(', ')}`);
    process.exit(1);
  }
} else {
  // 默认：代表性样例（北师大附中）
  const f = path.join(ROOT, 'examples', 'valid', 'old-school.json');
  if (!existsSync(f)) { console.error('❌ 缺少 examples/valid/old-school.json'); process.exit(1); }
  entities = [JSON.parse(readFileSync(f, 'utf8'))];
}

// schema 校验
const bad = entities.filter((e) => !validate(e));
if (bad.length) {
  console.error(`❌ ${bad.length} 个实体未通过 schema 校验，拒绝生成`);
  for (const e of bad) console.error('  -', e.name?.primary, JSON.stringify(validate.errors?.[0] ?? ''));
  process.exit(1);
}

// 时间轴范围：数据最早年份取整到十年前 → 2026
let tlMin = 2026;
for (const e of entities) for (const sn of e.timeline) {
  const y = parseInt(sn.start_date, 10);
  if (!isNaN(y)) tlMin = Math.min(tlMin, y);
}
tlMin = Math.floor(tlMin / 10) * 10;
const tlMax = 2026;

const dataJs = JSON.stringify(entities).replace(/</g, '\\u003c');
let html = tpl.replace('__STE_DATA__', dataJs).replace('__TL_MIN__', String(tlMin)).replace('__TL_MAX__', String(tlMax));
writeFileSync(path.join(ROOT, 'demo', 'index.html'), html, 'utf8');
console.log(`✅ demo/index.html 已生成（${entities.length} 实体 · 时间轴 ${tlMin}-${tlMax} · ${(html.length / 1024).toFixed(0)} KB）`);
