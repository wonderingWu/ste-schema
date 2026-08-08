#!/usr/bin/env node
/** 重查坐标：Photon + 城市/经纬度双校验 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync } from 'node:fs';

const PROXY = 'http://127.0.0.1:17890';
const BBOX = { 北京: [39.4, 115.4, 41.1, 117.5], 上海: [30.6, 120.8, 31.9, 122.1] };

function photon(q) {
  const url = 'https://photon.komoot.io/api/?limit=5&q=' + encodeURIComponent(q);
  try {
    const out = execFileSync('curl.exe', ['-s', '-x', PROXY, url], { encoding: 'utf8', timeout: 15000 });
    return JSON.parse(out).features || [];
  } catch { return []; }
}

function inCity(lat, lon, city) {
  const [minLat, minLon, maxLat, maxLon] = BBOX[city];
  return lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon;
}

const targets = [
  ['北京九十九中', '北京', '温泉镇 北京'],
  ['丰台五小望园校区', '北京', '望园路 北京丰台'],
  ['华曜宝山实验学校', '上海', '鄱阳湖路 上海宝山'],
  ['通州区第四中学', '北京', '通州区第四中学 北京'],
  ['兴华中学海户校区', '北京', '海户屯 北京大兴'],
];

const results = {};
for (const [name, city, q] of targets) {
  const feats = photon(q);
  const ok = feats.filter((f) => {
    const [lon, lat] = f.geometry.coordinates;
    return inCity(lat, lon, city);
  });
  if (ok.length) {
    const f = ok[0];
    const [lon, lat] = f.geometry.coordinates;
    results[name] = { lat, lon, label: f.properties.name || f.properties.street || '', city: f.properties.city, ok: true };
    console.log(`✅ ${name} => ${lat.toFixed(4)}, ${lon.toFixed(4)} (${f.properties.city} ${f.properties.street || ''})`);
  } else {
    results[name] = { ok: false };
    console.log(`❌ ${name} 城市内无命中: ${q}`);
  }
  await new Promise((r) => setTimeout(r, 900));
}
writeFileSync('demo/data/geofix.json', JSON.stringify(results, null, 2), 'utf8');
