const windowMap = new Map()
const resetWindow = {}

let routerUrl = ''

const handler = {
  get(obj, prop) {
    const tempWindow = windowMap.get(routerUrl)
    console.log(windowMap, routerUrl)
    return tempWindow[prop]
  },
  set(obj, prop, value) {
    if (!windowMap.has(routerUrl)) {
      windowMap.set(routerUrl, JSON.parse(JSON.stringify(resetWindow)))
    }
    const tempWindow = windowMap.get(routerUrl)
    tempWindow[prop] = value
  },
}

const proxyWindow = new Proxy(resetWindow, handler)

proxyWindow.a = '父类的 a'

routerUrl = 'routerA'
proxyWindow.a = 'routerA 的 a 属性'

routerUrl = ''

console.log(proxyWindow.a)
routerUrl = 'routerA'
console.log(proxyWindow.a)
