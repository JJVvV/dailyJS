function extend22<T, U>(first: T, second: U): T & U {
  const result = <T & U>{}
  for (let id in first) {
    ;(<T>result)[id] = first[id]
  }
  for (let id in second) {
    if (!result.hasOwnProperty(id)) {
      ;(<U>result)[id] = second[id]
    }
  }

  return result
}

let sampleVariable: { bar: number }
function foo(sampleVariable: { bar: number }) {}

interface Foo2 {
  bar: number
  bas: string
}

const foo2: Foo2 = {
  bar: 1,
  bas: '',
}

function doSome(x: number | string) {
  if (typeof x === 'string') {
    // 在这个块中，TypeScript 知道 `x` 的类型必须是 `string`
    console.log(x.subtr(1)) // Error: 'subtr' 不存在
    console.log(x.substr(1)) // ok
  } else {
    x.toFixed(1)
  }
}

type AA = {
  aa: string
  bb: string
}

type BB = {
  aa: number
  bb: string
}

function isAA(arg: AA | BB): arg is AA {
  return typeof (arg as AA).aa === 'string'
}

function doStuff2(arg: AA | BB) {
  if (isAA(arg)) {
    console.log(arg.aa)
  } else {
    console.log(arg.aa)
  }
}

doStuff2({ aa: 1, bb: '' })

type TFoo = {
  kind: 'foo' // 字面量类型
  foo: number
}

type TBar = {
  kind: 'bar' // 字面量类型
  bar: number
}

function doStuff(arg: TFoo | TBar) {
  if (arg.kind === 'foo') {
    console.log(arg.foo) // ok
    console.log(arg.bar) // Error
  } else {
    // 一定是 Bar
    console.log(arg.foo) // Error
    console.log(arg.bar) // ok
  }
}
