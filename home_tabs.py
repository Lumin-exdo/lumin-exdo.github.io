"""Home page: a library-style front door.

Three wings (计算机 / 理科 / 人文), a card per subject, and one reading panel below
whose left rail is the subject's second level (chapters, courses or series) and whose
main column lists articles, with a third level (years) where a series is long.
The per-subject <section class="group"> blocks stay in the HTML as the data source and
as the no-JavaScript fallback; 社科 rows come from local/catalog.json at run time.
"""
import html
import re

# wing → (English label, accent colour)
WINGS = {'计算机': ('Computer', '#1d5e78'), '理科': ('Mathematics & Physics', '#326a5b'), '人文': ('Humanities', '#9a5b2e')}

# subject → (wing, one-line description)
SUBJECTS = {
    '计组': ('计算机', '计算机组成原理：从运算部件到流水线与总线'),
    'OS': ('计算机', '操作系统：进程、内存、文件与设备'),
    '数据结构': ('计算机', '数据结构与算法的图解'),
    '计网': ('计算机', '计算机网络：从物理层到应用层'),
    'AI': ('计算机', '论文精读与实验记录'),
    '杂论': ('计算机', '零散的工具与思路复盘'),
    '数学': ('理科', '数学笔记与证明思路'),
    '物理': ('理科', '从具体运动走向物理理论的结构'),
    '工科数学复习': ('理科', '高数、线代、概率统计的复习笔记'),
    '社科': ('人文', '经济、制度与历史的案例式讲解'),
}

# Subjects whose titles carry a chapter number get chapters as the second level.
CHAPTERED = {'计组', 'OS', '计网'}
COURSES = ('高数上', '高数下', '线性代数', '概率论', '数理统计', '数学复盘系列')
SECTION_PREFIX = re.compile(r'^(\d+)(?:\.\d+)*(?:\s*[-–—~～]\s*\d+(?:\.\d+)*)?\s*·\s+')


def group_of(subject: str, title: str) -> str:
    if subject in CHAPTERED:
        m = SECTION_PREFIX.match(title) or re.match(r'^第\s*(\d+)\s*章', title)
        if m:
            return '导读' if m.group(1) == '0' else f'第 {m.group(1)} 章'
        return '专题与其他'
    if subject == '工科数学复习':
        for c in COURSES:
            if title.startswith(c):
                return c
        return '总表与专题'
    return ''


CSS = '''<style>
:root{--cs:#1d5e78;--sci:#326a5b;--hum:#9a5b2e;--tint:#efeee6}
.hero2{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(280px,1fr);gap:40px;align-items:center;padding:30px 0 26px}
.hero2 h1{font:600 clamp(30px,3.6vw,44px)/1.25 "Noto Serif SC",serif;letter-spacing:-.03em;margin:8px 0 12px}
.hero2 p{max-width:680px;font-size:16px;line-height:1.75;color:#52605a;margin:0}
.hero2 .preface-link{display:inline-flex;gap:10px;margin-top:12px;color:var(--blue);font:600 15px/1.5 "Noto Serif SC",serif;text-decoration:none;border-bottom:1px solid currentColor;padding-bottom:3px}
.hero2 .preface-link:hover{color:var(--sci)}
.stats{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid var(--line);border-radius:10px;background:var(--card);overflow:hidden}
.stat{padding:14px 16px 12px;border-right:1px solid var(--line)}
.stat:last-child{border-right:0}
.stat b{display:block;font:500 30px/1 "IBM Plex Mono",monospace;letter-spacing:-.04em;color:var(--ink)}
.stat span{display:block;margin-top:6px;font:12px "IBM Plex Mono",monospace;letter-spacing:.08em;color:var(--muted)}
.stat:nth-child(1) b{color:var(--cs)}.stat:nth-child(2) b{color:var(--sci)}.stat:nth-child(3) b{color:var(--hum)}
.finder{position:relative;margin:0 0 20px}
.finder input{width:100%;padding:11px 18px 11px 48px;border:1px solid var(--line);border-radius:10px;background:var(--card);color:var(--ink);font:17px "Noto Serif SC",serif}
.finder input:focus{outline:2px solid var(--blue);outline-offset:2px;border-color:transparent}
.finder::before{content:"";position:absolute;left:19px;top:50%;width:11px;height:11px;margin-top:-8px;border:2px solid var(--muted);border-radius:50%}
.finder::after{content:"";position:absolute;left:32px;top:50%;width:7px;height:2px;margin-top:6px;background:var(--muted);transform:rotate(45deg)}
.shelf{display:grid;grid-template-columns:1fr 1fr;column-gap:34px}.shelf .wing:first-child{grid-column:1/-1}.shelf .cards{grid-template-columns:repeat(auto-fill,minmax(168px,1fr))}.wing{margin:0 0 26px}
.wing-head{display:flex;align-items:baseline;gap:12px;margin:0 0 12px;padding-left:12px;border-left:4px solid var(--wc)}
.wing-head b{font:600 22px "Noto Serif SC",serif}
.wing-head i{font:12px "IBM Plex Mono",monospace;letter-spacing:.12em;color:var(--muted);font-style:normal;text-transform:uppercase}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
.card{position:relative;display:flex;flex-direction:column;gap:8px;padding:16px 18px 14px;border:1px solid var(--line);border-top:3px solid var(--wc);border-radius:8px;background:var(--card);color:var(--ink);text-decoration:none;transition:transform .15s,box-shadow .15s,border-color .15s}
.card:hover{transform:translateY(-2px);box-shadow:0 6px 18px -10px rgba(32,39,36,.35)}
.card .c-name{font:600 22px/1.25 "Noto Serif SC",serif}
.card .c-desc{font-size:14px;line-height:1.55;color:var(--muted);min-height:2.6em}
.card .c-bar{display:flex;gap:2px;height:6px;margin-top:2px}
.card .c-bar i{display:block;min-width:3px;border-radius:2px;background:var(--wc);opacity:.28}
.card .c-bar i:nth-child(odd){opacity:.55}
.card .c-count{font:12px "IBM Plex Mono",monospace;color:var(--wc)}
.card.is-empty{opacity:.5}
.card[aria-selected="true"]{background:var(--wc);border-color:var(--wc);color:#fff;transform:none;box-shadow:none}
.card[aria-selected="true"] .c-desc,.card[aria-selected="true"] .c-count{color:rgba(255,255,255,.82)}
.card[aria-selected="true"] .c-bar i{background:#fff}
.panel{margin:34px 0 90px;border:1px solid var(--line);border-radius:12px;background:var(--card);overflow:hidden;scroll-margin-top:14px}
.panel-head{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;padding:22px 28px 18px;border-bottom:1px solid var(--line);background:var(--tint);border-top:4px solid var(--wc)}
.panel-head h2{font:600 30px "Noto Serif SC",serif;margin:0}
.panel-head .p-desc{color:var(--muted);font-size:15px}
.panel-head .p-count{margin-left:auto;font:13px "IBM Plex Mono",monospace;color:var(--wc)}
.panel-body{display:grid;grid-template-columns:230px minmax(0,1fr);min-height:320px}
.rail{padding:16px 12px;border-right:1px solid var(--line);background:#fbfaf5}
.rail-inner{position:sticky;top:12px;display:flex;flex-direction:column;gap:2px;max-height:calc(100vh - 24px);overflow:auto}
.rail button{display:flex;justify-content:space-between;gap:10px;align-items:baseline;width:100%;padding:8px 12px;border:0;border-radius:6px;background:none;color:var(--ink);font:500 15px/1.4 "Noto Serif SC",serif;text-align:left;cursor:pointer}
.rail button em{font:12px "IBM Plex Mono",monospace;font-style:normal;color:var(--muted)}
.rail button:hover{background:var(--tint)}
.rail button[aria-current="true"]{background:var(--wc);color:#fff}
.rail button[aria-current="true"] em{color:rgba(255,255,255,.8)}
.main{padding:8px 28px 26px;min-width:0}
.blk{padding:18px 0 6px}
.blk-head{display:flex;align-items:baseline;gap:12px;margin:0 0 4px}
.blk-head h3{font:600 20px "Noto Serif SC",serif;margin:0}
.blk-head em{font:12px "IBM Plex Mono",monospace;font-style:normal;color:var(--wc)}
.blk-head button{margin-left:auto;border:0;background:none;color:var(--wc);font:13px "IBM Plex Mono",monospace;cursor:pointer;padding:2px 0}
.blk-head button:hover{text-decoration:underline}
.sub{margin:18px 0 0;padding-bottom:6px;border-bottom:1px solid var(--line);font:13px "IBM Plex Mono",monospace;letter-spacing:.08em;color:var(--muted)}
.main .list{border-top:0}
.main .entry{padding:13px 4px}
.main .entry:hover{padding-left:12px}
.main .entry-title{font-size:18px}
.main .entry .tagline{font:11px "IBM Plex Mono",monospace;color:var(--muted);border:1px solid var(--line);border-radius:999px;padding:0 8px}
.more{padding:10px 4px;color:var(--muted);font-size:14px}
.empty{padding:40px 4px;color:var(--muted)}
.js-home .catalog{display:none}
.hint{padding:46px 28px;color:var(--muted);text-align:center}
@media(max-width:900px){.shelf{grid-template-columns:1fr}.hero2{grid-template-columns:1fr;gap:18px;padding:22px 0 18px}.panel-body{grid-template-columns:1fr}.rail{border-right:0;border-bottom:1px solid var(--line)}.rail-inner{position:static;flex-direction:row;overflow-x:auto;max-height:none;gap:6px;padding-bottom:4px}.rail button{width:auto;white-space:nowrap}.main{padding:6px 18px 22px}.panel-head{padding:18px}}
@media(max-width:620px){.top .brand{white-space:nowrap}.hero2 p{font-size:17px}.stat b{font-size:28px}.cards{grid-template-columns:repeat(2,1fr);gap:8px}.card{padding:12px 13px}.card .c-name{font-size:18px}.card .c-desc{display:none}.main .entry-title{font-size:16px}}
</style>'''

SCRIPT = r'''<script>(()=>{
document.documentElement.classList.add('js-home');
const HKEY='dsh-home-state2';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;};
const subjects={};
$$('section.group').forEach(g=>{const id=g.id.replace('section-','');
 subjects[id]={id,items:$$('.entry',g).map(a=>({t:$('.entry-title',a).textContent,u:a.getAttribute('href'),g:a.dataset.g||'',s:''}))};});
const cards=$$('.card'), panel=$('#panel');
let cur='', curG='';
const groupsOf=S=>{const m=new Map();S.items.forEach(it=>{if(!m.has(it.g))m.set(it.g,[]);m.get(it.g).push(it);});return m;};
const stat=()=>{const n=Object.values(subjects).reduce((a,s)=>a+s.items.length,0);const e=$('#stat-total');if(e)e.textContent=n;};
const refreshCards=()=>cards.forEach(c=>{const S=subjects[c.dataset.id],n=S.items.length;
 $('.c-count',c).textContent=n?String(n).padStart(2,'0')+' 篇':(S.loading?'载入中':'暂无');c.classList.toggle('is-empty',!n&&!S.loading);
 const bar=$('.c-bar',c);bar.textContent='';const gs=groupsOf(S);
 if(gs.size>1)gs.forEach(v=>{const i=document.createElement('i');i.style.flex=String(v.length);bar.append(i);});});
const entry=(it,n)=>{const a=el('a','entry');a.href=it.u;a.append(el('span','num',String(n).padStart(2,'0')),el('span','entry-title',it.t),el('span','arrow','→'));return a;};
const list=(items,from=1)=>{const d=el('div','list');items.forEach((it,i)=>d.append(entry(it,from+i)));return d;};
const PREVIEW=4;
function render(){
 const S=subjects[cur];if(!S){panel.hidden=true;return;}
 const wc=getComputedStyle($('.card[data-id="'+cur+'"]')).getPropertyValue('--wc');
 panel.hidden=false;panel.style.setProperty('--wc',wc);panel.textContent='';
 const head=el('div','panel-head');head.append(el('h2','',cur),el('span','p-desc',$('.card[data-id="'+cur+'"] .c-desc').textContent),el('span','p-count',S.items.length+' 篇'));
 const body=el('div','panel-body');const gs=groupsOf(S);const rank=k=>{const m=/^第 (\d+) 章$/.exec(k);return k==='导读'?-1:m?+m[1]:k==='专题与其他'?1e3:0;};const named=[...gs.keys()].filter(k=>k).sort((x,y)=>rank(x)&&rank(y)?rank(x)-rank(y):0);
 const main=el('div','main');
 if(named.length){
  if(curG&&!gs.has(curG))curG='';
  const rail=el('nav','rail'),ri=el('div','rail-inner');rail.setAttribute('aria-label',cur+'的分组');
  const mk=(label,key,n)=>{const b=el('button','');b.type='button';b.append(el('span','',label),el('em','',String(n)));if(key===curG)b.setAttribute('aria-current','true');b.onclick=()=>go(cur,key);ri.append(b);};
  mk('全部','',S.items.length);named.forEach(k=>mk(k,k,gs.get(k).length));
  rail.append(ri);body.append(rail);
  if(!curG){
   named.forEach(k=>{const v=gs.get(k),blk=el('section','blk'),h=el('div','blk-head');
    h.append(el('h3','',k),el('em','',v.length+' 篇'));
    if(v.length>PREVIEW){const b=el('button','','查看全部 →');b.type='button';b.onclick=()=>go(cur,k);h.append(b);}
    blk.append(h,list(v.slice(0,PREVIEW)));
    if(v.length>PREVIEW)blk.append(el('div','more','还有 '+(v.length-PREVIEW)+' 篇'));main.append(blk);});
   if(gs.has(''))main.append(list(gs.get(''),1));
  }else{
   const v=gs.get(curG),subs=[...new Set(v.map(x=>x.s))].filter(Boolean);
   const h=el('div','blk-head');h.style.paddingTop='18px';h.append(el('h3','',curG),el('em','',v.length+' 篇'));main.append(h);
   if(subs.length>=3){let n=0;subs.forEach(s=>{const part=v.filter(x=>x.s===s);main.append(el('div','sub',s+' · '+part.length+' 篇'),list(part,n+1));n+=part.length;});
    const rest=v.filter(x=>!x.s);if(rest.length)main.append(list(rest,n+1));}
   else main.append(list(v));
  }
 }else{body.style.gridTemplateColumns='1fr';main.append(S.items.length?list(S.items):el('div','empty',S.loading?'正在载入……':'这个分类还没有文章。'));}
 body.append(main);panel.append(head,body);
}
function mark(){cards.forEach(c=>c.setAttribute('aria-selected',String(c.dataset.id===cur)));}
function save(){try{sessionStorage.setItem(HKEY,JSON.stringify({s:cur,g:curG,y:Math.round(scrollY)}));}catch(e){}}
function go(id,g,scroll){cur=id;curG=g||'';mark();render();
 history.replaceState(null,'','#section-'+id+(curG?'/'+encodeURIComponent(curG):''));save();
 if(scroll!==false&&matchMedia('(max-width:900px)').matches===false&&panel.getBoundingClientRect().top>innerHeight*.8)panel.scrollIntoView({behavior:'smooth',block:'start'});}
cards.forEach(c=>c.addEventListener('click',e=>{e.preventDefault();go(c.dataset.id,'',true);if(matchMedia('(max-width:900px)').matches)panel.scrollIntoView({behavior:'smooth',block:'start'});}));
addEventListener('scroll',save,{passive:true});addEventListener('pagehide',save);
if('scrollRestoration' in history)history.scrollRestoration='manual';
// search across everything loaded
const q=$('#finder-input'),res=$('#results');
q.addEventListener('input',()=>{const k=q.value.trim().toLowerCase();res.textContent='';
 if(!k){res.hidden=true;return;}
 const hits=[];Object.values(subjects).forEach(S=>S.items.forEach(it=>{if(it.t.toLowerCase().includes(k))hits.push([S.id,it]);}));
 res.hidden=false;const box=el('div','panel');box.style.margin='0 0 30px';const h=el('div','panel-head');h.append(el('h2','','搜索结果'),el('span','p-count',hits.length+' 篇'));box.append(h);
 const m=el('div','main');
 if(!hits.length)m.append(el('div','empty','标题里没有“'+q.value.trim()+'”。'));
 else{const d=el('div','list');hits.slice(0,60).forEach(([id,it],i)=>{const a=entry(it,i+1);const t=el('span','tagline',id);a.insertBefore(t,a.lastChild);a.style.gridTemplateColumns='42px 1fr auto auto';d.append(a);});m.append(d);}
 box.append(m);res.append(box);});
// 社科: read the local catalog, series become the second level
const soc=subjects['社科'];
if(soc){soc.loading=true;refreshCards();
 fetch('local/catalog.json',{cache:'no-store'}).then(r=>r.ok?r.json():[]).catch(()=>[]).then(rows=>{
  const order=[];rows.forEach(r=>{if(!order.includes(r.series))order.push(r.series);});
  const big=order.filter(s=>s!=='单篇'),tail=order.includes('单篇')?['单篇']:[];
  soc.items=[];[...big,...tail].forEach(s=>rows.filter(r=>r.series===s).forEach(r=>soc.items.push({t:r.title,u:r.url,g:s,s:r.sub||''})));
  soc.loading=false;stat();refreshCards();if(cur==='社科')render();});}
stat();refreshCards();
addEventListener('hashchange',()=>{const h=decodeURIComponent(location.hash.slice(1)).replace(/^section-/,'');const [id,g]=h.split('/');if(subjects[id])go(id,g||'',false);});
const st=(()=>{try{return JSON.parse(sessionStorage.getItem(HKEY)||'null')}catch(e){return null}})();
const h0=decodeURIComponent(location.hash.slice(1)).replace(/^section-/,'').split('/');
const start=subjects[h0[0]]?h0[0]:(st&&subjects[st.s]?st.s:'');
if(start){go(start,h0[0]===start?(h0[1]||''):(st&&st.g)||'',false);if(st&&!location.hash)requestAnimationFrame(()=>scrollTo(0,st.y||0));}
else panel.hidden=true;
})();</script>'''


def tabify(home: str) -> str:
    """Rebuild the home front matter and card shelf; keep the group sections as data."""
    groups = re.findall(r'<section id="section-([^"]+)" class="group"[^>]*><h2>[^<]*<span>([^<]*)</span>', home)
    names = [n for n, _ in groups]

    home = re.sub(r'(<section id="section-([^"]+)" class="group">)(.*?)(?=</section>)',
                  lambda m: m.group(1) + _tag(m.group(2), m.group(3)), home, flags=re.S)

    wings = {}
    for name in names:
        wing = SUBJECTS.get(name, ('计算机', ''))[0]
        wings.setdefault(wing, []).append(name)
    shelf = ''
    for wing in [w for w in WINGS if w in wings]:
        label, colour = WINGS[wing]
        cards = ''.join(
            f'<a class="card" role="tab" href="#section-{n}" data-id="{n}" aria-selected="false">'
            f'<span class="c-name">{n}</span><span class="c-desc">{SUBJECTS.get(n, ("", ""))[1]}</span>'
            f'<span class="c-bar"></span><span class="c-count"></span></a>'
            for n in wings[wing])
        shelf += (f'<div class="wing" style="--wc:{colour}"><div class="wing-head"><b>{wing}</b><i>{label}</i></div>'
                  f'<div class="cards" role="tablist" aria-label="{wing}">{cards}</div></div>')
    hero = ('<section class="hero2"><div><div class="eyebrow">写在前面</div><h1>把想明白的问题，完整地讲一遍。</h1>'
            '<p>这里收着我学习时写下的讲解，涵盖计算机、数学、物理与社会科学。我写的时候尽量不跳步：一个概念要讲到它具体指什么，'
            '一件事要讲清谁做了什么、接着发生了什么。最初是为了自己复习方便，也希望对同样好奇的人有些用处。</p>'
            '<a class="preface-link" href="misc/why-this-site.html">为什么做这个网站 <span aria-hidden="true">→</span></a></div>'
            '<div class="stats"><div class="stat"><b id="stat-total">·</b><span>篇文章</span></div>'
            f'<div class="stat"><b>{len(names)}</b><span>个学科</span></div>'
            f'<div class="stat"><b>{len(wings)}</b><span>个领域</span></div></div></section>')
    front = (f'{CSS}{hero}<div class="finder"><input id="finder-input" type="search" placeholder="按标题查找文章" aria-label="按标题查找文章" autocomplete="off"></div>'
             f'<div id="results" hidden></div><div class="shelf">{shelf}</div><div class="panel" id="panel" hidden></div>')
    home = re.sub(r'<section class="hero">.*?</section>', '', home, count=1, flags=re.S)
    home = re.sub(r'<nav class="topic-nav".*?</nav>', lambda _: front, home, count=1, flags=re.S)
    home = home.replace('<section class="catalog"><p class="section-label">COLLECTION / 文章目录</p>', '<section class="catalog">', 1)
    return home.replace('</section></main>', '</section>' + SCRIPT + '</main>', 1)


def _tag(name: str, body: str) -> str:
    if name not in CHAPTERED and name != '工科数学复习':
        return body

    def one(m):
        g = group_of(name, html.unescape(m.group(3)))
        return (f'<a class="entry" data-g="{html.escape(g, quote=True)}" href="{m.group(1)}">'
                f'<span class="num">{m.group(2)}</span><span class="entry-title">{m.group(3)}</span>')
    return re.sub(r'<a class="entry" href="([^"]*)"><span class="num">([^<]*)</span><span class="entry-title">([^<]*)</span>', one, body)
