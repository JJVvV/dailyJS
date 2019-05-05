const tree = {
  value: 0,
  children: [
    {
      value: 11,
      children: [
        {
          value: 21,
          children: [
            {
              value: 31,
              children: [],
            },
            {
              value: 32,
              children: [],
            },
            {
              value: 33,
              children: [],
            },
          ],
        },
        {
          value: 22,
          children: [],
        },
      ],
    },
    {
      value: 12,
      children: [
        {
          value: 23,
          children: [],
        },
        {
          value: 24,
          children: [],
        },
      ],
    },
    {
      value: 13,
      children: [],
    },
  ],
}
function DFSTree(node, depth, index, action) {
  if (!node) {
    return
  }
  action(node, depth, index)
  if (!node.children || !node.children.length) {
    return
  }
  node.children.forEach((item, i) => {
    DFSTree(item, depth + 1, i, action)
  })
}
console.log('***DFS***')
DFSTree(tree, 0, 0, (node, depth, i) => {
  console.log(node.value, depth, i)
})

function BFSTree(root, action) {
  if (!root) {
    return
  }
  const queue = [
    {
      item: root,
      depth: 0,
      index: 0,
    },
  ]
  while (queue.length) {
    const node = queue.shift()
    action(node.item, node.depth, node.index)
    if (!node.item.children || !node.item.children.length) {
      continue
    }
    node.item.children.forEach((item, index) => {
      queue.push({
        item,
        depth: node.depth + 1,
        index,
      })
    })
  }
}
console.log('***BFS***')
BFSTree(tree, (node, depth, index) => {
  console.log(node.value, depth, index)
})
