/* ================================================================
 * ste-memo-validator.js — ste-memo v0.1 profile 校验器（无依赖）
 * 浏览器全局 validateMEMO(doc) → {ok, errors:[{path,rule,msg}]}；Node module.exports
 * 导出形态说明（评审 P16）：type:module/ESM 环境下 module.exports 分支静默失效，
 * 由 globalThis.validateMEMO 兜底（profiles/ste-memo/test/test-memo.js 即如此加载）。
 * ================================================================ */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.validateMEMO = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {

  const RE = {
    uuid4: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    ohm_date: /^-?\d{4}(-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?)?$/,
    actor: /^(user:[A-Za-z0-9._-]+|anon:[A-Za-z0-9._-]+|agent:[A-Za-z0-9._-]+|system:[A-Za-z0-9._-]+|community)$/,
    lang: /^[a-zA-Z]{2,3}(-[a-zA-Z]{4})?(-([a-zA-Z]{2}|\d{3}))?$/,
    /* ISO 8601 date-time：秒可省，必须有 Z 或 ±hh:mm 偏移（评审 P5/M12/M13） */
    datetime: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})$/
  };
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  const isStr = v => typeof v === 'string';
  const nonEmpty = v => isStr(v) && v.length > 0;
  /* 非空白串（评审 P11：纯空格/全角空格不算内容） */
  const nonBlank = v => isStr(v) && v.trim().length > 0 && !/^[\s　]*$/.test(v);

  function calendarValid(d) {
    const m = d.match(/^(-?\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/);
    if (!m) return false;
    const y = parseInt(m[1], 10), mo = m[2] ? +m[2] : null, da = m[3] ? +m[3] : null;
    if (mo != null && (mo < 1 || mo > 12)) return false;
    if (da != null) {
      const dim = [31, (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mo - 1];
      if (da < 1 || da > dim) return false;
    }
    return true;
  }
  function norm(d, isEnd) {
    const neg = d[0] === '-';
    const p = (neg ? d.slice(1) : d).split('-').map(Number);
    const y = neg ? -p[0] : p[0];
    return [y, p[1] != null ? p[1] : (isEnd ? 12 : 1), p[2] != null ? p[2] : (isEnd ? 31 : 1)];
  }
  function cmp(a, b) { for (let i = 0; i < 3; i++) { if (a[i] !== b[i]) return a[i] - b[i]; } return 0; }

  /* ISO date-time 格式 + 日历有效性（draft-07 format 只是注解，必须在应用层断言） */
  function checkDateTime(v, path, err) {
    if (!isStr(v) || !RE.datetime.test(v)) {
      err(path, 'format', 'must be ISO 8601 date-time, e.g. 2026-08-25T10:30:00Z（"昨天"之类的垃圾值不算时间锚）');
      return false;
    }
    if (!calendarValid(String(v).slice(0, 10))) { err(path, 'calendar', 'invalid calendar date in date-time'); return false; }
    return true;
  }
  const isValidDateTime = v => isStr(v) && RE.datetime.test(v) && calendarValid(v.slice(0, 10));

  function checkMeta(m, path, err) {
    if (!isObj(m)) { err(path, 'type', 'contribution_meta must be object'); return; }
    const KEYS = ['created_by', 'created_via', 'ai_model', 'ai_prompt_version', 'confirmed_by', 'last_modified_by', 'last_modified_at', 'created_at'];
    Object.keys(m).forEach(k => { if (!KEYS.includes(k)) err(path + '.' + k, 'additionalProperties', 'unexpected meta key'); });
    if (!(isStr(m.created_by) && RE.actor.test(m.created_by)))
      err(path + '.created_by', 'required/pattern', 'created_by required, namespaced actor id');
    if (!['manual', 'ai_extraction', 'community_consensus', 'import'].includes(m.created_via))
      err(path + '.created_via', 'required/enum', 'invalid created_via');
    if (m.created_via === 'ai_extraction') {
      if (!nonEmpty(m.ai_model)) err(path + '.ai_model', 'if/then', 'ai_extraction requires ai_model');
    } else {
      if (m.ai_model != null) err(path + '.ai_model', 'if/then/else', 'ai_model forbidden unless ai_extraction');
      if (m.ai_prompt_version != null) err(path + '.ai_prompt_version', 'if/then/else', 'ai_prompt_version forbidden unless ai_extraction');
    }
    /* 评审 P3-4：confirmed_by 每项必须是合法 actor id（不只查重） */
    if (m.confirmed_by != null) {
      if (!Array.isArray(m.confirmed_by) || m.confirmed_by.some(a => !(isStr(a) && RE.actor.test(a))))
        err(path + '.confirmed_by', 'items', 'confirmed_by must be actor ids');
      else if (new Set(m.confirmed_by).size !== m.confirmed_by.length)
        err(path + '.confirmed_by', 'uniqueItems', 'confirmed_by must be unique');
    }
    if (m.last_modified_by != null && !(isStr(m.last_modified_by) && RE.actor.test(m.last_modified_by)))
      err(path + '.last_modified_by', 'pattern', 'must be namespaced actor id');
    /* date-time 字段格式断言（评审 P5） */
    if (m.created_at != null) checkDateTime(m.created_at, path + '.created_at', err);
    if (m.last_modified_at != null) checkDateTime(m.last_modified_at, path + '.last_modified_at', err);
  }

  function validateMEMO(doc) {
    const errors = [];
    const err = (path, rule, msg) => errors.push({ path, rule, msg });
    if (!isObj(doc)) { err('$', 'type', 'memo must be object'); return { ok: false, errors }; }

    const KEYS = ['profile', 'ste_core', 'memo_id', 'ste_id', 'place_text', 'coordinates', 'about_date', 'about_period',
      'observed_at', 'author', 'source_of_knowledge', 'author_identity', 'style', 'text', 'language', 'tags',
      'claims', 'media', 'confidence', 'ai_model', 'contributed_by', 'linked_at', 'retracted', 'retracted_at'];
    Object.keys(doc).forEach(k => { if (!KEYS.includes(k)) err('$.' + k, 'additionalProperties', 'unexpected memo key'); });

    /* 评审 P1：ste_core 入 required（STE-EXT §3 硬规则） */
    ['profile', 'ste_core', 'memo_id', 'ste_id', 'author', 'source_of_knowledge', 'author_identity', 'style', 'text', 'contributed_by']
      .forEach(k => { if (!(k in doc)) err('$.' + k, 'required', 'missing required field'); });

    if ('profile' in doc && doc.profile !== 'ste-memo/0.1')
      err('$.profile', 'const', 'profile must be "ste-memo/0.1"');
    /* 评审 P8：ste_core 钉精确版本（内核升版时发 memo 新版声明兼容） */
    if ('ste_core' in doc && doc.ste_core !== '0.2')
      err('$.ste_core', 'const', 'ste_core must be exactly "0.2"（钉精确内核版本）');
    if ('memo_id' in doc && !(isStr(doc.memo_id) && RE.uuid4.test(doc.memo_id)))
      err('$.memo_id', 'pattern', 'memo_id must be lowercase UUID v4');
    if ('ste_id' in doc && doc.ste_id !== null && !(isStr(doc.ste_id) && RE.uuid4.test(doc.ste_id)))
      err('$.ste_id', 'pattern', 'ste_id must be UUID v4 or null');

    /* STE-EXT §2.2：ste_id=null ⇒ place_text 或 coordinates 必居其一（P11：空白地名不算锚） */
    if (doc.ste_id === null) {
      if (!nonBlank(doc.place_text) && !isObj(doc.coordinates))
        err('$.ste_id', 'STE-EXT', 'orphan memo (ste_id=null) requires place_text or coordinates');
    }
    if (doc.place_text != null && !nonBlank(doc.place_text))
      err('$.place_text', 'minLength', 'place_text must be non-blank');
    if (doc.coordinates != null) {
      const c = doc.coordinates;
      if (!isObj(c)) err('$.coordinates', 'type', 'must be object');
      else {
        /* 评审 P3-2：坐标对象逐键白名单（对齐内核 checkPoint） */
        Object.keys(c).forEach(k => { if (!['lat', 'lon'].includes(k)) err('$.coordinates.' + k, 'additionalProperties', 'unexpected coordinate key'); });
        if (typeof c.lat !== 'number' || c.lat < -90 || c.lat > 90) err('$.coordinates.lat', 'range', 'lat must be in [-90,90]');
        if (typeof c.lon !== 'number' || c.lon < -180 || c.lon > 180) err('$.coordinates.lon', 'range', 'lon must be in [-180,180]');
      }
    }

    /* 时间锚字段级检查 */
    if (doc.about_date != null) {
      if (!isStr(doc.about_date) || !RE.ohm_date.test(doc.about_date)) err('$.about_date', 'pattern', 'must be ohm_date');
      else if (!calendarValid(doc.about_date)) err('$.about_date', 'calendar', 'invalid calendar date');
    }
    if (doc.about_period != null) {
      const p = doc.about_period;
      if (!isObj(p)) err('$.about_period', 'type', 'must be object');
      else {
        /* 评审 P3-1：about_period 逐键白名单（schema additionalProperties:false） */
        Object.keys(p).forEach(k => { if (!['start', 'end'].includes(k)) err('$.about_period.' + k, 'additionalProperties', 'unexpected about_period key'); });
        if (!nonBlank(p.start)) err('$.about_period.start', 'required', 'about_period.start required');
        else {
          if (!RE.ohm_date.test(p.start) || !calendarValid(p.start)) err('$.about_period.start', 'pattern', 'invalid start');
          if (p.end != null) {
            if (!isStr(p.end) || !RE.ohm_date.test(p.end) || !calendarValid(p.end)) err('$.about_period.end', 'pattern', 'invalid end');
            else if (cmp(norm(p.start, false), norm(p.end, true)) > 0) err('$.about_period', 'range', 'start must be ≤ end (inclusive)');
          }
        }
      }
    }
    /* 评审 P5：observed_at / linked_at / retracted_at 必须是合法 ISO date-time */
    if (doc.observed_at != null) checkDateTime(doc.observed_at, '$.observed_at', err);
    if (doc.linked_at != null) checkDateTime(doc.linked_at, '$.linked_at', err);

    /* STE-EXT §2.3 时间锚硬规则升级：锚必须"合法"才算数（垃圾字符串不算锚） */
    const okAbout = doc.about_date != null && isStr(doc.about_date) && RE.ohm_date.test(doc.about_date) && calendarValid(doc.about_date);
    const okPeriod = (function () {
      const p = doc.about_period;
      if (!isObj(p) || !nonBlank(p.start)) return false;
      if (!RE.ohm_date.test(p.start) || !calendarValid(p.start)) return false;
      if (p.end != null) {
        if (!isStr(p.end) || !RE.ohm_date.test(p.end) || !calendarValid(p.end)) return false;
        if (cmp(norm(p.start, false), norm(p.end, true)) > 0) return false;
      }
      return true;
    })();
    const okObserved = doc.observed_at != null && isValidDateTime(doc.observed_at);
    if (!okAbout && !okPeriod && !okObserved)
      err('$', 'STE-EXT', 'memo must carry at least one VALID time anchor (about_date / about_period / observed_at)');

    /* 三轴 */
    if (doc.author != null && !(isStr(doc.author) && RE.actor.test(doc.author)))
      err('$.author', 'pattern', 'author must be namespaced actor id');
    if (doc.source_of_knowledge != null && !['firsthand', 'secondhand', 'research', 'ai_generated'].includes(doc.source_of_knowledge))
      err('$.source_of_knowledge', 'enum', 'invalid source_of_knowledge');
    if (doc.author_identity != null && !['real_name', 'persistent_pseudonym', 'escrowed_anonymous'].includes(doc.author_identity))
      err('$.author_identity', 'enum', 'invalid author_identity');
    if (doc.style != null && !['neutral', 'personal_recollection', 'community_consensus', 'academic', 'journalistic', 'oral_history', 'other'].includes(doc.style))
      err('$.style', 'enum', 'invalid style');
    if (doc.language != null && !RE.lang.test(doc.language)) err('$.language', 'pattern', 'must be BCP 47');
    if (doc.confidence != null && (typeof doc.confidence !== 'number' || doc.confidence < 0 || doc.confidence > 1))
      err('$.confidence', 'range', 'confidence in [0,1]');

    /* R3 */
    if (doc.source_of_knowledge === 'ai_generated') {
      if (doc.confidence == null) err('$.confidence', 'R3', 'ai_generated requires confidence');
      if (!nonEmpty(doc.ai_model)) err('$.ai_model', 'R3', 'ai_generated requires ai_model');
    }
    /* C2 */
    if (doc.author_identity === 'escrowed_anonymous') {
      if (isStr(doc.author) && !doc.author.startsWith('anon:')) err('$.author', 'C2', 'escrowed_anonymous requires anon: author');
    } else if (isStr(doc.author) && doc.author.startsWith('anon:')) {
      err('$.author', 'C2', 'anon: author only allowed with escrowed_anonymous');
    }
    /* 评审 P3-6：布尔字段必须真布尔（"yes"/"true" 字符串拒绝） */
    if (doc.retracted != null && typeof doc.retracted !== 'boolean')
      err('$.retracted', 'type', 'retracted must be boolean');
    /* R6 墓碑：text 空 + retracted_at（合法 date-time），claims/media 一并移除 */
    if (doc.retracted === true) {
      if (doc.text !== '') err('$.text', 'R6', 'retracted memo must have empty text');
      if (!nonEmpty(doc.retracted_at)) err('$.retracted_at', 'R6', 'retracted requires retracted_at');
      else checkDateTime(doc.retracted_at, '$.retracted_at', err);
      if (doc.claims != null) err('$.claims', 'R6', 'retracted memo must not carry claims');
      if (doc.media != null) err('$.media', 'R6', 'retracted memo must not carry media');
    } else {
      if (doc.retracted_at != null) err('$.retracted_at', 'R6', 'retracted_at forbidden when not retracted');
      if ('text' in doc && !nonBlank(doc.text)) err('$.text', 'minLength', 'non-retracted memo text must be non-blank');
    }

    /* tags（P11：空白标签拒绝） */
    if (doc.tags != null) {
      if (!Array.isArray(doc.tags) || doc.tags.some(t => !nonBlank(t))) err('$.tags', 'items', 'tags must be non-blank strings');
      else if (new Set(doc.tags).size !== doc.tags.length) err('$.tags', 'uniqueItems', 'tags must be unique');
    }

    /* claims */
    if (doc.claims != null) {
      if (!Array.isArray(doc.claims)) err('$.claims', 'type', 'claims must be array');
      else doc.claims.forEach((c, i) => {
        const path = '$.claims[' + i + ']';
        if (!isObj(c)) { err(path, 'type', 'claim must be object'); return; }
        const CK = ['type', 'amount', 'unit', 'amount_modern', 'modern_base', 'tag'];
        Object.keys(c).forEach(k => { if (!CK.includes(k)) err(path + '.' + k, 'additionalProperties', 'unexpected claim key'); });
        if (!['price', 'age', 'count', 'duration', 'area', 'other'].includes(c.type)) err(path + '.type', 'enum', 'invalid claim type');
        if (typeof c.amount !== 'number') err(path + '.amount', 'required', 'amount must be number');
        if (!nonBlank(c.unit)) err(path + '.unit', 'required', 'unit required');
        if (c.amount_modern != null) {
          if (typeof c.amount_modern !== 'number') err(path + '.amount_modern', 'type', 'amount_modern must be number');
          if (typeof c.modern_base !== 'number') err(path + '.modern_base', 'if/then', 'amount_modern requires modern_base');
        }
        /* 评审 P3-5：modern_base 必须是整数（schema type:integer） */
        if (c.modern_base != null && (typeof c.modern_base !== 'number' || !Number.isInteger(c.modern_base)))
          err(path + '.modern_base', 'integer', 'modern_base must be integer (epoch year)');
        if (c.tag != null && !nonBlank(c.tag)) err(path + '.tag', 'minLength', 'claim tag must be non-blank');
      });
    }

    /* media（评审 P10：补回内核 evidence 的 AI 轴 ai_generated/confidence/ai_model） */
    if (doc.media != null) {
      if (!Array.isArray(doc.media)) err('$.media', 'type', 'media must be array');
      else doc.media.forEach((m, i) => {
        const path = '$.media[' + i + ']';
        if (!isObj(m)) { err(path, 'type', 'media item must be object'); return; }
        const MK = ['type', 'url', 'ste_asset_id', 'offline', 'date', 'title', 'ai_generated', 'confidence', 'ai_model'];
        Object.keys(m).forEach(k => { if (!MK.includes(k)) err(path + '.' + k, 'additionalProperties', 'unexpected media key'); });
        if (!['photo', 'audio', 'video', 'document'].includes(m.type)) err(path + '.type', 'enum', 'invalid media type');
        if (m.date != null && (!isStr(m.date) || !RE.ohm_date.test(m.date) || !calendarValid(m.date)))
          err(path + '.date', 'pattern', 'invalid ohm_date');
        if (m.offline != null && typeof m.offline !== 'boolean') err(path + '.offline', 'type', 'offline must be boolean');
        if (m.ai_generated != null && typeof m.ai_generated !== 'boolean') err(path + '.ai_generated', 'type', 'ai_generated must be boolean');
        if (m.confidence != null && (typeof m.confidence !== 'number' || m.confidence < 0 || m.confidence > 1))
          err(path + '.confidence', 'range', 'confidence in [0,1]');
        const hasUrl = nonBlank(m.url), hasAsset = nonBlank(m.ste_asset_id), hasOffline = m.offline === true && nonBlank(m.title);
        if (!hasUrl && !hasAsset && !hasOffline)
          err(path, 'anyOf', 'media must point at something: url / ste_asset_id / offline+title');
        /* 评审 P3-3：offline:true 必须配 title，与是否有 url/asset 无关（对齐内核 :230-231） */
        if (m.offline === true && !nonBlank(m.title))
          err(path + '.title', 'if/then', 'offline media requires title');
        /* P10：AI 生成媒体 ⇒ confidence + ai_model（R3 在媒体层的对应） */
        if (m.ai_generated === true) {
          if (m.confidence == null) err(path + '.confidence', 'R3', 'ai_generated media requires confidence');
          if (!nonEmpty(m.ai_model)) err(path + '.ai_model', 'R3', 'ai_generated media requires ai_model');
        }
      });
    }

    if (doc.contributed_by != null) checkMeta(doc.contributed_by, '$.contributed_by', err);
    return { ok: errors.length === 0, errors };
  }

  validateMEMO._meta = { profile: 'ste-memo/0.1', spec: 'profiles/ste-memo/README.md', review: 'coder-review-protocol-stack P1/P3/P5/P10/P11 修复版' };
  return validateMEMO;
});
