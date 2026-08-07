#!/usr/bin/env node
/**
 * build-schools.mjs — 把"消失的中小学"CSV 转换为符合 STE Schema v0.1 的实体数据。
 *
 * 输入: C:\Memo-Map-World4D 下的 7 个 CSV
 * 输出:
 *   1. demo/data/schools.json        — 全量实体数组（demo 内嵌用）
 *   2. examples/valid/*.json         — 5 个代表性单实体样例（覆盖 停办/搬迁/更名/恢复/停招）
 *
 * 坐标: OSM Nominatim 地理编码（限速 1 req/s，带 User-Agent），失败回退区中心 + 低置信度。
 * UUID: 由学校名 md5 派生，固定为 UUID v4 格式（同一学校多次运行 ID 稳定）。
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const SRC = 'C:\\Memo-Map-World4D';
const OUT = path.resolve('.');

/* ---------------- CSV 解析（处理引号） ---------------- */
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
    } else field += ch;
  }
  if (field !== '' || row.length) { row.push(field); if (row.some((c) => c.trim() !== '')) rows.push(row); }
  return rows;
}

/* ---------------- 年份解析 ---------------- */
// "1950" -> 1950; "1950s" -> 1950; "1998–2000" -> 2000(取末值); "1946（本部）" -> 1946; "—"/"-" -> null
// 特殊: "2010 前后（停办）/2026（恢复）" -> 取"停办"之前的年份 (2010)
function parseYear(s) {
  if (s == null) return null;
  const str = String(s).replace(/\s/g, '');
  if (str.includes('停办') && str.includes('恢复')) {
    const before = str.split('停办')[0];
    const m = before.match(/(\d{4})/);
    return m ? parseInt(m[1], 10) : null;
  }
  const m = str.match(/(\d{4})/g);
  if (!m) return null;
  return parseInt(m[m.length - 1], 10);
}

/* ---------------- 稳定 UUID v4 ---------------- */
function uuidFromName(name) {
  const h = createHash('md5').update('ste-school:' + name).digest('hex');
  return (
    h.slice(0, 8) + '-' + h.slice(8, 12) + '-4' + h.slice(13, 16) + '-' +
    '8' + h.slice(17, 20) + '-' + h.slice(20, 32)
  ).toLowerCase();
}

/* ---------------- 地理编码（Photon 主 + Nominatim 备 + 区中心兜底；带缓存） ---------------- */
const PROXY = 'http://127.0.0.1:17890';
const CACHE_FILE = path.join(OUT, 'demo', 'data', 'geo-cache.json');
let geoCache = {};
try { if (existsSync(CACHE_FILE)) geoCache = JSON.parse(readFileSync(CACHE_FILE, 'utf8')); } catch { /* ignore */ }

function httpGet(url, timeoutMs = 12000) {
  try {
    return execFileSync('curl.exe', ['-s', '-x', PROXY, '-H', 'User-Agent: ste-schema-builder/0.1', url], { encoding: 'utf8', timeout: timeoutMs });
  } catch { return null; }
}

// 从地址提取街道级关键词：去区名前缀与门牌号，如 "东城区东四北大街" -> "东四北大街"
function streetKeyword(addr) {
  let s = String(addr || '').replace(/^[\u4e00-\u9fa5]{2,4}区/, ''); // 去 XX区
  s = s.replace(/\d+号?$/g, ''); // 去门牌号
  const m = s.match(/[\u4e00-\u9fa5A-Za-z0-9]{2,}(?:街|路|胡同|巷|镇|村|园|道|弄|坊|里|校区|学校|中学|小学|大楼|厂)/);
  return m ? m[0] : s.trim();
}

function geocodePhoton(query) {
  const url = 'https://photon.komoot.io/api/?limit=1&q=' + encodeURIComponent(query);
  const out = httpGet(url);
  if (!out) return { ok: false };
  try {
    const j = JSON.parse(out);
    const f = j.features?.[0];
    if (f && f.geometry?.coordinates && f.properties?.countrycode === 'CN') {
      return { lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0], ok: true, label: f.properties.name };
    }
  } catch { /* fallthrough */ }
  return { ok: false };
}

function geocodeNominatim(query) {
  const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' +
    encodeURIComponent(query + ' 中国');
  const out = httpGet(url, 8000);
  if (!out) return { ok: false };
  try {
    const arr = JSON.parse(out);
    if (Array.isArray(arr) && arr.length > 0 && arr[0].lat && arr[0].lon) {
      return { lat: parseFloat(arr[0].lat), lon: parseFloat(arr[0].lon), ok: true, label: arr[0].display_name?.slice(0, 60) };
    }
  } catch { /* fallthrough */ }
  return { ok: false };
}

/* 区级中心坐标 fallback（北京/上海各行政区近似中心） */
const DISTRICTS = {
  东城区: [39.928, 116.416], 西城区: [39.912, 116.366], 海淀区: [39.959, 116.298],
  朝阳区: [39.921, 116.443], 通州区: [39.909, 116.656], 丰台区: [39.858, 116.286],
  大兴区: [39.726, 116.341], 昌平区: [39.705, 116.251], 石景山区: [39.906, 116.223],
  门头沟区: [39.940, 116.102], 房山区: [39.748, 116.143], 顺义区: [40.130, 116.655],
  嘉定区: [31.375, 121.266], 宝山区: [31.405, 121.489], 浦东新区: [31.222, 121.544],
  松江区: [31.030, 121.227], 奉贤区: [30.918, 121.474], 静安区: [31.230, 121.456],
  普陀区: [31.250, 121.396], 杨浦区: [31.260, 121.526], 虹口区: [31.264, 121.505],
  闵行区: [31.112, 121.382], 长宁区: [31.220, 121.424], 徐汇区: [31.188, 121.437],
  黄浦区: [31.231, 121.485],
};

function districtOf(addr, city) {
  for (const d of Object.keys(DISTRICTS)) if (addr.includes(d)) return d;
  return city === '北京' ? '东城区' : '浦东新区';
}

/* ---------------- STE 实体构建 ---------------- */
// type 映射: 停办/停办（老址）/停办→恢复/更名/升级/搬迁/合并/停招/停招（转制公办）
function buildEntity(r, city, geos) {
  const [no, name, foundedRaw, endRaw, addr, kind, intro] = r;
  const founded = parseYear(foundedRaw);
  const ended = parseYear(endRaw);
  // 清洗 primary: 处理 "旧名 → 新名" 形式
  const arrowParts = name.split('→');
  const primary = (arrowParts[0] || name).replace(/（.*?）|\(.*?\)/g, '').trim();
  const aliasMatch = name.match(/（([^）]+)）/);
  const aliases = [];
  if (aliasMatch) aliases.push(aliasMatch[1]);
  if (arrowParts.length > 1) aliases.push(arrowParts[arrowParts.length - 1].replace(/（.*?）|\(.*?\)/g, '').trim());

  // 坐标（用主流程已填好的 geos 缓存）
  const q = (addr || '').trim();
  let lat = null, lon = null, geoConf = 0.9, note = '';
  const g = geos[name + '|' + city];
  if (g && g.ok) { lat = g.lat; lon = g.lon; }
  else if (q) {
    const d = districtOf(q, city);
    [lat, lon] = DISTRICTS[d];
    geoConf = 0.3;
    note = `坐标回退到${d}区中心（地理编码未命中），需人工精化`;
  } else {
    const d = districtOf(primary, city);
    [lat, lon] = DISTRICTS[d];
    geoConf = 0.25;
    note = `无地址信息，坐标取${d}区中心，需人工精化`;
  }

  // timeline 快照
  const timeline = [];
  const kindNorm = String(kind || '').replace(/\s/g, '');
  const isRename = kindNorm.includes('更名') || kindNorm.includes('升级') || kindNorm.includes('并入') || kindNorm.includes('合并');
  const isMove = kindNorm.includes('搬迁');
  const isResume = kindNorm.includes('恢复');
  const isSuspend = kindNorm.includes('停招');

  const snap = (s, e, nm, status, desc) => ({
    start_date: String(s),
    ...(e != null ? { end_date: String(e) } : {}),
    name: nm, type: 'school', status,
    description: desc, confidence: 0.7,
  });

  if (isResume && founded && ended) {
    // 停办→恢复: 三段；恢复年份 = 字符串最后一个年份（如 "2010前后（停办）/2026（恢复）" -> 2026）
    const resumeMs = String(endRaw || '').replace(/\s/g, '').match(/(\d{4})/g);
    const resumed = resumeMs ? parseInt(resumeMs[resumeMs.length - 1], 10) : ended;
    timeline.push(snap(founded, ended, primary, 'active', intro));
    timeline.push(snap(ended, ended, primary, 'demolished', '停办期间：' + intro));
    timeline.push(snap(resumed, null, primary, 'active', '恢复招生（' + resumed + ' 年）。' + intro));
  } else if (isRename && founded) {
    const newName = arrowParts.length > 1 ? arrowParts[arrowParts.length - 1].replace(/（.*?）|\(.*?\)/g, '').trim() : primary;
    timeline.push(snap(founded, ended, primary, 'active', intro));
    timeline.push(snap(ended, null, newName, 'active', '更名/升级为「' + newName + '」。' + intro));
  } else if (isMove && founded) {
    timeline.push(snap(founded, ended, primary, 'active', intro));
    timeline.push(snap(ended, ended, primary, 'demolished', '搬迁：原校址关闭，' + intro));
  } else if (founded && ended) {
    // 普通停办/停招
    const status = isSuspend ? 'active' : 'demolished';
    const desc = isSuspend ? '停招（学校实体仍在）：' + intro : intro;
    timeline.push(snap(founded, ended, primary, 'active', desc));
    if (!isSuspend) timeline.push(snap(ended, ended, primary, 'demolished', '停办：' + intro));
  } else if (ended) {
    // 成立年份未知
    timeline.push(snap(ended, ended, primary, 'demolished', '成立年份不详，' + intro));
  } else {
    timeline.push(snap(1950, null, primary, 'active', intro));
  }

  return {
    ste_id: uuidFromName(name),
    ste_version: '0.1',
    name: { primary, ...(aliases.length ? { aliases } : {}) },
    coordinates: { lat, lon },
    tags: { amenity: 'school', 'ste:disappearance': kind, city },
    timeline,
    ...(note ? { _geo_note: note } : {}),
    _geo_conf: geoConf,
  };
}

/* ---------------- 主流程 ---------------- */
const FILES = [
  ['北京消失的中小学.csv', '北京'],
  ['上海消失的中小学.csv', '上海'],
  ['上海停办的中小学.csv', '上海'],
  ['上海搬迁的中小学.csv', '上海'],
  ['上海建国后消失的中小学.csv', '上海'],
  ['上海改开后消失的中小学.csv', '上海'],
  ['上海民国消失的中小学.csv', '上海'],
];

const entities = [];
for (const [f, city] of FILES) {
  const p = path.join(SRC, f);
  if (!existsSync(p)) continue;
  const rows = parseCSV(readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
  const header = rows[0];
  const idxName = header.indexOf('学校名称');
  const idxFounded = header.indexOf('成立年份') !== -1 ? header.indexOf('成立年份') : header.indexOf('成立年份');
  const idxEnd = header.findIndex((h) => h.includes('停办') || h.includes('搬迁') || h.includes('停招'));
  const idxAddr = header.indexOf('原地址');
  const idxKind = header.indexOf('类型');
  const idxIntro = header.indexOf('校史简介');
  for (const r of rows.slice(1)) {
    if (r.length <= idxName) continue;
    const rec = [
      r[0], r[idxName], r[idxFounded] ?? '', r[idxEnd] ?? '', r[idxAddr] ?? '',
      r[idxKind] ?? '', r[idxIntro] ?? '',
    ];
    entities.push({ rec, city, f });
  }
}

console.log(`解析出 ${entities.length} 所学校，开始地理编码（Nominatim 限速 1 req/s）...`);
const geos = {};
let okCount = 0;
for (const e of entities) {
  const rawAddr = (e.rec[4] || '').trim();
  const key = e.rec[1] + '|' + e.city;
  if (!geos[key]) {
    if (geoCache[key]) {
      geos[key] = geoCache[key];
      if (geoCache[key].ok) okCount++;
    } else {
      const kw = streetKeyword(rawAddr) || e.rec[1];
      let g = geocodePhoton(kw);
      if (!g.ok) g = geocodeNominatim(`${rawAddr || e.rec[1]} ${e.city}`);
      geos[key] = g;
      geoCache[key] = g;
      if (g.ok) okCount++;
      await new Promise((r) => setTimeout(r, 900));
    }
  }
}
mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
writeFileSync(CACHE_FILE, JSON.stringify(geoCache, null, 2), 'utf8');
console.log(`地理编码命中 ${okCount}/${entities.length}（缓存已存 ${Object.keys(geoCache).length} 条）`);

const built = entities.map((e) => buildEntity(e.rec, e.city, geos));

/* 输出全量数据 */
const demoDir = path.join(OUT, 'demo', 'data');
mkdirSync(demoDir, { recursive: true });
// demo 数据: 去掉内部字段 _geo_note/_geo_conf, 把 note 并入 tags 或 description
const clean = built.map((e) => {
  const { _geo_note, _geo_conf, ...rest } = e;
  const out = { ...rest };
  if (_geo_note) out.tags = { ...out.tags, note: _geo_note };
  return out;
});
writeFileSync(path.join(demoDir, 'schools.json'), JSON.stringify(clean, null, 2), 'utf8');

/* 输出 5 个代表性样例到 examples/valid/ */
const reps = [
  '北京八中（老八中）', '史家小学分校（老校址）', '华曜宝山实验学校（原华二宝山实验学校）',
  '通州区第四中学 → 首师大附中通州实验学校', '北京九十九中（老校址）',
];
const validDir = path.join(OUT, 'examples', 'valid');
mkdirSync(validDir, { recursive: true });
const repFiles = {
  '北京八中': 'beijing-no8.json',
  '史家小学分校': 'shijia-branch.json',
  '华曜宝山实验学校': 'huayao-baoshan-move.json',
  '通州区第四中学': 'tongzhou-no4-rename.json',
  '北京九十九中': 'beijing-no99-resume.json',
};
for (const e of built) {
  const f = repFiles[e.name.primary] ?? repFiles[e.name.aliases?.[0]];
  if (f) {
    const { _geo_note, _geo_conf, ...rest } = e;
    const out = { ...rest };
    if (_geo_note) out.tags = { ...out.tags, note: _geo_note };
    writeFileSync(path.join(validDir, f), JSON.stringify(out, null, 2) + '\n', 'utf8');
  }
}

console.log('完成。输出:');
console.log(`  demo/data/schools.json    (${clean.length} 实体)`);
console.log('  examples/valid/*.json     (5 个代表样例)');
