#!/usr/bin/env node
/**
 * build-demo.mjs — 把 schools.json（符合 STE Schema v0.1 的全量实体）注入模板，
 * 生成自包含的 demo/index.html（单文件，可直接扔 GitHub Pages）。
 *
 * 用法: node scripts/build-demo.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('.');
const tpl = readFileSync(path.join(ROOT, 'demo', 'template.html'), 'utf8');
const data = readFileSync(path.join(ROOT, 'demo', 'data', 'schools.json'), 'utf8');

// 注入前做一次 schema 校验，确保 demo 里的数据永远合法
const Ajv = (await import('ajv')).default;
const addFormats = (await import('ajv-formats')).default;
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const schema = JSON.parse(readFileSync(path.join(ROOT, 'v0.1', 'schema.json'), 'utf8'));
const validate = ajv.compile(schema);
const entities = JSON.parse(data);
const bad = entities.filter((e) => !validate(e));
if (bad.length) {
  console.error(`❌ ${bad.length} 个实体未通过 schema 校验，拒绝生成 demo`);
  for (const e of bad) console.error('  -', e.name?.primary, validate.errors?.[0]);
  process.exit(1);
}

const html = tpl.replace('__STE_DATA__', data.replace(/\n\s*/g, ' '));
writeFileSync(path.join(ROOT, 'demo', 'index.html'), html, 'utf8');
console.log(`✅ demo/index.html 已生成（${entities.length} 实体，全部通过 schema v0.1，${(html.length / 1024).toFixed(0)} KB）`);
