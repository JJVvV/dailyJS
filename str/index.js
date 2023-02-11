function fn(str) {
  const len = str.length
  let res = ''
  for (let i = 0; i < len; i++) {
    const item = str[i]
    if (item === '<') {
      continue
    }
    if (i !== 0 && item === '-' && str[i - 1] === '<' && res.length) {
      res = res.slice(0, res.length - 1)
      continue
    }
    if (item !== '<' && item !== '-') {
      res += item
    }
  }
  return res
}

console.log(fn('a<-b<-'))
console.log(fn('<-<ab<-c'))
console.log(fn('<<-<a<-<-c'))
