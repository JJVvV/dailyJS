function compose(middlewares) {
  if (!middlewares.length) {
    return () => {}
  }
  if (middlewares.length === 1) {
    return () => { middlewares[0](() => {}) }
  }
  return middlewares.reduce((cur, next) => {
    console.log()
    return (n = () => {}) => {
      console.log()
      return cur(() => next(n))
    }
  })
}

function compose2(middlewares) {
  if (!middlewares.length) {
    return () => {}
  }
  if (middlewares.length === 1) {
    return () => { middlewares[0](() => {}) }
  }
  return middlewares.reduce((cur, next) => (arg = () => {}) => {
    cur(() => { next(arg) })
  })
}


const middleware = []
middleware.push((next) => {
  console.log(1)
  next()
  console.log(1.1)
})
middleware.push((next) => {
  console.log(2)
  next()
  console.log(2.1)
})
middleware.push((next) => {
  console.log(3)
  next()
  console.log(3.1)
})
middleware.push((next) => {
  console.log(4)
  next()
  console.log(4.1)
})

const fn = compose(middleware)
const fn2 = compose2(middleware)
fn()
fn2()
