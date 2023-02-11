function isEqual(n1, n2) {
  return n1 === n2
}

function ListNode(val) {
  this.val = val
  this.next = null
}

function deleteNode(head, node) {
  const root = new ListNode(-1, null)
  root.next = head
  let cur = root
  while (cur) {
    if (cur.next && isEqual(cur.next, node)) {
      const { next } = cur.next
      cur.next = next
      break
    }
    cur = cur.next
  }
}

const node4 = new ListNode(4)
const node5 = new ListNode(5)
const node1 = new ListNode(1)
const node9 = new ListNode(9)
node4.next = node5
node5.next = node1
node1.next = node9

deleteNode(node4, node5)
console.log(node4)
