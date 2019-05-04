class EventEmitter {
  constructor() {
    this.eventList = {}
  }

  emit(event, ...params) {
    this.eventList[event].forEach((e, index, eventList) => {
      e.callback(...params)
      if (e.once) {
        eventList.splice(index, 1)
      }
    })
  }

  on(event, callback, once) {
    if (!this.eventList[event]) {
      this.eventList[event] = []
    }
    const eObj = {
      callback,
    }
    if (once) {
      eObj.once = once
    }
    this.eventList[event].push(eObj)
  }

  once(event, callback) {
    this.on(event, callback, true)
  }

  off(event, callback) {
    if (!event) {
      this.eventList = {}
    } else if (!callback) {
      this.eventList[event] = []
    } else {
      const index = this.eventList[event].indexOf(callback)
      this.eventList[event].splice(index, 1)
    }
  }
}

const event = new EventEmitter()

event.once('test', (a, b) => {
  console.log(a, b)
})

event.emit('test', 'a', 'b')
