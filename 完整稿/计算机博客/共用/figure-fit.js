/* Shared zoom template for standalone figures.
   Include this script after header and .scroll/.viewport. A static SVG mounts
   automatically; dynamic SVG figures call FigureFit.svg(frame, svg, false,
   {footer}) after rendering. HTML panels call FigureFit.panel(...). */
(function () {
  const states = new WeakMap();

  function state(frame) {
    let value = states.get(frame);
    if (!value) {
      const requestedFit = new URLSearchParams(location.search).get('fit');
      value = { mode: (requestedFit || frame.dataset.defaultFit) === 'width' ? 'width' : 'area', percent: 100, kind: null, controls: null };
      states.set(frame, value);
    }
    return value;
  }

  function space(frame, footer, reserve) {
    const css = getComputedStyle(frame);
    const padX = parseFloat(css.paddingLeft) + parseFloat(css.paddingRight);
    const padY = parseFloat(css.paddingTop) + parseFloat(css.paddingBottom);
    const width = Math.max(1, frame.clientWidth - padX);
    const footerHeight = footer ? footer.getBoundingClientRect().height : 0;
    const height = Math.max(150, innerHeight - frame.getBoundingClientRect().top
      - footerHeight - padY - reserve);
    frame.style.height = (height + padY) + 'px';
    return { width, height };
  }

  function updateControls(current, ratio) {
    if (!current.controls) return;
    const { area, width, slider, value } = current.controls;
    area.classList.toggle('selected', current.mode === 'area');
    width.classList.toggle('selected', current.mode === 'width');
    area.setAttribute('aria-pressed', String(current.mode === 'area'));
    width.setAttribute('aria-pressed', String(current.mode === 'width'));
    const display = current.mode === 'manual' ? current.percent : Math.round(ratio * 100);
    slider.value = String(Math.max(+slider.min, Math.min(+slider.max, display)));
    value.textContent = display + '%';
  }

  function svg(frame, figure, _expanded, options = {}) {
    const current = state(frame);
    current.kind = 'svg';
    current.figure = figure;
    current.options = options;
    const { width: roomW, height: roomH } = space(frame, options.footer || null, options.reserve ?? 8);
    const view = figure.viewBox.baseVal;
    if (!view.width || !view.height) return { roomW, roomH, width: 0 };
    const mode = !current.controls && _expanded ? 'width' : current.mode;
    const target = mode === 'width' ? roomW
      : mode === 'manual' ? view.width * current.percent / 100
      : Math.min(roomW, roomH * view.width / view.height);
    figure.style.minWidth = '0';
    figure.style.maxWidth = 'none';
    figure.style.flex = 'none';
    figure.style.width = target + 'px';
    figure.style.height = target * view.height / view.width + 'px';
    frame.style.justifyContent = target > roomW ? 'flex-start' : 'center';
    // 图下面还接着正文（如图下说明）时，框高随图走，只让整页竖向滚动
    if (frame.hasAttribute('data-page-scroll')) frame.style.height = 'auto';
    updateControls(current, target / view.width);
    return { roomW, roomH, width: target };
  }

  function panel(frame, panels, _expanded, naturalWidth, naturalHeight, options = {}) {
    const current = state(frame);
    Object.assign(current, { kind: 'panel', panels, naturalWidth, naturalHeight, options });
    const { width: roomW, height: roomH } = space(frame, options.footer || null, options.reserve ?? 10);
    const mode = !current.controls && _expanded ? 'width' : current.mode;
    const scale = mode === 'width' ? roomW / naturalWidth
      : mode === 'manual' ? current.percent / 100
      : Math.min(roomW / naturalWidth, roomH / naturalHeight);
    panels.forEach(element => { element.style.zoom = scale; });
    frame.style.justifyContent = scale * naturalWidth > roomW ? 'flex-start' : 'center';
    updateControls(current, scale);
    return { roomW, roomH, scale };
  }

  function refresh(frame) {
    const current = state(frame);
    if (typeof window.fitScene === 'function') window.fitScene();
    else if (typeof window.fit === 'function') window.fit();
    else if (current.kind === 'svg') svg(frame, current.figure, false, current.options);
    else if (current.kind === 'panel') panel(frame, current.panels, false,
      current.naturalWidth, current.naturalHeight, current.options);
  }

  function mount(frame = document.querySelector('.scroll,.viewport')) {
    const header = document.querySelector('header');
    if (!frame || !header || header.querySelector('.figure-fit-controls')) return;
    const current = state(frame);
    const old = header.querySelector('#fit,#fitToggle,#window-fit-toggle');
    if (old) old.hidden = true;
    const bar = document.createElement('div');
    bar.className = 'figure-fit-controls';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', '图示缩放');
    bar.innerHTML = '<button type="button" data-fit="area">适应图区</button>'
      + '<button type="button" data-fit="width">适应宽度</button>'
      + '<span>手动</span>'
      + '<button type="button" data-fit="minus" aria-label="缩小 10%">−</button>'
      + '<input type="range" min="25" max="200" step="5" value="100" aria-label="手动缩放比例">'
      + '<button type="button" data-fit="plus" aria-label="放大 10%">＋</button>'
      + '<output>100%</output>';
    header.append(bar);
    const find = name => bar.querySelector('[data-fit="' + name + '"]');
    const slider = bar.querySelector('input');
    current.controls = { area: find('area'), width: find('width'), slider,
      value: bar.querySelector('output') };
    if (!current.kind) {
      const figure = frame.querySelector('svg');
      if (figure) svg(frame, figure, false, { footer: document.querySelector('footer') });
    }
    function manual(percent) {
      current.mode = 'manual';
      current.percent = Math.max(+slider.min, Math.min(+slider.max, percent));
      refresh(frame);
    }
    find('area').onclick = () => { current.mode = 'area'; refresh(frame); };
    find('width').onclick = () => { current.mode = 'width'; refresh(frame); };
    find('minus').onclick = () => manual(current.mode === 'manual' ? current.percent - 10 : +slider.value - 10);
    find('plus').onclick = () => manual(current.mode === 'manual' ? current.percent + 10 : +slider.value + 10);
    slider.oninput = () => manual(+slider.value);
    refresh(frame);
    const observer = new ResizeObserver(() => refresh(frame));
    observer.observe(header);
    observer.observe(frame);
    const footer = document.querySelector('footer');
    if (footer) observer.observe(footer);
    addEventListener('resize', () => refresh(frame));
    document.fonts.ready.then(() => refresh(frame));
  }

  function mountInline() {
    const page = document.querySelector('#ie-demo,[data-figure-fit-inline]');
    if (!page || page.querySelector('.figure-fit-controls')) return;
    const figures = [...page.querySelectorAll('svg')].filter(el => el.viewBox.baseVal.width);
    let figure = page.querySelector('.fig svg') || figures.sort((a, b) =>
      b.viewBox.baseVal.width * b.viewBox.baseVal.height
      - a.viewBox.baseVal.width * a.viewBox.baseVal.height)[0];
    if (!figure) return;
    const frame = figure.closest('.fig') || figure.parentElement;
    const current = state(frame);
    const bar = document.createElement('div');
    bar.className = 'figure-fit-controls';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', '图示缩放');
    bar.innerHTML = '<button type="button" data-fit="area">适应图区</button>'
      + '<button type="button" data-fit="width">适应宽度</button>'
      + '<span>手动</span><button type="button" data-fit="minus" aria-label="缩小 10%">−</button>'
      + '<input type="range" min="5" max="250" step="5" value="100" aria-label="手动缩放比例">'
      + '<button type="button" data-fit="plus" aria-label="放大 10%">＋</button><output>100%</output>';
    // 页面可以用 data-fit-bar 指定按钮条放哪（如图和说明分两列时放在两列上方）
    const slot = page.querySelector('[data-fit-bar]');
    if (slot) slot.append(bar); else frame.parentElement.insertBefore(bar, frame);
    const find = name => bar.querySelector('[data-fit="' + name + '"]');
    const slider = bar.querySelector('input');
    current.controls = { area: find('area'), width: find('width'), slider,
      value: bar.querySelector('output') };
    const requested = new URLSearchParams(location.search).get('fit') || page.dataset.defaultFit || frame.dataset.defaultFit;
    current.mode = requested === 'width' ? 'width' : 'area';
    frame.style.overflowX = 'auto';
    function fitInline() {
      // Several lesson pages rebuild their SVG when a scene changes.
      const liveFigure = frame.querySelector('svg');
      if (liveFigure) figure = liveFigure;
      if (!figure.isConnected) return;
      const box = figure.viewBox.baseVal;
      if (!box.width || !box.height) return;
      const roomW = Math.max(1, Math.min(frame.clientWidth, innerWidth - 24));
      const roomH = Math.max(120, innerHeight - figure.getBoundingClientRect().top - 12);
      const target = current.mode === 'width' ? roomW
        : current.mode === 'manual' ? box.width * current.percent / 100
        : Math.min(roomW, roomH * box.width / box.height);
      figure.style.setProperty('min-width', '0', 'important');
      figure.style.setProperty('max-width', 'none', 'important');
      figure.style.setProperty('width', target + 'px', 'important');
      figure.style.setProperty('height', target * box.height / box.width + 'px', 'important');
      updateControls(current, target / box.width);
    }
    function manual(percent) {
      current.mode = 'manual';
      current.percent = Math.max(+slider.min, Math.min(+slider.max, percent));
      fitInline();
    }
    find('area').onclick = () => { current.mode = 'area'; fitInline(); };
    find('width').onclick = () => { current.mode = 'width'; fitInline(); };
    find('minus').onclick = () => manual(current.mode === 'manual' ? current.percent - 10 : +slider.value - 10);
    find('plus').onclick = () => manual(current.mode === 'manual' ? current.percent + 10 : +slider.value + 10);
    slider.oninput = () => manual(+slider.value);
    let pending = false;
    function schedule() {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => { pending = false; fitInline(); });
    }
    new ResizeObserver(schedule).observe(frame);
    new MutationObserver(schedule).observe(figure, { attributes: true, attributeFilter: ['viewBox'] });
    new MutationObserver(schedule).observe(frame, { childList: true, subtree: true });
    addEventListener('resize', schedule);
    page.addEventListener('click', schedule, true);
    page.addEventListener('keydown', schedule, true);
    document.fonts.ready.then(schedule);
    fitInline();
  }

  const style = document.createElement('style');
  style.textContent = '.figure-fit-controls{display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin:8px 0 2px}'
    + '.figure-fit-controls button{font:inherit;font-size:14px;padding:5px 10px;margin:0;white-space:nowrap}'
    + '.figure-fit-controls button.selected{background:#d9e9e3;color:#214e44;border-color:#689b8c}'
    + '.figure-fit-controls input{width:128px;accent-color:#426f63}'
    + '.figure-fit-controls span{font-size:14px;color:#575f5a}'
    + '.figure-fit-controls output{min-width:46px;font:14px ui-monospace,monospace;color:#3e4b45}'
    + '#fit[hidden],#fitToggle[hidden],#window-fit-toggle[hidden]{display:none!important}';
  document.head.append(style);
  window.FigureFit = { svg, panel, mount, mountInline };
  // Standalone step demos keep their own original controls. Only explicitly
  // marked still figures receive the shared fit bar.
  function autoMount() {
    if (document.body.hasAttribute('data-figure-fit-static')) mount();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoMount);
  else autoMount();
})();
