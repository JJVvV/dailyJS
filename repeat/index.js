function createRepeat(fn, repeat, interval) {
  let curIndex = 0
  function handle(...args) {
    if (curIndex >= repeat) {
      return
    }
    curIndex++
    setTimeout(() => {
      fn(...args)
      handle(...args)
    }, interval)
  }
  return handle
}

const fn = createRepeat(console.log, 3, 4)

fn('helloWorld')// 每4秒输出一次helloWorld, 输出3次
