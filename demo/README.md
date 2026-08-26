# STE Demo · 曾经的母校（多城市 4D 演示）

> v0.2 演示包，2026-08-26 上线。替代旧 v0.1 TimeTrace demo（原 `demo/index.html` / `template.html` / `data/schools.json` / `data/geofix.json` 已删除）。

## 页面

`index.html` —— 「曾经的母校」4D 地图 demo（Leaflet + 时间滑块）：

- 默认 **石家庄**：6 所本地种子学校（坐标经 OSM/地址核实），完整 memo（校友记忆）功能；
- 顶部城市切换器可切到 **北京 / 上海**：叠加只读演示数据包（`city-packs.js`），拖时间滑块可看到迁址轨迹（橙色虚线）；
- `?debug=historic` 联调模式：叠加 12 所历史名校全国展演（`historic-seed.js`）。
- 同目录 `ste-validator.js` / `ste-memo-validator.js` 为浏览器端参考校验器（103 / 75 检查点）。

## 数据（`data/`，全部为 STE v0.2，逐实体过校验器）

| 文件 | 数量 | 成熟度 |
|---|---|---|
| `sjz-schools-6-v02.json` | 6 | demo：石家庄 4 中学 + 2 小学，坐标已核实（OSM way 回填 external_ids） |
| `beijing-schools-21-v02.json` | 21 | 迁移存档：v0.1 存档机械迁移，坐标多为城区级近似，待逐校核实 |
| `shanghai-schools-56-v02.json` | 56 | 迁移存档：同上 |
| `historic-schools-12-v02.json` | 12 | 主干已核实：四存/西南联大/一六一/北师大附中/圣约翰/铁一小/上医/金陵/中山/华西/武大/北大，含迁址轨迹 |

- 北京/上海迁移包来自本仓库旧 `demo/data/schools.json`（v0.1 存档），迁移规则：sources 注入、
  半开→闭区间日期口径转换、低置信坐标标注；迁移脚本与收录标准见下游工作区 dataset/。
- 城市页面包 `city-packs.js` = 迁移实体 + 同城历史名校（北京 21+5=26，上海 56+2=58）。

## 备注

- `scripts/build-demo.mjs` / `build-schools.mjs` / `fix-coords.mjs` / `geofix.mjs` 为旧 demo 管线，
  本次保留未动（参考校验器将随后续 PR 单独入院）。
- 数据集许可以仓库 GOVERNANCE/ETHICS 公示为准。
