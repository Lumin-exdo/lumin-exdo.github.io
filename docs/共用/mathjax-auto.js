/* 共用：演示页里出现 TeX 公式（$…$）时自动渲染。
   由 svgstep.js、figure-fit.js 自动加载，页面不用单独引用。
   - 页面自己已加载 MathJax 的，不处理（它们自己负责排版）；
   - 只有页面文字里真有 TeX 特征（\命令、^上标、_下标）的 $…$ 才加载 MathJax，
     所以 shell 提示符之类的 "$ ls" 不会被误当公式；
   - 内容随步骤变化时（逐步演示、展开卡片）自动重新排版；
   - SVG 里的 <text> 不处理（MathJax 无法排版进 SVG 文字），公式请写在 HTML 卡片或说明里。 */
(function () {
  if (window.__mathjaxAuto) return;
  window.__mathjaxAuto = true;
  var own = Array.prototype.some.call(document.scripts, function (s) { return /mathjax(?!-auto)/i.test(s.src || ''); });
  if (window.MathJax || own) return;

  var STRONG = /(?<![\\$])\$(?!\s)[^$\n]*?(?:\\[A-Za-z]{2,}|\^[0-9{A-Za-z]|_\{|_[0-9A-Za-z])[^$\n]*?\$/;
  var SKIP = 'script,style,textarea,pre,code,noscript,svg,mjx-container';
  var loading = false, timer = 0;

  function findHosts() {
    var hosts = [], seen = new Set();
    if (!document.body) return hosts;
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var n;
    while ((n = w.nextNode())) {
      var t = n.nodeValue;
      if (t.indexOf('$') < 0 || !STRONG.test(t)) continue;
      var p = n.parentElement;
      if (!p || p.closest(SKIP)) continue;
      if (!seen.has(p)) { seen.add(p); hosts.push(p); }
    }
    return hosts;
  }

  function typeset(hosts) {
    window.MathJax.startup.promise
      .then(function () { return window.MathJax.typesetPromise(hosts); })
      .catch(function () {});
  }

  function run() {
    timer = 0;
    var hosts = findHosts();
    if (!hosts.length) return;
    if (window.MathJax && window.MathJax.typesetPromise) { typeset(hosts); return; }
    if (loading) return;
    loading = true;
    window.MathJax = {
      tex: { inlineMath: [['$', '$']], displayMath: [['$$', '$$']] },
      options: { skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'] },
      startup: { typeset: false }
    };
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
    s.onload = function () { typeset(findHosts()); };
    document.head.appendChild(s);
  }

  function schedule() { if (!timer) timer = setTimeout(run, 150); }

  function start() {
    run();
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
