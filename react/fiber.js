// const a1 = {
//   name: 'a1', child: null, sibling: null, parent: null,
// }
// const b1 = {
//   name: 'b1', child: null, sibling: null, parent: null,
// }
// const b2 = {
//   name: 'b2', child: null, sibling: null, parent: null,
// }
// const b3 = {
//   name: 'b3', child: null, sibling: null, parent: null,
// }
// const c1 = {
//   name: 'c1', child: null, sibling: null, parent: null,
// }
// const c2 = {
//   name: 'c2', child: null, sibling: null, parent: null,
// }
// const d1 = {
//   name: 'd1', child: null, sibling: null, parent: null,
// }
// const d2 = {
//   name: 'd2', child: null, sibling: null, parent: null,
// }

// a1.child = b1
// b2.child = c1
// b3.child = c2
// c1.child = d1

// b1.sibling = b2
// b2.sibling = b3
// d1.sibling = d2

// b1.parent = a1
// b2.parent = a1
// b3.parent = a1
// c1.parent = b2
// c2.parent = b3
// d1.parent = c1
// d2.parent = c1
// let node = a1

// function shouldStop(deadline) {
//   if (node && (deadline.timeRemaining() > 1 || deadline.didTimeout)) {
//     return false
//   }
//   return true
// }

// // eslint-disable-next-line no-shadow
// function traverseOneNode(node) {
//   console.log(node.name)
//   if (node.child) {
//     return node.child
//   }
//   if (node.sibling) {
//     return node.sibling
//   }
//   return node.parent
// }

// function traverse(deadline) {
//   while (node && !shouldStop(deadline)) {
//     const nextNode = traverseOneNode(node)
//     node = nextNode
//   }
//   if (node) {
//     requestIdleCallback(traverse)
//   }
// }


// requestIdleCallback(traverse)

function link(parent, elements) {
  if (!elements) {
    elements = []
  }
  parent.child = elements.reduceRight((previous, current) => {
    const node = new Node(current)
    node.return = parent
    node.sibling = previous
    return node
  }, null)
  return parent.child
}

function doWork(node) {
  console.log(node)
  const children = node.instance.render()
  return link(node, children)
}

function walk(o) {
  const root = o
  let current = o
  while (true) {
    const child = doWork(current)
    if (child) {
      current = child
      continue
    }
    if (current === root) {
      return
    }
    while (!current.sibling) {
      if (!current.return || current.return === root) {
        return
      }
      current = current.return
    }
    current = current.sibling
  }
}
