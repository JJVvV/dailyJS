function createStore(reducer, reloadedState, enhancer) {
  let state
  let listeners = []
  const getState = () => state
  function dispatch(action) {
    state = reducer(state, action)
    listeners.forEach(listener => listener())
    return action
  }

  function subscribe(listener) {
    listener.push(listener)
    return () => {
      listeners = listeners.filter(fn => fn !== listener)
    }
  }

  function replaceReducer(reducer) {
    // currentReducer = nextReducer
  }

  return {
    dispatch,
    getState,
    subscribe,
    replaceReducer,
  }
}

function combineReducers(reducers) {
  return (state = {}, action) => Object.keys(reducers).reduce((pre, key) => {
    pre[key] = reducers[key](state[key], action)
    return pre
  }, {})
}


function compose(...funcs) {
  if (funcs.length === 0) {
    return arg => arg
  }
  if (funcs.length === 1) {
    return funcs[0]
  }

  return funcs.reduce((cur, next) => (...args) => cur(next(...args)))
}


function applyMiddleware(...middlewares) {
  return function (createStore) {
    return function (reducer, initialState) {
      const store = createStore(reducer, initialState)
      const { dispatch } = store
      const api = {
        getState: store.getState,
        dispatch: (...args) => dispatch(...args),
      }
      const chain = middlewares.map((middleware) => middleware(api))
      dispatch = compose(...chain)(store.dispatch)
      return {
        ...store,
        dispatch,
      }
    }
  }
}

function treeHandler() {
  let map = new Map()
  let root = []
  function arr2Tree(arr) {
    arr.forEach((item) => {
      item.children = item.children || []
      map.set(item.id, item)
    })
    arr.forEach((item) => {
      if (map.has(item.parentId)) {
        const parent = map.get(item.parentId)
        parent.children = parent.children || []
        parent.children.push(item)
      } else {
        root.push(item)
      }
    })
    return root
  }

  function remove(id) {
    if (!map.has(id)) {
      return
    }
    const node = map.get(id)
    const parent = map.get(node.parentId)
    if (!parent) {
      root = []
      map = new Map()
    } else {
      parent.children = parent.children.filter((item) => item.id !== id)
      map.delete(id)
    }
  }

  function add(node) {
    if (map.has(node.id)) {
      return
    }
    map.set(node.id, node)
    const parent = map.get(node.parentId)
    node.children = node.children || []
    if (parent) {
      parent.children.push(node)
    } else {
      root.push(node)
    }
  }
  function getValue() {
    return root
  }
  return {
    arr2Tree,
    remove,
    add,
    getValue,
  }
}


const arr = [{
  id: 2,
  name: '部门B',
  parentId: 0,
},
{
  id: 3,
  name: '部门C',
  parentId: 1,
},
{
  id: 1,
  name: '部门A',
  parentId: 2,
},
{
  id: 4,
  name: '部门D',
  parentId: 1,
},
{
  id: 5,
  name: '部门E',
  parentId: 2,
},
{
  id: 6,
  name: '部门F',
  parentId: 3,
},
{
  id: 7,
  name: '部门G',
  parentId: 2,
},
{
  id: 8,
  name: '部门H',
  parentId: 4,
},
]

const tree = treeHandler()
console.log(tree.arr2Tree(arr))
