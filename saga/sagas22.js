function channel() {
  let taker
  function take(cb) {
    taker = cb
  }
  function put(input) {
    if (taker) {
      const tempTaker = taker
      taker = null
      tempTaker(input)
    }
  }
  return {
    take,
    put,
  }
}

const chan = channel()

function take() {
  return {
    type: 'take',
  }
}

function* takeEvery(worker) {
  yield fork(function*() {
    while (true) {
      const action = yield take()
      worker(action)
    }
  })
}

function fork(cb) {
  return {
    type: 'fork',
    fn: cb,
  }
}

function runForkEffect(effect, cb) {
  task(effect.fn || effect)
  cb()
}

function* mainSaga() {
  while (true) {
    const action = yield take()
    console.log(action)
  }
}

function runTakeEffect(effect, cb) {
  chan.take((input) => {
    cb(input)
  })
}

function task(iterator) {
  const iter = iterator()
  function next(...args) {
    const result = iter.next(...args)
    if (!result.done) {
      const effect = result.value
      if (effect.type === 'take') {
        runTakeEffect(result.value, next)
      }
    }
  }
  next()
}

task(mainSaga)

const btn = document.querySelector('button')
let i = 0
btn.addEventListener('click', () => {
  const action = `actiono ${i++}`
  chan.put(action)
})
