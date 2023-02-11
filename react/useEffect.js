let effectIndex = 0
const preDepsArr = []
const _effectDestroy = []
function useEffect(callback, depsArr) {
  if (Object.prototype.toString.call(depsArr) !== '[object Array]') {
    throw new Error('useEffect depsArr must be an array')
  }
  const preDeps = preDepsArr[effectIndex]
  const hasChanged = preDeps ? depsArr.every((dep, index) => dep === preDeps[index]) === false : true
  if (hasChanged) {
    const ret = callback()
    if (typeof ret === 'function') {
      _effectDestroy.push(ret)
    }
  }
  preDepsArr[effectIndex] = depsArr
  effectIndex++
}

let cursor = 0
const states = []
function useState(initialState) {
  const currentCursor = cursor
  states[currentCursor] = states[currentCursor] || initialState
  function setState(newState) {
    states[currentCursor] = newState
    // render()
  }
  cursor++
  return [states[currentCursor], setState]
}

const fiber = {
  // 保存该FunctionComponent对应的Hooks链表
  memoizedState: null,
  // 指向App函数
  stateNode: App,
}

const isMount = true
function useState2(initialState) {
  let hook
  if (isMount) {
    hook = {
      queue: {
        pending: null,
      },
      memoizedState: initialState,
      next: null,
    }
    if (!fiber.memoizedState) {
      fiber.memoizedState = hook
    } else {
      workInProgressHook.next = hook
    }
    workInProgressHook = hook
  } else {

  }
}
