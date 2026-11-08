/* 3.4 交互图共用的画法：按比例的时空图、卫星链路实物、序号窗口条。依赖 ../OS/svgstep.js 的 K。 */
(function () {
  const C = {
    data: ['#e3eefb', '#3e79a7'], ack: ['#e2f3e7', '#358267'], bad: ['#fde3df', '#b4352a'],
    lost: ['#f1eee8', '#9a9184'], retx: ['#fdebd3', '#c0732a'], nak: ['#fde3df', '#b4352a'],
    timer: '#d9822b', ink: '#302b37', mut: '#6f6a60', grid: '#ddd5c6'
  };
  let clipN = 0;
  /* 时空图。cfg: {x0, yA, yB, s(px/ms), tmax, label(tx)->string, hl:{tx:[],ack:[]}, showTimers, noteB(log)->[]} */
  function timeline(K, r, t, cfg) {
    const { x0, yA, yB, s, tmax } = cfg;
    const X = v => x0 + v * s, hl = cfg.hl || {};
    const xEnd = X(tmax);
    // 轴
    K.text(x0 - 12, yA + 6, cfg.nameA || 'A', { a: 'end', c: 'b' });
    K.text(x0 - 12, yB + 6, cfg.nameB || 'B', { a: 'end', c: 'b' });
    K.line(`M${x0} ${yA}H${xEnd}`, { c: '#8f8a80', w: 2 });
    K.line(`M${x0} ${yB}H${xEnd}`, { c: '#8f8a80', w: 2 });
    const tick = cfg.tick || 100, tlab = cfg.tickLabel || 200;
    for (let v = 0; v <= tmax; v += tick) {
      K.line(`M${X(v)} ${yB + 4}V${yB + (v % tlab ? 9 : 14)}`, { c: '#9a9184' });
      if (v % tlab === 0) K.text(X(v), yB + 32, String(v), { a: 'middle', c: 'sm mut' });
    }
    K.text(xEnd, yB + 54, '时间（ms）', { a: 'end', c: 'sm mut' });
    // 裁剪：只显示到 t
    const id = 'clip' + (++clipN);
    const svg = document.querySelector('svg');
    let defs = svg.querySelector('defs'); if (!defs) { defs = K.el('defs', {}, svg); }
    const cp = K.el('clipPath', { id }, defs); K.el('rect', { x: 0, y: 0, width: X(t), height: 4000 }, cp);
    const g = K.el('g', { 'clip-path': `url(#${id})` });
    const lg = K.el('g', {});   // 标签层：不裁剪，事件发生后才画
    const halo = { stroke: '#f5efe6', 'stroke-width': 5, 'paint-order': 'stroke', 'stroke-linejoin': 'round' };
    const lab = (x, y, s, attrs) => { const e = K.el('text', Object.assign({ x, y }, halo, attrs), lg); e.textContent = s; return e; };
    // 数据帧
    r.tx.forEach(f => {
      const on = (hl.tx || []).includes(f.i);
      const col = f.fate === 'bad' ? C.bad : f.fate === 'lost' ? C.lost : f.retx ? C.retx : C.data;
      const yEnd = f.fate === 'lost' ? yA + (yB - yA) * 0.55 : yB;
      const fr = f.fate === 'lost' ? 0.55 : 1;
      const pts = [[X(f.t0), yA], [X(f.t1), yA], [X(f.t1 + cfg.P * fr), yEnd], [X(f.t0 + cfg.P * fr), yEnd]];
      K.el('polygon', { points: pts.map(p => p.join(',')).join(' '), fill: col[0], stroke: col[1],
        'stroke-width': on ? 3 : 1.5, 'stroke-dasharray': f.fate === 'lost' ? '5 4' : null }, g);
      const mx = (X(f.t0) + X(f.t1)) / 2 + cfg.P * s * fr * 0.5, my = (yA + yEnd) / 2;
      if (X(t) >= mx + 6) lab(mx, my + 6, cfg.label ? cfg.label(f) : String(f.seq), { 'text-anchor': 'middle', class: 'b', fill: col[1] });
      if (f.fate === 'lost' && t >= f.t0 + cfg.P * fr) {
        const lx = X(f.t0 + cfg.P * fr) + 6, ly = yEnd + 4;
        lab(lx + 18, ly + 18, '×', { 'text-anchor': 'middle', class: 'bad', 'font-size': 22 });
        lab(lx + 18, ly + 38, '丢失', { 'text-anchor': 'middle', class: 'sm bad' });
      }
    });
    // 确认帧
    r.acks.forEach(a => {
      const on = (hl.ack || []).includes(a.j);
      const col = a.nak ? C.nak : C.ack;
      const fr = a.lost ? 0.5 : 1;
      const x1 = X(a.t0), y1 = yB, x2 = X(a.t0 + (a.arr - a.t0) * fr), y2 = yB + (yA - yB) * fr;
      K.el('path', { d: `M${x1} ${y1}L${x2} ${y2}`, stroke: col[1], 'stroke-width': on ? 3.2 : 1.8, fill: 'none',
        'stroke-dasharray': a.lost ? '6 5' : null, 'marker-end': a.lost ? null : mk(K, col[1]) }, g);
      const q = a.delay ? 0.12 : (cfg.ackAlt ? (a.j % 2 ? 0.16 : 0.42) : (cfg.ackAt ?? 0.3)), tx = x1 + (x2 - x1) * q / fr, ty = y1 + (y2 - y1) * q / fr;
      const name = (a.nak ? 'NAK' : 'ACK') + (a.seq === null ? '' : (cfg.ackLabel ? cfg.ackLabel(a) : a.seq));
      if (t >= a.t0 + (a.arr - a.t0) * q) lab(tx + 9, ty + 4, name + (a.delay ? '（迟到）' : ''), { class: 'sm b', fill: col[1] });
      if (a.lost && t >= a.t0 + (a.arr - a.t0) * fr) {
        lab(x2 + 4, y2 - 2, '×', { class: 'bad', 'font-size': 22 });
        lab(x2 + 22, y2 - 4, '丢失', { class: 'sm bad' });
      }
    });
    // 计时器条（A 轴上方）
    if (cfg.showTimers !== false) {
      K.text(x0 - 12, yA - 12, '计时器', { a: 'end', c: 'sm', fill: '#b35c00' });
      const seen = {};
      r.tx.forEach(f => {
        const ackT = cfg.timerStop ? cfg.timerStop(f, r) : null;
        const end = Math.min(f.t1 + cfg.TO, ackT ?? Infinity);
        const lane = cfg.timerLane ? cfg.timerLane(f) : 0;
        const y = yA - 16 - lane * 9;
        K.el('path', { d: `M${X(f.t1)} ${y}H${X(end)}`, stroke: C.timer, 'stroke-width': 4, opacity: 0.75 }, g);
        if (f.t1 + cfg.TO <= (ackT ?? Infinity)) {
          if (t >= end) lab(X(end), y - 6, '超时', { 'text-anchor': 'middle', class: 'sm', fill: '#b35c00', 'font-weight': 'bold' });
        }
      });
    }
    // 接收方动作标注（B 轴下方）
    (cfg.marksB || []).forEach(m => {
      if (t >= m.t) lab(X(m.t), yB + 74 + (m.row || 0) * 20, m.s, { 'text-anchor': 'middle', class: 'sm', fill: m.c || C.ink });
    });
    (cfg.marksA || []).forEach(m => {
      if (t >= m.t) lab(X(m.t), yA - 22 - (m.row || 0) * 20, m.s, { 'text-anchor': 'middle', class: 'sm b', fill: m.c || C.ink });
    });
    // 光标
    if (t < tmax) {
      K.line(`M${X(t)} ${yA - 4}V${yB + 20}`, { c: '#274e6b', w: 1.5, dash: '5 4' });
      K.text(X(t), yA - 40, 't = ' + Math.round(t) + ' ms', { a: 'middle', c: 'sm b', fill: '#274e6b' });
    }
    return X;
  }
  function mk(K, color) {
    const svg = document.querySelector('svg');
    const id = 'ah' + color.replace(/[^0-9a-z]/gi, '');
    if (!svg.querySelector('#' + id)) {
      let defs = svg.querySelector('defs'); if (!defs) defs = K.el('defs', {}, svg);
      const m = K.el('marker', { id, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 9, markerHeight: 9, markerUnits: 'userSpaceOnUse', orient: 'auto' }, defs);
      K.el('path', { d: 'M0 0L10 5L0 10Z', fill: color }, m);
    }
    return `url(#${id})`;
  }
  /* 序号条。cells: [{v:'3', st:'acked'|'sent'|'can'|'cannot'|'buf'|'want'|'done'|'idle', mark}], 画一排格子与窗口框 */
  const ST = {
    acked: ['#e2f3e7', '#7fb593', '#2f6e47'], sent: ['#fdebd3', '#d39a5a', '#9a5a1c'], can: ['#ffffff', '#3e79a7', '#274e6b'],
    cannot: ['#f1eee8', '#cfc7b8', '#9a9184'], buf: ['#e3eefb', '#3e79a7', '#274e6b'], want: ['#fff7d6', '#c9a227', '#7a5f00'],
    done: ['#e2f3e7', '#7fb593', '#2f6e47'], idle: ['#ffffff', '#cfc7b8', '#9a9184'], bad: ['#fde3df', '#b4352a', '#b4352a']
  };
  function strip(K, x, y, cells, o = {}) {
    const w = o.w || 44, h = o.h || 40;
    cells.forEach((c, i) => {
      const st = ST[c.st] || ST.idle;
      K.rect(x + i * w, y, w, h, { f: st[0], s: st[1], sw: c.hot ? 3 : 1.4, rx: 2 });
      K.text(x + i * w + w / 2, y + h / 2 + 7, c.v, { a: 'middle', c: 'mono b', fill: st[2] });
      if (c.mark) K.text(x + i * w + w / 2, y + h + 18, c.mark, { a: 'middle', c: 'sm', fill: c.markC || C.mut });
    });
    if (o.win) { // 窗口框 [from, to] 下标
      const [a, b] = o.win;
      K.rect(x + a * w - 4, y - 6, (b - a + 1) * w + 8, h + 12, { f: 'none', s: o.winC || '#274e6b', sw: 2.6, rx: 6 });
      if (o.winLabel) K.text(x + (a + b + 1) * w / 2, y - 12, o.winLabel, { a: 'middle', c: 'sm b', fill: o.winC || '#274e6b' });
    }
    return w;
  }
  /* 含 TeX 的标签：foreignObject 里的 HTML，交给 MathJax 排版。y 是基线位置（与 K.text 一致）。 */
  function tex(K, x, y, html, o = {}) {
    const w = o.w || 600, size = o.size || 17, a = o.a || 'start';
    const fx = a === 'middle' ? x - w / 2 : a === 'end' ? x - w : x;
    const fo = K.el('foreignObject', { x: fx, y: y - size * 1.15, width: w, height: size * 1.9 + (o.extra || 0) });
    const d = document.createElement('div');
    d.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
    d.style.cssText = `font:${o.bold ? 'bold ' : ''}${size}px "Microsoft YaHei","Noto Sans CJK SC",sans-serif;color:${o.fill || '#302b37'};text-align:${a === 'middle' ? 'center' : a === 'end' ? 'right' : 'left'};line-height:1.45;white-space:${o.wrap ? 'normal' : 'nowrap'}`;
    d.innerHTML = html; fo.append(d); return fo;
  }
  function typeset() {
    const svg = document.querySelector('svg');
    if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([svg]).catch(() => {});
  }
  window.ArqDraw = { timeline, strip, mk, tex, typeset, C, ST };
})();
