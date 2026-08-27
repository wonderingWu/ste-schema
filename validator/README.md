# validator/ — STE 官方参考校验器

`ste-validator.js` 是 STE Schema v0.2 的**官方参考校验器**（canonical reference validator），
零依赖 UMD 单文件，浏览器与 Node 均可直接加载。

## 为什么需要它

JSON Schema 只能表达 STE 规则的一部分（见根 README「Application-Level Validation」12 条清单）。
**通过 ajv 校验 ≠ 数据干净**。本校验器在手写代码里覆盖了 schema 表达不了的规则：

- schema 结构规则 + 内联 if/then 条件约束（与 `v0.2/schema.json` 对齐）
- 日历有效性（`02-30`、非闰年 `02-29` 必须拒绝）
- 时间线排序、区间不重叠（含 inclusive 边界）、至多一个开口末段且不得为 `demolished`
- BCE 天文纪年、经度 ±180 归一化等边界

共 **103 个检查点**（规则计数与 demo、测试套件交叉核对）。

## 用法

浏览器：

```html
<script src="ste-validator.js"></script>
<script>
  const result = validateSTE(doc); // { ok:boolean, errors:[{path,rule,msg}] }
</script>
```

Node：

```js
const validateSTE = require('./ste-validator.js');
const result = validateSTE(doc);
```

> ESM / `type:module` 环境下 `module.exports` 分支静默失效，请使用
> `globalThis.validateSTE` 兜底（demo 与测试套件即如此加载）。

## 同步纪律

`demo/ste-validator.js` 是 demo 静态托管所需的**打包副本**，本目录才是 canonical 来源。
改动校验器请改这里，再同步到 `demo/`。CI 与 `npm test` 中的
`scripts/check-validator-sync.mjs` 会强制两处字节一致，防止漂移。
