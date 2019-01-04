class App {
  static modules = []
  options
  constructor(options) {
    this.options = options
    this.init()
  }

  init() {
    window.addEventListener('DOMContentLoaded', () => {
      this.initModules()
      this.options.onReady(this)
    })
  }

  static use(module) {
    Array.isArray(module)
      ? module.forEach((item) => App.use(item))
      : App.modules.push(module)
  }

  initModules() {
    App.modules.forEach(
      (module) =>
        module.init && typeof module.init === 'function' && module.init(this)
    )
  }
}
