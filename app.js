/* ==========================================================================
   MotoFlow — app.js
   Không build step. Toàn bộ dữ liệu đọc từ data.js (MF).
   ========================================================================== */
(function () {
  'use strict';

  const MF = window.MF;
  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const num = (n) => String(n).replace('.', ',');
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  const params = new URLSearchParams(location.search);
  let booting = true;
  const state = {
    screen: params.get('screen') || 'home',
    scenario: params.get('scenario') || 'normal',
    theme: params.get('theme') || 'dark',
    clock: 7 * 3600 + 41 * 60 + 20,
    plan: 'review',       // review | approved | rejected
    chatBusy: false,
    horizon: 15
  };

  if (params.get('chrome') === '0') document.body.classList.add('solo');
  if (params.get('mode') === 'ops') {
    document.body.dataset.mode = 'ops';
    document.body.classList.add('solo-ops');
  }

  /* ------------------------------------------------------------------ utils */
  const f = () => MF.factors[state.scenario];
  const scaled = (v, key) => Math.round(v * f()[key]);
  const scaledArr = (arr, key) =>
    arr.map((v) => (v == null ? null : Math.round(v * f()[key])));

  function setText(key, value) {
    $$('[data-bind="' + key + '"]').forEach((el) => { el.textContent = value; });
  }
  function hhmmss(total) {
    const h = Math.floor(total / 3600) % 24;
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
  }
  function hhmm(total) {
    const h = Math.floor(total / 3600) % 24;
    const m = Math.floor((total % 3600) / 60);
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  }

  const STATE_LABEL = { ok: 'Thông thoáng', warn: 'Chậm', bad: 'Ùn tắc' };
  const stateOfQueue = (q) => (q >= 120 ? 'bad' : q >= 70 ? 'warn' : 'ok');

  function chip(stateKey, label) {
    return '<span class="state-chip" data-state-chip="' + stateKey + '"><span class="dot"></span>' +
      (label || STATE_LABEL[stateKey]) + '</span>';
  }

  /* ------------------------------------------------------------------ toast */
  let toastTimer;
  function toast(msg, icon) {
    const el = $('#toast');
    if (!el) return;
    el.innerHTML = '<svg class="icon icon--sm"><use href="#i-' + (icon || 'check') + '"/></svg><span>' + msg + '</span>';
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-on'), 2600);
  }

  /* ----------------------------------------------------------------- charts */
  function lineChart(cfg) {
    const W = cfg.width || 350;
    const H = cfg.height || 150;
    const padL = cfg.showAxis ? 30 : 6;
    const padR = 8;
    const padT = 12;
    const padB = cfg.showAxis ? 20 : 6;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;
    const labels = cfg.labels;
    const n = labels.length;

    const pool = [];
    (cfg.high || []).forEach((v) => v != null && pool.push(v));
    (cfg.low || []).forEach((v) => v != null && pool.push(v));
    (cfg.actual || []).forEach((v) => v != null && pool.push(v));
    (cfg.model || []).forEach((v) => v != null && pool.push(v));
    (cfg.extra || []).forEach((s) => s.values.forEach((v) => v != null && pool.push(v)));
    let max = Math.max.apply(null, pool);
    let min = cfg.baseZero === false ? Math.min.apply(null, pool) : 0;
    max = Math.ceil(max / 10) * 10 || 10;
    if (cfg.baseZero === false) min = Math.floor(min / 10) * 10;
    const range = Math.max(1, max - min);

    const x = (i) => padL + (innerW * i) / (n - 1);
    const y = (v) => padT + innerH - ((v - min) / range) * innerH;

    let out = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="presentation" aria-hidden="true">';

    if (cfg.showAxis) {
      [min, (min + max) / 2, max].forEach((v) => {
        const yy = y(v).toFixed(1);
        out += '<line class="grid-line" x1="' + padL + '" y1="' + yy + '" x2="' + (W - padR) + '" y2="' + yy + '"/>';
        out += '<text class="axis-text" x="' + (padL - 6) + '" y="' + (+yy + 3) + '" text-anchor="end">' + Math.round(v) + '</text>';
      });
      labels.forEach((lb, i) => {
        if (i % (cfg.xEvery || 3) !== 0) return;
        out += '<text class="axis-text" x="' + x(i).toFixed(1) + '" y="' + (H - 5) + '" text-anchor="middle">' + lb + '</text>';
      });
    }

    if (cfg.now != null) {
      const nx = x(cfg.now).toFixed(1);
      out += '<line class="now-line" x1="' + nx + '" y1="' + padT + '" x2="' + nx + '" y2="' + (padT + innerH) + '"/>';
      out += '<text class="now-label" x="' + nx + '" y="' + (padT - 3) + '" text-anchor="middle">bây giờ</text>';
    }

    // vùng tin cậy
    const bandIdx = [];
    (cfg.low || []).forEach((v, i) => { if (v != null) bandIdx.push(i); });
    if (bandIdx.length > 1) {
      let d = '';
      bandIdx.forEach((i, k) => {
        d += (k === 0 ? 'M' : 'L') + x(i).toFixed(1) + ' ' + y(cfg.high[i]).toFixed(1) + ' ';
      });
      for (let k = bandIdx.length - 1; k >= 0; k--) {
        const i = bandIdx[k];
        d += 'L' + x(i).toFixed(1) + ' ' + y(cfg.low[i]).toFixed(1) + ' ';
      }
      out += '<path class="band" d="' + d + 'Z"/>';
    }

    const pathOf = (arr) => {
      let d = '', started = false;
      arr.forEach((v, i) => {
        if (v == null) { started = false; return; }
        d += (started ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1) + ' ';
        started = true;
      });
      return d;
    };

    if (cfg.area && cfg.actual) {
      const first = cfg.actual.findIndex((v) => v != null);
      const last = cfg.actual.reduce((acc, v, i) => (v != null ? i : acc), -1);
      if (first >= 0 && last > first) {
        out += '<defs><linearGradient id="g' + cfg.id + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0%" stop-color="var(--brand)" stop-opacity=".30"/>' +
          '<stop offset="100%" stop-color="var(--brand)" stop-opacity="0"/></linearGradient></defs>';
        out += '<path d="' + pathOf(cfg.actual) + 'L' + x(last).toFixed(1) + ' ' + y(min) + ' L' + x(first).toFixed(1) + ' ' + y(min) + 'Z" fill="url(#g' + cfg.id + ')" stroke="none"/>';
      }
    }

    (cfg.extra || []).forEach((s) => {
      out += '<path class="' + s.cls + '" d="' + pathOf(s.values) + '"/>';
    });

    if (cfg.actual) out += '<path class="' + (cfg.actualCls || 'line--actual') + '" d="' + pathOf(cfg.actual) + '"/>';
    if (cfg.model)  out += '<path class="line--forecast" d="' + pathOf(cfg.model) + '"/>';

    // điểm cuối + nhãn trực tiếp
    const mark = (arr, cls, label) => {
      const last = arr.reduce((acc, v, i) => (v != null ? i : acc), -1);
      if (last < 0) return;
      const cx = x(last), cy = y(arr[last]);
      out += '<circle class="pin-dot" cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="3.2" stroke="' + cls + '"/>';
      if (label) {
        const anchor = last > n - 3 ? 'end' : 'middle';
        out += '<text class="axis-text" style="fill:var(--text);font-weight:600" x="' + (anchor === 'end' ? cx + 4 : cx).toFixed(1) +
          '" y="' + (cy - 8).toFixed(1) + '" text-anchor="' + anchor + '">' + label + '</text>';
      }
    };
    if (cfg.labels && cfg.actual) mark(cfg.actual, 'var(--brand)');
    if (cfg.model) mark(cfg.model, 'var(--ai)', cfg.endLabel);

    out += '</svg>';
    return out;
  }

  function sparkTel(el, series, unit) {
    if (!el) return;
    el.innerHTML = lineChart({
      id: Math.random().toString(36).slice(2, 7),
      labels: MF.route.labels,
      actual: series.actual,
      model: series.model,
      low: series.low,
      high: series.high,
      width: 340, height: 78, showAxis: false, xEvery: 99,
      area: true, endLabel: unit || ''
    });
  }

  /* ------------------------------------------------------------- render home */
  function renderWave() {
    const list = $('#waveList');
    if (!list) return;
    const offset = state.scenario === 'rain' ? 1 : 0;
    list.innerHTML = MF.greenWave.nodes.map((nd, i) => {
      const idx = clamp(i + offset, 0, MF.greenWave.nodes.length - 1);
      const item = MF.greenWave.nodes[idx];
      const label = STATE_LABEL[item.state];
      return '<li>' +
        '<span class="wave__rail" style="color:var(--' + item.state + ')"><span class="wave__dot"></span><span class="wave__stem"></span></span>' +
        '<span class="wave__name">' + nd.name + '</span>' +
        (item.inGreen
          ? '<span class="wave__flag">Vào xanh</span>'
          : '<span class="wave__flag" style="color:var(--warn)">Chờ ' + (state.scenario === 'surge' ? '18' : '12') + 's</span>') +
        '<span class="wave__eta">' + nd.eta + '</span>' +
        '</li>';
    }).join('');
  }

  const KIND_LABEL = { rain: 'Mưa', jam: 'Ùn tắc', camera: 'Thiết bị', incident: 'Sự cố', event: 'Thông tin' };

  function alertRow(a) {
    const iconMap = { rain: 'rain', jam: 'signal', camera: 'camera-off', incident: 'warn', event: 'activity' };
    return '<button type="button" class="alert" data-alert="' + a.id + '">' +
      '<span class="alert__icon" data-sev="' + a.severity + '"><svg class="icon icon--sm"><use href="#i-' + (iconMap[a.kind] || 'info') + '"/></svg></span>' +
      '<span class="alert__body">' +
        '<span class="alert__top"><span class="alert__title">' + a.title + '</span>' + chip(a.severity, KIND_LABEL[a.kind]) + '</span>' +
        '<span class="alert__meta">' + a.meta + '</span>' +
        '<span class="alert__text">' + a.body + '</span>' +
        '<span class="alert__cta">' + a.action + ' <svg class="icon icon--xs"><use href="#i-chevron"/></svg></span>' +
      '</span></button>';
  }

  function renderAlerts() {
    const home = $('#homeAlerts');
    if (home) home.innerHTML = MF.alerts.slice(0, 2).map(alertRow).join('');
    const page = $('#alertPage');
    if (page) {
      const filter = page.dataset.filter || 'all';
      const items = MF.alerts.filter((a) => filter === 'all' || a.kind === filter);
      page.innerHTML = items.length
        ? items.map(alertRow).join('')
        : '<div class="notice"><svg class="icon"><use href="#i-info"/></svg><p>Không có cảnh báo nào trong nhóm này.</p></div>';
    }
  }

  /* -------------------------------------------------------------- render node */
  function renderApproaches() {
    const el = $('#approachList');
    if (!el) return;
    el.innerHTML = MF.detail.approaches.map((a) => {
      const q = scaled(a.queue, 'queue');
      const st = stateOfQueue(q);
      const wait = scaled(a.wait, 'delay');
      const pct = clamp((q / 180) * 100, 8, 100);
      return '<article class="approach" data-state="' + st + '">' +
        '<div class="approach__head">' +
          '<span class="approach__dir">Hướng ' + a.dir + '</span>' +
          '<span class="approach__from">' + a.from + '</span>' +
        '</div>' +
        '<div class="approach__nums" style="color:var(--' + st + ')">' + q + '<small>m</small></div>' +
        '<div class="approach__bar" style="color:var(--' + st + ')"><span class="approach__fill" style="width:' + pct + '%;background:currentColor"></span></div>' +
        '<div class="approach__foot">' +
          '<span>Chờ <span class="mono">' + wait + 's</span> · xanh <span class="mono">' + a.green + 's</span></span>' +
          '<span class="mono" title="Thay đổi hàng đợi trong 5 phút">' + (a.trend > 0 ? '+' : '') + a.trend + ' m/5p</span>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  function renderNodeChart() {
    const el = $('#nodeChart');
    if (!el) return;
    const d = MF.detail.forecast;
    const actual = scaledArr(d.actual, 'queue');
    const model = scaledArr(d.model, 'queue');
    const low = scaledArr(d.low, 'queue');
    const high = scaledArr(d.high, 'queue');
    el.innerHTML = lineChart({
      id: 'node', labels: d.labels, actual, model, low, high,
      width: 340, height: 168, showAxis: true, xEvery: 2, area: true, now: 8.2,
      endLabel: model[model.length - 1] + ' m'
    });
    const table = $('#nodeTable');
    if (table) {
      table.innerHTML = '<thead><tr><th>Giờ</th><th>Thực tế</th><th>Dự báo</th><th>80%</th></tr></thead><tbody>' +
        d.labels.map((lb, i) => {
          const rng = low[i] != null && high[i] != null ? low[i] + '–' + high[i] : '—';
          return '<tr><td>' + lb + '</td><td>' + (actual[i] ?? '—') + '</td><td>' + (model[i] ?? '—') + '</td><td>' + rng + '</td></tr>';
        }).join('') + '</tbody>';
    }
  }

  function setRing(remaining, total) {
    const ring = $('#ringValue');
    if (!ring) return;
    const C = 2 * Math.PI * 46;
    ring.style.strokeDasharray = C;
    ring.style.strokeDashoffset = C * (1 - remaining / total);
    ring.style.stroke = 'var(--ok)';
  }

  /* -------------------------------------------------------------- render plans */
  function renderPlans() {
    const el = $('#planList');
    if (!el) return;
    const filter = el.dataset.filter || 'all';
    const items = MF.plans.filter((p) => {
      if (filter === 'all') return true;
      if (filter === 'review') return p.status === 'review';
      return p.status === 'applied';
    });
    const statusMap = {
      review: '<span class="badge badge--ai">Cần duyệt</span>',
      auto: '<span class="badge badge--ok">Tự áp dụng</span>',
      applied: '<span class="badge badge--ok">Đang chạy</span>'
    };
    el.innerHTML = items.map((p) => {
      const isReview = p.status === 'review' && state.plan === 'review';
      return '<article class="plan ' + (p.status === 'review' ? 'plan--review' : 'plan--applied') + '">' +
        '<div class="plan__head"><div><p class="plan__name">' + p.node + '</p>' +
        '<p class="plan__meta">' + p.note + '</p></div>' + (statusMap[p.status] || '') + '</div>' +
        '<div class="plan__grid">' +
          '<div class="plan__metric"><span>Chu kỳ</span>' + p.cycle + '</div>' +
          '<div class="plan__metric"><span>Lợi ích</span>' + p.gain + '</div>' +
          '<div class="plan__metric"><span>Tin cậy</span>' + Math.round(p.confidence * 100) + '%</div>' +
          '<div class="plan__metric"><span>Cập nhật</span>' + p.time + '</div>' +
        '</div>' +
        (isReview
          ? '<div class="plan__actions"><button type="button" class="btn btn--primary" data-approve="' + p.id + '"><svg class="icon"><use href="#i-check"/></svg> Phê duyệt</button>' +
            '<button type="button" class="btn btn--ghost" data-reject="' + p.id + '">Từ chối</button></div>'
          : '') +
      '</article>';
    }).join('');
  }

  function renderLimits() {
    const a = $('#limitList');
    if (a) a.innerHTML = MF.safety.limits.map((l) =>
      '<li><div><span class="limit__label">' + l.label + '</span><span class="limit__note">' + l.note + '</span></div>' +
      '<span class="limit__value">' + l.value + '</span></li>').join('');
    const b = $('#safetyLimits');
    if (b) b.innerHTML = MF.safety.limits.map((l) =>
      '<li><span class="limit__label">' + l.label + '</span><span class="limit__value">' + l.value + '</span>' +
      '<span class="limit__note">' + l.note + '</span></li>').join('');
  }

  function renderCams() {
    const el = $('#camList');
    if (!el) return;
    const extraFail = state.scenario === 'camera' ? 'PS' : null;
    el.innerHTML = MF.safety.cameras.map((c) => {
      const fail = c.status === 'fail' || (extraFail && c.name.indexOf(extraFail) > -1);
      return '<li class="cam"><span class="cam__dot" data-s="' + (fail ? 'fail' : 'ok') + '"></span>' +
        '<span class="cam__name">' + c.name + '</span>' +
        '<span class="cam__meta">' + (fail ? 'mất tín hiệu' : c.fps + ' · ' + c.last) + '</span></li>';
    }).join('');
  }

  /* ------------------------------------------------------------------- map */
  function renderMap() {
    const svg = $('#mapSvg');
    if (!svg) return;
    const nodes = MF.nodes;
    const scale = { 15: 1, 30: 1.16, 60: 1.34 }[state.horizon] || 1;

    let s = '';
    s += '<defs>' +
      '<pattern id="grid" width="26" height="26" patternUnits="userSpaceOnUse">' +
      '<path d="M26 0H0V26" fill="none" stroke="var(--border)" stroke-width=".5" opacity=".5"/></pattern>' +
      '</defs>';
    s += '<rect width="390" height="380" fill="url(#grid)"/>';

    // sông Sài Gòn (lược đồ)
    s += '<path d="M-20 44 C 60 66, 104 104, 182 116 S 306 118, 410 70 L 410 128 C 320 176, 236 168, 164 152 S 40 116, -20 92 Z" fill="var(--brand)" opacity=".14"/>';

    // đường ngang
    nodes.forEach((n) => {
      s += '<line x1="' + (n.x - 54) + '" y1="' + (n.y - 71) + '" x2="' + (n.x + 54) + '" y2="' + (n.y + 71) +
        '" stroke="var(--surface-3)" stroke-width="9" stroke-linecap="round"/>';
    });

    // trục chính
    const line = nodes.map((n) => n.x + ' ' + n.y).join(' L ');
    s += '<path d="M10 340 L ' + line + ' L 380 56" stroke="var(--surface-3)" stroke-width="22" fill="none" stroke-linecap="round"/>';
    s += '<path d="M10 340 L ' + line + ' L 380 56" stroke="var(--bg-elev)" stroke-width="15" fill="none" stroke-linecap="round"/>';
    s += '<path d="M10 340 L ' + line + ' L 380 56" stroke="var(--border)" stroke-width="1.2" fill="none" stroke-dasharray="6 9" opacity=".75"/>';

    // tuyến của người dùng
    s += '<path d="M26 332 L ' + nodes.map((n) => n.x + ' ' + n.y).join(' L ') +
      '" stroke="var(--brand)" stroke-width="4" fill="none" stroke-linecap="round" opacity=".92"/>';

    // nhãn khu vực
    s += '<text x="34" y="360" font-size="9" fill="var(--muted)" font-family="Fira Sans, sans-serif">Q.6 · Bình Chánh</text>';
    s += '<text x="168" y="146" font-size="9" fill="var(--muted)" font-family="Fira Sans, sans-serif">Q.5</text>';
    s += '<text x="286" y="76" font-size="9" fill="var(--muted)" font-family="Fira Sans, sans-serif">Q.1</text>';

    // vị trí người dùng
    s += '<g><circle cx="24" cy="346" r="13" fill="var(--brand)" opacity=".16"/>' +
      '<circle cx="24" cy="346" r="5.5" fill="var(--brand)" stroke="var(--bg)" stroke-width="2.4"/>' +
      '<text x="40" y="350" font-size="9.5" fill="var(--text)" font-weight="600" font-family="Fira Sans, sans-serif">Bạn</text></g>';

    // nút giao
    nodes.forEach((n) => {
      const st = stateOfQueue(scaled(n.queue, 'queue') * scale);
      const color = 'var(--' + st + ')';
      const sel = n.id === MF.detail.nodeId;
      const w = n.short.length * 7 + 30;
      const leftSide = n.x > 290;
      const chipX = leftSide ? n.x - w - 14 : n.x + 14;
      const chipY = n.y - 10;
      s += '<g class="map-pin" data-node="' + n.id + '" tabindex="0" role="button" aria-label="' +
        n.name + ', ' + STATE_LABEL[st] + ', hàng đợi ' + scaled(n.queue, 'queue') + ' mét">' +
        '<title>' + n.name + ' — ' + STATE_LABEL[st] + '</title>';
      if (sel) s += '<circle cx="' + n.x + '" cy="' + n.y + '" r="22" fill="' + color + '" opacity=".13"/>';
      s += '<circle cx="' + n.x + '" cy="' + n.y + '" r="9.5" fill="var(--bg)" stroke="' + color + '" stroke-width="3"/>';
      s += '<circle cx="' + n.x + '" cy="' + n.y + '" r="3.6" fill="' + color + '"/>';
      s += '<g><rect x="' + chipX + '" y="' + chipY + '" width="' + w + '" height="20" rx="6" fill="var(--surface)" stroke="var(--border)" opacity=".97"/>';
      s += '<text x="' + (chipX + 8) + '" y="' + (chipY + 14) + '" font-size="9.5" fill="var(--text)" font-weight="600" font-family="Fira Code, monospace">' + n.short + '</text>';
      s += '<circle cx="' + (chipX + w - 10) + '" cy="' + (chipY + 10) + '" r="3" fill="' + color + '"/>';
      s += '</g></g>';
    });

    svg.innerHTML = s;

    $$('.map-pin', svg).forEach((pin) => {
      const activate = () => {
        const nd = MF.nodes.find((x) => x.id === pin.dataset.node);
        MF.detail.nodeId = nd.id;
        updateMapSheet(nd);
        renderMap();
        toast('Đã chọn ' + nd.name, 'pin');
      };
      pin.addEventListener('click', activate);
      pin.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
      });
    });
    updateMapSheet(MF.nodes.find((x) => x.id === MF.detail.nodeId));
  }

  function updateMapSheet(nd) {
    if (!nd) return;
    const q = scaled(nd.queue, 'queue');
    const st = stateOfQueue(q);
    setText('mapNodeName', 'Võ Văn Kiệt – ' + nd.name);
    setText('mapNodeDistrict', 'Nút giao ' + nd.short);
    setText('mapCycle', nd.cycle);
    setText('mapQueue', q);
    setText('mapDelay', scaled(nd.delay, 'delay'));
    setText('mapConf', Math.round(nd.confidence * f().confidence * 100));
    setText('mapNodeState', STATE_LABEL[st]);
    const chipEl = $('[data-bind="mapNodeState"]');
    if (chipEl && chipEl.parentElement) chipEl.parentElement.dataset.stateChip = st;
    const spark = $('#mapSpark');
    if (spark) {
      spark.innerHTML = lineChart({
        id: 'map', labels: MF.detail.forecast.labels,
        actual: scaledArr(MF.detail.forecast.actual, 'queue'),
        model: scaledArr(MF.detail.forecast.model, 'queue'),
        low: scaledArr(MF.detail.forecast.low, 'queue'),
        high: scaledArr(MF.detail.forecast.high, 'queue'),
        width: 340, height: 70, showAxis: false, area: true, now: 8.2,
        endLabel: Math.round(MF.detail.forecast.model[12] * f().queue) + 'm'
      });
    }
  }

  /* ------------------------------------------------------------------- ops */
  function renderOps() {
    const kpis = $('#kpiRow');
    if (kpis) {
      kpis.innerHTML = MF.ops.kpis.map((k) => {
        const dir = k.dir;
        return '<article class="kpi"><p class="kpi__label">' + k.label + '</p>' +
          '<p class="kpi__value">' + k.value + '<small>' + k.unit + '</small></p>' +
          '<p class="kpi__foot"><span class="kpi__delta" data-dir="' + dir + '">' +
          '<svg class="icon icon--xs"><use href="#i-arrow-' + (dir === 'down' ? 'down' : 'up') + '"/></svg>' + k.delta + '</span>' +
          '<span>' + k.note + '</span></p></article>';
      }).join('');
    }

    const chart = $('#opsChart');
    if (chart) {
      const c = MF.ops.chart;
      chart.innerHTML = lineChart({
        id: 'ops', labels: c.labels, model: c.adaptive,
        actual: null, extra: [{ values: c.fixed, cls: 'line--muted' }],
        width: 980, height: 176, showAxis: true, xEvery: 1, baseZero: false, now: 4.7
      }).replace('class="line--forecast"', 'class="line--brand"');
    }

    const nodes = $('#opsNodes');
    if (nodes) {
      nodes.innerHTML = '<div class="node-row node-row--head"><span>Nút giao</span><span>Hàng đợi</span><span>Chờ TB</span><span>Chu kỳ</span><span>Tin cậy</span></div>' +
        MF.nodes.map((n, i) => {
          const q = scaled(n.queue, 'queue');
          const st = stateOfQueue(q);
          return '<div class="node-row"><span class="node-name"><i style="background:var(--' + st + ')"></i>' + n.name + '</span>' +
            '<span><span class="mono">' + q + 'm</span><span class="node-bar"><span style="width:' + clamp(q / 1.8, 6, 100) + '%;background:var(--' + st + ')"></span></span></span>' +
            '<span class="mono">' + scaled(n.delay, 'delay') + 's</span>' +
            '<span class="mono">' + (i === 3 ? 90 : n.cycle) + 's</span>' +
            '<span class="mono">' + Math.round(n.confidence * f().confidence * 100) + '%</span></div>';
        }).join('');
    }

    const queues = $('#opsQueues');
    if (queues) {
      const ap = MF.detail.approaches;
      queues.innerHTML = ap.map((a) => {
        const q = scaled(a.queue, 'queue');
        const st = stateOfQueue(q);
        return '<div class="qbar"><div class="qbar__head"><span>Hướng ' + a.dir + ' · ' + a.from + '</span>' +
          '<span class="mono" style="color:var(--' + st + ')">' + q + ' m</span></div>' +
          '<div class="qbar__track"><div class="qbar__fill" style="width:' + clamp(q / 1.8, 5, 100) + '%;background:var(--' + st + ')"></div></div></div>';
      }).join('');
    }
  }

  /* ---------------------------------------------------------------- chat */
  function renderChatSuggestions() {
    const el = $('#suggestions');
    if (!el) return;
    el.innerHTML = MF.chat.map((c, i) => '<button type="button" data-q="' + i + '">' + c.q + '</button>').join('');
  }

  function addMsg(text, who) {
    const chat = $('#chat');
    if (!chat) return;
    const div = document.createElement('div');
    div.className = 'msg msg--' + who;
    div.innerHTML = (who === 'bot' ? '<span class="msg__avatar" aria-hidden="true"><svg class="icon icon--sm"><use href="#i-spark"/></svg></span>' : '') +
      '<div class="msg__body"><p>' + text + '</p></div>';
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
    return div;
  }

  function askBot(question) {
    if (state.chatBusy) return;
    state.chatBusy = true;
    addMsg(question, 'user');
    const typing = addMsg('<span class="typing"><i></i><i></i><i></i></span>', 'bot');
    const found = MF.chat.find((c) => c.q === question);
    const answer = found ? found.a :
      'Mình chỉ trả lời dựa trên dữ liệu tổng hợp của 4 nút giao trên trục Võ Văn Kiệt. Bạn có thể hỏi về: vì sao đèn xanh dài hơn, độ chính xác dự báo, camera lỗi, hoặc dữ liệu cá nhân.';
    setTimeout(() => {
      typing.querySelector('.msg__body').innerHTML = '<p>' + answer + '</p>';
      state.chatBusy = false;
      const chat = $('#chat');
      if (chat) chat.scrollTop = chat.scrollHeight;
    }, 620);
  }

  /* ------------------------------------------------------------- numbers all */
  function updateNumbers() {
    const usr = MF.user;
    const eta = scaled(usr.eta, 'delay');
    const delta = eta - usr.etaBase;
    setText('eta', eta);
    setText('etaDelta', '+' + delta + ' phút');
    setText('arriveAt', hhmm(state.clock + eta * 60));
    setText('routeForecastNote', 'Chậm hơn ' + Math.max(2, Math.round(delta * 0.7)) + ' phút nếu khởi hành sau 07:55');
    setText('distance', usr.distance);

    const routeState = delta >= 8 ? 'bad' : delta >= 3 ? 'warn' : 'ok';
    setText('routeStateLabel', STATE_LABEL[routeState]);
    const rchip = $('[data-bind="routeStateLabel"]');
    if (rchip && rchip.parentElement) rchip.parentElement.dataset.stateChip = routeState;

    setText('gwSummary', state.scenario === 'rain'
      ? 'Đi trong 2 phút → xanh 2/4 nút'
      : state.scenario === 'surge'
        ? 'Đi trong 2 phút → xanh 2/4 nút'
        : MF.greenWave.summary);
    setText('bestDeparture', hhmm(state.clock + 3 * 60));
    setText('saved', state.scenario === 'normal' ? '-' + MF.greenWave.saved : '-' + Math.max(1, 4 - (state.scenario === 'rain' ? 2 : 1)) + ' phút');
    setText('updated', hhmmss(state.clock));
    setText('planCount', state.plan === 'review' ? '1 cần duyệt' : '0 cần duyệt');

    const node = MF.detail;
    setText('appliedCycle', node.applied.cycle);
    const ag = $('[data-bind="appliedGreens"]');
    if (ag) ag.innerHTML = node.applied.greens.map((g) => '<li>' + g + 's</li>').join('');
    const pg = $('[data-bind="proposedGreens"]');
    if (pg) pg.innerHTML = node.proposed.greens.map((g) => '<li>' + g + 's</li>').join('');
    setText('proposedCycle', node.proposed.cycle);
    setText('proposedConf', Math.round(node.proposed.confidence * f().confidence * 100));
    setText('cycle', node.cycle);

    // an toàn
    const twoFail = state.scenario === 'camera';
    setText('safetyStatusTitle', twoFail ? '2 thiết bị biên mất tín hiệu' : '1 thiết bị biên mất tín hiệu');
    setText('safetyStatusNote', twoFail
      ? 'Nút giao NTP và Pasteur chạy kế hoạch cố định 90 giây. AI bị khoá cho 2 nút.'
      : 'Nút giao Pasteur chạy kế hoạch cố định 90 giây. AI bị khoá cho nút này.');
    setText('safetyTileNote', twoFail ? '2 nút suy giảm' : 'Suy giảm 1 nút');
    const statusCard = $('#safetyStatus');
    if (statusCard) statusCard.classList.toggle('is-bad', twoFail);
    const badge = $('#safetyBadge');
    if (badge) {
      badge.textContent = twoFail ? 'Sự cố' : 'Suy giảm';
      badge.className = 'badge ' + (twoFail ? 'badge--bad' : 'badge--warn');
    }
    const aiNodes = $$('#safetyStatus .status-grid .stat__value')[1];
    if (aiNodes) aiNodes.textContent = twoFail ? '2' : '3';
    const b = $('#degradedBanner');
    if (b) {
      b.hidden = false;
      b.className = 'banner ' + (twoFail ? 'banner--bad' : 'banner--warn');
      b.innerHTML = '<svg class="icon"><use href="#i-camera-off"/></svg><div><strong>' +
        (twoFail ? 'Chế độ an toàn · 2 nút' : 'AI vẫn chạy 3/4 nút') + '</strong><span>' +
        (twoFail ? 'NTP và Pasteur dùng kế hoạch cố định 90 giây' : 'Camera Pasteur mất tín hiệu · nút này dùng kế hoạch cố định') +
        '</span></div><button type="button" class="linkbtn" data-goto="safety">Xem</button>';
    }
  }

  function renderAll() {
    updateNumbers();
    renderWave();
    renderAlerts();
    renderApproaches();
    renderNodeChart();
    renderPlans();
    renderLimits();
    renderCams();
    renderMap();
    sparkTel($('#routeSpark'), {
      actual: scaledArr(MF.route.actual, 'delay'),
      model: scaledArr(MF.route.model, 'delay'),
      low: scaledArr(MF.route.low, 'delay'),
      high: scaledArr(MF.route.high, 'delay')
    }, '');
    renderOps();
  }

  /* ------------------------------------------------------------------ notes */
  const NOTES = {
    home: ['Hôm nay', 'Người đi đường cần một câu trả lời trong 3 giây: đi bây giờ có kẹt không, nên đi lúc nào.',
      ['ETA là số lớn nhất trên màn hình, delta so với giờ thường đặt ngay cạnh.',
       'Làn sóng xanh biến dự báo thành hành động: xuất phát lúc mấy giờ.',
       'Cảnh báo dựa trên dự báo, luôn kèm nhãn "dự báo" và giờ cụ thể.']],
    map: ['Bản đồ dự báo', 'Không phải bản đồ giao thông hiện tại — đây là bản đồ của 15 phút tới.',
      ['Màu nút giao theo hàng đợi dự báo, có legend chữ không chỉ màu.',
       'Chọn khung +15/+30/+60 phút để thấy độ bất định tăng dần.',
       'Panel dưới đáy trả lời 3 số quan trọng nhất, rồi mới đến CTA.']],
    node: ['Nút giao', 'Màn hình cho kỹ sư: thấy hàng đợi 4 nhánh và kế hoạch đèn trước khi bấm duyệt.',
      ['Vòng đếm ngược pha là tâm điểm, số Fira Code tabular để không nhảy layout.',
       'So sánh "đang áp dụng" và "AI đề xuất" cạnh nhau, kèm % tin cậy.',
       'Biểu đồ có dải tin cậy 80% và bảng số thay thế cho người dùng screen reader.']],
    plans: ['Kế hoạch đèn', 'Hệ thống chỉ đề xuất. Không có nút nào gửi trực tiếp xuống đèn thật.',
      ['Thông điệp phạm vi đặt trên cùng, trước danh sách.',
       'Mỗi thẻ nêu chu kỳ, lợi ích, độ tin cậy và thời điểm cập nhật.',
       'Ràng buộc an toàn hiển thị ngay dưới danh sách để nhắc giới hạn.']],
    alerts: ['Cảnh báo', 'Phân biệt rõ mưa, ùn tắc, sự cố và lỗi thiết bị — mỗi loại có hành động khác nhau.',
      ['Bộ lọc dạng chip, cuộn ngang, chạm 44px.',
       'Mỗi cảnh báo nêu nguồn và giờ, không chỉ tiêu đề.',
       'Cảnh báo thiết bị dẫn thẳng sang lớp an toàn.']],
    safety: ['An toàn & dữ liệu', 'Lớp 4 là điều kiện bắt buộc: giới hạn cứng, dự phòng, quyền riêng tư.',
      ['Giới hạn xanh min/max, vàng, toàn đỏ, người đi bộ hiển thị thành lưới dễ quét.',
       'Sức khoẻ camera theo từng thiết bị biên, có FPS và độ trễ.',
       'Cam kết không lưu video, không nhận dạng — nêu ngay trong sản phẩm.']],
    assistant: ['Trợ lý AI', 'Giải thích được là điều kiện để kỹ sư tin và để giám khảo chấm điểm.',
      ['Câu trả lời luôn nêu số liệu, giới hạn an toàn và độ bất định.',
       'Gợi ý câu hỏi giúp người dùng mới bắt đầu.',
       'Trợ lý chỉ đọc dữ liệu tổng hợp, không điều khiển đèn.']]
  };

  function updateNotes() {
    const n = NOTES[state.screen] || NOTES.home;
    const t = $('#notesTitle'), b = $('#notesBody'), l = $('#notesList');
    if (t) t.textContent = n[0];
    if (b) b.textContent = n[1];
    if (l) l.innerHTML = n[2].map((x) => '<li>' + x + '</li>').join('');
    $$('.screens-nav button').forEach((btn) => btn.classList.toggle('is-active', btn.dataset.goto === state.screen));
  }

  /* ------------------------------------------------------------------- nav */
  const TAB_MAP = { home: 'home', map: 'map', node: 'node', plans: 'node', alerts: 'alerts', safety: 'safety', assistant: 'home' };

  function setScreen(id) {
    if (!NOTES[id]) id = 'home';
    state.screen = id;
    document.body.dataset.screen = id;
    $$('.viewport > .screen').forEach((s) => s.classList.toggle('is-active', s.dataset.screen === id));
    $$('.tabbar button').forEach((b) => b.classList.toggle('is-active', b.dataset.goto === TAB_MAP[id]));
    const sc = $('.screen[data-screen="' + id + '"]');
    if (sc) sc.scrollTop = 0;
    updateNotes();
    if (id === 'map') renderMap();
    if (window.innerWidth <= 900) window.scrollTo({ top: 0 });
  }

  function setScenario(key) {
    if (!MF.factors[key]) return;
    state.scenario = key;
    $$('.scenario-switch button').forEach((b) => b.classList.toggle('is-active', b.dataset.scenario === key));
    const note = $('#captionNote');
    if (note) note.textContent = 'kịch bản: ' + MF.scenarios[key].label.toLowerCase();
    renderAll();
    if (state.screen === 'map') renderMap();
    if (booting) return;
    toast(MF.scenarios[key].label + ' · ' + MF.scenarios[key].note, key === 'camera' ? 'warn' : 'refresh');
  }

  function approve(ok) {
    if (state.plan !== 'review') return;
    state.plan = ok ? 'approved' : 'rejected';
    MF.plans[0].status = ok ? 'applied' : 'auto';
    renderPlans();
    updateNumbers();
    const chipEl = $('.plan .badge');
    if (chipEl) chipEl.outerHTML = ok
      ? '<span class="badge badge--ok">Đã duyệt</span>'
      : '<span class="badge">Đã từ chối</span>';
    const btn = $('#approvePlan');
    if (btn) {
      btn.innerHTML = '<svg class="icon"><use href="#i-check"/></svg> ' + (ok ? 'Đã phê duyệt' : 'Đã từ chối');
      btn.disabled = true;
    }
    const rj = $('#rejectPlan');
    if (rj) rj.disabled = true;
    toast(ok
      ? 'Đã ghi nhận phê duyệt · chờ kỹ sư xác nhận tại chỗ'
      : 'Đã từ chối · giữ nguyên kế hoạch đang chạy', ok ? 'check' : 'x');
  }

  /* ------------------------------------------------------------------ events */
  document.addEventListener('click', (e) => {
    const goto = e.target.closest('[data-goto]');
    if (goto) { e.preventDefault(); setScreen(goto.dataset.goto); return; }

    const scn = e.target.closest('[data-scenario]');
    if (scn) { setScenario(scn.dataset.scenario); return; }

    const alert = e.target.closest('[data-alert]');
    if (alert) {
      const a = MF.alerts.find((x) => x.id === alert.dataset.alert);
      if (a) {
        if (a.kind === 'camera') setScreen('safety');
        else if (a.kind === 'jam') setScreen('node');
        else toast(a.title, 'info');
      }
      return;
    }
  });

  document.addEventListener('change', () => {});
  document.addEventListener('click', (e) => {
    const af = e.target.closest('[data-alert-filter]');
    if (af) {
      $$('[data-alert-filter]').forEach((b) => b.classList.toggle('is-active', b === af));
      $('#alertPage').dataset.filter = af.dataset.alertFilter;
      renderAlerts();
    }
    const pf = e.target.closest('[data-plan-filter]');
    if (pf) {
      $$('[data-plan-filter]').forEach((b) => b.classList.toggle('is-active', b === pf));
      $('#planList').dataset.filter = pf.dataset.planFilter;
      renderPlans();
    }
    const hz = e.target.closest('[data-horizon]');
    if (hz) {
      $$('[data-horizon]').forEach((b) => b.classList.toggle('is-active', b === hz));
      state.horizon = Number(hz.dataset.horizon);
      renderMap();
      toast('Khung dự báo +' + state.horizon + ' phút · độ bất định tăng theo thời gian', 'clock');
    }
    const ap = e.target.closest('[data-approve]');
    if (ap) { approve(true); }
    const rj = e.target.closest('[data-reject]');
    if (rj) { approve(false); }
    const sug = e.target.closest('[data-q]');
    if (sug) { askBot(MF.chat[Number(sug.dataset.q)].q); }
  });

  $('#approvePlan') && $('#approvePlan').addEventListener('click', () => approve(true));
  $('#rejectPlan') && $('#rejectPlan').addEventListener('click', () => approve(false));
  $('#opsApprove') && $('#opsApprove').addEventListener('click', (e) => {
    e.currentTarget.innerHTML = 'Đã duyệt';
    e.currentTarget.disabled = true;
    toast('Đã phê duyệt đề xuất NTP · chờ xác nhận tại chỗ', 'check');
  });

  $('#toggleTheme') && $('#toggleTheme').addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.body.dataset.theme = state.theme;
    const lbl = $('[data-theme-label]');
    const icon = $('#toggleTheme use');
    if (lbl) lbl.textContent = state.theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối';
    if (icon) icon.setAttribute('href', state.theme === 'dark' ? '#i-sun' : '#i-moon');
    renderAll();
  });

  $('#openOps') && $('#openOps').addEventListener('click', () => {
    document.body.dataset.mode = 'ops';
    renderOps();
    window.scrollTo({ top: 0 });
  });
  $('#closeOps') && $('#closeOps').addEventListener('click', () => {
    document.body.dataset.mode = 'app';
    window.scrollTo({ top: 0 });
  });

  $('#refreshMap') && $('#refreshMap').addEventListener('click', (e) => {
    e.currentTarget.querySelector('use').setAttribute('href', '#i-refresh');
    e.currentTarget.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: 700 });
    renderMap();
    toast('Đã làm mới dữ liệu · 07:' + String(state.clock % 3600 / 60 | 0).padStart(2, '0'), 'refresh');
  });

  $('#departNow') && $('#departNow').addEventListener('click', () => {
    toast('Đã bật nhắc làn sóng xanh · xuất phát lúc ' + hhmm(state.clock + 180), 'play');
  });

  $('#chatForm') && $('#chatForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#chatInput');
    const q = input.value.trim();
    if (!q) return;
    input.value = '';
    askBot(q);
  });

  // switch an toàn
  const sw = $('.switch');
  if (sw) {
    const toggle = () => {
      const on = !sw.classList.contains('is-on');
      sw.classList.toggle('is-on', on);
      sw.setAttribute('aria-checked', String(on));
      toast(on ? 'Đã bật tự quay về kế hoạch cố định' : 'Cảnh báo: đã tắt tự dự phòng', on ? 'shield' : 'warn');
    };
    sw.addEventListener('click', toggle);
    sw.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  }

  /* ---------------------------------------------------------------- ticker */
  function tick() {
    state.clock += 1;
    const t = hhmmss(state.clock);
    setText('updated', t);
    setText('arriveAt', hhmm(state.clock + scaled(MF.user.eta, 'delay') * 60));
    const sb = $('.statusbar__time');
    if (sb) sb.textContent = hhmm(state.clock);
    const live = $('.live');
    if (live) live.innerHTML = '<i></i> Trực tuyến · ' + t;

    const d = MF.detail.phase;
    d.remaining -= 1;
    if (d.remaining < 0) d.remaining = d.total;
    setText('ringNum', d.remaining);
    setRing(d.remaining, d.total);
    setText('phaseNext', d.remaining > 4 ? 'Vàng 3s → Toàn đỏ 2s' : 'Chuẩn bị chuyển pha');
  }

  /* ------------------------------------------------------------------- init */
  document.body.dataset.theme = state.theme;
  const ops = $('#ops');
  if (ops) ops.hidden = false;
  renderChatSuggestions();
  renderAll();
  setScreen(state.screen);
  setScenario(state.scenario);
  setRing(MF.detail.phase.remaining, MF.detail.phase.total);
  booting = false;
  setInterval(tick, 1000);

  window.MotoFlow = { setScreen, setScenario, state, MF };
})();
