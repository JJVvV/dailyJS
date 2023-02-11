function order(root) {
  const res = []
  const queue = [root]
  if (!root) {
    return res
  }
  while (queue.length) {
    const { length } = queue
    const curLevel = []
    for (let i = 0; i < length; i++) {
      const node = queue.shift()
      curLevel.push(node.val)
      if (node.left) {
        queue.push(node.left)
      }
      if (node.right) {
        queue.push(node.right)
      }
    }
    res.push(curLevel)
  }
}

function order2(root) {
  const res = []
  function dfs(node, depth) {
    if (node == null) {
      return
    }
    if (depth === res.length) {
      res.push(node.val)
    }

    dfs(node.right, depth + 1)
    dfs(node.left, depth + 1)
  }
  dfs(root, 0)
  return res
}

class TreeNode {
  constructor(val, left, right) {
    this.val = val
    this.left = left
    this.right = right
  }
}

const node1 = new TreeNode(1)
const node2 = new TreeNode(2)
const node3 = new TreeNode(3)
const node4 = new TreeNode(4)
const node5 = new TreeNode(5)
node1.left = node2
node1.right = node3
node2.right = node5
node3.right = node4

console.log(order2(node1))
