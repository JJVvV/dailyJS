/**
 * Created by AlexLiu on 11/14/15.
 */

let isFunc = isType('Function')
let isObj = isType('Object')
let isBool = isType('Boolean')
let isArr = isType('Array')

function isType(type) {
  return function (obj) {
    return Object.prototype.toString.call(obj) === `[object ${  type  }]`
  }
}

function toArray() {
  return arguments.length === 1
    ? Array.prototype.slice.apply(arguments[0])
    : toArray(arguments)
}

function shallowExtend(obj1, obj2, callback) {
  if (obj1) {
    if (obj2) {
      for (var name in obj2) {
        if (isFunc(callback) && !callback(obj2[name], name)) continue
        if (obj2.hasOwnProperty(name)) {
          obj1[name] = obj2[name]
        }
      }
    }
    return obj1
  } 
    return obj2
  
}

function isWindow(obj) {
  return obj != null && obj.window === obj
}

function isPlainObject(obj) {
  if (!isObj(obj) || obj.nodeType || isWindow(obj)) {
    return false
  }

  if (
    obj.constructor
    && !obj.constructor.prototype.hasOwnProperty('isPrototypeOf')
  ) {
    return false
  }

  return true
}

function extend() {
  var args = toArray(arguments),
    argLength,
    filter

  if (isFunc(args[args.length - 1]) && args[0] === true) {
    filter = args[args.length - 1]
    args = args.slice(1, args.length - 2)
  }

  argLength = args.length

  if (argLength == 1) {
    return args[0]
  } if (argLength == 2) {
    return shallowExtend(args[0], args[1], filter)
  } else if (argLength > 2) {
    return shallowExtend(args[0], extend.apply(null, args.slice(1)), filter)
  }
}

function extend2() {
  let args = arguments;
    var i = 1;
    var deep = false;
    var target = args[0];
    var length = args.length;
    var p;
    var clone;
    var options;
    var src;
    var copyIsArray;
    var copy

  if (isBool(args[0])) {
    deep = args[0]
    target = args[1]
    i++
  }

  if (i === length) {
    return args[0]
  }
  if (typeof target !== 'object' && !isFunc(target)) {
    target = {}
  }
  for (; i < length; i++) {
    if ((options = args[i]) != null) {
      for (p in options) {
        src = target[p]
        copy = options[p]
        if (src === copy) {
          continue
        }
        if (
          deep
          && copy
          && (isPlainObject(copy) || (copyIsArray = isArr(copy)))
        ) {
          if (copyIsArray) {
            copyIsArray = false
            clone = src && isArr(src) ? src : []
          } else {
            clone = src && isPlainObject(src) ? src : {}
          }
          target[p] = extend2(deep, clone, copy)
        } else {
          target[p] = copy
        }
      }
    }
  }

  return target
}
