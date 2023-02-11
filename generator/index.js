function isPromise(value) {
  return value && typeof value.then === 'function'
}
function generator2Async(generatorFn) {
  return function generator2AsyncInner(...args) {
    const gen = generatorFn.apply(this, args)
    return new Promise((resolve, reject) => {
      function next(arg) {
        let res
        try {
          res = gen.next(arg)
        } catch (error) {
          return reject(error)
        }
        const { value, done } = res
        if (done) {
          return resolve(value)
        }
        if (!isPromise(value)) {
          next(value)
        }
        return Promise.resolve(value).then((val) => next(val), (err) => {
          reject(err)
        })
      }
      next()
    })
  }
}

function promise(v) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(v)
    }, (2000))
  })
}

function* gen() {
  try {
    const res1 = yield promise(1)
    const res2 = yield promise(2)
    return res1 + res2
  } catch (e) {
    console.log(e)
  }
}

const asyncGen = generator2Async(gen)

asyncGen().then((res) => {
  console.log(res)
}).catch((e) => {
  console.log(e)
})
