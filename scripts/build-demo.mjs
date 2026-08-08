#!/usr/bin/env node
/**
 * build-demo.mjs v3 — 生成平台版 demo/index.html。
 *
 * 注入两个示例项目（全部数据过 STE Schema v0.1 校验）：
 *   1. 曾经的母校（默认）：14 所精选学校（消失/停办/更名/升级/搬迁/恢复/一直存在），时间轴联动
 *   2. 中山装年代记忆：旧 demo 内容并行发布——6 个北京老商业街 STE 地点 + 11 条种子记忆贡献
 *
 * 用法: node scripts/build-demo.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const ROOT = path.resolve('.');
const tpl = readFileSync(path.join(ROOT, 'demo', 'template.html'), 'utf8');
const Ajv = (await import('ajv')).default;
const addFormats = (await import('ajv-formats')).default;
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const schema = JSON.parse(readFileSync(path.join(ROOT, 'v0.1', 'schema.json'), 'utf8'));
const validate = ajv.compile(schema);

const fail = (m) => { console.error('❌ ' + m); process.exit(1); };

/* ---------- 项目 1：曾经的母校（14 所精选） ---------- */
const pool = JSON.parse(readFileSync(path.join(ROOT, 'demo', 'data', 'schools.json'), 'utf8'));
const FEATURED_NAMES = [
  '北京八中', '史家小学分校', '府学胡同小学部分校区', '北京九十九中',
  '龙旺庄小学', '运河中学附属小学', '丰台五小京铁校区', '通州区第四中学',
  '兴华中学海户校区', '华曜宝山实验学校', '华二前滩学校初中部', '圣华紫竹双语学校',
  '上海科技大学附属学校', '松江爱菊学校',
];
const bnuas = JSON.parse(readFileSync(path.join(ROOT, 'examples', 'valid', 'old-school.json'), 'utf8'));
const schools = [bnuas];
for (const n of FEATURED_NAMES) {
  const hit = pool.find((e) => e.name.primary.includes(n) || (e.name.aliases || []).some((a) => a.includes(n)));
  if (!hit) fail(`精选学校未找到: ${n}`);
  schools.push(hit);
}
console.log(`项目「曾经的母校」: ${schools.length} 所`);

/* ---------- 项目 2：中山装年代记忆（旧 demo 内容 → STE 地点 + 种子贡献） ---------- */
const uuid = (s) => { const h = createHash('md5').update('ste-place:' + s).digest('hex'); return (h.slice(0, 8) + '-' + h.slice(8, 12) + '-4' + h.slice(13, 16) + '-' + '8' + h.slice(17, 20) + '-' + h.slice(20, 32)).toLowerCase(); };

const PLACES = [
  { name: '前门大栅栏', lat: 39.8955, lon: 116.3897, type: 'street', intro: '老商业街，瑞蚨祥绸缎庄所在地，票证年代买布做衣的必经之地。' },
  { name: '王府井百货大楼', lat: 39.9138, lon: 116.4108, type: 'mall', intro: '1955 年开业的"新中国第一店"，成衣柜台承载了几代人的置装记忆。' },
  { name: '西单商场', lat: 39.9087, lon: 116.3747, type: 'mall', intro: '1930 年代起的老商场，缝纫机、手表等"大件"在这里凭票供应。' },
  { name: '隆福寺街', lat: 39.9245, lon: 116.4142, type: 'street', intro: '老庙会商业街，国营服装店与个体裁缝铺并存。' },
  { name: '天桥', lat: 39.8806, lon: 116.3910, type: 'street', intro: '平民市井记忆聚集地，粮店、委托店、旧货摊交错。' },
  { name: '地安门百货商场', lat: 39.9367, lon: 116.3890, type: 'mall', intro: '城北居民采买"三大件"的主要国营商场。' },
].map((p) => ({
  ste_id: uuid(p.name),
  ste_version: '0.1',
  name: { primary: p.name },
  coordinates: { lat: p.lat, lon: p.lon },
  tags: { amenity: p.type, 'ste:project': 'zhongshan-era', city: '北京' },
  timeline: [{ start_date: '1950', name: p.name, type: p.type, status: 'active', description: p.intro, confidence: 0.75 }],
}));

/* 11 条种子记忆（旧 demo 原文，转贡献模型） */
const SEED_CONTRIBS = [
  { place: '王府井百货大楼', type: 'text', year: 1958, author: '王女士 · 1952 年生', title: '父亲的藏青色中山装', text: '1958 年父亲在百货大楼扯了藏青色哗叽料，请东四的裁缝做的。四个口袋、风纪扣，只有过年和开大会才舍得穿。', price: 21, seed: 1 },
  { place: '前门大栅栏', type: 'text', year: 1965, author: '李建国 · 1948 年生', title: '瑞蚨祥扯布做制服', text: '凭布票在大栅栏瑞蚨祥买的灰蓝色布料，一件中山装用料七尺半，工钱另算。做好那天穿着照了张全家福。', price: 28, seed: 2 },
  { place: '天桥', type: 'text', year: 1962, author: '赵秀兰 · 1945 年生', title: '粮本与粮票的日子', text: '困难时期全家在天桥粮店凭证购粮，母亲把粮票夹在毛主席语录里保存，每月最后一天才舍得买二两香油。', seed: 3 },
  { place: '地安门百货商场', type: 'text', year: 1972, author: '孙志远 · 1949 年生', title: '一块上海牌手表', text: '参加工作第三年，攒了快一年的工资，在地安门百货买到上海牌手表。晚上放在枕头边，听滴答声睡觉。', price: 120, seed: 4 },
  { place: '西单商场', type: 'text', year: 1975, author: '马淑芬 · 1950 年生', title: '蝴蝶牌缝纫机进家门', text: '1975 年托人搞到一张缝纫机票，在西单商场排队提的货。从此全家的衣服、邻居的裤脚都在这台机器上轧出来。', price: 157, seed: 5 },
  { place: '王府井百货大楼', type: 'text', year: 1976, author: '周丽华 · 1956 年生', title: '第一件的确良衬衫', text: '的确良不用熨、挺括耐穿，白衬衫配蓝裤子是那个年代的时髦。买的时候柜台前围了一圈人看料子。', price: 12.5, seed: 6 },
  { place: '西单商场', type: 'text', year: 1978, author: '陈德海 · 1953 年生', title: '结婚礼服是毛料中山装', text: '1978 年结婚，咬牙在西单商场买了一套毛料中山装，比布料贵一倍多。婚礼照片至今还挂在老屋墙上。', price: 45, seed: 7 },
  { place: '前门大栅栏', type: 'text', year: 1981, author: '刘长顺 · 1957 年生', title: '永久牌 28 大杠', text: '1981 年凭票买的永久 28 大杠，提车当天绕着前门骑了三圈。车后座带过媳妇，也带过一百多斤的大白菜。', price: 168, seed: 8 },
  { place: '隆福寺街', type: 'text', year: 1983, author: '吴桂芳 · 1955 年生', title: '隆福寺裁缝铺的毛料套装', text: '改革开放后裁缝铺活泛起来，隆福寺老师傅给做的中山装，垫肩挺括。那年穿着它去广州出差，觉得特有面子。', price: 62, seed: 9 },
  { place: '隆福寺街', type: 'text', year: 1985, author: '郑爱民 · 1960 年生', title: '12 寸黑白电视机', text: '1985 年家里第一台电视机，昆仑牌 12 寸黑白。夏天晚上搬到大院里，半条胡同的邻居搬着小板凳来看《射雕英雄传》。', price: 420, seed: 10 },
  { place: '地安门百货商场', type: 'text', year: 1989, author: '许文博 · 1965 年生', title: '最后一件中山装', text: '1989 年在地安门百货给父亲买了件成衣中山装，那年之后他自己也改穿夹克和西装了。一个时代的背影。', price: 95, seed: 11 },
];

/* ---------- schema 校验全部实体 ---------- */
const allEntities = [...schools, ...PLACES];
const bad = allEntities.filter((e) => !validate(e));
if (bad.length) {
  for (const e of bad) console.error('  -', e.name?.primary, JSON.stringify(validate.errors?.[0] ?? ''));
  fail(`${bad.length} 个实体未通过 schema 校验`);
}
console.log(`✅ 全部 ${allEntities.length} 个实体通过 schema v0.1`);

/* ---------- 组装注入数据 ---------- */
const PROJECTS = [
  {
    id: 'alma-mater',
    name: '曾经的母校',
    desc: '母校记忆 · 变迁与存在（含已消失、更名、搬迁、恢复）',
    kind: 'timeline',
    entities: schools.map(({ ste_id, ste_version, name, coordinates, tags, timeline }) => ({ ste_id, ste_version, name, coordinates, tags, timeline })),
  },
  {
    id: 'zhongshan-era',
    name: '中山装年代记忆',
    desc: '城市物质生活记忆 · 票证年代的置装与日常（旧 demo 内容迁移）',
    kind: 'memories',
    entities: PLACES,
    seedContribs: SEED_CONTRIBS,
  },
];

const dataJs = JSON.stringify(PROJECTS).replace(/</g, '\\u003c');
let html = tpl.replace('__PROJECTS__', dataJs);
writeFileSync(path.join(ROOT, 'demo', 'index.html'), html, 'utf8');
console.log(`✅ demo/index.html 已生成（${(html.length / 1024).toFixed(0)} KB，${PROJECTS.length} 个项目）`);
