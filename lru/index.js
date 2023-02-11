class LRUCache {
  constructor(length) {
    this.length = length
    this.data = new Map()
  }

  set(key, value) {
    const { data } = this
    if (data.has(key)) {
      data.delete(key)
    }
    data.set(key, value)
    if (data.size > this.length) {
      const delKey = data.keys().next().value
      data.delete(delKey)
    }
  }

  get(key) {
    const { data } = this
    if (!data.has(key)) {
      return null
    }
    const value = data.get(key)
    data.delete(key)
    data.set(key, value)
    return value
  }
}
