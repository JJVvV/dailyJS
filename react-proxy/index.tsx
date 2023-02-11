import React, { useState, useCallback} from 'react'

const EVENTS = Symbol()

export function proxy<T extends object>(initialValue: T): T {

  const subs: Record<string | symbol, Array<Function>> = {}
  const events = {
    subscribe(property: string, callback: Function) {
      subs[property] ??= []
      // only subscribes each handler once
      // this is a bad api, just trying to get it working
      if (subs[property].indexOf(callback) === -1)
        subs[property].push(callback)
    },
    unsubscribe(callback: Function) {
      // unsubscribes this handler from all properties
      // this is a bad api, just trying to get it working
      for (let property in subs) {
        subs[property].splice(subs[property].indexOf(callback))
      }
    }
  }

  return new Proxy<T>(initialValue, {
    get(target, property, receiver) {
      // exposes a way to subscribe to property changes
      if (property === EVENTS) return events
      return Reflect.get(target, property, receiver)
    },
    set(target, property, newValue) {
      const oldValue = Reflect.get(target, property)
      const success = Reflect.set(target, property, newValue)
      // emits event when value changes
      if (success && oldValue !== newValue) {
        subs[property]?.forEach(callback => callback())
      }
      return success
    }
  })
}

export function useSnapshot<T extends object>(proxy: T): T {
  const [, updateState] = useState({});
  const forceUpdate = useCallback(() => {
    // unsubscribe so that we can resubscribe on next render to only used props
    (proxy as any)[EVENTS].unsubscribe(forceUpdate)
    updateState({})
  }, []);

  return new Proxy(proxy, {
    get(target, property) {
      // subscribe to properties we read
      const events = (target as any)[EVENTS]
      events.subscribe(property, forceUpdate)
      return Reflect.get(target, property)
    }
  })
}
