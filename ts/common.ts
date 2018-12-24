export function createStandardAction<T extends string>(type: T) {
  return function<P>() {
    return function(arg: P): { type: T; payload: P } {
      return {
        type,
        payload: arg,
      }
    }
  }
}

export function createAction<T extends string>(type: T) {
  return function() {
    return {
      type,
    }
  }
}

export type ActionCreator<T extends string> = (...args: any[]) => { type: T }
export type ActionResult<T> = T extends (...args: any[]) => any
  ? ReturnType<T>
  : never

export function getType<T extends string>(action: ActionCreator<T>) {
  return action().type
}

type ActionCreatorMap<T> = { [K in keyof T]: ActionResult<T[K]> }

export type ActionType<T> = T extends object
  ? ActionCreatorMap<T>[keyof T]
  : ActionResult<T>
