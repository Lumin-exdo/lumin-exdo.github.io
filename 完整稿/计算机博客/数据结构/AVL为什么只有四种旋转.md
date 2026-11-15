# AVL 为什么只有四种旋转

插入前，树中每个结点的左右子树高度差最多为 1。插入一个新数后，只有新结点到根的路径可能变高，而且每层最多只增高 1。从下往上遇到的第一个失衡结点记作 **z**：它的较高孩子只能在左边或右边。这个孩子记作 **y**；让 y 增高的那一侧又只能在左边或右边。因此路径只可能是 **左左、左右、右左、右右**，即 $2\times2=4$ 种。

先看下方的 **“① 为什么只有四种”**，再点 **“② 左旋/右旋是什么”**：两幅树并排显示旋转前后，蓝线标出夹在中间的 T₂ 子树怎样改挂。**“③ 从空树完整建树”** 可以逐步点，也可以按“自动播放”。结点横坐标始终按数值从小到大排列。

<style>.avl-frame{display:block;width:100%;height:1450px;border:0;background:#f5efe6;border-radius:14px}.article-shell:has(.avl-frame){max-width:1280px}.article:has(.avl-frame){max-width:none}</style>
<iframe class="avl-frame" src="7.3-平衡二叉树-四种旋转.html" title="AVL 建树、四种情况证明与旋转演示" loading="eager"></iframe>

[单独打开全屏演示](7.3-平衡二叉树-四种旋转.html)。
