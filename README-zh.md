# STE Schema (SpatioTemporal Entity)

给地图加一层时间。每个实体（学校、建筑、街道、公园……）不只是"现在是什么"，而是**它曾经是什么、何时变的、为什么变**。

一个 STE 是一个地点的时空快照集：坐标 + 按时间排序的 timeline 快照。兼容 OSM/OHM 的 tag 命名，时间是一等公民。

- **Schema v0.1（canonical）**：`v0.1/schema.json`（英文版，唯一事实来源）
- **中文翻译版**：`v0.1/schema.zh.json`（结构与英文版必须一致，仅 description/title/examples 允许翻译差异）

## 目录结构

```
ste-schema/
├── v0.1/
│   ├── schema.json          # 英文版（canonical）
│   └── schema.zh.json       # 中文版
├── examples/
│   ├── valid/               # 应该通过校验的样例
│   │   └── old-school.json
│   └── invalid/             # 应该校验失败的样例（负向测试，同样重要！）
│       └── bad-uuid.json
├── scripts/
│   ├── check-parity.mjs     # 中英文版结构一致性检查
│   └── local-validate.mjs   # 本地预推送验证（valid 必须过、invalid 必须拒）
└── .github/
    └── workflows/
        └── validate.yml     # CI：schema 编译 + 样例校验 + parity 检查
```

## 设计原则

1. **宁少勿多（KISS）**：起步字段只留 80% 实体能用的
2. **先兼容，后扩展**：tag 命名复用 OSM/OHM（`start_date`、`amenity`），独有的加 `ste_` 前缀
3. **时间是一等公民**：会随时间变化的值放进 `timeline[]`，不变的值放顶层
4. **证据与置信度必带**：AI 生成的数据必须有 `sources` + `confidence` + `evidence`
5. **人类可读 > 机器可读**：全称不缩写，一个历史学教授应该能看懂

## 核心结构（v0.1）

| 字段 | 类型 | 说明 |
|------|------|------|
| `ste_id` | string | 全局唯一 ID，UUID v4（小写） |
| `ste_version` | string | Schema 版本号，必填（`^\\d+\\.\\d+(\\.\\d+)?$`），为未来迁移预留 |
| `name` | object | 当前名称。⚠️ 是 timeline 当前生效快照的**反规范化缓存**（搜索/展示用），source of truth 是 timeline，冲突时 timeline 赢 |
| `coordinates` | object | WGS84 坐标（lat: -90~90, lon: -180~180） |
| `tags` | object | 自由 OSM 兼容 tags（键值均为字符串） |
| `timeline` | array | **核心**。时间快照数组，每个快照代表一个时间段 |

### timeline 快照

| 字段 | 必填 | 说明 |
|------|------|------|
| `start_date` | ✅ | OHM 风格日期 `YYYY` / `YYYY-MM` / `YYYY-MM-DD`，负号开头表示公元前（如 `-0221`） |
| `end_date` | — | 缺省 = 至今（只能出现在最后一个快照，且其 status 不能是 demolished） |
| `name` | ✅ | 该时期的名称 |
| `type` | ✅ | 该时期的实体类型，复用 OSM 值（school/building/street/park…） |
| `status` | — | `active` / `demolished` / `under_construction` / `proposed`。注意：**改名是事件不是状态**，改名后的新快照 status 仍是 `active` |
| `description` | — | 该时期的叙事描述（人话，不是百科词条） |
| `confidence` | — | 置信度 0~1 |
| `sources` | — | 来源列表（URL / 文献 / 口述） |
| `evidence` | — | 证据链（v0.1 存 URL；结构化证据 v1 引入）。`type` ∈ photo/satellite/map/document/oral/ai_generated |

### 条件约束（schema 内联 if/then）

- `status = demolished` → 必须带 `end_date`
- 证据含 `ai_generated` → 必须带 `confidence` + `sources`

## 应用层校验清单

JSON Schema 表达不了的规则，由应用层保证。**通过 schema 校验 ≠ 数据干净。**

1. `end_date >= start_date`（同一快照内）
2. timeline 按 `start_date` 升序排列
3. 相邻快照时间段不重叠
4. 至多一个快照缺省 `end_date`，且必须是最后一个
5. 历法合法性：`2021-02-30`、非闰年 `02-29` 等
6. 顶层 `name` 与 timeline 当前生效快照一致（应由 timeline 自动派生，禁止手写）
7. `lat=0, lon=0`（Null Island）视为可疑数据告警

## 与 OSM/OHM 的兼容策略

- `type`、`tags`、`amenity`、`start_date`、`end_date` 直接复用 OSM/OHM 命名
- 独有的叙事和证据字段加 `ste_` 前缀以示区分（v0.1 中暂无，v1 起引入）
- 目标是：任何现有 OHM 工具（Overpass API、JOSM）能部分识别 STE 数据
- STE 是 OSM/OHM 的**超集**，不是平行宇宙

## 在线 Demo

[**消失的母校**](https://wonderingWu.github.io/ste-schema/demo/) —— 完全由 STE v0.1 数据驱动的可用地图 Demo：

- **77 个真实实体**，由北京/上海消失、停办、搬迁、更名中小学的整理数据构建（1950s–2026）
- 每所学校是一个 STE 实体：稳定 UUID、WGS84 坐标（OSM 地理编码）、完整 `timeline[]` 快照（开办 → 更名/搬迁/停办 → 恢复）
- 全部数据通过 `v0.1/schema.json` 校验（见 `demo/data/schools.json`；5 个代表样例在 `examples/valid/`）
- 随时可重新生成：`node scripts/build-schools.mjs`（CSV → STE）再 `node scripts/build-demo.mjs`（注入 Demo 页面）

## 本地验证

```bash
npm install
node scripts/local-validate.mjs   # valid 样例必须全过，invalid 样例必须全拒
node scripts/check-parity.mjs v0.1/schema.json v0.1/schema.zh.json
```

推送后 CI（`.github/workflows/validate.yml`）自动执行同样的四步：schema 编译 → valid 样例校验 → invalid 负向测试 → en/zh parity 检查。

## 版本计划

- **v0.1**：基础 schema + 单实体时间线。证据链只存 URL
- **v1**：结构化证据链（多源交叉验证）、实体间关系（`linked_events`）、事件模型
