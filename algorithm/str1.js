function removeLessChar(str) {
  const map = {}
  for (let i = 0; i < str.length; i++) {
    if (map[str[i]] === undefined) {
      map[str[i]] = 0
    }
    map[str[i]]++
  }
  let chars = []
  let min = Number.MAX_SAFE_INTEGER
  for (const char in map) {
    if (map[char] < min) {
      min = map[char]
      chars = [char]
    } else if (map[char] === min) {
      chars.push(char)
    }
  }
  const reg = new RegExp(chars.join('|'), 'g')
  return str.replace(reg, '')
}

console.log(removeLessChar('aaabbbcceeff'))
