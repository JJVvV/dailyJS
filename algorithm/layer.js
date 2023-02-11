function layerSum(root) {
  const ret = []
  const queue = [root]
  if (!root) {
    return ret
  }
  while (queue.length) {
    const len = queue.length
    let curSum = 0
    for (let i = 0; i < len; i++) {
      const node = queue.shift()
      curSum += node.value
      if (node.children) {
        queue.push(...node.children)
      }
    }

    ret.push(curSum)
  }
  return ret
}

const res = layerSum({
  value: 2,
  children: [
    { value: 6, children: [{ value: 1 }] },
    { value: 3, children: [{ value: 2 }, { value: 3 }, { value: 4 }] },
    { value: 5, children: [{ value: 7 }, { value: 8 }] },
  ],
})

console.log(res)
