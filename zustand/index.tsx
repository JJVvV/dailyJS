export const createStore = (initialState) => {
  let state = initialState
  const getState = () => state;
  const setState = (nextState) => {
    state = nextState
    listeners.forEach((listener) => {
      listener();
    })
  }

  const listeners = new Set<any>();

  const subscribe= (listener) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }
  return {
    getState,
    setState,
    subscribe
  }
}


