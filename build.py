from __future__ import annotations

import html
import hashlib
import json
import os
import re
import shutil
import sys
import time
import unicodedata
import home_tabs
import side_gallery
from datetime import datetime
from pathlib import Path
from tools.sync_learning_pages import SINGLE_COPY_FIGURES

HERE = Path(__file__).resolve().parent
VENDOR = HERE / "vendor"
if str(VENDOR) not in sys.path:
    sys.path.insert(0, str(VENDOR))
from markdown_it import MarkdownIt
from markdown_it.rules_inline.emphasis import tokenize as tokenize_emphasis
from mdit_py_plugins.dollarmath import dollarmath_plugin

PUBLIC_EDITION = (HERE / 'public-edition.json').exists()
if not PUBLIC_EDITION:
    import local_notes
ROOTS = [
    ("计算机", HERE / '完整稿' / '计算机博客'),
    ("数学", HERE / '完整稿' / '数学博客'),
    ("物理", HERE / '完整稿' / '物理博客'),
    ("工科数学复习", HERE / '完整稿' / '工科数学复习'),
]
OUT = HERE / "site"
ATTACHMENTS = HERE / '完整稿' / '网站附件'
DATE_TABLE = HERE / "date-table.json"
IMAGE_MAP: dict[str, str] = {}
COMPUTER_SECTIONS = ('计组', 'OS', '数据结构', '计网', 'AI', '杂论')
# 网址里的专栏代号（文件夹 → 英文代号）
SECTION_CODES = {'计组': 'coa', 'OS': 'os', '计网': 'net', '数据结构': 'ds', 'AI': 'ai', '杂论': 'misc', '数学': 'math', '物理': 'physics', '工科数学复习': 'eng-math'}

SEARCH_UI = '''<button id="search-open" style="position:fixed;right:24px;bottom:24px;z-index:5;border:1px solid #dcded6;border-radius:999px;background:#fffefa;color:#405047;padding:9px 14px;font:13px 'IBM Plex Mono',monospace;cursor:pointer;box-shadow:0 3px 14px #20272418">⌕ 搜索</button><div id="search-panel" hidden style="position:fixed;inset:0;z-index:10;background:#20272466;padding:12vh 20px"><div style="max-width:660px;margin:auto;background:#fffefa;border:1px solid #dcded6;border-radius:7px;padding:18px;box-shadow:0 18px 50px #20272440"><div style="display:flex;gap:10px;align-items:center"><input id="search-input" type="search" placeholder="输入关键词，搜索标题与正文" style="width:100%;border:0;outline:0;background:transparent;color:#202724;font:17px 'Source Han Sans SC',sans-serif;padding:8px"><button id="search-close" style="border:0;background:transparent;color:#69716c;font-size:18px;cursor:pointer">×</button></div><div id="search-results" style="border-top:1px solid #dcded6;margin-top:10px;max-height:52vh;overflow:auto"></div></div></div>'''

SEARCH_SCRIPT = '''<script>(()=>{const open=document.getElementById('search-open'),panel=document.getElementById('search-panel'),input=document.getElementById('search-input'),close=document.getElementById('search-close'),results=document.getElementById('search-results');let entries=[];const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));async function show(){panel.hidden=false;input.focus();if(!entries.length)entries=await fetch('search-index.json').then(r=>r.json())}function render(){const q=input.value.trim().toLowerCase();if(!q){results.innerHTML='<p style="color:#69716c;font-size:14px;padding:8px 0">搜索文章标题或正文内容</p>';return}const found=entries.filter(x=>(x.title+' '+x.text).toLowerCase().includes(q)).slice(0,30);results.innerHTML=found.length?found.map(x=>'<a href="'+encodeURI(x.url)+'?q='+encodeURIComponent(input.value.trim())+'" style="display:block;padding:14px 4px;border-bottom:1px solid #e7e8e2;text-decoration:none;color:#202724"><strong style="font-family:Noto Serif SC,serif">'+esc(x.title)+'</strong><span style="display:block;color:#69716c;font-size:13px;line-height:1.6;margin-top:3px">'+esc(x.text.slice(Math.max(0,x.text.toLowerCase().indexOf(q)-38),Math.max(0,x.text.toLowerCase().indexOf(q)-38)+120))+'</span></a>').join(''):'<p style="color:#69716c;font-size:14px;padding:8px 0">没有找到匹配文章</p>'}open.onclick=show;close.onclick=()=>panel.hidden=true;panel.onclick=e=>{if(e.target===panel)panel.hidden=true};input.oninput=render;addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();show()}if(e.key==='Escape')panel.hidden=true});const q=new URLSearchParams(location.search).get('q');if(q)setTimeout(()=>{const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode:n=>/^(SCRIPT|STYLE)$/i.test(n.parentElement.tagName)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});let n;while(n=w.nextNode()){const i=n.nodeValue.toLowerCase().indexOf(q.toLowerCase());if(i>=0){const r=document.createRange();r.setStart(n,i);r.setEnd(n,i+q.length);const m=document.createElement('mark');m.style.cssText='background:#ead8b8;color:inherit;padding:0 2px;border-radius:2px';r.surroundContents(m);m.scrollIntoView({block:'center',behavior:'smooth'});break}}},500)})()</script>'''

CSS = r'''@import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Noto+Serif+SC:wght@400;500;600;700&family=Source+Han+Sans+SC:wght@400;500;600;700&display=swap");
:root{--paper:#f7f5f0;--ink:#202724;--muted:#69716c;--line:#dcded6;--card:#fffefa;--blue:#1d5e78;--math:#326a5b;--max:760px}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--paper);color:var(--ink);font-family:"Noto Serif SC","Source Han Serif SC","Songti SC",serif;font-size:17px;line-height:1.85}.wrap{max-width:1200px;margin:auto;padding:0 34px}.top{border-bottom:1px solid var(--line);padding:23px 0 21px}.nav{display:flex;justify-content:space-between;align-items:center;gap:18px}.brand{font-family:"Noto Serif SC",serif;font-size:20px;font-weight:700;color:var(--ink);text-decoration:none;letter-spacing:.06em}.tag{font:12px "IBM Plex Mono",monospace;color:var(--muted);letter-spacing:.08em}.hero{max-width:900px;padding:95px 0 75px}.eyebrow{font:13px "IBM Plex Mono",monospace;letter-spacing:.14em;color:var(--blue);text-transform:uppercase}.hero h1{font:600 clamp(38px,6vw,69px)/1.22 "Noto Serif SC",serif;letter-spacing:-.04em;margin:17px 0 23px}.hero p{max-width:620px;font-size:19px;color:#52605a;margin:0}.topic-nav{position:sticky;top:0;z-index:4;display:flex;gap:7px;flex-wrap:wrap;padding:13px 0;background:linear-gradient(var(--paper) 75%,transparent)}.topic-nav a{border:1px solid var(--line);border-radius:999px;padding:4px 12px;background:var(--card);font:12px "IBM Plex Mono",monospace;color:#52605a;text-decoration:none}.topic-nav a:hover{border-color:var(--blue);color:var(--blue)}.catalog{border-top:1px solid var(--line);padding:25px 0 100px}.section-label{font:13px "IBM Plex Mono",monospace;color:var(--muted);letter-spacing:.1em;margin:0 0 20px}.group{scroll-margin-top:58px;margin:0 0 54px}.group h2{font:600 28px "Noto Serif SC",serif;margin:0 0 14px}.group h2 span{font:13px "IBM Plex Mono",monospace;color:var(--math);vertical-align:middle;margin-left:8px}.list{border-top:1px solid var(--line)}.entry{display:grid;grid-template-columns:42px 1fr auto;gap:12px;padding:20px 4px;border-bottom:1px solid var(--line);align-items:baseline;text-decoration:none;color:var(--ink);transition:.18s}.entry:hover{padding-left:12px;background:#f0f1ea}.num{font:13px "IBM Plex Mono",monospace;color:var(--muted)}.entry-title{font:600 20px/1.45 "Noto Serif SC",serif}.arrow{color:var(--blue);font-size:20px}.foot{border-top:1px solid var(--line);padding:24px 0 45px;color:var(--muted);font-size:13px}.article-shell{max-width:1030px;margin:auto;padding:0 34px}.article-head{max-width:var(--max);padding:74px 0 46px;border-bottom:1px solid var(--line)}.crumb{font:13px "IBM Plex Mono",monospace;color:var(--blue);text-decoration:none}.article-head h1{font:600 clamp(32px,5vw,52px)/1.3 "Noto Serif SC",serif;letter-spacing:-.03em;margin:20px 0 0}.article{max-width:var(--max);padding:46px 0 100px}.article h1,.article h2,.article h3,.article h4{font-family:"Noto Serif SC",serif;line-height:1.45}.article h1{font-size:32px;margin:2em 0 .8em}.article h2{font-size:27px;border-top:1px solid var(--line);padding-top:1.5em;margin:2.8em 0 .8em}.article h3{font-size:22px;margin:2em 0 .7em}.article h4{font-size:19px;margin:1.6em 0 .5em}.article p{margin:1em 0}.article strong{font-weight:700;color:#182a24}.article code{font:14px "IBM Plex Mono",monospace;background:#ebece5;border-radius:3px;padding:.12em .3em}.article pre{overflow:auto;background:#242b28;color:#eef2eb;padding:20px 22px;border-radius:5px;line-height:1.65}.article pre code{padding:0;background:none;color:inherit}.article pre code.hljs{padding:0;background:none}.article blockquote{margin:1.6em 0;padding:8px 20px;border-left:3px solid var(--math);background:#edf3ee;color:#34443d}.article ul,.article ol{padding-left:1.5em}.article li{margin:.45em 0}.article table{width:100%;border-collapse:collapse;margin:1.7em 0;font-size:15px}.article td,.article th{border:1px solid var(--line);padding:9px 12px;text-align:left}.article th{background:#eaede6}.note-image{font-size:13px;color:var(--muted);border:1px dashed var(--line);padding:9px 12px;margin:1em 0}.back{font:14px "IBM Plex Mono",monospace;text-decoration:none;color:var(--blue)}@media(max-width:620px){.wrap,.article-shell{padding:0 20px}.hero{padding:65px 0 50px}.topic-nav{top:0}.entry{grid-template-columns:28px 1fr auto}.entry-title{font-size:18px}.article-head{padding-top:50px}.article{font-size:16px}}
'''

CSS += r'''
.article img{max-width:100%;height:auto}
.article figure.wide-figure{width:calc(100% + 270px);margin:1.8em 0 1.8em -135px}
.article figure.wide-figure img{width:100%}
.article blockquote p{margin:.65em 0}.article blockquote p:first-child{margin-top:0}.article blockquote p:last-child{margin-bottom:0}
@media(max-width:900px){.article figure.wide-figure{width:100%;margin-left:0}}
.article-shell:has(.article-layout){max-width:1600px;padding-inline:32px}
.article-shell:has(.article-layout) .article-head{max-width:none}
.article:has(.article-layout){max-width:none;width:100%}
/* 含代码块的文章：栏放宽，正文仍保持阅读宽度，代码块、表格、配图可以用满整栏 */
.article-shell:has(.article>:is(pre,iframe)):not(:has(.article-layout)){max-width:1300px}
.article-shell:has(.article>:is(pre,iframe)):not(:has(.article-layout)) .article{max-width:none}
.article-shell:has(.article>:is(pre,iframe)):not(:has(.article-layout)) .article>*{max-width:var(--max)}
.article-shell:has(.article>:is(pre,iframe)):not(:has(.article-layout)) .article>:is(pre,table,figure,iframe,p:has(>img)){max-width:1060px}
.article>p>img{max-width:100%;height:auto}
.article-layout{display:grid;grid-template-columns:minmax(0,1fr) 760px;gap:40px;align-items:start}
.article-visual{grid-column:1;min-width:0}.article-copy{grid-column:2;min-width:0}
.article-visual{position:sticky;top:16px;max-height:calc(100dvh - 32px);overflow:auto;overscroll-behavior:contain}
.article-visual .vmw{width:100%;box-sizing:border-box;position:static}
.article-copy>h1:first-child{margin-top:0}
.article-copy figure.wide-figure{width:100%;margin-inline:0}
@media(max-width:1250px){.article-layout{grid-template-columns:1fr;gap:28px}.article-visual,.article-copy{grid-column:1;width:100%;max-width:760px;margin-inline:auto}.article-shell:has(.article-layout){max-width:1030px}}
@media(max-width:1250px){.article-visual{position:static;max-height:none;overflow:visible}}
@media(max-width:620px){.article-shell:has(.article-layout){padding-inline:20px}}
@media(min-width:1251px){
html:has(.article-layout),body:has(.article-layout){height:100%;overflow:hidden}
.article-shell:has(.article-layout){height:100dvh;display:flex;flex-direction:column}
.article-shell:has(.article-layout) .article-head{flex:none;padding:16px 0 12px}
.article-shell:has(.article-layout) .article-head h1{font-size:28px;margin:6px 0 0}
.article-shell:has(.article-layout) .article-head p{margin:4px 0 0!important}
.article:has(.article-layout){flex:1;min-height:0;padding:18px 0 0}
.article-layout{height:100%;min-height:0;align-items:stretch}
.article-visual{position:static;max-height:none;overflow:hidden;min-height:0}
.article-visual .vmw{height:100%;display:flex;flex-direction:column;overflow:hidden}
.article-visual #vm-svg{flex:0 1 auto;min-height:0;max-height:55dvh}
.article-visual #vm-desc{min-height:0;overflow:auto}
.article-copy{height:100%;overflow-y:auto;overscroll-behavior:contain;box-sizing:border-box;padding-bottom:60px;scrollbar-width:thin}
}
'''

def mathjax_renderer(content: str, options: dict[str, bool]) -> str:
    """Keep TeX for the browser, while preventing HTML from eating < or &."""
    opening, closing = ('\\[', '\\]') if options['display_mode'] else ('\\(', '\\)')
    # colorv2 accepts #RRGGBB; also accept the site's existing [HTML] notation.
    content = re.sub(
        r'\\color\[HTML\]\{([0-9a-fA-F]{6})\}',
        lambda match: r'\color{#' + match.group(1) + '}',
        content,
    )
    return opening + html.escape(content) + closing

def prepare_display_math(text: str) -> str:
    """Give standalone single-line $$ formulas block spacing in every note."""
    output: list[str] = []
    for line in text.splitlines():
        match = re.fullmatch(r'([ \t]*)\$\$(.+?)\$\$([.,;:]?)[ \t]*', line)
        if not match:
            output.append(line)
            continue
        indent, formula, punctuation = match.groups()
        if output and output[-1].strip():
            output.append('')
        output.extend((indent + '$$', indent + formula + punctuation, indent + '$$', ''))
    return '\n'.join(output)

def cjk_emphasis(state, silent):
    """Allow bold punctuation next to CJK prose, using normal delimiter pairing."""
    start = state.pos
    first = len(state.delimiters)
    matched = tokenize_emphasis(state, silent)
    if not matched or state.src[start:state.pos] != '**':
        return matched
    before = state.src[start - 1] if start else ' '
    after = state.src[state.pos] if state.pos < state.posMax else ' '

    def is_cjk(char):
        return any(lo <= ord(char) <= hi for lo, hi in (
            (0x3400, 0x4DBF), (0x4E00, 0x9FFF), (0xF900, 0xFAFF),
            (0x20000, 0x323AF), (0x3040, 0x30FF), (0xAC00, 0xD7AF),
        ))

    before_punct = unicodedata.category(before).startswith('P')
    after_punct = unicodedata.category(after).startswith('P')
    if before_punct and (is_cjk(after) or (
        unicodedata.east_asian_width(before) in ('W', 'F') and after.isalnum()
    )):
        for delimiter in state.delimiters[first:]:
            delimiter.close = True
    elif after_punct and (is_cjk(before) or (
        unicodedata.east_asian_width(after) in ('W', 'F') and before.isalnum()
    )):
        for delimiter in state.delimiters[first:]:
            delimiter.open = True
    return matched


MARKDOWN = MarkdownIt('gfm-like', {'html': True, 'linkify': True}).use(
    dollarmath_plugin, renderer=mathjax_renderer, double_inline=True
)
MARKDOWN.inline.ruler.at('emphasis', cjk_emphasis)

def inline(s: str) -> str:
    # The notes are author-controlled: preserve ordinary inline HTML, but never
    # allow script blocks to become executable markup in the published pages.
    scripts = []
    def keep_script(match: re.Match) -> str:
        token = f'\uFFF2SCRIPT{len(scripts)}\uFFF3'
        scripts.append((token, match.group(0)))
        return token
    s = re.sub(r'(?is)<script\b[^>]*>.*?</script\s*>', keep_script, s)
    s = re.sub(r'(?is)</?script\b[^>]*>', keep_script, s)
    tags = []
    def keep_tag(match: re.Match) -> str:
        token = f'\uFFF0HTML{len(tags)}\uFFF1'
        tag = match.group(0)
        if re.match(r'(?is)<img\b', tag):
            def rewrite_src(src_match: re.Match) -> str:
                name = Path(src_match.group(3).replace('\\', '/')).name
                asset = IMAGE_MAP.get(name)
                if not asset:
                    return src_match.group(0)
                return src_match.group(1) + src_match.group(2) + asset + src_match.group(2)
            tag = re.sub(r'(?is)(\bsrc\s*=\s*)(["\'])([^"\']+)\2', rewrite_src, tag)
        tags.append((token, tag))
        return token
    s = re.sub(r'<[^>]+>', keep_tag, s)
    s = html.escape(s, quote=False)
    for token, tag in tags:
        s = s.replace(token, tag)
    for token, script in scripts:
        s = s.replace(token, html.escape(script, quote=False))
    s = re.sub(r'`([^`]+)`', r'<code>\1</code>', s)
    s = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', s)
    s = re.sub(r'\*(.+?)\*', r'<em>\1</em>', s)
    return s

def legacy_markdown_to_html(text: str) -> str:
    lines = text.replace('\r\n', '\n').split('\n')
    out, paragraph, in_code, code = [], [], False, []
    in_list, list_item_open, list_kind = False, False, ''
    nested_list_open, nested_item_open, nested_kind = False, False, ''
    def flush_p():
        nonlocal paragraph
        if paragraph: out.append('<p>' + inline(' '.join(paragraph)) + '</p>'); paragraph=[]
    def close_ul():
        nonlocal in_list, list_item_open, list_kind, nested_list_open, nested_item_open, nested_kind
        if nested_item_open: out.append('</li>'); nested_item_open=False
        if nested_list_open: out.append(f'</{nested_kind}>'); nested_list_open=False; nested_kind=''
        if list_item_open: out.append('</li>'); list_item_open=False
        if in_list: out.append(f'</{list_kind}>'); in_list=False; list_kind=''
    i=0
    while i < len(lines):
        line=lines[i]; stripped=line.strip()
        if stripped.startswith('```'):
            flush_p(); close_ul()
            if in_code: out.append('<pre><code>'+html.escape('\n'.join(code))+'</code></pre>'); code=[]; in_code=False
            else: in_code=True
            i+=1; continue
        if in_code: code.append(line); i+=1; continue
        image = re.fullmatch(r'!\[\[([^\]|]+)(?:\|[^\]]+)?\]\]', stripped)
        if image:
            flush_p(); close_ul(); name=image.group(1).strip(); asset=IMAGE_MAP.get(name)
            if asset:
                figure_name = Path(asset.split('?', 1)[0]).name
                figure_class = ' class="wide-figure"' if figure_name == '纯数学学科关系图.svg' or figure_name.startswith('physics-analytical-') else ''
                out.append(f'<figure{figure_class}><img style="display:block;max-width:100%;height:auto;border:1px solid #dcded6" src="{html.escape(asset, quote=True)}" alt="{html.escape(name, quote=True)}"><figcaption>{html.escape(name)}</figcaption></figure>')
            else:
                out.append('<div class="note-image">笔记引用的图片未在已授权的 attachments 目录中找到。</div>')
            i+=1; continue
        markdown_image = re.fullmatch(r'!\[([^\]]*)\]\(([^)]+)\)', stripped)
        if markdown_image:
            flush_p(); close_ul(); alt=markdown_image.group(1).strip(); name=Path(markdown_image.group(2).strip()).name; asset=IMAGE_MAP.get(name)
            if asset:
                figure_name = Path(asset.split('?', 1)[0]).name
                figure_class = ' class="wide-figure"' if figure_name == '纯数学学科关系图.svg' or figure_name.startswith('physics-analytical-') else ''
                out.append(f'<figure{figure_class}><img style="display:block;max-width:100%;height:auto;border:1px solid #dcded6" src="{html.escape(asset, quote=True)}" alt="{html.escape(alt, quote=True)}"><figcaption>{html.escape(alt or name)}</figcaption></figure>')
            else:
                out.append('<div class="note-image">笔记引用的图片未在已授权的目录中找到。</div>')
            i+=1; continue
        if stripped == '---': flush_p(); close_ul(); out.append('<hr>'); i+=1; continue
        m=re.match(r'^(#{1,6})\s+(.+)$', stripped)
        if m:
            flush_p(); close_ul(); n=len(m.group(1)); out.append(f'<h{n}>'+inline(m.group(2))+f'</h{n}>'); i+=1; continue
        if stripped.startswith('$$') and stripped.endswith('$$') and len(stripped) > 4:
            flush_p(); close_ul(); out.append('<div>\\['+html.escape(stripped[2:-2])+'\\]</div>'); i+=1; continue
        if stripped.startswith('$$'):
            flush_p(); close_ul(); formula=[stripped[2:]]; i+=1
            while i<len(lines) and not lines[i].strip().endswith('$$'): formula.append(lines[i]); i+=1
            if i<len(lines): formula.append(lines[i].strip()[:-2]); i+=1
            out.append('<div>\\['+html.escape('\n'.join(formula))+'\\]</div>'); continue
        if stripped == '>' or stripped.startswith('> '):
            flush_p(); close_ul(); quote_lines=[]
            while i < len(lines):
                quoted = lines[i].lstrip()
                if quoted != '>' and not quoted.startswith('> '):
                    break
                quote_lines.append(quoted[1:].lstrip())
                i += 1
            out.append('<blockquote>' + legacy_markdown_to_html('\n'.join(quote_lines)) + '</blockquote>')
            continue
        list_match = re.match(r'^(?:[-*+]\s+|\d+\.\s+)', stripped)
        if list_match:
            flush_p()
            kind = 'ol' if re.match(r'^\d+\.\s+', stripped) else 'ul'
            indent = len(line) - len(line.lstrip(' \t'))
            if indent and in_list:
                if not nested_list_open:
                    out.append(f'<{kind}>'); nested_list_open=True; nested_kind=kind
                elif nested_kind != kind:
                    if nested_item_open: out.append('</li>'); nested_item_open=False
                    out.append(f'</{nested_kind}><{kind}>'); nested_kind=kind
                if nested_item_open: out.append('</li>')
                out.append('<li>'+inline(list_match.string[list_match.end():])); nested_item_open=True; i+=1; continue
            if nested_list_open:
                if nested_item_open: out.append('</li>'); nested_item_open=False
                out.append(f'</{nested_kind}>'); nested_list_open=False; nested_kind=''
            if in_list and list_kind != kind: close_ul()
            if not in_list: out.append(f'<{kind}>'); in_list=True; list_kind=kind
            if list_item_open: out.append('</li>')
            out.append('<li>'+inline(list_match.string[list_match.end():])); list_item_open=True; i+=1; continue
        if in_list and (line.startswith('  ') or line.startswith('\t')) and stripped:
            out.append(' '+inline(stripped)); i+=1; continue
        if '|' in stripped and i+1<len(lines) and re.match(r'^\|?\s*:?-{3,}', lines[i+1].strip()):
            flush_p(); close_ul(); headers=[x.strip() for x in stripped.strip('|').split('|')]; i+=2; rows=[]
            while i<len(lines) and '|' in lines[i] and lines[i].strip(): rows.append([x.strip() for x in lines[i].strip().strip('|').split('|')]); i+=1
            out.append('<table><thead><tr>'+''.join('<th>'+inline(x)+'</th>' for x in headers)+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+inline(x)+'</td>' for x in row)+'</tr>' for row in rows)+'</tbody></table>'); continue
        if not stripped: flush_p(); close_ul(); i+=1; continue
        close_ul(); paragraph.append(stripped); i+=1
    flush_p(); close_ul()
    return '\n'.join(out)

def markdown_to_html(text: str) -> str:
    """Render CommonMark/GFM via markdown-it, plus the local note conventions."""
    # Hold bracket-delimited TeX while markdown-it parses prose: otherwise it
    # interprets TeX backslashes as Markdown escapes. Restore it afterward.
    bracket_math: list[tuple[str, str]] = []
    def hold_bracket_math(match: re.Match) -> str:
        token = f'\uFFF4MATH{len(bracket_math)}\uFFF5'
        bracket_math.append((token, match.group(1) + html.escape(match.group(2)) + match.group(3)))
        return token
    text = re.sub(r'(\\\[)(.*?)(\\\])', hold_bracket_math, text, flags=re.S)
    text = re.sub(r'(\\\()(.*?)(\\\))', hold_bracket_math, text, flags=re.S)

    def rewrite_wikilink(match: re.Match) -> str:
        name = match.group(1).strip()
        asset = IMAGE_MAP.get(name)
        if asset:
            return f'![{name}]({asset})'
        return '<div class="note-image">笔记引用的图片未在已授权的 attachments 目录中找到。</div>'
    text = re.sub(r'!\[\[([^\]|]+)(?:\|[^\]]+)?\]\]', rewrite_wikilink, text)

    def rewrite_markdown_image(match: re.Match) -> str:
        alt, target = match.group(1), match.group(2)
        asset = IMAGE_MAP.get(Path(target.strip()).name)
        return f'![{alt}]({asset or target})'
    text = re.sub(r'!\[([^\]]*)\]\(([^)]+)\)', rewrite_markdown_image, text)

    def rewrite_attachment_link(match: re.Match) -> str:
        label, target = match.group(1), match.group(2)
        asset = IMAGE_MAP.get(Path(target.strip()).name)
        return f'[{label}]({asset})' if asset else match.group(0)
    # Linked companion files placed next to a note are copied to assets like images.
    text = re.sub(r'(?<!!)\[([^\]]*)\]\(([^)\s]+\.(?:html|txt|c))\)', rewrite_attachment_link, text, flags=re.I)

    def rewrite_html_image(match: re.Match) -> str:
        name = Path(match.group(3).replace('\\', '/')).name
        asset = IMAGE_MAP.get(name)
        return match.group(1) + match.group(2) + (asset or match.group(3)) + match.group(2)
    text = re.sub(r'(?is)(\bsrc\s*=\s*)(["\'])([^"\']+)\2', rewrite_html_image, text)
    rendered = MARKDOWN.render(text)
    for token, formula in bracket_math:
        rendered = rendered.replace(token, formula)
    rendered = re.sub(
        r'<p>\s*(<img\b[^>]*src="[^"]*physics-analytical-[^"]*"[^>]*>)\s*</p>',
        r'<figure class="wide-figure">\1</figure>',
        rendered,
    )
    return rendered

def diagram_layout(body: str, names: tuple[str, ...]) -> str:
    """Move selected illustrations into a zoomable reading pane; preserve text."""
    figures = []
    for name in names:
        pattern = r'<p>\s*(<img\b[^>]*src="[^"]*' + re.escape(name) + r'(?:\?[^"]*)?"[^>]*>)\s*</p>'
        match = re.search(pattern, body)
        if not match:
            return body
        image = match.group(1)
        src = re.search(r'src="([^"]*)"', image).group(1)
        alt = re.search(r'alt="([^"]*)"', image)
        label = alt.group(1) if alt else html.escape(name)
        figures.append((match.group(0), image, src, label))
    panels, buttons = [], []
    for i, (original, image, src, label) in enumerate(figures):
        buttons.append(f'<button type="button" data-diagram="{i}" aria-pressed="{str(i == 0).lower()}">{label}</button>')
        panels.append(f'<div class="diagram-panel" data-panel="{i}"' + (' hidden' if i else '') + f'><div class="diagram-canvas">{image}</div><a href="{src}" target="_blank" rel="noopener">在新标签页打开原图 ↗</a></div>')
        body = body.replace(original, f'<p class="diagram-reference"><button type="button" data-diagram="{i}">查看配图：{label} ↗</button></p>', 1)
    return ('<div class="article-layout"><aside class="article-visual diagram-reader" aria-label="配图阅读区">'
            '<div class="diagram-toolbar">' + ''.join(buttons) +
            '<label>放大 <input class="diagram-zoom" type="range" min="100" max="300" step="25" value="100" aria-label="配图缩放"><output>100%</output></label>'
            '<button type="button" class="diagram-jump">定位对应正文 ↓</button><small>放大后可在图内横向、纵向滚动。</small></div><div class="diagram-viewport">' + ''.join(panels) +
            '</div></aside><div class="article-copy">' + body + '<!--article-copy-end--></div></div>' + r'''<script>(()=>{
const pane=document.querySelector('.diagram-reader'),zoom=pane.querySelector('.diagram-zoom');
document.querySelectorAll('[data-diagram]').forEach(button=>button.addEventListener('click',()=>{
 const id=button.dataset.diagram;
 pane.querySelectorAll('[data-panel]').forEach(p=>p.hidden=p.dataset.panel!==id);
 pane.querySelectorAll('[data-diagram]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.diagram===id)));
 if(!matchMedia('(min-width:1251px)').matches)pane.scrollIntoView({block:'start',behavior:'smooth'});
}));
zoom.addEventListener('input',()=>{
 pane.querySelectorAll('.diagram-canvas').forEach(c=>c.style.width=zoom.value+'%');
 pane.querySelector('output').textContent=zoom.value+'%';
});
pane.querySelector('.diagram-jump').addEventListener('click',()=>{
 const id=pane.querySelector('[aria-pressed="true"]').dataset.diagram;
 document.querySelector('.diagram-reference [data-diagram="'+id+'"]').scrollIntoView({block:'start',behavior:'smooth'});
});
})();</script>''')


CSS += r'''
.diagram-reader{display:flex;flex-direction:column;border:1px solid var(--line);border-radius:6px;background:var(--card)}
.diagram-toolbar{flex:none;padding:12px;display:flex;flex-wrap:wrap;gap:8px;border-bottom:1px solid var(--line);font:13px/1.6 sans-serif}
.diagram-toolbar button,.diagram-reference button{border:1px solid var(--line);border-radius:4px;background:var(--paper);color:var(--math);padding:7px 10px;text-align:left;cursor:pointer;font:inherit}
.diagram-toolbar button[aria-pressed="true"]{background:#e3ece5;border-color:var(--math)}
.diagram-toolbar label{display:flex;align-items:center;gap:8px;width:100%}.diagram-toolbar small{color:var(--muted)}
.diagram-viewport{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;padding:10px}
.diagram-canvas{width:100%}.diagram-canvas img{display:block;width:100%;height:auto}
.diagram-panel>a{font:13px/2 sans-serif;color:var(--math)}
.article-shell:has(.diagram-reader){max-width:1900px}
@media(min-width:1251px){.article-layout:has(.diagram-reader){grid-template-columns:minmax(0,1fr) minmax(0,680px);gap:28px}}
@media(max-width:1250px){.diagram-viewport{max-height:65dvh}.article-shell:has(.diagram-reader){max-width:1030px}}
'''


CSS += side_gallery.CSS

def page_base(title: str, body: str, article=False, published: str | None = None) -> str:
    date_line = f'<p style="margin:12px 0 0;color:#8a908b;font:12px IBM Plex Mono,monospace;letter-spacing:.04em">发布于 {html.escape(published)}</p>' if published else ''
    if article and '<div class="vmw">' in body:
        vm_start = body.index('<div class="vmw">')
        vm_end_marker = '</div>\n<script>\n(function(){'
        vm_end = body.find(vm_end_marker, vm_start)
        if vm_end >= 0:
            vm_end += len('</div>')
            vm_block = body[vm_start:vm_end]
            body = (
                '<div class="article-layout">'
                f'<aside class="article-visual">{vm_block}</aside>'
                f'<div class="article-copy">{body[:vm_start]}{body[vm_end:]}</div>'
                '</div>'
            )
    elif article and side_gallery.MARK in body:
        body = side_gallery.wrap(body)
    main = f'<main class="article-shell"><header class="article-head"><a class="crumb" href="index.html">← 知识合集</a><h1>{html.escape(title)}</h1>{date_line}</header><article class="article">{body}</article></main>' if article else body
    live_reload = "<script>(async()=>{let v='';setInterval(async()=>{try{const n=await fetch('version.txt?'+Date.now(),{cache:'no-store'}).then(r=>r.text());if(v&&n!==v)location.reload();v=n}catch(e){}},2000)})()</script>"
    license = '<footer class="wrap foot">除非另有说明，本站内容采用 <a style="color:#80582d;font-weight:600;text-decoration-color:#b89a75;text-underline-offset:3px" href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans" rel="license">CC BY-NC-SA 4.0</a> 协议发布。</footer>'
    if '<div class="article-layout">' in body:
        main += '''<script>(()=>{
const copy=document.querySelector('.article-copy');
document.addEventListener('wheel',e=>{
if(!matchMedia('(min-width:1251px)').matches||e.ctrlKey||document.querySelector('#search-panel:not([hidden])'))return;
if(copy.contains(e.target)||e.target.closest('.diagram-reader,.fx-visual'))return;
e.preventDefault();copy.scrollTop+=e.deltaY*(e.deltaMode===1?20:e.deltaMode===2?copy.clientHeight:1);
},{passive:false});
})();</script>'''
        if '<!--article-copy-end-->' in main:
            main = main.replace('<!--article-copy-end-->', license)
        else:
            main = main.replace('</div></div></article>', license + '</div></div></article>')
        license = ''
    return f'<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{html.escape(title)} · 知识合集</title><link rel="stylesheet" href="style.css"><script>window.MathJax={{loader:{{load:["[tex]/colorv2"]}},tex:{{inlineMath:[["$","$"]],packages:{{"[-]":["textmacros"],"[+]":["colorv2"]}},autoload:{{color:[]}}}}}};</script><script async src="https://cdn.jsdelivr.net/npm/mathjax@4.0.0/tex-mml-chtml.js"></script><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/styles/github-dark.min.css"><script defer src="https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/highlight.min.js"></script><script>addEventListener("DOMContentLoaded",function(){{if(window.hljs){{hljs.configure({{cssSelector:"pre code[class*=language-]"}});hljs.highlightAll();}}}});</script></head><body>{main}{license}{SEARCH_UI}{live_reload}{SEARCH_SCRIPT}</body></html>'

def page(title: str, body: str, article=False, published: str | None = None) -> str:
    """Add both common TeX inline delimiters without touching note text."""
    css_version = hashlib.sha256(CSS.encode('utf-8')).hexdigest()[:12]
    return page_base(title, body, article, published).replace(
        'href="style.css"', f'href="style.css?v={css_version}"'
    ).replace(
        "await fetch('search-index.json').then(r=>r.json())",
        "await fetch('search-index.json').then(r=>r.json())" if PUBLIC_EDITION else
        "(await Promise.all([fetch('search-index.json').then(r=>r.json()),fetch('local/search-index.json').then(r=>r.ok?r.json():[]).catch(()=>[])])).flat();render()"
    ).replace(
        'inlineMath:[["$","$"]]',
        r'inlineMath:[["$","$"],["\\(","\\)"]]',
    )

def copy_referenced_attachments(all_texts: list[str]):
    """Copy only attachment files explicitly embedded by the published notes."""
    global IMAGE_MAP
    requested = set()
    for text in all_texts:
        requested.update(re.findall(r'!\[\[([^\]|]+)(?:\|[^\]]+)?\]\]', text))
        requested.update(Path(x.strip()).name for x in re.findall(r'!\[[^\]]*\]\(([^)]+)\)', text))
        requested.update(Path(x.replace('\\', '/')).name for x in re.findall(r'(?is)<img\b[^>]*\bsrc\s*=\s*["\']([^"\']+)["\']', text))
        requested.update(Path(x).name for x in re.findall(r'(?<!!)\[[^\]]*\]\(([^)\s]+\.(?:html|txt|c))\)', text, flags=re.I))
        for encoded_sources in re.findall(r'\bvar\s+SRCS\s*=\s*(\[.*?\])\s*;', text, flags=re.S):
            try:
                requested.update(Path(x.split('?', 1)[0].split('#', 1)[0]).name for x in json.loads(encoded_sources))
            except (ValueError, TypeError):
                pass
    image_files = [p for _, root in ROOTS for p in root.rglob('*') if p.is_file()]
    image_files += [p for p in ATTACHMENTS.rglob('*') if p.is_file()]
    attachment_index = {p.name: p for p in image_files}
    assets = OUT / 'assets'
    for name in sorted(x.strip() for x in requested):
        source = attachment_index.get(name)
        if source:
            destination = assets / source.name
            destination.parent.mkdir(parents=True, exist_ok=True)
            if source.name not in SINGLE_COPY_FIGURES:
                shutil.copy2(source, destination)
            figure_path = '' if source.name in SINGLE_COPY_FIGURES else 'assets/'
            IMAGE_MAP[name] = figure_path + source.name + '?v=' + str(source.stat().st_mtime_ns)
            if source.suffix.lower() == '.html':
                is_os_figure = source.parent.name == 'OS'
                standalone_text = source.read_text(encoding='utf-8')
                # Relocated two-pane pages link to standalone figures at the site root.
                shared_palette = '../images/course-figure-palette.js'
                if shared_palette in standalone_text:
                    palette_source = (source.parent / shared_palette).resolve()
                    if palette_source.is_file():
                        (OUT / 'images').mkdir(parents=True, exist_ok=True)
                        shutil.copy2(palette_source, OUT / 'images' / palette_source.name)
                        (OUT / source.name).write_text(
                            standalone_text.replace(shared_palette, 'images/course-figure-palette.js'),
                            encoding='utf-8',
                        )
                    else:
                        raise FileNotFoundError(palette_source)
                else:
                    shutil.copy2(source, OUT / source.name)
                if is_os_figure:
                    os_assets = OUT / 'os'
                    os_assets.mkdir(parents=True, exist_ok=True)
                    if source.name not in SINGLE_COPY_FIGURES:
                        shutil.copy2(source, os_assets / source.name)
                for script_name in re.findall(r'<script\b[^>]*\bsrc=["\']([^"\']+\.js)["\']', standalone_text, flags=re.I):
                    if Path(script_name).name != script_name:
                        continue
                    companion = source.parent / script_name
                    if companion.is_file():
                        shutil.copy2(companion, assets / script_name)
                        shutil.copy2(companion, OUT / script_name)
                        if is_os_figure:
                            shutil.copy2(companion, os_assets / script_name)
                for css_name in re.findall(r'<link\b[^>]*\bhref=["\']([^"\']+\.css)["\']', standalone_text, flags=re.I):
                    if Path(css_name).name != css_name or css_name == 'style.css':
                        continue
                    companion = source.parent / css_name
                    if companion.is_file():
                        shutil.copy2(companion, assets / css_name)
                        shutil.copy2(companion, OUT / css_name)
                        if is_os_figure:
                            shutil.copy2(companion, os_assets / css_name)

def file_identity(path: Path) -> str:
    stat = path.stat()
    ino = getattr(stat, 'st_ino', 0)
    if ino:
        return f'{stat.st_dev}:{ino}'
    return f'path:{path.resolve()}'

def content_fingerprint(text: str) -> str:
    """A rename fallback: same article text gets the same fingerprint."""
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def reorder_virtual_memory_note(text: str, path: Path) -> str:
    """Put the interactive walkthrough before the long explanatory sections.

    The walkthrough is moved as one complete block, so no source content is
    discarded. Its step descriptions remain attached to the diagram, while
    the later sections continue to provide the full detailed treatment.
    """
    if path.name != '3.6 - 虚拟存储器.md':
        return text
    start_marker = '### 7.2 分步图'
    end_marker = '### 7.3 进程被切换和进程结束'
    insert_marker = '## 1. 虚拟存储器要解决什么问题'
    start = text.find(start_marker)
    end = text.find(end_marker, start + len(start_marker)) if start >= 0 else -1
    insert_at = text.find(insert_marker)
    if min(start, end, insert_at) < 0:
        return text
    block = text[start:end].strip()
    block = block.replace(
        start_marker,
        '## 先看动画：虚拟存储器完整走一遍',
        1,
    )
    remaining = text[:start] + text[end:]
    remaining = remaining.replace(
        end_marker,
        '### 7.2 进程被切换和进程结束',
        1,
    )
    insert_at = remaining.find(insert_marker)
    return remaining[:insert_at] + block + '\n\n' + remaining[insert_at:]

def relocate(page_html: str, slug: str) -> str:
    """文章放在子目录（如 os/virtual-machine.html）时，把相对站点根目录的地址补上 ../。"""
    depth = slug.count('/')
    if not depth:
        return page_html
    up = '../' * depth
    keep = r'(?![a-zA-Z][a-zA-Z0-9+.-]*:|//|/|#|\.\./|\?)'
    page_html = re.sub(r'(\b(?:src|href)\s*=\s*)(["\'])' + keep, lambda m: m.group(1) + m.group(2) + up, page_html)
    page_html = re.sub(r'(location\.replace\(\s*)(["\'])' + keep, lambda m: m.group(1) + m.group(2) + up, page_html)
    for name in ("search-index.json", "local/search-index.json", "version.txt?"):
        page_html = page_html.replace(f"fetch('{name}", f"fetch('{up}{name}")
    return page_html.replace("encodeURI(x.url)", f"'{up}'+encodeURI(x.url)")

def relocate_twopane(page_html: str, slug: str) -> str:
    """两栏页原本和笔记同目录；挪到 slug 位置后，同目录的文件改指向站点根目录的副本，../images 不变。"""
    up = '../' * slug.count('/')
    page_html = relocate(page_html, slug)
    def fix(match: re.Match) -> str:
        srcs = json.loads(match.group(1))
        srcs = [s if s.startswith(('../', 'http:', 'https:', '/')) else up + s for s in srcs]
        return 'var SRCS=' + json.dumps(srcs, ensure_ascii=False) + ';'
    page_html = re.sub(r'var SRCS=(\[.*?\]);', fix, page_html, count=1)
    if slug.startswith('physics/'):
        # Physics SVGs are copied into assets/, while the local note uses images/.
        page_html = page_html.replace(
            f'{up}images/physics-analytical-',
            f'{up}assets/physics-analytical-',
        )
    return page_html

def _pub(path) -> bool:
    """下划线开头的目录（如 _校对）不参与发布。"""
    return not any(part.startswith('_') for part in Path(path).parts)

def load_date_table() -> dict[str, dict[str, str]]:
    if not DATE_TABLE.exists():
        return {}
    try:
        data = json.loads(DATE_TABLE.read_text(encoding='utf-8'))
    except Exception:
        return {}
    if isinstance(data, dict) and 'files' in data and isinstance(data['files'], dict):
        data = data['files']
    return data if isinstance(data, dict) else {}

def section_for(source: str, path: Path, title: str) -> str:
    """Computer notes are classified by their first-level local folder."""
    if source != '计算机':
        return source
    return path.parts[0] if path.parts and (path.parts[0] in COMPUTER_SECTIONS or path.parts[0] == '工科数学复习') else '杂论'

def display_title(filename_stem: str) -> str:
    """Show just chapter.section publicly; keep finer ordering in filenames."""
    match = re.match(r'^(\d+)(?:\.(\d+))?[.\da-z-]*\s*[-—–]\s*(.+)$', filename_stem, flags=re.I)
    if not match:
        return filename_stem
    number = match.group(1) + (f'.{match.group(2)}' if match.group(2) else '')
    span = re.match(r'^(\d+\.\d+)-(\d+\.\d+)\s*[-—–]', filename_stem)
    if span:  # 合并多节的文件（如 3.1-3.2）：标题把各节都标出来
        number = f'{span.group(1)}–{span.group(2)}'
    return f'{number} · {match.group(3)}'

def clear_out():
    """清空 site/。Windows 上文件可能被浏览器、杀毒软件短暂占用（WinError 145/32），稍等重试。"""
    for _ in range(10):
        try:
            if OUT.exists():
                shutil.rmtree(OUT)
            return
        except OSError:
            time.sleep(0.5)
    if OUT.exists():
        shutil.rmtree(OUT)

def publish_public_site():
    """Replace docs/ (the GitHub Pages folder) with the independently built public site."""
    target = HERE / 'docs'
    if target.exists():
        shutil.rmtree(target)
    shutil.copytree(OUT, target)
    (target / '.nojekyll').touch()

def build_lock():
    """同一时间只允许一个构建：手动运行和后台自动构建撞在一起时，后来的等前一个跑完。"""
    import socket
    lock = socket.socket()
    for _ in range(240):
        try:
            lock.bind(('127.0.0.1', 8098))
            return lock
        except OSError:
            time.sleep(0.5)
    raise SystemExit('等了 2 分钟，另一个构建还没结束；请稍后再试')

def main():
    lock = build_lock()
    try:
        _main()
    finally:
        lock.close()

def _main():
    global IMAGE_MAP
    IMAGE_MAP = {}
    date_table = load_date_table()
    try:
        next_number = int(json.loads(DATE_TABLE.read_text(encoding='utf-8')).get('next_number', 1))
    except Exception:
        next_number = 1
    next_date_table: dict[str, dict[str, str]] = {}
    used_previous_ids: set[str] = set()
    # URLs already assigned to an article stay reserved, even if files reorder.
    reserved_slugs = {record.get('slug') for record in date_table.values()
                      if isinstance(record, dict) and record.get('slug')}
    reserved_slugs |= {old for record in date_table.values() if isinstance(record, dict)
                       for old in record.get('old_slugs', [])}
    assigned_slugs: set[str] = set()
    # 每个网址（现用的和留跳转的旧网址）属于哪条记录
    slug_owners: dict[str, dict] = {}
    for record in date_table.values():
        if isinstance(record, dict):
            for owned in [record.get('slug'), *record.get('old_slugs', [])]:
                if owned:
                    slug_owners.setdefault(owned, record)
    clear_out()
    OUT.mkdir(parents=True)
    (OUT/'style.css').write_text(CSS, encoding='utf-8')
    palette_review = Path(__file__).resolve().parent / 'maintenance' / 'learning-audit' / '配色复核清单.html'
    if palette_review.is_file():
        shutil.copy2(palette_review, OUT / palette_review.name)
    source_files = [(category, file) for category, folder in ROOTS for file in sorted(folder.rglob('*.md')) if _pub(file)]
    texts = {
        file: prepare_display_math(side_gallery.inject(reorder_virtual_memory_note(
            file.read_text(encoding='utf-8-sig'),
            file,
        ), file))
        for _, file in source_files
    }
    twopane_files = {}
    for category, file in source_files:
        match = re.match(r'\s*<script>location\.replace\("([^"]+?\.html)"\);</script>', texts[file])
        if not match:
            continue
        twopane_file = file.parent / match.group(1)
        if not twopane_file.exists():
            folder = next(root for name, root in ROOTS if name == category)
            twopane_file = next(folder.rglob(match.group(1)), None)
        if twopane_file and twopane_file.exists():
            twopane_files[file] = twopane_file
    copy_referenced_attachments([
        *texts.values(), *(path.read_text(encoding='utf-8') for path in twopane_files.values())
    ])
    records_by_section: dict[str, list[tuple[int, str, str]]] = {
        name: [] for name in (*COMPUTER_SECTIONS, '数学', '物理', '工科数学复习')
    }
    search_entries=[]
    for category, folder in ROOTS:
        files=sorted(f for f in folder.rglob('*.md') if _pub(f))
        for n, file in enumerate(files, 1):
            title=display_title(file.stem)
            text=texts[file]
            identity = file_identity(file)
            relative_path = str(file.relative_to(folder))
            fingerprint = content_fingerprint(text)
            previous = date_table.get(identity)

            # First choice: it is physically the same file (including a rename).
            if previous is None:
                # Second choice: an editor replaced the file at the same location.
                previous = next((record for old_id, record in date_table.items()
                                 if old_id not in used_previous_ids
                                 and record.get('source') == category
                                 and record.get('path') == relative_path), None)
            if previous is None:
                # Third choice: unchanged text was moved/renamed, so the path changed too.
                matches = [(old_id, record) for old_id, record in date_table.items()
                           if old_id not in used_previous_ids
                           and record.get('fingerprint') == fingerprint]
                if len(matches) == 1:
                    previous = matches[0][1]
                    used_previous_ids.add(matches[0][0])
            if identity in date_table:
                used_previous_ids.add(identity)
            first_seen = (previous or {}).get('first_seen')
            if not first_seen:
                first_seen = datetime.fromtimestamp(file.stat().st_ctime).strftime('%Y-%m-%d %H:%M:%S')
            # 网址 = 专栏代号（由笔记所在文件夹决定）/ 名字.html；表里只记名字，挪文件夹时网址自动跟着变
            code = SECTION_CODES.get(section_for(category, file.relative_to(folder), title), 'misc')
            # 名字被别的文章占着（例如挪进来的文章和本专栏原有文章同名），就加 -2、-3 避让；原地没动的文章优先
            def taken(candidate: str) -> bool:
                owner = slug_owners.get(candidate)
                return candidate in assigned_slugs or (owner is not None and owner is not previous)
            base = (previous or {}).get('name')
            if not base:
                names_file = HERE / 'page-names.json'
                names = json.loads(names_file.read_text(encoding='utf-8')) if names_file.exists() else {}
                name_key = f'{category}/{relative_path.replace(os.sep, "/")}'
                base = names.get(name_key)
                if not base or not re.fullmatch(r'[a-z][a-z0-9]*(?:-[a-z0-9]+)*', base):
                    raise ValueError(f'新网页须先在 page-names.json 中设置英文具名地址：{name_key}')
            name, suffix = base, 2
            while taken(f'{code}/{name}.html'):
                name, suffix = f'{base}-{suffix}', suffix + 1
            slug = f'{code}/{name}.html'
            assigned_slugs.add(slug)
            next_date_table[identity] = {
                'first_seen': first_seen,
                'source': category,
                'path': relative_path,
                'title': title,
                'fingerprint': fingerprint,
                'name': name,
                'slug': slug,
            }
            previous_slug = (previous or {}).get('slug')
            old_slugs = [o for o in (previous or {}).get('old_slugs', []) + ([previous_slug] if previous_slug else []) if o != slug]
            old_slugs = list(dict.fromkeys(old_slugs))
            if old_slugs:
                next_date_table[identity]['old_slugs'] = old_slugs
            rendered = markdown_to_html(text)
            if file.name == '专题 - 时延：一台1GHz计算机的时间账本.md':
                rendered = diagram_layout(rendered, ('fig10_dram_read_timing.svg', 'fig11_load_miss_path.svg'))
            (OUT/slug).parent.mkdir(parents=True, exist_ok=True)
            twopane_file = twopane_files.get(file)
            if twopane_file:
                # 两栏页笔记：文章地址上直接放两栏页本身，不再跳转到中文文件名的副本
                (OUT/slug).write_text(relocate_twopane(twopane_file.read_text(encoding='utf-8'), slug), encoding='utf-8')
            else:
                (OUT/slug).write_text(relocate(page(title, rendered, True, first_seen), slug), encoding='utf-8')
            for old in old_slugs:
                rel = os.path.relpath(slug, os.path.dirname(old) or '.').replace(os.sep, '/')
                target = html.escape(rel, quote=True)
                (OUT/old).parent.mkdir(parents=True, exist_ok=True)
                (OUT/old).write_text('<!doctype html><meta charset="utf-8">'
                    f'<meta http-equiv="refresh" content="0; url={target}"><link rel="canonical" href="{target}">'
                    f'<script>location.replace({json.dumps(rel)}+location.search+location.hash)</script>'
                    f'<p>本文已移至 <a href="{target}">{html.escape(title)}</a></p>', encoding='utf-8')
            section = section_for(category, file.relative_to(folder), title)
            if slug != 'misc/why-this-site.html':
                records_by_section.setdefault(section, []).append((len(records_by_section[section]) + 1, title, slug))
            plain = re.sub(r'!\[\[[^\]]+\]\]|!\[[^\]]*\]\([^)]+\)|```[\s\S]*?```|[#*_`>|]', ' ', text)
            search_entries.append({'title': title, 'url': slug, 'text': re.sub(r'\s+', ' ', plain).strip()})
    groups = [(name, records_by_section[name]) for name in (*COMPUTER_SECTIONS, '数学', '物理', '工科数学复习')]
    catalog=''.join(f'<section id="section-{name}" class="group"><h2>{name}<span>{len(records):02d} 篇</span></h2><div class="list">'+''.join(f'<a class="entry" href="{slug}"><span class="num">{n:02d}</span><span class="entry-title">{html.escape(title)}</span><span class="arrow">→</span></a>' for n,title,slug in records)+'</div></section>' for name,records in groups)
    topic_nav = '<nav class="topic-nav" aria-label="文章分类">' + ''.join(f'<a href="#section-{name}">{name}</a>' for name, _ in groups) + '</nav>'
    home='<header class="top"><div class="wrap nav"><a class="brand" href="index.html">知识合集</a><span class="tag">COMPUTER · MATHEMATICS</span></div></header><main class="wrap"><section class="hero"><div class="eyebrow">Personal notes, made public</div><h1>把想明白的问题，<br>完整地讲一遍。</h1><p>计算机与数学的学习笔记。这里保留概念的来处、推导的过程，以及那些最容易被忽略的区别。</p></section>'+topic_nav+'<section class="catalog"><p class="section-label">COLLECTION / 文章目录</p>'+catalog+'</section></main>'
    if not PUBLIC_EDITION:
        home = home.replace('</nav>', '<a href="#section-社科">社科</a></nav>', 1)
        home = home.replace('</section></main>', local_notes.CATALOG + '</section></main>')
        home = home.replace('计算机与数学的学习笔记。', '计算机、数学、物理与社科的学习笔记。')
        home = home.replace('COMPUTER · MATHEMATICS', 'COMPUTER · MATHEMATICS · PHYSICS · SOCIAL SCIENCES')
    home = home.replace(
        '<div class="eyebrow">Personal notes, made public</div><h1>把想明白的问题，<br>完整地讲一遍。</h1><p>计算机、数学、物理与社科的学习笔记。这里保留概念的来处、推导的过程，以及那些最容易被忽略的区别。</p>',
        '<div class="eyebrow">写在前面</div><h1>把想明白的问题，<br>完整地讲一遍。</h1>'
        '<p>这里收着我学习时写下的讲解，计算机、数学和社会科学都有。我写的时候尽量不跳步：一个概念要讲到它具体指什么，一件事要讲清谁做了什么、接着发生了什么。最初是为了自己复习方便，也希望对同样好奇的人有些用处。</p>'
        '<a class="preface-link" href="misc/why-this-site.html">为什么做这个网站 <span aria-hidden="true">→</span></a>',
        1,
    )
    home = home_tabs.tabify(home)
    if PUBLIC_EDITION:
        home = re.sub(r'<a class="preface-link"[^>]*>.*?</a>', '', home, count=1, flags=re.S)
        home = home.replace('涵盖计算机、数学、物理与社会科学', '目前公开计算机与数学的部分文章')
    if not PUBLIC_EDITION:
        local_notes.build(HERE, OUT, markdown_to_html, page)
    (OUT/'index.html').write_text(page('知识合集', home), encoding='utf-8')
    (OUT/'search-index.json').write_text(json.dumps(search_entries, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    DATE_TABLE.write_text(json.dumps({'schema': 1, 'next_number': next_number, 'files': next_date_table}, ensure_ascii=False, indent=2), encoding='utf-8')
    from tools.sync_learning_pages import sync
    sync()
    # Readers reload on a new version. Publish it only after every page and asset exists.
    version_pending = OUT / '.version.txt.tmp'
    version_pending.write_text(str(time.time_ns()), encoding='utf-8')
    version_pending.replace(OUT / 'version.txt')
    if PUBLIC_EDITION:
        publish_public_site()
    print(f'Built {sum(len(x[1]) for x in groups)} articles in {OUT}')

def snapshot() -> tuple[tuple[str, int, int], ...]:
    watched = [p for _, root in ROOTS for p in root.rglob('*') if p.is_file()]
    watched += [p for p in ATTACHMENTS.rglob('*') if p.is_file()]
    if not PUBLIC_EDITION:
        watched += [p for p in local_notes.sources(HERE) if p.is_file()]
    if (HERE / 'local-content.json').exists():
        watched.append(HERE / 'local-content.json')
    entries = []
    for p in watched:
        try:
            st = p.stat()
        except OSError:
            continue  # moved or deleted while scanning; the next scan sees the new state
        entries.append((str(p), st.st_mtime_ns, st.st_size))
    return tuple(sorted(entries))

def watch():
    main()
    state = snapshot()
    print('Watching the two note folders and attachments. Press Ctrl+C to stop.')
    while True:
        time.sleep(1)
        try:
            new_state = snapshot()
        except OSError as exc:
            print(f'Scan failed, retrying: {exc}', file=sys.stderr)
            continue
        if new_state != state:
            try:
                main()
                state = new_state
            except Exception as exc:
                print(f'Rebuild failed: {exc}', file=sys.stderr)

if __name__ == '__main__':
    watch() if '--watch' in sys.argv else main()
