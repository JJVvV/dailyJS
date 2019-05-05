/**
 * 遍历 dom
 */

function walkTheDOMRecursive(node, func, depth, returnedFromParent) {
  const root = node || window.document
  const ret = func(root, depth, returnedFromParent)
  if (root.attributes) {
    for (let i = 0; i < root.attributes.length; i++) {
      walkTheDOMRecursive(root.attributes[i], func, depth, ret)
    }
  }
  if (root.nodeType === 2) {
    console.log('is attrubte')
  }
  if (root.nodeType !== 2) {
    node = root.firstChild
    while (node) {
      walkTheDOMRecursive(node, func, depth + 1, returnedFromParent)
      node = node.nextSibling
    }
  }
}

const root = document.querySelector('.root')
walkTheDOMRecursive(
  root,
  (node, depth) => {
    console.log(node.nodeName, depth)
  },
  0
)
