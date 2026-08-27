# GOVERNANCE.md · STE 项目治理（草案 v0.1）

> 提案，待上游采纳。适用范围：ste-schema 内核、官方 profiles/、官方工具链。

## 1. 角色与决策

- **BDFL（仁慈独裁者）**：@wonderingWu。内核 schema 与官方 profile 的最终合并权，**保持到内核 v1.0 发布**。
- **贡献者**：任何人通过 PR 提交；fixture（正/负向用例）与代码同权重。
- **伦理争议**：按 ETHICS.md 三级机制，委员会为最终手段。

治理成熟度应落后于采用度一个身位：v1.0 前不设委员会、不设投票，决策记录公开即可。

## 2. 许可

| 资产 | 许可 | 理由 |
|---|---|---|
| schema 文本（内核 + profiles + ETHICS） | **CC0 1.0**（公共领域） | 标准文本零摩擦复用；署名靠 git 历史与作者权威，不靠许可证 |
| 代码（校验器、构建脚本、SDK、CLI） | **MIT** | 商用友好，与 OSM/OHM 工具链惯例一致 |
| 精选数据集 | **ODbL 1.0**（2026-08-27 经 ETHICS R8 定夺生效） | 与 OSM 生态兼容；署名+相同方式共享，防止数据被圈地 |

## 3. 质量门（CI 必须通过）

1. `ajv compile --strict`（en + zh，所有版本，无告警；建议加 ajv-formats 显式断言 uri/date-time）
2. 正向 fixture 全过、负向 fixture 全败（每个规则一条负向用例的传统不得破坏）
3. en/zh 结构对等检查（check-parity）
4. profile 入院标准（STE-EXT §6；该扩展规范目前存于项目工作区 `STE-EXT.md`，待正式入仓）：schema + README + ≥3 正向 / ≥5 负向 fixture + 一个真实使用场景
5. 校验器等价门（规划中，需 ajv 环境）：手写参考校验器与 JSON Schema 的 ajv 差分测试入 CI——同一 fixture 集两侧判定必须一致；当前由规则计数交叉断言兜底

## 4. 版本与兼容

- 内核 `ste_version` 版本锁定（const）；破坏性变更 = 大版本。
- profile 独立版本演进，必须声明 `ste_core` 兼容范围。
- 发布即打 tag；schema.json 一经发布不静默修改（修复描述性文案允许 patch 版本）。

## 5. 路线图锚点

- **v0.3**（内核，讨论中）：narrative 时间锚（about_period）、narrative 级 provenance（AI 辅助+人工确认场景）、structured source objects
- **ste-memo v0.1**：profiles/ste-memo/（草案，目前存于项目工作区，待正式入仓）
- **v1.0**：结构化证据交叉验证、实体关系 linked_events、事件模型（届时评估 ste-event 是否独立成 profile）
