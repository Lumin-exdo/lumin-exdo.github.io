/* 计网 2.1a 各图共用：配色、小格子、波形。在 svgstep.js 之后引入。
   svgstep.js 的全局样式 svg text{fill;font} 会盖掉 fill 与 font-size 属性，这里统一转成行内样式。 */
(function () {
  const C = { INK: '#302b37', MUT: '#6f6a60', BL: '#3e79a7', BLb: '#e3eefb', BLd: '#174a85', OR: '#c0732a', ORb: '#fdebd3', ORd: '#87501a',
    GR: '#358267', GRb: '#e2f3e7', GRd: '#225c43', RD: '#b4352a', RDb: '#fde3df', YL: '#c9a227', YLb: '#fff3c4', PU: '#7a5bb0', PUb: '#efe8fb', LINE: '#a79e8e', BOX: '#fffdf8', BORD: '#d9c7a8' };
  const fix = r => { r.querySelectorAll('text[fill]').forEach(t => { t.style.fill = t.getAttribute('fill'); }); r.querySelectorAll('text[font-size]').forEach(t => { t.style.fontSize = t.getAttribute('font-size') + 'px'; }); };
  const go = () => document.querySelectorAll('svg').forEach(s => { fix(s); new MutationObserver(() => fix(s)).observe(s, { childList: true, subtree: true }); });
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', go) : go();

  const sinc = x => x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x);
  /* 外框（浅色底的面板） */
  function panel(K, x, y, w, h, title) {
    K.rect(x, y, w, h, { f: C.BOX, s: C.BORD, rx: 10 });
    if (title) K.text(x + 16, y + 28, title, { size: 19, c: 'b' });
  }
  /* 一个带字的小格子，文字居中 */
  function cell(K, x, y, w, h, txt, c, o = {}) {
    c = c || [C.BLb, C.BL, C.BLd];
    K.rect(x, y, w, h, { f: c[0], s: o.hot ? '#1667c4' : c[1], sw: o.hot ? 3 : (o.sw || 1.6), rx: o.rx ?? 4 });
    if (txt !== '' && txt != null) K.text(x + w / 2, y + h / 2 + (o.dy ?? 6), txt, { a: 'middle', size: o.size || 17, c: o.c ?? 'mono b', fill: c[2] });
  }
  /* 一串比特，每位一格。cols[i] 可给每格不同颜色；返回总宽 */
  function bits(K, x, y, s, w, h, o = {}) {
    [...s].forEach((b, i) => {
      const c = o.col ? o.col(b, i) : (b === '1' ? [C.ORb, C.OR, C.ORd] : [C.BLb, C.BL, C.BLd]);
      cell(K, x + i * (w + (o.gap || 0)), y, w, h, b, c, { size: o.size || 17 });
    });
    return s.length * (w + (o.gap || 0));
  }
  /* 按函数 f(t) 采样成折线路径；X、Y 把 t、值映射到画布坐标 */
  function path(f, t0, t1, n, X, Y) {
    let d = '';
    for (let i = 0; i <= n; i++) { const t = t0 + (t1 - t0) * i / n; d += (i ? 'L' : 'M') + X(t).toFixed(1) + ' ' + Y(f(t)).toFixed(1); }
    return d;
  }
  /* 方波（每位一个电平，bits 为 0/1 字符串），返回路径 */
  function square(s, x, y, w, amp, lo) {
    let d = '';
    [...s].forEach((b, i) => {
      const yy = y - (b === '1' ? amp : (lo ?? 0));
      d += (i ? 'V' + yy : 'M' + x + ' ' + yy) + 'H' + (x + (i + 1) * w);
    });
    return d;
  }
  /* 圆点 */
  function dot(K, x, y, r, fill, stroke, sw) { return K.el('circle', { cx: x, cy: y, r, fill, stroke: stroke || fill, 'stroke-width': sw || 2 }); }
  window.N21 = { C, sinc, panel, cell, bits, path, square, dot, fix };
})();
