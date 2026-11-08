"""Sync standalone learning pages and their relative vector resources after build.py."""
from pathlib import Path
import shutil

ROOT=Path(__file__).resolve().parents[1]
BLOG=ROOT/'完整稿'/'计算机博客'
OUT=ROOT/'site'
PALETTE_TAG='../images/course-figure-palette.js'
SINGLE_COPY_FIGURES={
    '真实软件里的进程与线程-交互演示.html',
    '调度程序内部-分派与公平-交互演示.html',
    '虚拟机-同一次写盘-交互演示.html',
    '指令流水线-数据通路加细-交互演示.html',
}

def copy_new(src,target):
    """只拷构建时还没有的文件：网站里已有同名文件（文章、首页、跳转页）时跳过并提示，绝不覆盖。
    内容完全相同的不算冲突（例如构建时已拷进 assets 的同一个演示页）。"""
    if target.exists() and not (target.stat().st_size==src.stat().st_size and target.read_bytes()==src.read_bytes()):
        print(f'跳过（网站里已有同名文件，不覆盖）：{target.relative_to(OUT)} ← {src.name}')
        return 0
    target.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(src,target);return 1

def copy_twopane_with_root_figure(src,target):
    """Subdirectory pages refer to their figures at the site root."""
    content=src.read_text(encoding='utf-8')
    for name in SINGLE_COPY_FIGURES:
        content=content.replace('"'+name+'"','"../'+name+'"')
        content=content.replace('"'+name+'#','"../'+name+'#')
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(content,encoding='utf-8')
    return 1

def copy_standalone_html(src,target):
    """A root-level copy needs a root-relative link to the shared palette."""
    content=src.read_text(encoding='utf-8')
    if PALETTE_TAG not in content:
        return copy_new(src,target)
    rendered=content.replace(PALETTE_TAG,'images/course-figure-palette.js')
    if target.exists() and target.read_text(encoding='utf-8')!=rendered:
        print(f'跳过（网站里已有同名文件，不覆盖）：{target.relative_to(OUT)} ← {src.name}')
        return 0
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(rendered,encoding='utf-8')
    return 1

def sync():
    n=0
    for folder in ['OS','计组','计网','数据结构','AI']:
        if not (BLOG/folder).is_dir():
            continue
        for p in (BLOG/folder).glob('*'):
            if p.suffix.lower() in {'.js', '.css'}:
                for target in (OUT/p.name, OUT/folder/p.name, OUT/'assets'/p.name):
                    copy_new(p,target)
        for p in (BLOG/folder).glob('*.html'):
            n+=copy_standalone_html(p,OUT/p.name)
            if p.name in SINGLE_COPY_FIGURES:
                continue
            has_root_figure=any('"'+name+'"' in p.read_text(encoding='utf-8') for name in SINGLE_COPY_FIGURES)
            for target in [OUT/'assets'/p.name,OUT/folder/p.name]:
                if has_root_figure:
                    n+=copy_twopane_with_root_figure(p,target)
                else:
                    n+=copy_new(p,target)
        for p in (BLOG/folder).iterdir():
            if p.suffix.lower() in ('.txt', '.c'):
                for target in (OUT/p.name, OUT/folder/p.name):
                    n+=copy_new(p,target)
        for p in (BLOG/folder).iterdir():
            # 两栏页、演示页同目录引用的插图（如 进程线程-另解-*.svg），根目录和子目录各放一份
            if p.suffix.lower() not in ['.svg','.png','.jpg','.jpeg','.webp']:continue
            for target in [OUT/p.name,OUT/folder/p.name]:
                copy_new(p,target)
    for p in (BLOG/'images').iterdir():
        if p.suffix.lower() not in ['.svg','.png','.jpg','.jpeg','.webp']:continue
        target=OUT/'images'/p.name;target.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(p,target)
    palette=BLOG/'images'/'course-figure-palette.js'
    if palette.is_file():
        target=OUT/'images'/palette.name
        target.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(palette,target)
    for p in (BLOG/'计组').iterdir():
        if p.suffix.lower() not in ['.svg','.png']:continue
        target=OUT/'计组'/p.name;target.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(p,target)
    for os_twopane in (OUT/'os').glob('*.html'):
        content=os_twopane.read_text(encoding='utf-8')
        fixed=content
        for name in SINGLE_COPY_FIGURES:
            fixed=fixed.replace('"'+name+'"','"../'+name+'"')
            fixed=fixed.replace('"'+name+'#','"../'+name+'#')
        if fixed!=content:
            os_twopane.write_text(fixed,encoding='utf-8')
    print(f'Synced {n} standalone learning pages and vector resources.')

if __name__=='__main__':sync()
