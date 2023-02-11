function fun(str) {
  const map = new Map()
  const len = str.length
  for (let i = 0; i < len; i++) {
    if (!map.has(str[i])) {
      map.set(str[i], 0)
    }
    const value = map.get(str[i])
    map.set(str[i], value + 1)
  }
  for (let i = 0; i < len; i++) {
    const value = map.get(str[i])
    if (value === 1) {
      return i
    }
  }
  return -1
}

console.log(fun('aaaa'))
