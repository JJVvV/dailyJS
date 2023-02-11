const promise = new Promise((resolve, reject) => {
  // throw new Error('error aaa')
  setTimeout(() => {
    resolve()
  }, 30)
})

promise.then(() => {
  console.log('success aaa')
  throw new Error('error')
}, (err) => {
  // throw new Error('reject error')
  console.log('reject', err)
}).catch((err) => {
  console.log('catch', err)
})

function isPromise(obj) {
  return typeof obj === 'object' && obj !== null && typeof obj.then === 'function'
}

function all(values) {
  return new Promise((resolve, reject) => {
    const result = []
    let times = 0
    const postSuccess = (i, value) => {
      result[i] = value
      if (++times === values.length) {
        resolve(result)
      }
    }
    for (let i = 0; i < values.length; i++) {
      const current = values[i]
      if (isPromise(current)) {
        current.then((value) => {
          postSuccess(i, value)
        }).catch((e) => {
          reject(e)
        })
      } else {
        postSuccess(i, current)
      }
    }
  })
}

function race(values) {
  return new Promise((resolve, reject) => {
    for (let i = 0; i < values.length; i++) {
      const item = values[i]
      if (isPromise(item)) {
        item.then(resolve, reject)
      } else {
        resolve(item)
      }
    }
  })
}

Promise.prototype.finally = function (callback) {
  const P = this.constructor
  return this.then(
    value => P.resolve.call(this, callback()).then(() => value),
    reason => P.resolve.call(this, callback()).then(() => { throw reason }),
  )
}

function all2(promises) {
  return new Promise((resolve, reject) => {
    let time = 0
    const result = []
    for (let i = 0; i < promises.length; i++) {
      const item = promises[i]
      item.then((res) => {
        time++
        result[i] = res
        if (time === promises.length) {
          resolve(result)
        }
        return res
      }, (e) => {
        time++
        result[i] = e
        hasError = true
        if (time === promises.length) {
          resolve(result)
        }
        throw e
      })
    }
  })
}

const promiseList = [
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(0)
    }, 3000)
  }),
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(1)
    }, 1000)
  }),
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(2)
    }, 1000)
  }),
  new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error(3))
    }, 1000)
  }),
]

const res = all2(promiseList).then(console.log)
