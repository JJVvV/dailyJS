const obj = {
  toString() {
    return 11
  },
  valueOf() {
    return 22
  },
}
const obj2 = {
  toString() {
    return 'obj2'
  },
  valueOf() {
    return obj
  },
}
// 因为是+操作符，默认当做Number类型，所以obj2先调用valueOf方法, 返回结果obj不为原始类型，则继续调用toString 方法,返回原始类型'obj2'
console.group("'' + obj2")
console.log('' + obj2)
console.groupEnd()

var a={
  toString:function(){
      console.log('调用了 a.toString');
      return {};
  },
  valueOf:function(){
      console.log('调用了 a.valueOf');
      return '111';
  }
}

// alert 方法会隐式的转换参数为String，所以先调用参数的toString 方法， toString没有返回原始类型，则继续调用valueOf方法，返回了原始类型'111'
// alert(a) 
// '111'

var obj3 = {
  valueOf: function() {
    console.log("valueOf");
    return {}; // 非基本类型
  },
  toString: function() {
    console.log("toString");
    return {}; // 非基本类型
  }
};

try{
  console.group('1 + obj3')
  var ret1 = 1 + obj3
  console.groupEnd()
}catch(e){
  console.log(e)
  console.groupEnd()
}

try{
  console.group("'1' + obj3")
  var ret2 = '1' + obj3
  console.groupEnd()
}catch(e){
  console.log(e)
  console.groupEnd()
}

try{
  console.group("`1${obj3}`")
  var ret3 = `1${obj3}`
  console.groupEnd()
  
}catch(e){
  console.log(e)
  console.groupEnd()
}

var obj4 = {
  valueOf: function() {
    console.log("valueOf");
    return 'asdf'
  },
  toString: function() {
    console.log("toString");
    return 11
  }
};

console.group("ret4 = 1 + obj4")
var ret4 = 1 + obj4
console.log('ret4: ', ret4)
console.groupEnd()