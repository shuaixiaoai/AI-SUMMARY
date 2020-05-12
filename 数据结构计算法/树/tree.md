## 树： 非线性数据结构
+ 仅有唯一的根节点
+ 除根节点外， 每个节点都有并只有唯一一个节点
+ 节点间不能形成闭环

#### 树的相关概念
拥有相同父节点的节点， 互称为兄弟节点   
节点深度： 从根节点到该节点所经历的边的个数   
节点的高度： 节点到叶子节点的最长路劲   
树的高度： 根节点的高度

高度计算你： height = -1 || 1 + max(height(p.left), height(p.right))

+ 二叉树： 最多仅有两个子节点
+ 平衡二叉树： 二叉树中每个节点的左右子树的高度相差不能大于1
+ 满二叉树： 除子叶节点外每一个节点都有左右子叶且叶子节点都处在最底层的二叉树
+ 完全二叉树： 深度为n， 除第n层外， 其它各层（1~h-1）的节点树都达到最大个数， 第h层所有的节点都连续集中在最左边

```js
/**
* 1、当前节点的val
* 2、左子节点left
* 3、右子节点right
*/ 
function Node(val) {
  this.val = val
  this.left = null
  this.right = null
}

// 一棵二叉树可以由根节点通过左右指针连接起来形成一个树
function BinaryTree () {
  let Node = function (val) {
    this.val = val
    this.left = null
    this.right = null
  }
  let root = null
}

```

```js
/**
* 二叉树的遍历： 
* 前序遍历： 对于二叉树中的任意一个节点，先打印该节点，然后是它的左子树，最后右子树
* 中序遍历： 对于二叉树中的任意一个节点，先打印它的左子树，然后是该节点，最后右子树
* 后序遍历： 对于二叉树中的任意一个节点，先打印它的左子树，然后是右子树，最后该节点 
*/

// 递归实现
var preorderTraverseNode = (root) => {
  let result = []
  var preOrderTraverseNode = (node) => {
    if (node) {
      // 先根节点
      result.push(node.val)
      // 然后left
      preOrderTraverseNode(node.left)
      // 最后right
      preOrderTraverseNode(node.right)
    }
    preOrderTraverseNode(root)
    return result
  }
}

// 迭代实现
// 1、利用栈来记录遍历的过程，实际上，递归就使用了调用栈，所以这里我们可以使用栈来模拟递归的过程
// 2、首先根入栈
// 3、将根节点出栈，将根节点值放入结果数组中
// 4、然后遍历左子树、右子树，因为栈是先入后出，所以，我们先右子树入栈，然后左子树入栈
// 5、继续出栈（左子树被出栈）…….

// 6、依次循环出栈遍历入栈，直到栈为空，遍历完成
const preOrderTraversal = (root) => {
  const list = []
  const stack = []

  // 当根节点不为空的时候， 将根节点入栈
  if (root) stack.push(root)
  whilee (stack.length > 0) {
    const curNode = stack.pop()
    // 第一步的时候， 先访问的是根节点
    list.push(curNode.val)

    // 先打印left， 后打印right
    // 所以先加入栈的是右子树， 后左子树
    if (curNode.right !== null) {
      stack.push(curNode.right)
    }
    if (curNode.left !== null) {
      stack.push(curNode.left)
    }
  }
  return list
}

```