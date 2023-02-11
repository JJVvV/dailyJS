function throttle(func, wait, options) {
  let timeout; let context; let args; let
    result
  let previous = 0

  const later = function () {
    previous = Date.now()
    timeout = null
    result = func.apply(context, args)
  }

  const throttled = function () {
    const now = Date.now()
    const remaining = wait - (now - previous)
  	context = this
    args = arguments
    if (remaining <= 0) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      previous = now
      result = func.apply(context, args)
    } else if (!timeout) {
      timeout = setTimeout(later, remaining)
    }
    return result
  }
  return throttled
}

function throttle2(func, wait, options = {}) {
  let timeout = null
  let context = null
  let result = null
  let previous = 0
  let args = null

  const throttled = function throttled(..._args) {
    const now = Date.now()
    context = this
    args = _args
    if (previous === 0 && options.leading === false) {
      previous = now
    }
    const remainning = wait - (now - previous)
    if (remainning <= 0) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      previous = now
      result = func.apply(context, args)
    } else if (!timeout && options.trailing !== false) {
      timeout = setTimeout(() => {
        previous = Date.now()
        timeout = null
        result = func.apply(context, args)
        if (!timeout) {
          context = null
          args = null
        }
      }, remainning)
    }
    return result
  }
  return throttled
}


function throttle3(func, wait, options) {
  let args = null
  let context = null
  let previous = 0
  let now = null
  let timer = null
  let ret = null
  function throttled(..._args) {
    context = this
    args = _args
    now = Date.now()
    if (!previous && options.leading === false) {
      previous = Date.now()
    }
    const remainning = wait - (now - previous)
    if (remainning <= 0) {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      previous = Date.now()
      ret = func.apply(context, args)
    } else if (!timer && options.trailing !== false) {
      timer = setTimeout(() => {
        previous = Date.now()
        timer = null
        ret = func.apply(context, args)
        context = null
        args = null
      }, remainning)
    }
    return ret
  }
  return throttled
}

function throttle4(func, wait, options) {
  let timeout
  let context
  let args
  let result
  let previous = 0

  const later = function later() {
    previous = Date.now()
    timeout = null
    previous = options.leading === false ? 0 : Date.now()
    result = func.apply(context, args)
  }

  const throttled = function throttled() {
    const now = Date.now()
    if (!previous && options.leading === false) {
      previous = Date.now()
    }
    const remaining = wait - (now - previous)
    context = this
    args = arguments
    if (remaining <= 0) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      previous = now
      result = func.apply(context, args)
    } else if (!timeout && options.trailing) {
      timeout = setTimeout(later, remaining)
    }
    return result
  }
  return throttled
}

function debounce(fn, wait = 50, immediate) {
  let timer = null
  return function debounced(...args) {
    // this保存给context
    const context = this
    if (timer) clearTimeout(timer)

    // immediate 为 true 表示第一次触发后执行
    // timer 为空表示首次触发
    if (immediate && !timer) {
      fn.apply(context, args)
    }

    timer = setTimeout(() => {
      fn.apply(context, args)
    }, wait)
  }
}


const onResize = debounce(() => {
  console.log('resized')
}, 2000, true)
window.addEventListener('resize', onResize)
