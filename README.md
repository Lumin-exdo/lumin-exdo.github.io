# 知识合集

这里收录我学习过程中整理的计算机与数学笔记。写作时尽量从具体问题出发，讲清概念的含义、推导的过程，以及容易混淆的地方；部分文章配有可以操作的图解和演示。

**进入网站：[lumin-exdo.github.io](https://lumin-exdo.github.io/)**

建议通过网站阅读，以获得完整的排版、公式和交互演示。

## 目前公开的内容

- **计算机组成原理**：[I/O 接口与方式](https://lumin-exdo.github.io/coa/io-interfaces-and-methods.html)
- **计算机组成原理**：[GPU 入门：从一次 ReLU 到 FlashAttention](https://lumin-exdo.github.io/coa/gpu-intro-relu-flashattention.html)
- **人工智能**：[GPU 入门：从一次 ReLU 到 FlashAttention](https://lumin-exdo.github.io/ai/gpu-intro-relu-flashattention.html)
- **计算机网络**：[通信基础：基本概念与信道的极限容量](https://lumin-exdo.github.io/net/channel-capacity.html)
- **数学**：[凯莱—哈密顿定理](https://lumin-exdo.github.io/math/cayley-hamilton.html)

内容会随学习和核对继续修订，也会逐步加入新的文章。欢迎通过本仓库的 Issue 或 Pull Request 指出错误、补充资料。

## 本地构建

本仓库包含公开文章的源稿、配图、页面模板和构建器，可以独立构建，无需访问其他仓库。

安装 Python 3.12 后，在仓库目录运行：

```sh
python -m pip install -r requirements.txt --target vendor
python build.py
```

文章源稿位于 `完整稿/`，公开文章清单见 `public-pages.json`。构建结果生成在 `site/`，同时整体输出到 `docs/`，GitHub Pages 从 `docs/` 发布。
