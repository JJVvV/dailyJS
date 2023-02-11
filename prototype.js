function prototype(child, parent) {
  const proto = Object.create(parent.prototype)
  proto.constructor = child
  child.prototype = proto
}

function newOperator(ctor) {
  if (typeof ctor !== 'function') {
    throw new Error('ctor must be a function')
  }
  const newObj = Object.create(ctor.prototype)
  const args = Array.prototype.slice.call(arguments, 1)
  const ret = ctor.apply(newObj, args)
  if ((typeof ret === 'object' && ret !== null) || typeof ret === 'function') {
    return ret
  }
  return newObj
}


function isInstanceof(ins, cons) {
  let insPro
  do {
    insPro = ins.__proto__
    if (insPro == null) {
      return false
    }
    if (insPro === cons.prototype) {
      return true
    }
  } while (insPro)
  return false
}
