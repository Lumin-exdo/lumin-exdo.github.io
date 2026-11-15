/* ds-draw.js —— 数据结构图集的公共画图件（各章复用）。
   引入顺序：../共用/figure-fit.js → ../共用/svgstep.js → ../共用/svgsize.js → ds-draw.js → 本页脚本。
   K 是 svgstep.js 传给 draw() 的画笔（K.rect / K.text / K.arrow / K.line / K.circle / K.el）。

   颜色与状态
     DS.C            颜色表（ink 正文、mut 灰字、hot 本步涉及、chg 本步改变、bad 失败/失衡、ok 成功、red/black 红黑树结点）
     DS.ST           格子状态样式：norm | hot | chg | bad | ok | dim | sel ，每项 {f 填充, s 描边, sw 线宽, t 字色}

   画布
     DS.view(w, h)   把当前 svg 的 viewBox 设成 0 0 w h（每一幕可以不同高度；在 draw() 开头调用）

   数组 / 散列表
     DS.cells(K, x, y, vals, o) 一排格子，带下标与值。o：cw 格宽(54) ch 格高(44) idx 起始下标(0)｜下标数组｜false
         idxBelow 下标写在格子下方 name 左侧名字 st(i)→状态名 fs 字号 sub(i)→格子下方第二行小字（如探查次数）
         返回 {cx(i) 格子中心 x, x(i) 左边 x, y, ch, cw, right}
     DS.ptr(K, cx, yBottom, label, o)  从下方指向格子的下标指针（low / mid / high 之类）；o.c 颜色 o.row 第几层(0)

   链表
     DS.lnode(K, x, y, data, o)  “数据｜指针”结点。o：dw 数据格宽(48) pw 指针格宽(26) h(36) st 状态 nul 指针为空画 ∧ addr 结点上方地址
         返回 {inL:[x,y] 左侧入口, out:[x,y] 指针格中心, right}

   二叉树（结点对象 {k, l, r, ...}）
     DS.place(root, o)            位置表 Map(node→{x,y,d})。o：xOf(k) 按关键字给横坐标（推荐：同一关键字各步横坐标不变）
                                  或 x0+dx 按中序名次；y0 dy 按深度
     DS.tree(K, root, o)          画边和结点。o：pos 位置表（缺省用 place） r 半径(21) node(n)→{f,s,sw,t} 结点样式
         edge(p,c)→{c,w} 边样式 badge(n)→小字(如平衡因子) badgeC(n)→颜色 nil 画 NIL 小方块 ring(n)→true 画橙色外圈
         label(n)→结点内文字（缺省 n.k）；返回位置表
     DS.walk(root)                中序结点数组

   B 树 / B+ 树（结点对象 {keys:[...], kids:[...]}）
     DS.bnode(K, x, y, keys, o)   一个结点：指针格与关键字格交替（P0 K1 P1 … ）。o：slots 关键字格数 kw(40) pw(15) ch(34)
         showN 左侧加关键字个数格 kst(i)→关键字格状态 nst→整个结点外框状态 kids 是否有孩子（指针格画圆点）
         返回 {x, y, w, h, ptr(i)→[x,y] 第 i 个指针格底部中心, key(i)→[x,y]}
     DS.bwidth(slots, o)          结点宽度
     DS.btree(K, root, o)         排版并画整棵树。o：x0 / cx 居中 y0 dy gap slots 以及 bnode 的选项，
         nst(n) kst(n,i) ptrC(n,i)→箭头颜色或 null（不画）；返回 {pos: Map(node→{x,y,w,box}), width}

   其他
     DS.tex(K, x, y, w, h, src, o)  SVG 里放 TeX 公式（foreignObject + MathJax）。o：size a color
     DS.chip(K, x, y, text, o)      带底色的短标签，x,y 为左上角。o：f s t size；返回宽度
     DS.tw(textEl)                  量文字宽度
     DS.code(K, x, y, lines, o)     等宽代码行（保留缩进）。o：lh 行高(29) size(15) on(j)→'hot'|'sel' 高亮第 j 行 w 高亮条宽
*/
(function () {
  const C = {
    ink: '#302b37', mut: '#6f6a60', line: '#a99c88', grid: '#b9ab94',
    hot: '#d9822b', hotF: '#fde3c2', chg: '#1667c4', chgF: '#e3eefb', chgS: '#3e79a7',
    bad: '#b4352a', badF: '#fbe1dc', ok: '#22703a', okF: '#e1f2e4', okS: '#3f9a5a',
    red: '#c8372d', redF: '#fbd9d3', redT: '#9b231b', black: '#3a3536', blackS: '#1f1b1c',
    panel: '#fffdf8', panelS: '#e0d3bb'
  };
  const ST = {
    norm: { f: '#fff', s: C.grid, sw: 1.3, t: C.ink },
    hot: { f: C.hotF, s: C.hot, sw: 2.6, t: C.ink },
    chg: { f: C.chgF, s: C.chgS, sw: 2.6, t: C.chg },
    bad: { f: C.badF, s: '#c0503f', sw: 2.6, t: C.bad },
    ok: { f: C.okF, s: C.okS, sw: 2.6, t: C.ok },
    dim: { f: '#eee8de', s: '#d6cbb8', sw: 1.2, t: '#b3a896' },
    sel: { f: '#fff4dc', s: '#d9b63c', sw: 2, t: C.ink }
  };
  const css = document.createElement('style');
  css.textContent = '.notes{max-width:1180px;margin:6px auto 30px;padding:0 16px;display:flex;flex-direction:column;gap:14px}'
    + '.nhint{color:#6f624f;font-size:14px;margin:4px 0}'
    + '.note{background:#fffdf8;border:1px solid #e3d9c4;border-radius:10px;padding:14px 20px}'
    + '.note summary{cursor:pointer;list-style:none}.note summary h2{display:inline;font-size:19px;margin:0}'
    + '.note summary::before{content:"▾ ";color:#9a8b70}.note:not([open]) summary::before{content:"▸ "}'
    + '.note p,.note li{font-size:15.5px;line-height:1.7;margin:6px 0}'
    + 'table.prop{border-collapse:collapse;margin:10px 0;font-size:15px;background:#fff}'
    + 'table.prop th,table.prop td{border:1px solid #d9cdb6;padding:6px 11px;text-align:left;vertical-align:top;line-height:1.55}'
    + 'table.prop th{background:#f6eedf}table.prop td.c{text-align:center}'
    // 横屏一屏放下：标题、说明、幕按钮、上一步/下一步、缩放条挤在两行里
    + 'header{display:flex;flex-wrap:wrap;align-items:center;gap:4px 14px;padding:8px 16px 2px}header h1{font-size:19px;margin:0}'
    + 'header small{display:inline;flex:1 1 360px}nav#steps{margin:0;flex:0 1 auto}nav#steps>div{flex-basis:auto!important;margin:0!important}'
    + '.figure-fit-controls{margin:0!important}footer{min-height:0!important;padding:4px 20px 8px!important}';
  document.head.append(css);
  // svgstep.js 的 svg text{fill:…} 样式会盖掉 fill 属性：把 fill 属性转成行内样式，让 K.text 的 fill 生效
  const fixFill = root => root.querySelectorAll('text[fill]').forEach(t => { t.style.fill = t.getAttribute('fill'); });
  const goFill = () => document.querySelectorAll('svg').forEach(s => { fixFill(s); new MutationObserver(() => fixFill(s)).observe(s, { childList: true, subtree: true }); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', goFill); else goFill();

  const svgEl = () => document.querySelector('.scroll svg');
  function view(w, h) { svgEl().setAttribute('viewBox', '0 0 ' + w + ' ' + h); }
  function tw(t) { try { return t.getBBox().width; } catch (e) { return String(t.textContent).length * 9; } }

  function cells(K, x, y, vals, o = {}) {
    const cw = o.cw || 54, ch = o.ch || 44, n = vals.length;
    const idx = i => Array.isArray(o.idx) ? o.idx[i] : (o.idx ?? 0) + i;
    if (o.name) K.text(x - 12, y + ch / 2 + 6, o.name, { a: 'end', c: 'b' });
    const order = [...Array(n).keys()].sort((a, b) => ((o.st && o.st(a) && o.st(a) !== 'norm') ? 1 : 0) - ((o.st && o.st(b) && o.st(b) !== 'norm') ? 1 : 0));
    order.forEach(i => {
      const s = ST[(o.st && o.st(i)) || 'norm'] || ST.norm;
      K.rect(x + i * cw, y, cw, ch, { f: s.f, s: s.s, sw: s.sw, rx: 2 });
    });
    for (let i = 0; i < n; i++) {
      const s = ST[(o.st && o.st(i)) || 'norm'] || ST.norm, cx = x + i * cw + cw / 2, v = vals[i];
      if (v !== null && v !== undefined && v !== '') K.text(cx, y + ch / 2 + 6, String(v), { a: 'middle', c: 'mono b', fill: s.t, size: o.fs });
      if (o.idx !== false) K.text(cx, o.idxBelow ? y + ch + 17 : y - 7, String(idx(i)), { a: 'middle', size: 13, fill: C.mut, c: 'mono' });
      if (o.sub) { const t = o.sub(i); if (t !== null && t !== undefined && t !== '') K.text(cx, y + ch + (o.idxBelow ? 36 : 19), String(t), { a: 'middle', size: 14, c: 'mono b', fill: o.subC ? o.subC(i) : C.mut }); }
    }
    return { cx: i => x + i * cw + cw / 2, x: i => x + i * cw, y, ch, cw, right: x + n * cw };
  }
  function ptr(K, cx, yb, label, o = {}) {
    const c = o.c || C.hot, dy = (o.row || 0) * 44;
    K.arrow(`M${cx} ${yb + 30 + dy}L${cx} ${yb + 5}`, { c, w: 2.2 });
    K.text(cx, yb + 47 + dy, label, { a: 'middle', c: 'b mono', size: 15, fill: c });
  }

  function lnode(K, x, y, data, o = {}) {
    const dw = o.dw || 48, pw = o.pw || 26, h = o.h || 36, s = ST[o.st || 'norm'];
    K.rect(x, y, dw, h, { f: s.f, s: s.s, sw: s.sw, rx: 2 });
    K.rect(x + dw, y, pw, h, { f: o.st && o.st !== 'norm' ? s.f : '#f6f1e8', s: s.s, sw: s.sw, rx: 2 });
    K.text(x + dw / 2, y + h / 2 + 6, String(data), { a: 'middle', c: 'mono b', fill: s.t });
    if (o.nul) K.text(x + dw + pw / 2, y + h / 2 + 6, '∧', { a: 'middle', c: 'b', fill: C.mut });
    else K.circle(x + dw + pw / 2, y + h / 2, 3.5, { f: C.ink, s: C.ink, sw: 1 });
    if (o.addr) K.text(x, y - 6, o.addr, { size: 12, c: 'mono', fill: C.mut });
    return { inL: [x, y + h / 2], out: [x + dw + pw / 2, y + h / 2], right: x + dw + pw };
  }

  function walk(root) { const a = []; (function w(n) { if (!n) return; w(n.l); a.push(n); w(n.r); })(root); return a; }
  function place(root, o = {}) {
    const pos = new Map(); let rank = 0;
    (function w(n, d) {
      if (!n) return; w(n.l, d + 1);
      pos.set(n, { x: o.xOf ? o.xOf(n.k) : (o.x0 || 40) + (rank++) * (o.dx || 60), y: (o.y0 || 40) + d * (o.dy || 70), d });
      w(n.r, d + 1);
    })(root, 0);
    return pos;
  }
  function tree(K, root, o = {}) {
    const pos = o.pos || place(root, o), r = o.r || 21;
    const seg = (a, b, ra, rb) => {
      const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
      return `M${a.x + dx / L * ra} ${a.y + dy / L * ra}L${b.x - dx / L * rb} ${b.y - dy / L * rb}`;
    };
    const nil = [];
    pos.forEach((p, n) => {
      [n.l, n.r].forEach((c, side) => {
        if (c) {
          const e = (o.edge && o.edge(n, c)) || {};
          K.line(seg(p, pos.get(c), r, r), { c: e.c || '#8f8678', w: e.w || 2 });
          if (e.lab) K.text((p.x + pos.get(c).x) / 2 + (side ? 10 : -10), (p.y + pos.get(c).y) / 2 - 4, e.lab, { a: side ? 'start' : 'end', size: 13, c: 'b', fill: e.c || C.mut });
        } else if (o.nil) {
          const q = { x: p.x + (side ? 1 : -1) * (o.nilDx || 18), y: p.y + (o.nilDy || 42) };
          K.line(seg(p, q, r, 7), { c: '#b8ad9c', w: 1.3 });
          nil.push(q);
        }
      });
    });
    nil.forEach(q => { K.rect(q.x - 7, q.y - 6, 14, 12, { f: C.black, s: C.blackS, sw: 1, rx: 1 }); });
    pos.forEach((p, n) => {
      const s = (o.node && o.node(n)) || {};
      if (o.ring && o.ring(n)) K.circle(p.x, p.y, r + 5, { f: 'none', s: C.hot, sw: 3 });
      K.circle(p.x, p.y, r, { f: s.f || '#fff', s: s.s || '#6f6a60', sw: s.sw || 2 });
      K.text(p.x, p.y + 6, o.label ? o.label(n) : String(n.k), { a: 'middle', c: 'b mono', fill: s.t || C.ink, size: o.fs || 16 });
      if (o.badge) {
        const b = o.badge(n);
        if (b !== null && b !== undefined && b !== '') K.text(p.x + r + 3, p.y - r + 5, String(b), { size: 14, c: 'b mono', fill: o.badgeC ? o.badgeC(n) : C.mut });
      }
    });
    return pos;
  }

  function bwidth(slots, o = {}) { return (o.showN ? 30 : 0) + (slots + 1) * (o.pw || 15) + slots * (o.kw || 40); }
  function bnode(K, x, y, keys, o = {}) {
    const kw = o.kw || 40, pw = o.pw || 15, h = o.ch || 34, slots = Math.max(o.slots || keys.length, keys.length);
    const w = bwidth(slots, o), ns = ST[o.nst || 'norm'];
    K.rect(x - 2, y - 2, w + 4, h + 4, { f: 'none', s: ns === ST.norm ? 'none' : ns.s, sw: ns === ST.norm ? 0 : 2.8, rx: 4 });
    let cx = x;
    if (o.showN) { K.rect(cx, y, 30, h, { f: '#f1ead9', s: C.grid, sw: 1.2, rx: 1 }); K.text(cx + 15, y + h / 2 + 6, String(keys.length), { a: 'middle', c: 'mono b', fill: C.mut, size: 15 }); cx += 30; }
    const ptrX = [], keyX = [];
    for (let i = 0; i <= slots; i++) {
      K.rect(cx, y, pw, h, { f: '#f6f1e8', s: C.grid, sw: 1.2, rx: 1 });
      ptrX.push(cx + pw / 2);
      if (o.kids && i <= keys.length) K.circle(cx + pw / 2, y + h - 7, 2.8, { f: C.ink, s: C.ink, sw: 1 });
      cx += pw;
      if (i < slots) {
        const s = ST[(o.kst && o.kst(i)) || 'norm'] || ST.norm;
        K.rect(cx, y, kw, h, { f: i < keys.length ? s.f : '#fbf8f2', s: s.s, sw: s.sw, rx: 1 });
        if (i < keys.length) K.text(cx + kw / 2, y + h / 2 + 6, String(keys[i]), { a: 'middle', c: 'mono b', fill: s.t, size: 16 });
        keyX.push(cx + kw / 2); cx += kw;
      }
    }
    return { x, y, w, h, ptr: i => [ptrX[i], y + h], key: i => [keyX[i], y + h / 2] };
  }
  function blayout(root, o = {}) {
    const slots = o.slots || 2, gap = o.gap || 26, dy = o.dy || 90, y0 = o.y0 || 40;
    const W = n => bwidth(Math.max(slots, n.keys.length), o);
    const pos = new Map(); let cur = 0;
    (function rec(n, d) {
      if (!n.kids || !n.kids.length) { const w = W(n); pos.set(n, { x: cur, y: y0 + d * dy, w }); cur += w + gap; return; }
      n.kids.forEach(c => rec(c, d + 1));
      const f = pos.get(n.kids[0]), l = pos.get(n.kids[n.kids.length - 1]), w = W(n);
      pos.set(n, { x: (f.x + f.w / 2 + l.x + l.w / 2) / 2 - w / 2, y: y0 + d * dy, w });
    })(root, 0);
    let minx = Infinity, maxx = -Infinity; pos.forEach(p => { minx = Math.min(minx, p.x); maxx = Math.max(maxx, p.x + p.w); });
    const shift = (o.cx !== undefined ? o.cx - (minx + maxx) / 2 : (o.x0 || 40) - minx);
    pos.forEach(p => { p.x += shift; });
    return { pos, width: maxx - minx };
  }
  function btree(K, root, o = {}) {
    const L = blayout(root, o);
    L.pos.forEach((p, n) => {
      p.box = bnode(K, p.x, p.y, n.keys, Object.assign({}, o, { nst: o.nst && o.nst(n), kst: o.kst && (i => o.kst(n, i)), kids: n.kids && n.kids.length > 0 }));
    });
    L.pos.forEach((p, n) => {
      (n.kids || []).forEach((c, i) => {
        const col = o.ptrC ? o.ptrC(n, i) : '#8f8678';
        if (col === null) return;
        const [ax, ay] = p.box.ptr(i), q = L.pos.get(c), tx = q.x + q.w / 2;
        K.arrow(`M${ax} ${ay - 7}L${tx} ${q.y - 3}`, { c: col, w: col === '#8f8678' ? 1.6 : 2.6 });
      });
    });
    return L;
  }

  let pend = [], timer = null;
  function tex(K, x, y, w, h, src, o = {}) {
    const fo = K.el('foreignObject', { x, y, width: w, height: h });
    const d = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
    d.style.cssText = 'font:' + (o.size || 17) + 'px "Microsoft YaHei","Noto Sans CJK SC",sans-serif;color:' + (o.color || C.ink)
      + ';text-align:' + (o.a || 'left') + ';line-height:1.35;white-space:nowrap';
    d.textContent = src; fo.append(d); pend.push(d);
    if (!timer) timer = setTimeout(() => {
      timer = null; const l = pend.splice(0).filter(e => e.isConnected);
      if (l.length && window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise(l).catch(() => {});
    }, 0);
    return fo;
  }
  function chip(K, x, y, text, o = {}) {
    const size = o.size || 14;
    const t = K.text(x + 7, y + size + 3, text, { size, c: o.c || 'b', fill: o.t || C.ink });
    const w = tw(t) + 14;
    const r = K.rect(x, y, w, size + 10, { f: o.f || '#f6eedf', s: o.s || '#d9cdb6', sw: 1.2, rx: 5 });
    t.parentNode.insertBefore(r, t);
    return w;
  }
  function code(K, x, y, lines, o = {}) {
    const lh = o.lh || 29, size = o.size || 15;
    lines.forEach((c, j) => {
      const on = o.on && o.on(j);
      if (on) K.rect(x - 12, y - size - 4 + j * lh, o.w || 700, lh - 2, { f: on === 'hot' ? '#fde3c2' : '#fff4dc', s: 'none', rx: 4 });
      const t = K.text(x, y + j * lh, c, { c: 'mono', size }); t.style.whiteSpace = 'pre';
    });
  }

  /* 整台“机器”：底部三块面板——代码（高亮当前行）｜变量（本步改变的标蓝）｜比较记录（逐行累积，最新一行加粗）
     DS.machine(K, y, o)  o：h 高(150) code 行数组 on(j)→'hot'|'sel' codeW(560) varW(200)
         vars [[名, 值, 是否本步改变]] log [{s 文字, c 颜色}] logTitle   占满 x=30..1170 */
  function machine(K, y, o = {}) {
    const h = o.h || 150, cw = o.codeW || 560, vw = o.varW || 200, g = 14, x0 = 30;
    K.rect(x0, y, cw, h, { f: C.panel, s: C.panelS, rx: 10 });
    code(K, x0 + 26, y + 34, o.code || [], { w: cw - 28, lh: o.lh || 29, size: o.size || 15, on: o.on });
    let x = x0 + cw + g;
    K.rect(x, y, vw, h, { f: C.panel, s: C.panelS, rx: 10 });
    K.text(x + 16, y + 26, '变量', { c: 'b', size: 15, fill: C.mut });
    (o.vars || []).forEach(([n, v, chg], j) => {
      K.text(x + 16, y + 56 + j * (o.vlh || 30), n, { size: 16, c: 'mono' });
      K.text(x + vw - 16, y + 56 + j * (o.vlh || 30), String(v), { a: 'end', c: 'mono b', size: 18, fill: chg ? C.chg : C.ink });
    });
    x += vw + g;
    const lw = 1170 - x;
    K.rect(x, y, lw, h, { f: C.panel, s: C.panelS, rx: 10 });
    K.text(x + 16, y + 26, o.logTitle || '比较记录', { c: 'b', size: 15, fill: C.mut });
    const lg = o.log || [], lh = o.logLh || Math.min(24, (h - 46) / Math.max(lg.length, 1));
    const two = lg.length > 7, per = two ? Math.ceil(lg.length / 2) : lg.length, lh2 = two ? Math.min(26, (h - 46) / per) : lh;
    lg.forEach((e, j) => K.text(x + 16 + (two ? Math.floor(j / per) * (lw - 24) / 2 : 0), y + 52 + (j % per) * lh2, e.s, { size: two ? 13.5 : 14.5, c: j === lg.length - 1 ? 'mono b' : 'mono', fill: e.c || (j === lg.length - 1 ? C.chg : C.ink) }));
  }

  /* 每幕顶部三格：想做什么 → 怎么做 → 结果说明什么（每格 ≤ 约 40 字，自动换行）   DS.goal(K, a, b, c)；占 y=8..72
     DS.rd(K, x, y, n) 橙圈数字（阅读顺序）；DS.wrap(text, n) 按宽度换行 */
  function wrap(t, n) { let o = '', w = 0; for (const ch of t) { const c = ch.charCodeAt(0) > 255 ? 1 : 0.55; if (w + c > n) { o += '\n'; w = 0; } o += ch; w += c; } return o; }
  function goal(K, a, b, c) {
    [['想做什么', a, '#d9822b', '#fde3c2'], ['怎么做', b, '#3e79a7', '#e3eefb'], ['结果说明什么', c, '#3f9a5a', '#e1f2e4']].forEach(([lab, txt, col, fc], j) => {
      const x = 30 + j * 390, w = 360; K.rect(x, 8, w, 64, { f: fc, s: col, sw: 1.6, rx: 9 });
      K.text(x + 12, 27, lab, { size: 13.5, c: 'b', fill: col }); K.text(x + 12, 47, wrap(txt, 22), { size: 14.5, lh: 17.5 });
      if (j < 2) K.arrow(`M${x + w + 3} 40L${x + 390 - 4} 40`, { c: '#8f8678', w: 2.2 });
    });
  }
  function rd(K, x, y, n) { K.circle(x, y, 12, { f: C.hot, s: '#fff', sw: 1.5 }); K.text(x, y + 5.5, String(n), { a: 'middle', size: 15, c: 'b', fill: '#fff' }); }

  /* 树类页面共用的面板件：panel 圆角面板｜codeBox 代码面板｜varsBox 调试器式变量窗口（名字｜值｜含义，本步改变标蓝）｜mark 在结点旁标指针名 */
  function panel(K, x, y, w, h, title) { K.rect(x, y, w, h, { f: C.panel, s: C.panelS, rx: 10 }); if (title) K.text(x + 14, y + 24, title, { c: 'b', size: 14.5, fill: C.mut }); }
  function codeBox(K, x, y, w, h, lines, on, title) { panel(K, x, y, w, h, title || '代码'); code(K, x + 22, y + 48, lines, { lh: 22, size: 14, on, w: w - 28 }); }
  function varsBox(K, x, y, w, h, rows, title) {
    panel(K, x, y, w, h, title || '变量窗口（每步的值）');
    const lh = Math.min(27, (h - 44) / rows.length);
    rows.forEach(([n, v, d, chg], j) => { const yy = y + 46 + j * lh; if (j % 2 === 0) K.rect(x + 8, yy - lh + 8, w - 16, lh, { f: '#faf5ea', s: 'none', rx: 4 });
      K.text(x + 16, yy, n, { size: 14.5, c: 'b mono' }); K.text(x + 112, yy, String(v), { size: 14.5, c: 'b mono', fill: chg ? C.chg : C.ink }); K.text(x + 222, yy, d || '', { size: 13, fill: C.mut }); });
  }
  function mark(K, pos, key, label, col, where) {
    const q = pos.get(key); if (!q) return;
    if (where === 'left') { K.text(q.x - 52, q.y + 10, label, { a: 'end', size: 17, c: 'b mono', fill: col }); K.arrow(`M${q.x - 46} ${q.y + 4}L${q.x - 22} ${q.y + 4}`, { c: col, w: 2.4 }); }
    else if (where === 'right') { K.text(q.x + 52, q.y + 10, label, { a: 'start', size: 17, c: 'b mono', fill: col }); K.arrow(`M${q.x + 46} ${q.y + 4}L${q.x + 22} ${q.y + 4}`, { c: col, w: 2.4 }); }
    else if (where === 'down') { K.text(q.x, q.y + 52, label, { a: 'middle', size: 17, c: 'b mono', fill: col }); K.arrow(`M${q.x} ${q.y + 38}L${q.x} ${q.y + 22}`, { c: col, w: 2.4 }); }
    else { K.text(q.x, q.y - 44, label, { a: 'middle', size: 17, c: 'b mono', fill: col }); K.arrow(`M${q.x} ${q.y - 36}L${q.x} ${q.y - 22}`, { c: col, w: 2.4 }); }
  }
  window.DS = { panel, codeBox, varsBox, mark, goal, rd, wrap, machine, code, C, ST, view, cells, ptr, lnode, walk, place, tree, bnode, bwidth, blayout, btree, tex, chip, tw };
})();
