function longestSameStr(str1, str2) {
  const r = []

  const n1 = str1.length
  const n2 = str2.length
  let length = 0
  for (let i = 0; i < n1; i++) {
    r[i] = r[i] || []
    for (let j = 0; j < n2; j++) {
      r[i][j] = r[i][j] || 0

      if (str1[i] === str2[j]) {
        if (i === 0 || j === 0) {
          r[i][j] = 1
        } else {
          r[i][j] = r[i - 1][j - 1] + 1
        }
      } else {
        r[i][j] = 0
      }
      length = Math.max(length, r[i][j])
    }
  }
  return length
}
