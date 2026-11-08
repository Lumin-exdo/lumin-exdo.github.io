# 公开网站工程

本目录是独立的公开工程，对应 GitHub 仓库 Lumin-exdo/lumin-exdo.github.io（分支 master，Pages 从仓库根目录发布）。

- 只收录用户明确许可的稿件，清单见 `public-pages.json`；`完整稿/` 里只放这些稿件及其引用的页面、图片和脚本。
- 构建器 `build.py`、`home_tabs.py`、`side_gallery.py`、`tools/sync_learning_pages.py` 与私有工程相同；以 `public-edition.json` 区分公开版。
- 构建命令（仅限 Windows Python）：`python build.py`。它读取本工程的 `完整稿/`，生成 `site/` 并更新仓库根目录。不得访问或修改私有工程。
- 新增一篇：在私有工程运行 `python3 tools/public_closure.py --copy "<完整稿下的相对路径>"`，它复制稿件和全部引用文件，并登记到 `date-table.json`、`public-pages.json`；然后构建、提交。不需公开的内容（`tmp/`、`maintenance/`、`local-*.json`、`local_notes.py`、其余 `tools/`、`site/`、备份、日志、其他稿件）一律不复制。

私有版改了界面或构建器后：运行私有工程的 `python3 tools/sync_public_code.py`，只同步 `build.py`、`home_tabs.py`、`side_gallery.py`、`requirements.txt`、`tools/sync_learning_pages.py` 五个共用文件，再在公开工程构建、提交。公开版差异只能靠共用代码里的 `public-edition.json` 开关实现，不要手改公开版副本。
