# STE Schema (SpatioTemporal Entity)

*「时迹 · TimeTrace」项目的 schema 仓库——一张承载时间的地图，每个地点都有自己的历史。*

给地图加一层时间。每个实体（学校、建筑、街道、公园……）不只是"现在是什么"，而是**它曾经是什么、何时变的、为什么变**。

一个 STE 是一个地点的时空快照集：坐标 + 按时间排序的 timeline 快照。兼容 OSM/OHM 的 tag 命名，时间是一等公民。

- **Schema v0.2（当前）**：`v0.2/schema.json` — external_ids、快照级坐标、溯源、多视角叙事、证据链、来源必填（伦理章程 R1）
- **Schema v0.1（旧版）**：`v0.1/schema.json` — 基础版，保留以兼容存量数据
- **中文翻译版**：每个版本都有 `schema.zh.json`，结构必须与英文版完全一致（仅 description/title/examples 允许翻译差异）
- **伦理章程**：[ETHICS.md](ETHICS.md)（中文原文）/ [ETHICS.en.md](ETHICS.en.md)（英文版）— v0.2 schema 规则引用的规范性文档（R1–R9、委员会机制、平台承诺）
- [English README](README.md)

## 目录结构

```
ste-schema/
├── v0.1/
│   ├── schema.json          # 英文版（旧版）
│   └── schema.zh.json       # 中文版
├── v0.2/
│   ├── schema.json          # 英文版（当前 canonical）
│   └── schema.zh.json       # 中文版
├── examples/
│   ├── valid/               # v0.1 应该通过校验的样例
│   └── invalid/             # v0.1 应该校验失败的样例（负向测试）
├── test/
│   ├── valid/               # v0.2 应该通过校验的样例
│   └── invalid/             # v0.2 负向测试（25 个 fixture，一条规则一个）
├── validator/
│   └── ste-validator.js       # 官方参考校验器（零依赖 UMD，103 检查点）
├── ETHICS.md                # 伦理章程 v0.2（中文原文）
├── ETHICS.en.md             # 伦理章程 v0.2（英文版）
├── docs/
│   ├── schema-v0.2-notes.md # v0.2 变更对照与设计说明
│   └── proposals/           # 草案提案（v0.3 生命周期、质疑 profile）
├── scripts/
│   ├── check-parity.mjs     # 中英文版结构一致性检查
│   ├── check-validator-sync.mjs # validator/ 与 demo/ 副本防漂移
│   └── local-validate.mjs   # 本地预推送验证（双版本）
├── LICENSE                  # MIT（代码）+ 分层许可说明
├── LICENSE-CC0-1.0          # 标准文本 / profiles / 伦理章程
├── LICENSE-ODbL-1.0         # 精选数据集
├── GOVERNANCE.md            # 项目治理（草案 v0.1）：角色、许可、质量门
└── .github/
    └── workflows/
        └── validate.yml     # CI：strict 编译 + valid/invalid fixture + parity + validator 同步
```

## 设计原则

1. **宁少勿多（KISS）**：起步字段只留 80% 实体能用的
2. **先兼容，后扩展**：tag 命名复用 OSM/OHM（`start_date`、`amenity`），独有的加 `ste_` 前缀
3. **时间是一等公民**：会随时间变化的值放进 `timeline[]`，不变的值放顶层
4. **证据与置信度必带**：AI 生成的数据必须有 `sources` + `confidence` + `evidence`
5. **人类可读 > 机器可读**：全称不缩写，一个历史学教授应该能看懂

## 核心结构（v0.2）

| 字段 | 类型 | 说明 |
|------|------|------|
| `ste_id` | string | 全局唯一 ID，UUID v4（小写） |
| `ste_version` | string | Schema 版本，`const: "0.2"` — 版本锁定，声明其他版本的文档无法通过 v0.2 校验 |
| `name` | object | 当前名称（反规范化缓存）。`localized` 按 BCP 47 键控；由最后一个 timeline 快照派生 |
| `coordinates` | object | 默认 WGS84 代表点（lat -90~90, lon -180~180）；搬迁场景按快照覆盖 |
| `external_ids` | object | 外部交叉引用：wikidata（Q 号）、osm/ohm（`type/id`）、wikipedia（`langwiki:标题`）、baidu_baike（仅链接） |
| `tags` | object | 自由 OSM 兼容标签；社区自造键用 `ste:` 前缀 |
| `narratives` | array | 多视角叙事——明确不是事实主张。三轴：`source_of_knowledge` / `author_identity` / `style`；撤回留墓碑（R6） |
| `timeline` | array | **核心**。时间快照数组，每个快照代表一个时间段 |

### timeline 快照（v0.2）

| 字段 | 必填 | 说明 |
|------|------|------|
| `start_date` | ✅ | OHM 风格日期 `YYYY` / `YYYY-MM` / `YYYY-MM-DD`；公元前用 ISO 8601 天文纪年（`0000` = 公元前1年） |
| `end_date` | — | 在声明粒度上为**闭区间**；缺省 = 至今（只能出现在最后一个快照） |
| `name` | ✅ | 该时期的名称 |
| `type` | ✅ | 该时期的实体类型，复用 OSM 值 |
| `status` | — | `active` / `demolished` / `under_construction` / `proposed` / `relocated`。**改名是事件不是状态** |
| `coordinates` | — | 快照级覆盖；`status=relocated` 时必填 |
| `description` | — | 最短的中立事实摘要；解读归 `narratives[]` |
| `description_provenance` | — | description 的溯源（`manual` / `ai_generated` / `community_consensus` / `imported`）；有 description 时必填 |
| `confidence` | — | 该快照整体的自报置信度 0~1 |
| `sources` | ✅ | 按 R1 必填——无来源即无正式数据集条目（30 天草稿宽限） |
| `contributed_by` | — | 溯源元数据（参与者命名空间 `user:`/`anon:`/`agent:`/`system:`/`community`） |
| `evidence` | — | 证据链：外部 URL / 平台资产 / 线下实物；`ai_generated` 标志与媒介正交 |

### 条件约束（schema 内联 if/then）

- `status = demolished` → 必须带 `end_date`
- `status = relocated` → 必须带快照 `coordinates`
- 有 `description` → 必须带 `description_provenance`；`ai_generated` → 必须带快照 `confidence`
- `retracted=true`（叙事）→ `text` 必须为空 + `retracted_at` 必填（墓碑）
- `retracted=true`（证据）→ 禁止 `url`/`ste_asset_id` + `retracted_at` 必填
- `source_of_knowledge=ai_generated`（叙事）→ `confidence` + `ai_model` 必填
- `author_identity=escrowed_anonymous` → `author` 必须是 `anon:`（其他情况必须不是 `anon:`）
- `created_via=ai_extraction` → `ai_model` 必填；其他情况禁止出现
- 出现 `verified_at` → `verified` 必须为 `true`

## 应用层校验清单

JSON Schema 表达不了的规则，由应用层保证。**通过 schema 校验 ≠ 数据干净。**（v0.2 起 12 条；v0.1 曾用 7 条子集）

1. **历法合法性**：`02-30`、非闰年 `02-29` 等 schema 放行，需应用拒绝。
2. **timeline 顺序性**：按 `start_date` 升序；时段互不重叠（按闭区间约定判定）；至多一个快照缺 `end_date` 且必须是最后一个；缺 `end_date` 的快照 status ≠ demolished。
3. **`format` 关键字**（date-time / uri）在 draft-07 是注解，验证器需显式开启 format 断言，或应用自行校验。
4. **`default` 值**验证器不填充，读取方需自行套用默认。
5. **name/aliases 派生**：从 timeline 重算并比对，人工手写不一致时以 timeline 为准（name 是缓存，不是事实来源）。
6. **tags 键前缀**：非 OSM 惯例键必须带 `ste:` 前缀（schema 无法区分哪些是 OSM 惯例键）。
7. **anon: token 不可关联性**：同一用户的 anon token 不得跨贡献复用或可被反查——这是密码学/平台层保证，schema 只能约束格式。
8. **经度归一化**：比对前将 -180 归一为 +180（或反之）。
9. **external_ids 存活性**：pattern 只保证格式，Q95 是否真实存在、OSM way 是否已被删除需定期巡检（`note` 字段配套使用）。
10. **草稿生命周期**：30 天宽限、到期处理、draft → formal 的晋升校验（晋升时刻跑本 schema）全部在平台侧。
11. **撤回墓碑渲染**：`retracted=true` 时前端只显示墓碑；schema 保证数据形态，不保证展示行为。
12. **baidu_baike 内容不入库**：只存链接，抓取内容属许可违规。

## 伦理章程

[ETHICS.md](ETHICS.md)（中文原文）/ [ETHICS.en.md](ETHICS.en.md)（英文版）— v0.2，四部分：信念、数据规则（R1–R9）、争议机制（三层，委员会为最后手段）、平台承诺（C1–C3）。schema 规则引用章程条款（R1 来源、R2 视角/身份、R3 AI 标记、R6 撤回墓碑、R7 领土时间锚定、C2 导出边界）。

## 与 OSM/OHM 的兼容策略

- `type`、`tags`、`amenity`、`start_date`、`end_date` 直接复用 OSM/OHM 命名
- STE 自有顶层字段加 `ste_` 前缀以示区分（已在用：`ste_id`、`ste_version`、`ste_asset_id`）；非 OSM 惯例的 **tag 键**用 `ste:` 前缀（见应用层校验清单第 06 条）
- 目标是：任何现有 OHM 工具（Overpass API、JOSM）能部分识别 STE 数据
- STE 是 OSM/OHM 的**超集**，不是平行宇宙

## 在线 Demo

[**曾经的母校**](https://wonderingWu.github.io/ste-schema/demo/) —— 由 STE 数据驱动的可用地图 Demo（页面另含迁移而来的旧 demo「中山装年代记忆」）：

- **77 个真实实体**，由北京/上海消失、停办、搬迁、更名中小学的整理数据构建（1950s–2026）
- 每所学校是一个 STE 实体：稳定 UUID、WGS84 坐标（OSM 地理编码）、完整 `timeline[]` 快照（开办 → 更名/搬迁/停办 → 恢复）
- 全部数据通过 `v0.1/schema.json` 校验（见 `demo/data/schools.json`；6 个代表样例在 `examples/valid/`）
- 随时可重新生成：`node scripts/build-schools.mjs`（CSV → STE）再 `node scripts/build-demo.mjs`（注入 Demo 页面）

## 本地验证

```bash
npm install
node scripts/local-validate.mjs   # 双版本：valid 必须全过、invalid 必须全拒、strict 编译 + parity
```

推送后 CI（`.github/workflows/validate.yml`）自动执行同样的闸门：strict schema 编译（en/zh × v0.1/v0.2）→ valid fixture 校验 → invalid 负向测试 → en/zh parity → validator 同步检查。

## 参考校验器

[`validator/ste-validator.js`](validator/) 是 STE v0.2 的**官方参考校验器**：零依赖 UMD 单文件（浏览器 + Node 通用），除 schema 规则外还覆盖 JSON Schema 表达不了的应用层规则（日历有效性、时间线排序与重叠、单开口末段等）。只过 ajv 校验 ≠ 数据干净——请同时跑本校验器。`demo/ste-validator.js` 是打包副本，由 CI 强制与本目录字节一致。

## 兼容性实证

- [`docs/compatibility/2026-08-27-osm-overpass-report.md`](docs/compatibility/2026-08-27-osm-overpass-report.md) —— 首次第三方数据验证：14 个 OSM/Overpass 北京历史要素经 `scripts/import-osm-overpass.mjs` 导入；可映射记录 6/6 双验证通过（ajv + 参考校验器），8 条按"不发明"原则隔离并注明原因。
- [`docs/repo-layout.md`](docs/repo-layout.md) —— 仓库分区纪律与拆仓触发条件（为什么协议/demo/章程暂时共居一仓）。

## 许可

分层许可（依 [GOVERNANCE.md](GOVERNANCE.md) §2，落实伦理章程 R8）：

- **代码**（`scripts/`、`validator/`、demo 源码、CI）：[MIT](LICENSE)
- **标准文本**（`v0.1/`、`v0.2/`、`docs/`、官方 profiles）与**伦理章程**（`ETHICS.md`、`ETHICS.en.md`）：[CC0 1.0](LICENSE-CC0-1.0)——标准文本零摩擦复用
- **精选数据集**（`demo/data/*.json`）：[ODbL 1.0](LICENSE-ODbL-1.0)——署名+相同方式共享，与 OSM 生态兼容

## 版本计划

- **v0.1**：基础 schema + 单实体 timeline。证据链只存 URL。
- **v0.2**：external_ids（Wikidata/OSM/OHM/Wikipedia/Baidu Baike）、快照级坐标（搬迁）、命名空间参与者的 `contributed_by` 溯源、多视角 `narratives[]`（R2 三轴）、证据链（URL / 平台资产 / 线下实物，撤回墓碑）、来源必填（R1）、`name.localized`（BCP 47）、证据 `date` 统一 ohm_date 约定、版本锁定 `const: "0.2"`。
- **v1**：结构化证据交叉验证、实体关系（`linked_events`）、事件模型、结构化 source 对象（v0.3 计划）。
