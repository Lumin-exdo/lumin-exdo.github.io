/* Shared step player and SVG drawing helpers for OS figures.
   Page skeleton: <header><h1/><small/><nav id="steps"></nav></header>
   <div class="scroll"><svg viewBox="0 0 W H"><g id="draw"></g></svg></div><footer id="note"></footer>
   then <script src="figure-fit.js"></script><script src="svgstep.js"></script> and
   SvgStep.start({steps:[{b:'button text',t:'title',n:'note html'}], draw:(k,K)=>{...}}).
   Geometry is drawn the same in every step; draw() only changes colours and values. */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const css = document.createElement('style');
  css.textContent = '*{box-sizing:border-box}body{margin:0;background:#f5efe6;color:#302b37;font:16px "Microsoft YaHei","Noto Sans CJK SC",sans-serif}'
    + 'header{padding:12px 20px 4px}h1{font-size:22px;margin:0 0 6px}header small{display:block;color:#6f624f;font-size:14px;line-height:1.5}'
    + 'nav#steps{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 2px}'
    + 'nav#steps button{font:inherit;font-size:14px;padding:6px 10px;border:1px solid #b6a58b;border-radius:7px;background:#fffaf2;cursor:pointer}'
    + 'nav#steps button.on{background:#274e6b;color:#fff;border-color:#274e6b}nav#steps button:disabled{opacity:.4;cursor:default}'
    + '.scroll{overflow:auto;display:flex;justify-content:center;padding:0 10px 6px;max-width:1250px;margin:0 auto}svg{display:block;flex:none}'
    + 'svg text{font:17px "Microsoft YaHei","Noto Sans CJK SC",sans-serif;fill:#302b37}'
    + 'svg .mono{font-family:Consolas,"DejaVu Sans Mono",monospace}svg .b{font-weight:bold}svg .sm{font-size:15px}svg .lg{font-size:20px;font-weight:bold}'
    + 'svg .mut{fill:#6f6a60}svg .chg{fill:#1667c4;font-weight:bold}svg .bad{fill:#b4352a;font-weight:bold}'
    + 'footer{padding:6px 22px 14px;min-height:64px;line-height:1.6;font-size:15px}footer b{color:#274e6b}';
  document.head.append(css);

  let g, markers;
  function el(name, attrs, parent) {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
    (parent || g).append(e);
    return e;
  }
  function marker(color) {
    const id = 'm' + color.replace(/[^0-9a-z]/gi, '');
    if (!markers.has(id)) {
      markers.add(id);
      const defs = g.ownerSVGElement.querySelector('defs') || el('defs', {}, g.ownerSVGElement);
      const m = el('marker', { id, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 9, markerHeight: 9,
        markerUnits: 'userSpaceOnUse', orient: 'auto-start-reverse' }, defs);
      el('path', { d: 'M0 0L10 5L0 10Z', fill: color }, m);
    }
    return 'url(#' + id + ')';
  }
  const K = {
    HOT: '#d9822b', CHG: '#1667c4', BAD: '#b4352a',
    rect(x, y, w, h, o = {}) {
      return el('rect', { x, y, width: w, height: h, rx: o.rx ?? 6, fill: o.f || '#fff', stroke: o.s || '#a99c88',
        'stroke-width': o.sw || 1.5, 'stroke-dasharray': o.dash, opacity: o.op });
    },
    /* text; '\n' starts a new line (line height o.lh, default 1.35em) */
    text(x, y, s, o = {}) {
      const t = el('text', { x, y, class: o.c, 'text-anchor': o.a, fill: o.fill, 'font-size': o.size });
      String(s).split('\n').forEach((line, i) => {
        const sp = el('tspan', { x, dy: i ? (o.lh || (o.size || 17) * 1.35) : 0 }, t);
        sp.textContent = line;
      });
      return t;
    },
    arrow(d, o = {}) {
      const c = o.c || '#af762d';
      return el('path', { d, fill: 'none', stroke: c, 'stroke-width': o.w || 2.5, 'stroke-dasharray': o.dash,
        'marker-end': o.noHead ? null : marker(c), 'marker-start': o.both ? marker(c) : null });
    },
    line(d, o = {}) { return el('path', { d, fill: 'none', stroke: o.c || '#a99c88', 'stroke-width': o.w || 1.5, 'stroke-dasharray': o.dash }); },
    circle(cx, cy, r, o = {}) { return el('circle', { cx, cy, r, fill: o.f || '#fff', stroke: o.s || '#6f6a60', 'stroke-width': o.sw || 2 }); },
    /* a labelled box: title line plus optional value lines */
    box(x, y, w, h, title, lines = [], o = {}) {
      K.rect(x, y, w, h, o);
      if (title) K.text(x + 10, y + 21, title, { c: 'b' + (o.tc ? ' ' + o.tc : '') });
      lines.forEach((ln, i) => {
        const [s, c] = Array.isArray(ln) ? ln : [ln, ''];
        K.text(x + 10, y + (title ? 44 : 22) + i * (o.lh || 21), s, { c });
      });
    },
    hot(x, y, w, h, color) { return K.rect(x - 3, y - 3, w + 6, h + 6, { f: 'none', s: color || K.HOT, sw: 3.5, rx: 8 }); },
    el
  };

  function prepareStepFit() {
    const frame = document.querySelector('.scroll');
    const view = frame?.querySelector('svg')?.viewBox.baseVal;
    if (frame && view && !frame.dataset.defaultFit && view.height >= view.width * 0.9) {
      frame.dataset.defaultFit = 'width';
    }
    return frame;
  }

  function start({ steps, draw }) {
    g = document.getElementById('draw');
    markers = new Set();
    const nav = document.getElementById('steps');
    const note = document.getElementById('note');
    let at = 0;
    const prev = document.createElement('button'); prev.textContent = '← 上一步';
    const next = document.createElement('button'); next.textContent = '下一步 →';
    nav.append(prev);
    const btns = steps.map((s, i) => {
      const b = document.createElement('button');
      b.textContent = s.b;
      b.onclick = () => { at = i; render(); };
      nav.append(b);
      return b;
    });
    nav.append(next);
    prev.onclick = () => { if (at > 0) { at--; render(); } };
    next.onclick = () => { if (at < steps.length - 1) { at++; render(); } };
    addEventListener('keydown', e => {
      if (e.target.closest && e.target.closest('input,select,textarea')) return;
      if (e.key === 'ArrowRight') next.onclick(); else if (e.key === 'ArrowLeft') prev.onclick();
    });
    function fit() {
      const frame = document.querySelector('.scroll');
      if (window.FigureFit) FigureFit.svg(frame, frame.querySelector('svg'), false, { footer: note });
    }
    window.fit = fit;
    function render() {
      while (g.firstChild) g.firstChild.remove();
      draw(at, K);
      btns.forEach((b, i) => b.classList.toggle('on', i === at));
      prev.disabled = at === 0; next.disabled = at === steps.length - 1;
      note.innerHTML = '<b>' + (at + 1) + ' / ' + steps.length + ' · ' + steps[at].t + '</b>　' + steps[at].n;
      if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([note]).catch(() => {});
      fit();
    }
    addEventListener('resize', fit);
    document.fonts.ready.then(fit);
    const frame = prepareStepFit();
    render();
    if (window.FigureFit) FigureFit.mount(frame);
  }
  /* static figure: draw once, no step buttons */
  function still(draw) {
    g = document.getElementById('draw');
    markers = new Set();
    draw(K);
    const fit = () => { const f = document.querySelector('.scroll'); if (window.FigureFit) FigureFit.svg(f, f.querySelector('svg'), false, { footer: document.getElementById('note') }); };
    window.fit = fit; addEventListener('resize', fit); document.fonts.ready.then(fit); fit();
  }
  /* several scenes, each with its own steps: SvgStep.scenes({scenes:[{b:'tab',t:'scene title',steps:[{t,n}]}], draw:(si,k,K)=>{}})
     Scene tabs on the first row; ← / → and the buttons walk steps, crossing into the next / previous scene. */
  function scenes({ scenes, draw }) {
    g = document.getElementById('draw');
    markers = new Set();
    const nav = document.getElementById('steps');
    const note = document.getElementById('note');
    let si = 0, k = 0;
    const tabs = scenes.map((s, i) => {
      const b = document.createElement('button');
      b.textContent = s.b; b.onclick = () => { si = i; k = 0; render(); }; nav.append(b); return b;
    });
    const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:6px;align-items:center;flex-basis:100%;margin-top:2px';
    const prev = document.createElement('button'); prev.textContent = '← 上一步';
    const next = document.createElement('button'); next.textContent = '下一步 →';
    const cnt = document.createElement('span'); cnt.style.cssText = 'font-size:14px;color:#6f624f;min-width:9em';
    row.append(prev, next, cnt); nav.append(row);
    prev.onclick = () => { if (k > 0) k--; else if (si > 0) { si--; k = scenes[si].steps.length - 1; } render(); };
    next.onclick = () => { if (k < scenes[si].steps.length - 1) k++; else if (si < scenes.length - 1) { si++; k = 0; } render(); };
    addEventListener('keydown', e => {
      if (e.target.closest && e.target.closest('input,select,textarea')) return;
      if (e.key === 'ArrowRight') next.onclick(); else if (e.key === 'ArrowLeft') prev.onclick();
    });
    function fit() {
      const frame = document.querySelector('.scroll');
      if (window.FigureFit) FigureFit.svg(frame, frame.querySelector('svg'), false, { footer: note });
    }
    window.fit = fit;
    function render() {
      while (g.firstChild) g.firstChild.remove();
      const sc = scenes[si], st = sc.steps[k];
      if (sc.h) g.ownerSVGElement.setAttribute('viewBox', '0 0 1000 ' + sc.h);
      draw(si, k, K);
      tabs.forEach((b, i) => b.classList.toggle('on', i === si));
      prev.disabled = si === 0 && k === 0; next.disabled = si === scenes.length - 1 && k === sc.steps.length - 1;
      cnt.textContent = '第 ' + (k + 1) + ' / ' + sc.steps.length + ' 步';
      note.innerHTML = '<b>' + sc.b + ' · ' + (k + 1) + '/' + sc.steps.length + ' · ' + st.t + '</b>　' + st.n;
      if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([note]).catch(() => {});
      fit();
    }
    addEventListener('resize', fit);
    document.fonts.ready.then(fit);
    const frame = prepareStepFit();
    render();
    if (window.FigureFit) FigureFit.mount(frame);
  }
  window.SvgStep = { start, still, scenes, K };
})();
