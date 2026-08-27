/* ================================================================
 * ste-validator.js — STE Schema v0.2 手写校验器（无依赖）
 * 覆盖：schema 结构规则 + 内联 if/then 条件约束 + 应用层规则
 * （日历有效性 / 时间线排序与重叠 / 单开口末段）
 * 用法：浏览器 <script> 后得全局 validateSTE(doc)；Node 下 module.exports
 * 返回：{ ok:boolean, errors:[{path,rule,msg}] }
 * 导出形态说明（评审 P16）：type:module/ESM 环境下 module.exports 分支静默失效，
 * 由 globalThis.validateSTE 兜底（ste-schema/test-ste.js 即如此加载）。
 * ================================================================ */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.validateSTE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {

  const RE = {
    uuid4: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    ohm_date: /^-?\d{4}(-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?)?$/,
    actor: /^(user:[A-Za-z0-9._-]+|anon:[A-Za-z0-9._-]+|agent:[A-Za-z0-9._-]+|system:[A-Za-z0-9._-]+|community)$/,
    lang: /^[a-zA-Z]{2,3}(-[a-zA-Z]{4})?(-([a-zA-Z]{2}|\d{3}))?$/,
    wikidata: /^Q[1-9]\d*$/,
    osm: /^(node|way|relation)\/[1-9]\d*$/,
    wikipedia: /^[a-z]{2,12}wiki:.+$/,
    /* ISO 8601 date-time：秒可省，必须有 Z 或 ±hh:mm 偏移（评审 P5 同类问题在内核侧的对应） */
    datetime: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})$/
  };
  const ENUM = {
    sok: ['firsthand', 'secondhand', 'research', 'ai_generated'],
    aid: ['real_name', 'persistent_pseudonym', 'escrowed_anonymous'],
    style: ['neutral', 'personal_recollection', 'community_consensus', 'academic', 'journalistic', 'oral_history', 'other'],
    status: ['active', 'demolished', 'under_construction', 'proposed', 'relocated'],
    evtype: ['photo', 'satellite', 'map', 'document', 'oral', 'audio', 'video'],
    via: ['manual', 'ai_extraction', 'community_consensus', 'import'],
    dprov: ['manual', 'ai_generated', 'community_consensus', 'imported']
  };

  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  const isStr = v => typeof v === 'string';
  const nonEmpty = v => isStr(v) && v.length > 0;
  /* 非空白串（评审 P11：纯空格/全角空格不算内容） */
  const nonBlank = v => isStr(v) && v.trim().length > 0 && !/^[\s　]*$/.test(v);
  /* ISO date-time 格式断言（draft-07 format 只是注解） */
  function checkDateTime(v, path, err) {
    if (!isStr(v) || !RE.datetime.test(v)) {
      err(path, 'format', 'must be ISO 8601 date-time, e.g. 2026-08-25T10:30:00Z');
      return false;
    }
    if (!calendarValidDT(String(v).slice(0, 10))) { err(path, 'calendar', 'invalid calendar date in date-time'); return false; }
    return true;
  }
  function calendarValidDT(d) {
    const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return false;
    const y = +m[1], mo = +m[2], da = +m[3];
    if (mo < 1 || mo > 12) return false;
    const dim = [31, (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mo - 1];
    return da >= 1 && da <= dim;
  }

  /* 日历有效性（应用层规则 01）：YYYY[-MM[-DD]]，考虑闰年 */
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
  /* 归一化比较键：start 取下界，end 取上界（inclusive at stated granularity） */
  function normStart(d) { const p = d.split('-').map(Number); const neg = d[0] === '-'; const a = neg ? [-p[1], p[2] || 1, p[3] || 1] : [p[0], p[1] || 1, p[2] || 1]; return a; }
  function normEnd(d) { const p = d.split('-').map(Number); const neg = d[0] === '-'; const a = neg ? [-p[1], p[2] || 12, p[3] || 31] : [p[0], p[1] || 12, p[2] || 31]; return a; }
  function cmp(a, b) { for (let i = 0; i < 3; i++) { if (a[i] !== b[i]) return a[i] - b[i]; } return 0; }

  function validateSTE(doc) {
    const errors = [];
    const err = (path, rule, msg) => errors.push({ path, rule, msg });

    /* ---------- 顶层 ---------- */
    if (!isObj(doc)) { err('$', 'type', 'document must be an object'); return { ok: false, errors }; }
    ['ste_id', 'ste_version', 'name', 'coordinates', 'timeline'].forEach(k => {
      if (!(k in doc)) err('$.' + k, 'required', 'missing required top-level field');
    });
    const TOP = ['ste_id', 'ste_version', 'name', 'coordinates', 'external_ids', 'tags', 'narratives', 'timeline'];
    Object.keys(doc).forEach(k => { if (!TOP.includes(k)) err('$.' + k, 'additionalProperties', 'unexpected top-level key'); });

    if ('ste_id' in doc && !(isStr(doc.ste_id) && RE.uuid4.test(doc.ste_id)))
      err('$.ste_id', 'pattern', 'must be lowercase UUID v4');
    if ('ste_version' in doc && doc.ste_version !== '0.2')
      err('$.ste_version', 'const', 'version-locked: must be exactly "0.2"');

    /* ---------- name ---------- */
    if (isObj(doc.name)) {
      const N = ['primary', 'localized', 'aliases'];
      Object.keys(doc.name).forEach(k => { if (!N.includes(k)) err('$.name.' + k, 'additionalProperties', 'unexpected name key'); });
      if (!nonBlank(doc.name.primary)) err('$.name.primary', 'required', 'name.primary is required and non-blank');
      if (doc.name.localized != null) {
        if (!isObj(doc.name.localized)) err('$.name.localized', 'type', 'must be object');
        else Object.entries(doc.name.localized).forEach(([k, v]) => {
          if (!RE.lang.test(k)) err('$.name.localized.' + k, 'pattern', 'key must be BCP 47 tag');
          if (!nonEmpty(v)) err('$.name.localized.' + k, 'minLength', 'localized name must be non-empty');
        });
      }
      if (doc.name.aliases != null) {
        if (!Array.isArray(doc.name.aliases) || doc.name.aliases.some(a => !nonBlank(a)))
          err('$.name.aliases', 'items', 'aliases must be non-empty strings');
        else if (new Set(doc.name.aliases).size !== doc.name.aliases.length)
          err('$.name.aliases', 'uniqueItems', 'aliases must be unique');
      }
    } else if ('name' in doc) err('$.name', 'type', 'name must be object');

    /* ---------- coordinates / wgs84 ---------- */
    function checkPoint(p, path) {
      if (!isObj(p)) { err(path, 'type', 'must be object'); return; }
      Object.keys(p).forEach(k => { if (!['lat', 'lon'].includes(k)) err(path + '.' + k, 'additionalProperties', 'unexpected coordinate key'); });
      if (typeof p.lat !== 'number' || p.lat < -90 || p.lat > 90) err(path + '.lat', 'range', 'lat must be in [-90,90]');
      if (typeof p.lon !== 'number' || p.lon < -180 || p.lon > 180) err(path + '.lon', 'range', 'lon must be in [-180,180]');
    }
    if ('coordinates' in doc) checkPoint(doc.coordinates, '$.coordinates');

    /* ---------- external_ids ---------- */
    if (doc.external_ids != null) {
      const EXT = ['wikidata', 'osm', 'ohm', 'baidu_baike', 'wikipedia'];
      if (!isObj(doc.external_ids)) err('$.external_ids', 'type', 'must be object');
      else Object.entries(doc.external_ids).forEach(([k, ref]) => {
        const path = '$.external_ids.' + k;
        if (!EXT.includes(k)) { err(path, 'additionalProperties', 'unexpected external_ids key'); return; }
        if (!isObj(ref)) { err(path, 'type', 'external_id_ref must be object'); return; }
        Object.keys(ref).forEach(rk => { if (!['id', 'verified', 'verified_at', 'note'].includes(rk)) err(path + '.' + rk, 'additionalProperties', 'unexpected ref key'); });
        if (!nonBlank(ref.id)) err(path + '.id', 'required', 'external id required');
        else {
          if (k === 'wikidata' && !RE.wikidata.test(ref.id)) err(path + '.id', 'pattern', 'wikidata id must be Q-number');
          if ((k === 'osm' || k === 'ohm') && !RE.osm.test(ref.id)) err(path + '.id', 'pattern', k + ' id must be type/id (node|way|relation)');
          if (k === 'wikipedia' && !RE.wikipedia.test(ref.id)) err(path + '.id', 'pattern', 'wikipedia id must be <lang>wiki:<title>');
        }
        /* 评审 P4：verified 必须真布尔 */
        if (ref.verified != null && typeof ref.verified !== 'boolean')
          err(path + '.verified', 'type', 'verified must be boolean');
        if (ref.verified_at != null) {
          if (ref.verified !== true)
            err(path + '.verified_at', 'if/then', 'verified_at requires verified=true');
          else checkDateTime(ref.verified_at, path + '.verified_at', err);
        }
      });
    }

    /* ---------- tags ---------- */
    if (doc.tags != null) {
      if (!isObj(doc.tags)) err('$.tags', 'type', 'must be object');
      else Object.entries(doc.tags).forEach(([k, v]) => {
        if (!k.length) err('$.tags', 'propertyNames', 'tag key must be non-empty');
        if (!nonEmpty(v)) err('$.tags.' + k, 'minLength', 'tag value must be non-empty string');
        else if (!nonBlank(v)) err('$.tags.' + k, 'minLength', 'tag value must be non-blank string');
      });
    }

    /* ---------- contribution_meta ---------- */
    function checkMeta(m, path) {
      if (!isObj(m)) { err(path, 'type', 'contribution_meta must be object'); return; }
      const KEYS = ['created_by', 'created_via', 'ai_model', 'ai_prompt_version', 'confirmed_by', 'last_modified_by', 'last_modified_at', 'created_at'];
      Object.keys(m).forEach(k => { if (!KEYS.includes(k)) err(path + '.' + k, 'additionalProperties', 'unexpected meta key'); });
      if (m.created_by == null || !(isStr(m.created_by) && RE.actor.test(m.created_by)))
        err(path + '.created_by', 'required/pattern', 'created_by required, namespaced actor id (R: provenance transparency)');
      if (m.created_via == null || !ENUM.via.includes(m.created_via))
        err(path + '.created_via', 'required/enum', 'created_via required: ' + ENUM.via.join('/'));
      if (m.created_via === 'ai_extraction') {
        if (!nonEmpty(m.ai_model)) err(path + '.ai_model', 'if/then', 'ai_extraction requires ai_model');
      } else {
        if (m.ai_model != null) err(path + '.ai_model', 'if/then/else', 'ai_model forbidden unless created_via=ai_extraction');
        if (m.ai_prompt_version != null) err(path + '.ai_prompt_version', 'if/then/else', 'ai_prompt_version forbidden unless created_via=ai_extraction');
      }
      if (m.confirmed_by != null) {
        if (!Array.isArray(m.confirmed_by) || m.confirmed_by.some(a => !(isStr(a) && RE.actor.test(a))))
          err(path + '.confirmed_by', 'items', 'confirmed_by must be actor ids');
        else if (new Set(m.confirmed_by).size !== m.confirmed_by.length)
          err(path + '.confirmed_by', 'uniqueItems', 'confirmed_by must be unique');
      }
      if (m.last_modified_by != null && !(isStr(m.last_modified_by) && RE.actor.test(m.last_modified_by)))
        err(path + '.last_modified_by', 'pattern', 'must be namespaced actor id');
      if (m.created_at != null) checkDateTime(m.created_at, path + '.created_at', err);
      if (m.last_modified_at != null) checkDateTime(m.last_modified_at, path + '.last_modified_at', err);
    }

    /* ---------- narratives ---------- */
    if (doc.narratives != null) {
      if (!Array.isArray(doc.narratives)) err('$.narratives', 'type', 'must be array');
      else doc.narratives.forEach((n, i) => {
        const path = '$.narratives[' + i + ']';
        if (!isObj(n)) { err(path, 'type', 'narrative must be object'); return; }
        const KEYS = ['author', 'source_of_knowledge', 'author_identity', 'style', 'text', 'language', 'confidence', 'ai_model', 'created_at', 'endorsed_by', 'retracted', 'retracted_at'];
        Object.keys(n).forEach(k => { if (!KEYS.includes(k)) err(path + '.' + k, 'additionalProperties', 'unexpected narrative key'); });
        ['author', 'source_of_knowledge', 'author_identity', 'style', 'text'].forEach(k => {
          if (!(k in n)) err(path + '.' + k, 'required', 'narrative missing required field');
        });
        if (n.author != null && !(isStr(n.author) && RE.actor.test(n.author)))
          err(path + '.author', 'pattern', 'author must be namespaced actor id');
        if (n.source_of_knowledge != null && !ENUM.sok.includes(n.source_of_knowledge))
          err(path + '.source_of_knowledge', 'enum', 'invalid source_of_knowledge');
        if (n.author_identity != null && !ENUM.aid.includes(n.author_identity))
          err(path + '.author_identity', 'enum', 'invalid author_identity');
        if (n.style != null && !ENUM.style.includes(n.style))
          err(path + '.style', 'enum', 'invalid style');
        if (n.language != null && !RE.lang.test(n.language))
          err(path + '.language', 'pattern', 'language must be BCP 47');
        if (n.confidence != null && (typeof n.confidence !== 'number' || n.confidence < 0 || n.confidence > 1))
          err(path + '.confidence', 'range', 'confidence in [0,1]');
        if (n.endorsed_by != null) {
          if (!Array.isArray(n.endorsed_by) || n.endorsed_by.some(a => !(isStr(a) && RE.actor.test(a))))
            err(path + '.endorsed_by', 'items', 'endorsed_by must be actor ids');
          else if (new Set(n.endorsed_by).size !== n.endorsed_by.length)
            err(path + '.endorsed_by', 'uniqueItems', 'endorsed_by must be unique');
        }
        /* 评审 P4：retracted 必须真布尔（"yes" 等字符串拒绝） */
        if (n.retracted != null && typeof n.retracted !== 'boolean')
          err(path + '.retracted', 'type', 'retracted must be boolean');
        /* R6 撤回墓碑 */
        if (n.retracted === true) {
          if (n.text !== '') err(path + '.text', 'R6', 'retracted narrative must have empty text (tombstone)');
          if (!nonEmpty(n.retracted_at)) err(path + '.retracted_at', 'R6', 'retracted narrative requires retracted_at');
          else checkDateTime(n.retracted_at, path + '.retracted_at', err);
        } else {
          if (n.retracted_at != null) err(path + '.retracted_at', 'R6', 'retracted_at forbidden when not retracted');
          if ('text' in n && !nonBlank(n.text))
            err(path + '.text', 'minLength', 'non-retracted narrative text must be non-blank');
        }
        /* R3 AI 标注 */
        if (n.source_of_knowledge === 'ai_generated') {
          if (n.confidence == null) err(path + '.confidence', 'R3', 'ai_generated narrative requires confidence');
          if (!nonEmpty(n.ai_model)) err(path + '.ai_model', 'R3', 'ai_generated narrative requires ai_model');
        }
        /* C2 托管匿名 */
        if (n.author_identity === 'escrowed_anonymous') {
          if (isStr(n.author) && !n.author.startsWith('anon:'))
            err(path + '.author', 'C2', 'escrowed_anonymous requires anon: author token');
        } else if (isStr(n.author) && n.author.startsWith('anon:')) {
          err(path + '.author', 'C2', 'anon: author only allowed with escrowed_anonymous');
        }
      });
    }

    /* ---------- evidence_item ---------- */
    function checkEvidence(e, path) {
      if (!isObj(e)) { err(path, 'type', 'evidence must be object'); return; }
      const KEYS = ['type', 'ai_generated', 'url', 'ste_asset_id', 'offline', 'date', 'title', 'confidence', 'ai_model', 'contributed_by', 'retracted', 'retracted_at'];
      Object.keys(e).forEach(k => { if (!KEYS.includes(k)) err(path + '.' + k, 'additionalProperties', 'unexpected evidence key'); });
      if (!ENUM.evtype.includes(e.type))
        err(path + '.type', 'enum', 'invalid evidence type (AI generation is the ai_generated flag, not a type)');
      if (e.date != null && !(isStr(e.date) && RE.ohm_date.test(e.date)))
        err(path + '.date', 'pattern', 'date must be ohm_date');
      else if (e.date != null && !calendarValid(e.date))
        err(path + '.date', 'calendar', 'invalid calendar date');
      if (e.confidence != null && (typeof e.confidence !== 'number' || e.confidence < 0 || e.confidence > 1))
        err(path + '.confidence', 'range', 'confidence in [0,1]');
      if (e.contributed_by != null) checkMeta(e.contributed_by, path + '.contributed_by');
      /* 评审 P4：布尔字段必须真布尔 */
      if (e.retracted != null && typeof e.retracted !== 'boolean')
        err(path + '.retracted', 'type', 'retracted must be boolean');
      if (e.offline != null && typeof e.offline !== 'boolean')
        err(path + '.offline', 'type', 'offline must be boolean');
      if (e.ai_generated != null && typeof e.ai_generated !== 'boolean')
        err(path + '.ai_generated', 'type', 'ai_generated must be boolean');
      if (e.retracted === true) {
        if (!nonEmpty(e.retracted_at)) err(path + '.retracted_at', 'R6', 'retracted evidence requires retracted_at');
        else checkDateTime(e.retracted_at, path + '.retracted_at', err);
        if (e.url != null || e.ste_asset_id != null)
          err(path, 'R6', 'retracted evidence must not carry url/ste_asset_id (pointer IS the content)');
      } else {
        if (e.retracted_at != null) err(path + '.retracted_at', 'R6', 'retracted_at forbidden when not retracted');
        const hasUrl = nonBlank(e.url), hasAsset = nonBlank(e.ste_asset_id), hasOffline = e.offline === true && nonBlank(e.title);
        if (!hasUrl && !hasAsset && !hasOffline)
          err(path, 'anyOf', 'evidence must point at something: url, ste_asset_id, or offline=true + title');
        if (e.offline === true && !nonBlank(e.title))
          err(path + '.title', 'if/then', 'offline evidence requires title');
      }
      if (e.ai_generated === true) {
        if (e.confidence == null) err(path + '.confidence', 'R3', 'ai_generated evidence requires confidence');
        if (!nonEmpty(e.ai_model)) err(path + '.ai_model', 'R3', 'ai_generated evidence requires ai_model');
      }
    }

    /* ---------- timeline ---------- */
    function checkDate(d, path) {
      if (!isStr(d) || !RE.ohm_date.test(d)) { err(path, 'pattern', 'must be ohm_date YYYY[-MM[-DD]]'); return false; }
      if (!calendarValid(d)) { err(path, 'calendar', 'invalid calendar date (app-level rule 01)'); return false; }
      return true;
    }
    if (Array.isArray(doc.timeline)) {
      if (doc.timeline.length < 1) err('$.timeline', 'minItems', 'timeline must have at least 1 snapshot');
      let openEnded = 0;
      doc.timeline.forEach((s, i) => {
        const path = '$.timeline[' + i + ']';
        if (!isObj(s)) { err(path, 'type', 'snapshot must be object'); return; }
        const KEYS = ['start_date', 'end_date', 'name', 'type', 'status', 'coordinates', 'description', 'description_provenance', 'confidence', 'sources', 'contributed_by', 'evidence'];
        Object.keys(s).forEach(k => { if (!KEYS.includes(k)) err(path + '.' + k, 'additionalProperties', 'unexpected snapshot key'); });
        ['start_date', 'name', 'type', 'sources'].forEach(k => {
          if (!(k in s)) err(path + '.' + k, 'required', 'snapshot missing required field (sources mandatory per R1)');
        });
        if (s.start_date != null) checkDate(s.start_date, path + '.start_date');
        if (s.end_date != null) checkDate(s.end_date, path + '.end_date');
        else openEnded++;
        if (s.name != null && !nonBlank(s.name)) err(path + '.name', 'minLength', 'name non-blank');
        if (s.type != null && !nonEmpty(s.type)) err(path + '.type', 'minLength', 'type non-empty');
        if (s.status != null && !ENUM.status.includes(s.status)) err(path + '.status', 'enum', 'invalid status');
        if (s.status === 'demolished' && s.end_date == null)
          err(path + '.end_date', 'if/then', 'demolished requires end_date');
        if (s.status === 'relocated' && s.coordinates == null)
          err(path + '.coordinates', 'if/then', 'relocated requires snapshot coordinates');
        if (s.coordinates != null) checkPoint(s.coordinates, path + '.coordinates');
        if (s.description != null) {
          if (!nonEmpty(s.description)) err(path + '.description', 'minLength', 'description non-empty');
          if (!ENUM.dprov.includes(s.description_provenance))
            err(path + '.description_provenance', 'if/then', 'description requires description_provenance');
        }
        if (s.description_provenance === 'ai_generated' && s.confidence == null)
          err(path + '.confidence', 'if/then', 'ai_generated description requires snapshot confidence');
        if (s.confidence != null && (typeof s.confidence !== 'number' || s.confidence < 0 || s.confidence > 1))
          err(path + '.confidence', 'range', 'confidence in [0,1]');
        if (s.sources != null) {
          if (!Array.isArray(s.sources) || s.sources.length < 1)
            err(path + '.sources', 'minItems', 'sources must have at least 1 item (R1)');
          else s.sources.forEach((src, j) => {
            if (!nonBlank(src)) err(path + '.sources[' + j + ']', 'minLength', 'source must be non-blank string');
          });
        }
        if (s.contributed_by != null) checkMeta(s.contributed_by, path + '.contributed_by');
        if (s.evidence != null) {
          if (!Array.isArray(s.evidence)) err(path + '.evidence', 'type', 'evidence must be array');
          else s.evidence.forEach((e, j) => checkEvidence(e, path + '.evidence[' + j + ']'));
        }
      });
      /* 应用层规则 02：排序 / 重叠 / 开口段（评审 P13：保留原索引，错误路径指向真凶） */
      const snaps = doc.timeline
        .map((s, i) => ({ s, i }))
        .filter(x => isObj(x.s) && isStr(x.s.start_date) && RE.ohm_date.test(x.s.start_date));
      for (let k = 1; k < snaps.length; k++) {
        if (cmp(normStart(snaps[k].s.start_date), normStart(snaps[k - 1].s.start_date)) < 0)
          err('$.timeline[' + snaps[k].i + '].start_date', 'app-02', 'timeline must be sorted by start_date ascending');
      }
      for (let k = 0; k < snaps.length - 1; k++) {
        const cur = snaps[k].s;
        if (cur.end_date == null)
          err('$.timeline[' + snaps[k].i + ']', 'app-02', 'only the LAST snapshot may omit end_date');
        else if (RE.ohm_date.test(cur.end_date) && cmp(normEnd(cur.end_date), normStart(snaps[k + 1].s.start_date)) >= 0)
          err('$.timeline[' + snaps[k].i + '].end_date', 'app-02', 'periods overlap (end_date is INCLUSIVE; equal end/start counts as overlap)');
      }
      if (openEnded > 1) err('$.timeline', 'app-02', 'at most one snapshot without end_date');
      /* 评审 P13：已删除"open-ended must not be demolished"死检查——
         demolished 缺 end_date 必先触发上方 :demolished requires end_date，该检查永不可达 */
    } else if ('timeline' in doc) err('$.timeline', 'type', 'timeline must be array');

    return { ok: errors.length === 0, errors };
  }

  validateSTE._meta = { schema: 'https://wonderingWu.github.io/ste-schema/v0.2/schema.json', rules: 'schema + inline if/then + app-level 01/02' };
  return validateSTE;
});
