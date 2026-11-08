"""Pinned left-column figure gallery for selected notes (same two-column layout as 3.6)."""
import html
from pathlib import Path

MARK = '<div class="side-gallery">'
END = '<!--/side-gallery-->'

# (folder, filename prefix) -> figures shown in the left column, in order.
# Each figure: (image file name findable by build.py, caption). First match wins.
# 计组第 5 章已改为 twopane 两栏页（左栏是自绘图和交互演示），不再需要这里的固定图廊。
RULES = []


def figures_for(path: Path) -> list[tuple[str, str]]:
    for (folder, prefix), figures in RULES:
        if path.parent.name == folder and path.name.startswith(prefix):
            return figures
    return []


def inject(text: str, path: Path) -> str:
    """Prepend the gallery as one raw-HTML block so markdown keeps it intact."""
    figures = figures_for(path)
    if not figures:
        return text
    slides = ''.join(
        f'<figure class="sg-slide"{" hidden" if i else ""}>'
        f'<img src="{html.escape(name)}" alt="{html.escape(caption)}" title="点击查看原图">'
        f'<figcaption>{html.escape(caption)}</figcaption></figure>'
        for i, (name, caption) in enumerate(figures))
    nav = ('' if len(figures) < 2 else
           '<div class="sg-nav"><button type="button" data-step="-1">← 上一张</button>'
           f'<span class="sg-count">1 / {len(figures)}</span>'
           '<button type="button" data-step="1">下一张 →</button></div>')
    return f'{MARK}{slides}{nav}</div>{END}\n\n{text}'


def wrap(body: str) -> str:
    """Move the gallery into the left column; the rest of the article goes right."""
    start = body.index(MARK)
    end = body.index(END, start) + len(END)
    gallery = body[start:end]
    return ('<div class="article-layout">'
            f'<aside class="article-visual">{gallery}{SCRIPT}</aside>'
            f'<div class="article-copy">{body[:start]}{body[end:]}</div>'
            '</div>')


CSS = r'''
.side-gallery{height:100%;display:flex;flex-direction:column;gap:10px;box-sizing:border-box}
.sg-slide{margin:0;display:flex;flex-direction:column;gap:8px;min-height:0}
.sg-slide[hidden]{display:none}
.sg-slide img{display:block;cursor:zoom-in;max-width:100%;width:auto;height:auto;max-height:calc(100dvh - 230px);object-fit:contain;background:#fff;border:1px solid var(--line);border-radius:6px}
.sg-slide figcaption{font-size:13px;color:var(--muted);line-height:1.5}
.sg-nav{display:flex;align-items:center;justify-content:center;gap:14px;font:13px "IBM Plex Mono",monospace;color:var(--muted)}
.sg-nav button{border:1px solid var(--line);border-radius:999px;background:var(--card);padding:5px 12px;cursor:pointer;font:inherit;color:var(--ink)}
.sg-nav button:hover{border-color:var(--blue);color:var(--blue)}
@media(max-width:1250px){.sg-slide img{max-height:none}}
@media(min-width:1251px){.article-layout:has(.side-gallery){grid-template-columns:minmax(0,1fr) 800px}}
'''

SCRIPT = '''<script>(()=>{
const g=document.querySelector('.side-gallery');if(!g)return;
g.querySelectorAll('img').forEach(img=>img.addEventListener('click',()=>open(img.currentSrc||img.src,'_blank')));
const slides=[...g.querySelectorAll('.sg-slide')],count=g.querySelector('.sg-count');
if(slides.length<2)return;let i=0;
const go=d=>{slides[i].hidden=true;i=(i+d+slides.length)%slides.length;slides[i].hidden=false;count.textContent=(i+1)+' / '+slides.length;};
g.querySelectorAll('.sg-nav button').forEach(b=>b.addEventListener('click',()=>go(+b.dataset.step)));
document.addEventListener('keydown',e=>{if(e.target.closest('input,textarea')||document.querySelector('#search-panel:not([hidden])'))return;
if(e.key==='ArrowLeft')go(-1);else if(e.key==='ArrowRight')go(1);});
})();</script>'''
