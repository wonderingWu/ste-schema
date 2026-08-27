# STE Demo · 曾经的母校（多城市 4D 演示）

> v0.2 演示包，2026-08-26 上线。替代旧 v0.1 demo（原 `demo/index.html` / `template.html` / `data/schools.json` / `data/geofix.json` 已删除）。
> 项目品牌：时痕 · STE（原「时迹 · TimeTrace」，2026-08-27 更名）。

## 页面

`index.html` —— 「曾经的母校」4D 地图 demo（Leaflet + 时间滑块）：

- 默认**全国图**（第一视图）：全部城市包 + 12 所历史名校叠加，滑块自 1879 起；浏览器定位命中三城自动落城，被拒则留全国；
- 城市视图：**石家庄**（合成演示数据，完整 memo 记忆功能）、**北京 / 上海**（有据可查的真实学校，坐标多为城区级近似并如实标注）；城市包实体可写记忆（2026-08-27 起只读门禁解除）；
- 拖时间滑块可看迁址轨迹（橙色虚线）；跨城迁址（如北师大附中西迁段）以快照级坐标表达；
- 同目录 `ste-validator.js` / `ste-memo-validator.js` 为浏览器端校验器副本，canonical 版本在仓库根 `validator/`（CI 强制字节一致）。

## 数据（`data/`，全部为 STE v0.2，逐实体过校验器）

| 文件 | 数量 | 成熟度 |
|---|---|---|
| `sjz-schools-6-v02.json` | 6 | **合成演示数据**（文件内逐条标注"（演示数据）"），用于体验贡献流程 |
| `beijing-schools-21-v02.json` | 21 | 迁移存档：v0.1 存档机械迁移，坐标多为城区级近似，待逐校核实 |
| `shanghai-schools-56-v02.json` | 56 | 迁移存档：同上 |
| `historic-schools-12-v02.json` | 12 | 主干已核实：四存/西南联大/一六一/北师大附中/圣约翰/铁一小/上医/金陵/中山/华西/武大/北大，含迁址轨迹 |

- 北京/上海迁移包来自旧 v0.1 存档（原 `demo/data/schools.json`，已删除），迁移规则：sources 注入、
  半开→闭区间日期口径转换、低置信坐标标注。
- 城市页面包 `city-packs.js` = 迁移实体 + 同城历史名校（北京 21+5=26，上海 56+2=58）。

## 备注

- 旧 demo 管线脚本（`build-demo` / `build-schools` / `fix-coords` / `geofix`）已随 2026-08-27 协议批删除（其输入文件早已移除）。
- 数据集许可以仓库 GOVERNANCE/ETHICS 公示为准（ODbL 1.0）。
