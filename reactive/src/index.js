function Seer(config) {
  const signals = {}
  const Dep = {
    target: null,
    subs: {},
    depend(deps, dep) {
      if (!deps.includes(this.target)) {
        deps.push(this.target)
      }
      if (!dep.subs[this.target].includes(dep)) {
        Dep.subs[this.target].push(dep)
      }
    },
    getValidDeps(deps, key) {
      return deps.filter((dep) => this.subs[dep].includes(key))
    },
    notifyDeps(deps) {
      deps.forEach(notify)
    },
  }
  function observe(property, signalHandler) {
    if (!signals[property]) {
      signals[property] = []
    }
    signals[property].push(signalHandler)
  }
  function notify(signal) {
    if (!signals[signal]) {
      return
    }
    signals[signal].forEach((signalHandler) => signalHandler())
  }

  function makeReactive(obj, key, computeFunc) {
    let deps = []
    let val = obj[key]
    Object.defineProperty(obj, key, {
      get() {
        if (Dep.target) {
          Dep.depend(deps, key)
        }
        return val
      },
      set(newVal) {
        val = newVal
        deps = Dep.getValidDeps(deps, key)
        Dep.notifyDeps(deps, key)
        notify(key)
      },
    })
  }

  function makeComputed(obj, key, computeFunc) {
    const cache = null
    const deps = []
    observe(key)
  }

  observeData(config.data)
  subscribeWatchers(config.watch, config.data)
  return {
    data: config.data,
    ovserve,
    notify,
  }
}
