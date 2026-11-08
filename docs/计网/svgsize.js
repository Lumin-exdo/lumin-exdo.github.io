/* svgstep.js 的全局样式 svg text{font:17px …} 会盖掉 font-size 属性，K.text 的 size 参数因此不生效。
   在 svgstep.js 之后引入本文件：把 font-size 属性转成行内样式，让 size 生效。 */
(function () {
  const fix = root => root.querySelectorAll('text[font-size]').forEach(t => { t.style.fontSize = t.getAttribute('font-size') + 'px'; });
  const go = () => { document.querySelectorAll('svg').forEach(s => { fix(s); new MutationObserver(() => fix(s)).observe(s, { childList: true, subtree: true }); }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
