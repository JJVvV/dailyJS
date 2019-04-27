function longestStr(str) {
  const n = str.length
  if (n === 1) {
    return n
  }
  let start = 0

  let max = 0
  const obj = {}
  for (let i = 0; i < n; i++) {
    if (obj[str[i]] != null && obj[str[i]] >= start) {
      start = obj[str[i]] + 1
    }
    obj[str[i]] = i

    max = Math.max(max, i - start + 1)
  }
  return max
}
