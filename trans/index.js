function trans(value) {
  const map = {
    0: '零',
    1: '一',
    2: '二',
    3: '三',
    4: '四',
    5: '五',
    6: '六',
    7: '七',
    8: '八',
    9: '九',
  }
  function transed(num) {
    if (num < 10) {
      return map[num]
    }
    if (num < 100) {
      const remained = transed(num % 10)
      return `${map[Math.floor(num / 10)]}十${remained}`
    }
    if (num < 1000) {
      const remainedNum = num % 100
      let remained = transed(remainedNum)
      if (remainedNum < 10) {
        remained = `零${remained}`
      }
      return `${map[Math.floor(num / 100)]}百${remained}`
    }
    if (num < 10000) {
      const remainedNum = num % 1000
      let remained = transed(remainedNum)
      if (remainedNum < 100) {
        remained = `零${remained}`
      }
      return `${map[Math.floor(num / 1000)]}千${remained}`
    }

    if (num < 10000 * 10000) {
      const left = Math.floor(num / 10000)
      const right = num % 10000
      return `${transed(left)}万${transed(right)}`
    }

    if (num < 10000 * 10000 * 10000) {
      const left = Math.floor(num / (10000 * 10000))
      const right = num % (10000 * 10000)
      return `${transed(left)}亿${transed(right)}`
    }
    throw new Error('')
  }
  return transed(value)
}

function trans2(value) {
  const map = {
    0: '零',
    1: '一',
    2: '二',
    3: '三',
    4: '四',
    5: '五',
    6: '六',
    7: '七',
    8: '八',
    9: '九',
  }
  const units = ['', '十', '百', '千', '万', '十', '百', '千', '亿', '十', '百', '千']
  const numStr = `${value}` // 12301
  let ret = ''
  if (value < 10) {
    return map[value]
  }
  for (let i = 0; i < numStr.length; i++) {
    const item = numStr[i]
    const unitIndex = numStr.length - 1 - i
    const unit = units[unitIndex]
    let shouldAddUnitWhenZero = false
    if (unitIndex === 4 || unitIndex === 8) {
      if (numStr[i - 1] !== '0' || numStr[i - 2] !== '0' || numStr[i - 3] !== '0') {
        shouldAddUnitWhenZero = true
      }
    }
    ret += item === '0' ? shouldAddUnitWhenZero ? unit : '零' : `${map[item]}${unit}`
  }
  return ret.replace(/零+/g, '零').replace(/零$/, '').replace(/^一十/, '十')
}


console.log(trans2(123456))


async function async1() {
  console.log('async1 start')
  await async2()
  console.log('async1 end')
}
async function async2() {
  await console.log('async2')
}
console.log('script start')
setTimeout(() => {
  console.log('setTimeout')
}, 0)
async1()
new Promise(((resolve) => {
  console.log('promise1')
  resolve()
  console.log('promise2')
})).then(() => {
  console.log('promise3')
})
console.log('script end')
