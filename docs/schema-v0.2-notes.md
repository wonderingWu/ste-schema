# 修复版配套文档

## ① 变更对照表（修改 ↔ 审核问题）

### 🔴 必修项

| # | 审核问题 | 修复方式 |
|---|---|---|
| 1 | `escrow_note` 泄露通道（轮一#1） | **字段彻底删除**。顶层 description 新增"EXPORT BOUNDARY"声明；`narrative_entry` description 明确"There is deliberately NO escrow_note field"——防止后人不明就里加回来 |
| 2 | 托管匿名 vs 必填 author（轮一#2） | 新增 `actor_id` 定义（命名空间前缀）；if/then 强制 `escrowed_anonymous ⇔ author 以 anon: 开头`，双向约束 |
| 3 | retracted 与 text 必填矛盾（轮一#3、本轮#2） | narrative：`retracted=true ⇒ text maxLength 0 + retracted_at 必填`；evidence：`retracted=true ⇒ url/ste_asset_id 禁止出现 + retracted_at 必填`；两处均补 else 分支防"未撤回却有撤回时间" |
| 4 | AI narrative 缺 confidence（轮一#4） | `source_of_knowledge=ai_generated ⇒ required: [confidence, ai_model]` |
| 5 | 枚举混轴（轮二#3） | `description_style` → `description_provenance`（纯来源枚举）；`evidence.type` 移除 `ai_generated`、顺手补了 `audio`/`video`（asset 描述里提到 audio recordings 但原枚举放不下）；新增正交 `ai_generated: boolean`，为 true 时强制 confidence + ai_model |
| 6 | 草稿机制无处安放（轮二#4） | 设计决策：**草稿是平台侧记录，不是合法 STE 文档**。写入顶层 description "DRAFTS" 段 + status 字段注释。schema 保持只校验正式数据 |
| 7 | evidence anyOf 的 year 漏洞（本轮#1） | 移除裸 `year` 分支；新增 `offline: true + title` 分支——线下实物证据成为显式选择且必须可描述 |

### 🟡 强烈建议项

| 审核问题 | 修复方式 |
|---|---|
| confidence 层级（本轮#3） | evidence_item 内置 `confidence`；snapshot 级 confidence 注释明确两者分工；删除了原来冗余的"AI 证据 ⇒ snapshot sources"约束（sources 本就无条件必填） |
| evidence year → ohm_date（本轮#4） | `year: integer` → `date: ohm_date`，与 timeline 统一 |
| external_ids 格式（轮二#6/#7） | 每个 key 叠加 pattern；wikipedia 采用 `zhwiki:标题` sitelink 约定；osm/ohm 强制 `type/id` 格式；baidu_baike 加许可警告 |
| end_date 语义（轮二#9） | timeline description 写死 **inclusive** 约定 + 重叠判定规则 |
| BCE 纪年（轮一#10） | 统一为 ISO 天文纪年（0000 = 1 BCE），并注明与口语 BCE 的 off-by-one |
| 条件依赖收紧（轮一#6） | `verified_at ⇒ verified=true`；`ai_model/ai_prompt_version ⇔ created_via=ai_extraction`（else 分支禁止出现） |
| contribution_meta 空对象（轮一#7） | `required: [created_by, created_via]` |
| language 长度上限（轮一#8） | 新 `language_tag` 定义，pattern 支持 `zh-Hans-CN` |
| 魔法字符串（轮一#9） | `actor_id` 统一应用于 created_by / author / confirmed_by / endorsed_by / last_modified_by |
| 版本锁定 | `ste_version` 改为 `"const": "0.2"` |
| name 缓存派生规则（轮二#10） | 明确"取最后一个 snapshot 而非 active snapshot" |
| 其他小项 | tags 值 minLength 1；description 加 minLength 1（同时让 if 条件简化为 required 判断）；几何限制声明；lon ±180 归一化提示 |

### 提前处理的 🟢 项

`name.zh` → `name.localized`（BCP 47 键控对象）。理由：既然 v0.2 尚未正式发布，现在改比 v0.3 迁移便宜。**如果已有存量数据，这条可以回退**，恢复原 `zh` 字段即可，不影响其他修复。

---

## ② 应用层校验清单（README "Application-level validation" 节替换稿）

Schema 无法表达、必须在应用层强制的规则：

1. **日历有效性**：`02-30`、非闰年 `02-29` 等 schema 放行，需应用拒绝。
2. **timeline 顺序性**：按 start_date 升序、时段互不重叠（按 inclusive 约定判定）、至多一个 snapshot 缺 end_date 且必须是最后一个、缺 end_date 的 snapshot status ≠ demolished。
3. **`format` 关键字**（date-time / uri）在 draft-07 是注解，验证器需显式开启 format 断言，或应用自行校验。
4. **`default` 值**验证器不填充，读取方需自行套用默认。
5. **name/aliases 派生**：从 timeline 重算并比对，人工手写不一致时以 timeline 为准。
6. **tags 键前缀**：非 OSM 惯例键必须带 `ste:` 前缀（schema 无法区分哪些是 OSM 惯例键）。
7. **anon: token 不可关联性**：同一用户的 anon token 不得跨贡献复用或可被反查——这是密码学/平台层保证，schema 只能约束格式。
8. **经度归一化**：比对前将 -180 归一为 +180（或反之）。
9. **external_ids 存活性**：pattern 只保证格式，Q95 是否真实存在、OSM way 是否已被删除需定期巡检（`note` 字段配套使用）。
10. **草稿生命周期**：30 天宽限、到期处理、draft → formal 的晋升校验（晋升时刻跑本 schema）全部在平台侧。
11. **撤回墓碑渲染**：`retracted=true` 时前端只显示墓碑；schema 保证数据形态，不保证展示行为。
12. **baidu_baike 内容不入库**：只存链接，抓取内容属许可违规。

---

## ③ CI 负向测试用例清单

每条对应一个必须**校验失败**的 fixture（延续 v0.1 R3 的测试传统），命名建议 `test/invalid/NN_描述.json`：

```
01_narrative_ai_without_confidence        source_of_knowledge=ai_generated 但缺 confidence
02_narrative_ai_without_model             同上但缺 ai_model
03_narrative_retracted_with_text          retracted=true 且 text 非空
04_narrative_retracted_without_timestamp  retracted=true 但缺 retracted_at
05_narrative_not_retracted_with_timestamp retracted 缺省/false 但出现 retracted_at
06_narrative_escrow_with_user_author      escrowed_anonymous + author="user:alice"
07_narrative_realname_with_anon_author    real_name + author="anon:x7f3"
08_evidence_pointing_at_nothing           {"type":"photo"} 无 url/asset/offline
09_evidence_offline_without_title         offline=true 无 title
10_evidence_ai_without_confidence         ai_generated=true 无 confidence
11_evidence_retracted_with_url            retracted=true 但仍带 url
12_evidence_type_ai_generated             type="ai_generated"（旧枚举值，确认已移除）
13_snapshot_demolished_without_end        status=demolished 无 end_date
14_snapshot_relocated_without_coords      status=relocated 无 coordinates
15_snapshot_description_without_provenance 有 description 无 description_provenance
16_snapshot_ai_description_without_conf   description_provenance=ai_generated 无 confidence
17_snapshot_without_sources               缺 sources 或 sources=[]
18_meta_empty_object                      contributed_by: {}
19_meta_manual_with_ai_model              created_via=manual 却带 ai_model
20_extref_verified_at_without_verified    有 verified_at 但 verified=false/缺省
21_wikidata_bad_format                    external_ids.wikidata.id="Q95abc"
22_osm_bare_number                        external_ids.osm.id="12345"
23_wrong_version                          ste_version="0.1"
24_bad_language_tag                       language="zh-Hans-CN-x-foo"（超出 pattern）
```

外加至少 3 个**正向** fixture：最小合法文档、带撤回墓碑的文档、带 AI 证据 + relocated snapshot 的完整文档。

---

## ④ 需要你拍板的两个破坏性变更

1. **`name.zh` → `name.localized`**：上文已述，可回退。
2. **evidence `year: integer` → `date: ohm_date`**：如果已有实例数据写了 `year: 1950`，需要迁移脚本（`1950 → "1950"`，负数年份按天文纪年偏移 +1）。BCE 纪年从"−0221 = 221 BCE"改为 ISO 天文纪年同样影响存量 timeline 数据——**如果已有 BCE 数据，迁移时所有负数年份 +1**；如果还没有 BCE 数据（大概率），现在改零成本。

另有一个**语义收紧**提醒：`contribution_meta` 的 else 分支现在**禁止**非 ai_extraction 记录携带 `ai_model`。如果实践中存在"人工修订 AI 初稿"场景（created_via=manual 但想保留原始模型信息），这个约束会挡路——届时把 else 分支删掉即可，属一行改动，建议先保持严格、遇到真实需求再放宽。

---

按此版本发布前，建议最后跑一遍 `ajv compile --strict`（draft-07 模式 + `--all-errors`）确认无编译告警，24 条负向用例全红、3 条正向全绿，即可打 tag。需要我再出正向 fixture 的完整示例文档（比如西南联大迁移案例，恰好能覆盖 relocated + snapshot coordinates + 多叙事 + 托管匿名）的话，说一声。