#!/usr/bin/env node
/**
 * fix-coords.mjs — 离线修正 schools.json 中跨城市错误命中的坐标。
 * 背景：Photon/Nominatim 对重名地名（新街口/温泉镇/望园路等）可能命中到其他城市，
 * 例如"北京九中"被编码到南京新街口。城市边界校验失败的条目回退到区中心并标注。
 * 用法: node scripts/fix-coords.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';

const F = 'demo/data/schools.json';
const data = JSON.parse(readFileSync(F, 'utf8'));

const DISTRICTS = {
  东城区: [39.928, 116.416], 西城区: [39.912, 116.366], 海淀区: [39.959, 116.298],
  朝阳区: [39.921, 116.443], 通州区: [39.909, 116.656], 丰台区: [39.858, 116.286],
  大兴区: [39.726, 116.341], 昌平区: [39.705, 116.251], 石景山区: [39.906, 116.223],
  嘉定区: [31.375, 121.266], 宝山区: [31.405, 121.489], 浦东新区: [31.222, 121.544],
  松江区: [31.030, 121.227], 奉贤区: [30.918, 121.474], 静安区: [31.230, 121.456],
  普陀区: [31.250, 121.396], 杨浦区: [31.260, 121.526], 虹口区: [31.264, 121.505],
  闵行区: [31.112, 121.382], 长宁区: [31.220, 121.424], 徐汇区: [31.188, 121.437],
};

const BBOX = { 北京: [39.4, 115.4, 41.1, 117.5], 上海: [30.6, 120.8, 31.9, 122.1] };
function districtOf(addr, city) {
  for (const d of Object.keys(DISTRICTS)) if ((addr || '').includes(d)) return d;
  return city === '北京' ? '东城区' : '浦东新区';
}

let fixed = 0;
for (const e of data) {
  const b = BBOX[e.tags.city];
  const { lat, lon } = e.coordinates;
  const inside = !b || (lat >= b[0] && lat <= b[2] && lon >= b[1] && lon <= b[3]);
  if (inside) continue;
  // 修正：回退区中心
  const d = districtOf((e.tags['addr:street'] || '') + (e.tags.note || ''), e.tags.city);
  const [dlat, dlon] = DISTRICTS[d] || (e.tags.city === '北京' ? [39.91, 116.4] : [31.23, 121.47]);
  e.coordinates = { lat: dlat, lon: dlon };
  e.tags = { ...e.tags, note: `坐标修正：原地理编码命中其他城市（${lat.toFixed(3)},${lon.toFixed(3)}），已回退${d}区中心，需人工精化` };
  fixed++;
  console.log(`修正: ${e.name.primary} → ${dlat},${dlon} (${d})`);
}
if (fixed) {
  writeFileSync(F, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✅ 已修正 ${fixed} 个实体，写入 ${F}`);
} else {
  console.log('无需修正');
}
