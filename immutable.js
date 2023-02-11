/**
 *  Copyright (c) 2014-2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory()
    : typeof define === 'function' && define.amd ? define(factory)
      : global.Immutable = factory()
}(this, () => {
  const SLICE$0 = Array.prototype.slice

  function createClass(ctor, superClass) {
    if (superClass) {
      ctor.prototype = Object.create(superClass.prototype)
    }
    ctor.prototype.constructor = ctor
  }

  // Used for setting prototype methods that IE8 chokes on.
  const DELETE = 'delete'

  // Constants describing the size of trie nodes.
  const SHIFT = 5 // Resulted in best performance after ______?
  const SIZE = 1 << SHIFT
  const MASK = SIZE - 1

  // A consistent shared value representing "not set" which equals nothing other
  // than itself, and nothing that could be provided externally.
  const NOT_SET = {}

  // Boolean references, Rough equivalent of `bool &`.
  const CHANGE_LENGTH = { value: false }
  const DID_ALTER = { value: false }

  function MakeRef(ref) {
    ref.value = false
    return ref
  }

  function SetRef(ref) {
    ref && (ref.value = true)
  }

  // A function which returns a value representing an "owner" for transient writes
  // to tries. The return value will only ever equal itself, and will not equal
  // the return of any subsequent call of this function.
  function OwnerID() {}

  // http://jsperf.com/copy-array-inline
  function arrCopy(arr, offset) {
    offset = offset || 0
    const len = Math.max(0, arr.length - offset)
    const newArr = new Array(len)
    for (let ii = 0; ii < len; ii++) {
      newArr[ii] = arr[ii + offset]
    }
    return newArr
  }

  function ensureSize(iter) {
    if (iter.size === undefined) {
      iter.size = iter.__iterate(returnTrue)
    }
    return iter.size
  }

  function wrapIndex(iter, index) {
    // This implements "is array index" which the ECMAString spec defines as:
    //     A String property name P is an array index if and only if
    //     ToString(ToUint32(P)) is equal to P and ToUint32(P) is not equal
    //     to 2^32âˆ’1.
    // However note that we're currently calling ToNumber() instead of ToUint32()
    // which should be improved in the future, as floating point numbers should
    // not be accepted as an array index.
    if (typeof index !== 'number') {
      const numIndex = +index
      if (`${numIndex}` !== index) {
        return NaN
      }
      index = numIndex
    }
    return index < 0 ? ensureSize(iter) + index : index
  }

  function returnTrue() {
    return true
  }

  function wholeSlice(begin, end, size) {
    return (begin === 0 || (size !== undefined && begin <= -size))
            && (end === undefined || (size !== undefined && end >= size))
  }

  function resolveBegin(begin, size) {
    return resolveIndex(begin, size, 0)
  }

  function resolveEnd(end, size) {
    return resolveIndex(end, size, size)
  }

  function resolveIndex(index, size, defaultIndex) {
    return index === undefined
      ? defaultIndex
      : index < 0
        ? Math.max(0, size + index)
        : size === undefined
          ? index
          : Math.min(size, index)
  }

  function Iterable(value) {
    return isIterable(value) ? value : Seq(value)
  }


  createClass(KeyedIterable, Iterable)
  function KeyedIterable(value) {
    return isKeyed(value) ? value : KeyedSeq(value)
  }


  createClass(IndexedIterable, Iterable)
  function IndexedIterable(value) {
    return isIndexed(value) ? value : IndexedSeq(value)
  }


  createClass(SetIterable, Iterable)
  function SetIterable(value) {
    return isIterable(value) && !isAssociative(value) ? value : SetSeq(value)
  }


  function isIterable(maybeIterable) {
    return !!(maybeIterable && maybeIterable[IS_ITERABLE_SENTINEL])
  }

  function isKeyed(maybeKeyed) {
    return !!(maybeKeyed && maybeKeyed[IS_KEYED_SENTINEL])
  }

  function isIndexed(maybeIndexed) {
    return !!(maybeIndexed && maybeIndexed[IS_INDEXED_SENTINEL])
  }

  function isAssociative(maybeAssociative) {
    return isKeyed(maybeAssociative) || isIndexed(maybeAssociative)
  }

  function isOrdered(maybeOrdered) {
    return !!(maybeOrdered && maybeOrdered[IS_ORDERED_SENTINEL])
  }

  Iterable.isIterable = isIterable
  Iterable.isKeyed = isKeyed
  Iterable.isIndexed = isIndexed
  Iterable.isAssociative = isAssociative
  Iterable.isOrdered = isOrdered

  Iterable.Keyed = KeyedIterable
  Iterable.Indexed = IndexedIterable
  Iterable.Set = SetIterable


  var IS_ITERABLE_SENTINEL = '@@__IMMUTABLE_ITERABLE__@@'
  var IS_KEYED_SENTINEL = '@@__IMMUTABLE_KEYED__@@'
  var IS_INDEXED_SENTINEL = '@@__IMMUTABLE_INDEXED__@@'
  var IS_ORDERED_SENTINEL = '@@__IMMUTABLE_ORDERED__@@'

  /* global Symbol */

  const ITERATE_KEYS = 0
  const ITERATE_VALUES = 1
  const ITERATE_ENTRIES = 2

  const REAL_ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator
  const FAUX_ITERATOR_SYMBOL = '@@iterator'

  const ITERATOR_SYMBOL = REAL_ITERATOR_SYMBOL || FAUX_ITERATOR_SYMBOL


  function src_Iterator__Iterator(next) {
    this.next = next
  }

  src_Iterator__Iterator.prototype.toString = function () {
    return '[Iterator]'
  }


  src_Iterator__Iterator.KEYS = ITERATE_KEYS
  src_Iterator__Iterator.VALUES = ITERATE_VALUES
  src_Iterator__Iterator.ENTRIES = ITERATE_ENTRIES

  src_Iterator__Iterator.prototype.inspect = src_Iterator__Iterator.prototype.toSource = function () { return this.toString() }
  src_Iterator__Iterator.prototype[ITERATOR_SYMBOL] = function () {
    return this
  }


  function iteratorValue(type, k, v, iteratorResult) {
    const value = type === 0 ? k : type === 1 ? v : [k, v]
    iteratorResult ? (iteratorResult.value = value) : (iteratorResult = {
      value, done: false,
    })
    return iteratorResult
  }

  function iteratorDone() {
    return { value: undefined, done: true }
  }

  function hasIterator(maybeIterable) {
    return !!getIteratorFn(maybeIterable)
  }

  function isIterator(maybeIterator) {
    return maybeIterator && typeof maybeIterator.next === 'function'
  }

  function getIterator(iterable) {
    const iteratorFn = getIteratorFn(iterable)
    return iteratorFn && iteratorFn.call(iterable)
  }

  function getIteratorFn(iterable) {
    const iteratorFn = iterable && (
      (REAL_ITERATOR_SYMBOL && iterable[REAL_ITERATOR_SYMBOL])
                || iterable[FAUX_ITERATOR_SYMBOL]
    )
    if (typeof iteratorFn === 'function') {
      return iteratorFn
    }
  }

  function isArrayLike(value) {
    return value && typeof value.length === 'number'
  }

  createClass(Seq, Iterable)
  function Seq(value) {
    return value === null || value === undefined ? emptySequence()
      : isIterable(value) ? value.toSeq() : seqFromValue(value)
  }

  Seq.of = function (/* ...values */) {
    return Seq(arguments)
  }

  Seq.prototype.toSeq = function () {
    return this
  }

  Seq.prototype.toString = function () {
    return this.__toString('Seq {', '}')
  }

  Seq.prototype.cacheResult = function () {
    if (!this._cache && this.__iterateUncached) {
      this._cache = this.entrySeq().toArray()
      this.size = this._cache.length
    }
    return this
  }

  // abstract __iterateUncached(fn, reverse)

  Seq.prototype.__iterate = function (fn, reverse) {
    return seqIterate(this, fn, reverse, true)
  }

  // abstract __iteratorUncached(type, reverse)

  Seq.prototype.__iterator = function (type, reverse) {
    return seqIterator(this, type, reverse, true)
  }


  createClass(KeyedSeq, Seq)
  function KeyedSeq(value) {
    return value === null || value === undefined
      ? emptySequence().toKeyedSeq()
      : isIterable(value)
        ? (isKeyed(value) ? value.toSeq() : value.fromEntrySeq())
        : keyedSeqFromValue(value)
  }

  KeyedSeq.prototype.toKeyedSeq = function () {
    return this
  }


  createClass(IndexedSeq, Seq)
  function IndexedSeq(value) {
    return value === null || value === undefined ? emptySequence()
      : !isIterable(value) ? indexedSeqFromValue(value)
        : isKeyed(value) ? value.entrySeq() : value.toIndexedSeq()
  }

  IndexedSeq.of = function (/* ...values */) {
    return IndexedSeq(arguments)
  }

  IndexedSeq.prototype.toIndexedSeq = function () {
    return this
  }

  IndexedSeq.prototype.toString = function () {
    return this.__toString('Seq [', ']')
  }

  IndexedSeq.prototype.__iterate = function (fn, reverse) {
    return seqIterate(this, fn, reverse, false)
  }

  IndexedSeq.prototype.__iterator = function (type, reverse) {
    return seqIterator(this, type, reverse, false)
  }


  createClass(SetSeq, Seq)
  function SetSeq(value) {
    return (
      value === null || value === undefined ? emptySequence()
        : !isIterable(value) ? indexedSeqFromValue(value)
          : isKeyed(value) ? value.entrySeq() : value
    ).toSetSeq()
  }

  SetSeq.of = function (/* ...values */) {
    return SetSeq(arguments)
  }

  SetSeq.prototype.toSetSeq = function () {
    return this
  }


  Seq.isSeq = isSeq
  Seq.Keyed = KeyedSeq
  Seq.Set = SetSeq
  Seq.Indexed = IndexedSeq

  const IS_SEQ_SENTINEL = '@@__IMMUTABLE_SEQ__@@'

  Seq.prototype[IS_SEQ_SENTINEL] = true


  // #pragma Root Sequences

  createClass(ArraySeq, IndexedSeq)
  function ArraySeq(array) {
    this._array = array
    this.size = array.length
  }

  ArraySeq.prototype.get = function (index, notSetValue) {
    return this.has(index) ? this._array[wrapIndex(this, index)] : notSetValue
  }

  ArraySeq.prototype.__iterate = function (fn, reverse) {
    const array = this._array
    const maxIndex = array.length - 1
    for (var ii = 0; ii <= maxIndex; ii++) {
      if (fn(array[reverse ? maxIndex - ii : ii], ii, this) === false) {
        return ii + 1
      }
    }
    return ii
  }

  ArraySeq.prototype.__iterator = function (type, reverse) {
    const array = this._array
    const maxIndex = array.length - 1
    let ii = 0
    return new src_Iterator__Iterator((() => (ii > maxIndex
      ? iteratorDone()
      : iteratorValue(type, ii, array[reverse ? maxIndex - ii++ : ii++]))))
  }


  createClass(ObjectSeq, KeyedSeq)
  function ObjectSeq(object) {
    const keys = Object.keys(object)
    this._object = object
    this._keys = keys
    this.size = keys.length
  }

  ObjectSeq.prototype.get = function (key, notSetValue) {
    if (notSetValue !== undefined && !this.has(key)) {
      return notSetValue
    }
    return this._object[key]
  }

  ObjectSeq.prototype.has = function (key) {
    return this._object.hasOwnProperty(key)
  }

  ObjectSeq.prototype.__iterate = function (fn, reverse) {
    const object = this._object
    const keys = this._keys
    const maxIndex = keys.length - 1
    for (var ii = 0; ii <= maxIndex; ii++) {
      const key = keys[reverse ? maxIndex - ii : ii]
      if (fn(object[key], key, this) === false) {
        return ii + 1
      }
    }
    return ii
  }

  ObjectSeq.prototype.__iterator = function (type, reverse) {
    const object = this._object
    const keys = this._keys
    const maxIndex = keys.length - 1
    let ii = 0
    return new src_Iterator__Iterator((() => {
      const key = keys[reverse ? maxIndex - ii : ii]
      return ii++ > maxIndex
        ? iteratorDone()
        : iteratorValue(type, key, object[key])
    }))
  }

  ObjectSeq.prototype[IS_ORDERED_SENTINEL] = true


  createClass(IterableSeq, IndexedSeq)
  function IterableSeq(iterable) {
    this._iterable = iterable
    this.size = iterable.length || iterable.size
  }

  IterableSeq.prototype.__iterateUncached = function (fn, reverse) {
    if (reverse) {
      return this.cacheResult().__iterate(fn, reverse)
    }
    const iterable = this._iterable
    const iterator = getIterator(iterable)
    let iterations = 0
    if (isIterator(iterator)) {
      let step
      while (!(step = iterator.next()).done) {
        if (fn(step.value, iterations++, this) === false) {
          break
        }
      }
    }
    return iterations
  }

  IterableSeq.prototype.__iteratorUncached = function (type, reverse) {
    if (reverse) {
      return this.cacheResult().__iterator(type, reverse)
    }
    const iterable = this._iterable
    const iterator = getIterator(iterable)
    if (!isIterator(iterator)) {
      return new src_Iterator__Iterator(iteratorDone)
    }
    let iterations = 0
    return new src_Iterator__Iterator((() => {
      const step = iterator.next()
      return step.done ? step : iteratorValue(type, iterations++, step.value)
    }))
  }


  createClass(IteratorSeq, IndexedSeq)
  function IteratorSeq(iterator) {
    this._iterator = iterator
    this._iteratorCache = []
  }

  IteratorSeq.prototype.__iterateUncached = function (fn, reverse) {
    if (reverse) {
      return this.cacheResult().__iterate(fn, reverse)
    }
    const iterator = this._iterator
    const cache = this._iteratorCache
    let iterations = 0
    while (iterations < cache.length) {
      if (fn(cache[iterations], iterations++, this) === false) {
        return iterations
      }
    }
    let step
    while (!(step = iterator.next()).done) {
      const val = step.value
      cache[iterations] = val
      if (fn(val, iterations++, this) === false) {
        break
      }
    }
    return iterations
  }

  IteratorSeq.prototype.__iteratorUncached = function (type, reverse) {
    if (reverse) {
      return this.cacheResult().__iterator(type, reverse)
    }
    const iterator = this._iterator
    const cache = this._iteratorCache
    let iterations = 0
    return new src_Iterator__Iterator((() => {
      if (iterations >= cache.length) {
        const step = iterator.next()
        if (step.done) {
          return step
        }
        cache[iterations] = step.value
      }
      return iteratorValue(type, iterations, cache[iterations++])
    }))
  }


  // # pragma Helper functions

  function isSeq(maybeSeq) {
    return !!(maybeSeq && maybeSeq[IS_SEQ_SENTINEL])
  }

  let EMPTY_SEQ

  function emptySequence() {
    return EMPTY_SEQ || (EMPTY_SEQ = new ArraySeq([]))
  }

  function keyedSeqFromValue(value) {
    const seq = Array.isArray(value) ? new ArraySeq(value).fromEntrySeq()
      : isIterator(value) ? new IteratorSeq(value).fromEntrySeq()
        : hasIterator(value) ? new IterableSeq(value).fromEntrySeq()
          : typeof value === 'object' ? new ObjectSeq(value)
            : undefined
    if (!seq) {
      throw new TypeError(
        `${'Expected Array or iterable object of [k, v] entries, '
                + 'or keyed object: '}${value}`,
      )
    }
    return seq
  }

  function indexedSeqFromValue(value) {
    const seq = maybeIndexedSeqFromValue(value)
    if (!seq) {
      throw new TypeError(
        `Expected Array or iterable object of values: ${value}`,
      )
    }
    return seq
  }

  function seqFromValue(value) {
    const seq = maybeIndexedSeqFromValue(value)
            || (typeof value === 'object' && new ObjectSeq(value))
    if (!seq) {
      throw new TypeError(
        `Expected Array or iterable object of values, or keyed object: ${value}`,
      )
    }
    return seq
  }

  function maybeIndexedSeqFromValue(value) {
    return (
      isArrayLike(value) ? new ArraySeq(value)
        : isIterator(value) ? new IteratorSeq(value)
          : hasIterator(value) ? new IterableSeq(value)
            : undefined
    )
  }

  function seqIterate(seq, fn, reverse, useKeys) {
    const cache = seq._cache
    if (cache) {
      const maxIndex = cache.length - 1
      for (var ii = 0; ii <= maxIndex; ii++) {
        const entry = cache[reverse ? maxIndex - ii : ii]
        if (fn(entry[1], useKeys ? entry[0] : ii, seq) === false) {
          return ii + 1
        }
      }
      return ii
    }
    return seq.__iterateUncached(fn, reverse)
  }

  function seqIterator(seq, type, reverse, useKeys) {
    const cache = seq._cache
    if (cache) {
      const maxIndex = cache.length - 1
      let ii = 0
      return new src_Iterator__Iterator((() => {
        const entry = cache[reverse ? maxIndex - ii : ii]
        return ii++ > maxIndex
          ? iteratorDone()
          : iteratorValue(type, useKeys ? entry[0] : ii - 1, entry[1])
      }))
    }
    return seq.__iteratorUncached(type, reverse)
  }

  createClass(Collection, Iterable)
  function Collection() {
    throw TypeError('Abstract')
  }


  createClass(KeyedCollection, Collection); function KeyedCollection() {}

  createClass(IndexedCollection, Collection); function IndexedCollection() {}

  createClass(SetCollection, Collection); function SetCollection() {}


  Collection.Keyed = KeyedCollection
  Collection.Indexed = IndexedCollection
  Collection.Set = SetCollection

  /**
     * An extension of the "same-value" algorithm as [described for use by ES6 Map
     * and Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#Key_equality)
     *
     * NaN is considered the same as NaN, however -0 and 0 are considered the same
     * value, which is different from the algorithm described by
     * [`Object.is`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is).
     *
     * This is extended further to allow Objects to describe the values they
     * represent, by way of `valueOf` or `equals` (and `hashCode`).
     *
     * Note: because of this extension, the key equality of Immutable.Map and the
     * value equality of Immutable.Set will differ from ES6 Map and Set.
     *
     * ### Defining custom values
     *
     * The easiest way to describe the value an object represents is by implementing
     * `valueOf`. For example, `Date` represents a value by returning a unix
     * timestamp for `valueOf`:
     *
     *     var date1 = new Date(1234567890000); // Fri Feb 13 2009 ...
     *     var date2 = new Date(1234567890000);
     *     date1.valueOf(); // 1234567890000
     *     assert( date1 !== date2 );
     *     assert( Immutable.is( date1, date2 ) );
     *
     * Note: overriding `valueOf` may have other implications if you use this object
     * where JavaScript expects a primitive, such as implicit string coercion.
     *
     * For more complex types, especially collections, implementing `valueOf` may
     * not be performant. An alternative is to implement `equals` and `hashCode`.
     *
     * `equals` takes another object, presumably of similar type, and returns true
     * if the it is equal. Equality is symmetrical, so the same result should be
     * returned if this and the argument are flipped.
     *
     *     assert( a.equals(b) === b.equals(a) );
     *
     * `hashCode` returns a 32bit integer number representing the object which will
     * be used to determine how to store the value object in a Map or Set. You must
     * provide both or neither methods, one must not exist without the other.
     *
     * Also, an important relationship between these methods must be upheld: if two
     * values are equal, they *must* return the same hashCode. If the values are not
     * equal, they might have the same hashCode; this is called a hash collision,
     * and while undesirable for performance reasons, it is acceptable.
     *
     *     if (a.equals(b)) {
   *       assert( a.hashCode() === b.hashCode() );
   *     }
     *
     * All Immutable collections implement `equals` and `hashCode`.
     *
     */
  function is(valueA, valueB) {
    if (valueA === valueB || (valueA !== valueA && valueB !== valueB)) {
      return true
    }
    if (!valueA || !valueB) {
      return false
    }
    if (typeof valueA.valueOf === 'function'
            && typeof valueB.valueOf === 'function') {
      valueA = valueA.valueOf()
      valueB = valueB.valueOf()
      if (valueA === valueB || (valueA !== valueA && valueB !== valueB)) {
        return true
      }
      if (!valueA || !valueB) {
        return false
      }
    }
    if (typeof valueA.equals === 'function'
            && typeof valueB.equals === 'function'
            && valueA.equals(valueB)) {
      return true
    }
    return false
  }

  function fromJS(json, converter) {
    return converter
      ? fromJSWith(converter, json, '', { '': json })
      : fromJSDefault(json)
  }

  function fromJSWith(converter, json, key, parentJSON) {
    if (Array.isArray(json)) {
      return converter.call(parentJSON, key, IndexedSeq(json).map((v, k) => fromJSWith(converter, v, k, json)))
    }
    if (isPlainObj(json)) {
      return converter.call(parentJSON, key, KeyedSeq(json).map((v, k) => fromJSWith(converter, v, k, json)))
    }
    return json
  }

  function fromJSDefault(json) {
    if (Array.isArray(json)) {
      return IndexedSeq(json).map(fromJSDefault).toList()
    }
    if (isPlainObj(json)) {
      return KeyedSeq(json).map(fromJSDefault).toMap()
    }
    return json
  }

  function isPlainObj(value) {
    return value && (value.constructor === Object || value.constructor === undefined)
  }

  const src_Math__imul = typeof Math.imul === 'function' && Math.imul(0xffffffff, 2) === -2
    ? Math.imul
    : function imul(a, b) {
      a |= 0 // int
      b |= 0 // int
      const c = a & 0xffff
      const d = b & 0xffff
      // Shift by 0 fixes the sign on the high part.
      return (c * d) + ((((a >>> 16) * d + c * (b >>> 16)) << 16) >>> 0) | 0 // int
    }

  // v8 has an optimization for storing 31-bit signed numbers.
  // Values which have either 00 or 11 as the high order bits qualify.
  // This function drops the highest order bit in a signed number, maintaining
  // the sign bit.
  function smi(i32) {
    return ((i32 >>> 1) & 0x40000000) | (i32 & 0xBFFFFFFF)
  }

  function hash(o) {
    if (o === false || o === null || o === undefined) {
      return 0
    }
    if (typeof o.valueOf === 'function') {
      o = o.valueOf()
      if (o === false || o === null || o === undefined) {
        return 0
      }
    }
    if (o === true) {
      return 1
    }
    const type = typeof o
    if (type === 'number') {
      let h = o | 0
      if (h !== o) {
        h ^= o * 0xFFFFFFFF
      }
      while (o > 0xFFFFFFFF) {
        o /= 0xFFFFFFFF
        h ^= o
      }
      return smi(h)
    }
    if (type === 'string') {
      return o.length > STRING_HASH_CACHE_MIN_STRLEN ? cachedHashString(o) : hashString(o)
    }
    if (typeof o.hashCode === 'function') {
      return o.hashCode()
    }
    return hashJSObj(o)
  }

  function cachedHashString(string) {
    let hash = stringHashCache[string]
    if (hash === undefined) {
      hash = hashString(string)
      if (STRING_HASH_CACHE_SIZE === STRING_HASH_CACHE_MAX_SIZE) {
        STRING_HASH_CACHE_SIZE = 0
        stringHashCache = {}
      }
      STRING_HASH_CACHE_SIZE++
      stringHashCache[string] = hash
    }
    return hash
  }

  // http://jsperf.com/hashing-strings
  function hashString(string) {
    // This is the hash from JVM
    // The hash code for a string is computed as
    // s[0] * 31 ^ (n - 1) + s[1] * 31 ^ (n - 2) + ... + s[n - 1],
    // where s[i] is the ith character of the string and n is the length of
    // the string. We "mod" the result to make it between 0 (inclusive) and 2^31
    // (exclusive) by dropping high bits.
    let hash = 0
    for (let ii = 0; ii < string.length; ii++) {
      hash = 31 * hash + string.charCodeAt(ii) | 0
    }
    return smi(hash)
  }

  function hashJSObj(obj) {
    let hash
    if (usingWeakMap) {
      hash = weakMap.get(obj)
      if (hash !== undefined) {
        return hash
      }
    }

    hash = obj[UID_HASH_KEY]
    if (hash !== undefined) {
      return hash
    }

    if (!canDefineProperty) {
      hash = obj.propertyIsEnumerable && obj.propertyIsEnumerable[UID_HASH_KEY]
      if (hash !== undefined) {
        return hash
      }

      hash = getIENodeHash(obj)
      if (hash !== undefined) {
        return hash
      }
    }

    hash = ++objHashUID
    if (objHashUID & 0x40000000) {
      objHashUID = 0
    }

    if (usingWeakMap) {
      weakMap.set(obj, hash)
    } else if (isExtensible !== undefined && isExtensible(obj) === false) {
      throw new Error('Non-extensible objects are not allowed as keys.')
    } else if (canDefineProperty) {
      Object.defineProperty(obj, UID_HASH_KEY, {
        enumerable: false,
        configurable: false,


        writable: false,
        value: hash,
      })
    } else if (obj.propertyIsEnumerable !== undefined
            && obj.propertyIsEnumerable === obj.constructor.prototype.propertyIsEnumerable) {
      // Since we can't define a non-enumerable property on the object
      // we'll hijack one of the less-used non-enumerable properties to
      // save our hash on it. Since this is a function it will not show up in
      // `JSON.stringify` which is what we want.
      obj.propertyIsEnumerable = function () {
        return this.constructor.prototype.propertyIsEnumerable.apply(this, arguments)
      }
      obj.propertyIsEnumerable[UID_HASH_KEY] = hash
    } else if (obj.nodeType !== undefined) {
      // At this point we couldn't get the IE `uniqueID` to use as a hash
      // and we couldn't use a non-enumerable property to exploit the
      // dontEnum bug so we simply add the `UID_HASH_KEY` on the node
      // itself.
      obj[UID_HASH_KEY] = hash
    } else {
      throw new Error('Unable to set a non-enumerable property on object.')
    }

    return hash
  }

  // Get references to ES5 object methods.
  var { isExtensible } = Object

  // True if Object.defineProperty works as expected. IE8 fails this test.
  var canDefineProperty = (function () {
    try {
      Object.defineProperty({}, '@', {})
      return true
    } catch (e) {
      return false
    }
  }())

  // IE has a `uniqueID` property on DOM nodes. We can construct the hash from it
  // and avoid memory leaks from the IE cloneNode bug.
  function getIENodeHash(node) {
    if (node && node.nodeType > 0) {
      switch (node.nodeType) {
        case 1: // Element
          return node.uniqueID
        case 9: // Document
          return node.documentElement && node.documentElement.uniqueID
      }
    }
  }

  // If possible, use a WeakMap.
  var usingWeakMap = typeof WeakMap === 'function'
  let weakMap
  if (usingWeakMap) {
    weakMap = new WeakMap()
  }

  var objHashUID = 0

  var UID_HASH_KEY = '__immutablehash__'
  if (typeof Symbol === 'function') {
    UID_HASH_KEY = Symbol(UID_HASH_KEY)
  }

  var STRING_HASH_CACHE_MIN_STRLEN = 16
  var STRING_HASH_CACHE_MAX_SIZE = 255
  var STRING_HASH_CACHE_SIZE = 0
  var stringHashCache = {}

  function invariant(condition, error) {
    if (!condition) throw new Error(error)
  }

  function assertNotInfinite(size) {
    invariant(
      size !== Infinity,
      'Cannot perform this action with an infinite size.',
    )
  }

  createClass(ToKeyedSequence, KeyedSeq)
  function ToKeyedSequence(indexed, useKeys) {
    this._iter = indexed
    this._useKeys = useKeys
    this.size = indexed.size
  }

  ToKeyedSequence.prototype.get = function (key, notSetValue) {
    return this._iter.get(key, notSetValue)
  }

  ToKeyedSequence.prototype.has = function (key) {
    return this._iter.has(key)
  }

  ToKeyedSequence.prototype.valueSeq = function () {
    return this._iter.valueSeq()
  }

  ToKeyedSequence.prototype.reverse = function () {
    const this$0 = this
    const reversedSequence = reverseFactory(this, true)
    if (!this._useKeys) {
      reversedSequence.valueSeq = function () { return this$0._iter.toSeq().reverse() }
    }
    return reversedSequence
  }

  ToKeyedSequence.prototype.map = function (mapper, context) {
    const this$0 = this
    const mappedSequence = mapFactory(this, mapper, context)
    if (!this._useKeys) {
      mappedSequence.valueSeq = function () { return this$0._iter.toSeq().map(mapper, context) }
    }
    return mappedSequence
  }

  ToKeyedSequence.prototype.__iterate = function (fn, reverse) {
    const this$0 = this
    let ii
    return this._iter.__iterate(
      this._useKeys
        ? (v, k) => fn(v, k, this$0)
        : ((ii = reverse ? resolveSize(this) : 0),
        function (v) { return fn(v, reverse ? --ii : ii++, this$0) }),
      reverse,
    )
  }

  ToKeyedSequence.prototype.__iterator = function (type, reverse) {
    if (this._useKeys) {
      return this._iter.__iterator(type, reverse)
    }
    const iterator = this._iter.__iterator(ITERATE_VALUES, reverse)
    let ii = reverse ? resolveSize(this) : 0
    return new src_Iterator__Iterator((() => {
      const step = iterator.next()
      return step.done ? step
        : iteratorValue(type, reverse ? --ii : ii++, step.value, step)
    }))
  }

  ToKeyedSequence.prototype[IS_ORDERED_SENTINEL] = true


  createClass(ToIndexedSequence, IndexedSeq)
  function ToIndexedSequence(iter) {
    this._iter = iter
    this.size = iter.size
  }

  ToIndexedSequence.prototype.includes = function (value) {
    return this._iter.includes(value)
  }

  ToIndexedSequence.prototype.__iterate = function (fn, reverse) {
    const this$0 = this
    let iterations = 0
    return this._iter.__iterate((v) => fn(v, iterations++, this$0), reverse)
  }

  ToIndexedSequence.prototype.__iterator = function (type, reverse) {
    const iterator = this._iter.__iterator(ITERATE_VALUES, reverse)
    let iterations = 0
    return new src_Iterator__Iterator((() => {
      const step = iterator.next()
      return step.done ? step
        : iteratorValue(type, iterations++, step.value, step)
    }))
  }


  createClass(ToSetSequence, SetSeq)
  function ToSetSequence(iter) {
    this._iter = iter
    this.size = iter.size
  }

  ToSetSequence.prototype.has = function (key) {
    return this._iter.includes(key)
  }

  ToSetSequence.prototype.__iterate = function (fn, reverse) {
    const this$0 = this
    return this._iter.__iterate((v) => fn(v, v, this$0), reverse)
  }

  ToSetSequence.prototype.__iterator = function (type, reverse) {
    const iterator = this._iter.__iterator(ITERATE_VALUES, reverse)
    return new src_Iterator__Iterator((() => {
      const step = iterator.next()
      return step.done ? step
        : iteratorValue(type, step.value, step.value, step)
    }))
  }


  createClass(FromEntriesSequence, KeyedSeq)
  function FromEntriesSequence(entries) {
    this._iter = entries
    this.size = entries.size
  }

  FromEntriesSequence.prototype.entrySeq = function () {
    return this._iter.toSeq()
  }

  FromEntriesSequence.prototype.__iterate = function (fn, reverse) {
    const this$0 = this
    return this._iter.__iterate((entry) => {
      // Check if entry exists first so array access doesn't throw for holes
      // in the parent iteration.
      if (entry) {
        validateEntry(entry)
        const indexedIterable = isIterable(entry)
        return fn(
          indexedIterable ? entry.get(1) : entry[1],
          indexedIterable ? entry.get(0) : entry[0],
          this$0,
        )
      }
    }, reverse)
  }

  FromEntriesSequence.prototype.__iterator = function (type, reverse) {
    const iterator = this._iter.__iterator(ITERATE_VALUES, reverse)
    return new src_Iterator__Iterator((() => {
      while (true) {
        const step = iterator.next()
        if (step.done) {
          return step
        }
        const entry = step.value
        // Check if entry exists first so array access doesn't throw for holes
        // in the parent iteration.
        if (entry) {
          validateEntry(entry)
          const indexedIterable = isIterable(entry)
          return iteratorValue(
            type,
            indexedIterable ? entry.get(0) : entry[0],
            indexedIterable ? entry.get(1) : entry[1],
            step,
          )
        }
      }
    }))
  }


  ToIndexedSequence.prototype.cacheResult = ToKeyedSequence.prototype.cacheResult = ToSetSequence.prototype.cacheResult = FromEntriesSequence.prototype.cacheResult = cacheResultThrough


  function flipFactory(iterable) {
    const flipSequence = makeSequence(iterable)
    flipSequence._iter = iterable
    flipSequence.size = iterable.size
    flipSequence.flip = function () { return iterable }
    flipSequence.reverse = function () {
      const reversedSequence = iterable.reverse.apply(this) // super.reverse()
      reversedSequence.flip = function () { return iterable.reverse() }
      return reversedSequence
    }
    flipSequence.has = function (key) { return iterable.includes(key) }
    flipSequence.includes = function (key) { return iterable.has(key) }
    flipSequence.cacheResult = cacheResultThrough
    flipSequence.__iterateUncached = function (fn, reverse) {
      const this$0 = this
      return iterable.__iterate((v, k) => fn(k, v, this$0) !== false, reverse)
    }
    flipSequence.__iteratorUncached = function (type, reverse) {
      if (type === ITERATE_ENTRIES) {
        const iterator = iterable.__iterator(type, reverse)
        return new src_Iterator__Iterator((() => {
          const step = iterator.next()
          if (!step.done) {
            const k = step.value[0]
            step.value[0] = step.value[1]
            step.value[1] = k
          }
          return step
        }))
      }
      return iterable.__iterator(
        type === ITERATE_VALUES ? ITERATE_KEYS : ITERATE_VALUES,
        reverse,
      )
    }
    return flipSequence
  }


  function mapFactory(iterable, mapper, context) {
    const mappedSequence = makeSequence(iterable)
    mappedSequence.size = iterable.size
    mappedSequence.has = function (key) { return iterable.has(key) }
    mappedSequence.get = function (key, notSetValue) {
      const v = iterable.get(key, NOT_SET)
      return v === NOT_SET
        ? notSetValue
        : mapper.call(context, v, key, iterable)
    }
    mappedSequence.__iterateUncached = function (fn, reverse) {
      const this$0 = this
      return iterable.__iterate(
        (v, k, c) => fn(mapper.call(context, v, k, c), k, this$0) !== false,
        reverse,
      )
    }
    mappedSequence.__iteratorUncached = function (type, reverse) {
      const iterator = iterable.__iterator(ITERATE_ENTRIES, reverse)
      return new src_Iterator__Iterator((() => {
        const step = iterator.next()
        if (step.done) {
          return step
        }
        const entry = step.value
        const key = entry[0]
        return iteratorValue(
          type,
          key,
          mapper.call(context, entry[1], key, iterable),
          step,
        )
      }))
    }
    return mappedSequence
  }


  function reverseFactory(iterable, useKeys) {
    const reversedSequence = makeSequence(iterable)
    reversedSequence._iter = iterable
    reversedSequence.size = iterable.size
    reversedSequence.reverse = function () { return iterable }
    if (iterable.flip) {
      reversedSequence.flip = function () {
        const flipSequence = flipFactory(iterable)
        flipSequence.reverse = function () { return iterable.flip() }
        return flipSequence
      }
    }
    reversedSequence.get = function (key, notSetValue) { return iterable.get(useKeys ? key : -1 - key, notSetValue) }
    reversedSequence.has = function (key) { return iterable.has(useKeys ? key : -1 - key) }
    reversedSequence.includes = function (value) { return iterable.includes(value) }
    reversedSequence.cacheResult = cacheResultThrough
    reversedSequence.__iterate = function (fn, reverse) {
      const this$0 = this
      return iterable.__iterate((v, k) => fn(v, k, this$0), !reverse)
    }
    reversedSequence.__iterator = function (type, reverse) { return iterable.__iterator(type, !reverse) }
    return reversedSequence
  }


  function filterFactory(iterable, predicate, context, useKeys) {
    const filterSequence = makeSequence(iterable)
    if (useKeys) {
      filterSequence.has = function (key) {
        const v = iterable.get(key, NOT_SET)
        return v !== NOT_SET && !!predicate.call(context, v, key, iterable)
      }
      filterSequence.get = function (key, notSetValue) {
        const v = iterable.get(key, NOT_SET)
        return v !== NOT_SET && predicate.call(context, v, key, iterable)
          ? v : notSetValue
      }
    }
    filterSequence.__iterateUncached = function (fn, reverse) {
      const this$0 = this
      let iterations = 0
      iterable.__iterate((v, k, c) => {
        if (predicate.call(context, v, k, c)) {
          iterations++
          return fn(v, useKeys ? k : iterations - 1, this$0)
        }
      }, reverse)
      return iterations
    }
    filterSequence.__iteratorUncached = function (type, reverse) {
      const iterator = iterable.__iterator(ITERATE_ENTRIES, reverse)
      let iterations = 0
      return new src_Iterator__Iterator((() => {
        while (true) {
          const step = iterator.next()
          if (step.done) {
            return step
          }
          const entry = step.value
          const key = entry[0]
          const value = entry[1]
          if (predicate.call(context, value, key, iterable)) {
            return iteratorValue(type, useKeys ? key : iterations++, value, step)
          }
        }
      }))
    }
    return filterSequence
  }


  function countByFactory(iterable, grouper, context) {
    const groups = src_Map__Map().asMutable()
    iterable.__iterate((v, k) => {
      groups.update(
        grouper.call(context, v, k, iterable),
        0,
        (a) => a + 1,
      )
    })
    return groups.asImmutable()
  }


  function groupByFactory(iterable, grouper, context) {
    const isKeyedIter = isKeyed(iterable)
    const groups = (isOrdered(iterable) ? OrderedMap() : src_Map__Map()).asMutable()
    iterable.__iterate((v, k) => {
      groups.update(
        grouper.call(context, v, k, iterable),
        (a) => (a = a || [], a.push(isKeyedIter ? [k, v] : v), a),
      )
    })
    const coerce = iterableClass(iterable)
    return groups.map((arr) => reify(iterable, coerce(arr)))
  }


  function sliceFactory(iterable, begin, end, useKeys) {
    const originalSize = iterable.size

    // Sanitize begin & end using this shorthand for ToInt32(argument)
    // http://www.ecma-international.org/ecma-262/6.0/#sec-toint32
    if (begin !== undefined) {
      begin |= 0
    }
    if (end !== undefined) {
      end |= 0
    }

    if (wholeSlice(begin, end, originalSize)) {
      return iterable
    }

    const resolvedBegin = resolveBegin(begin, originalSize)
    const resolvedEnd = resolveEnd(end, originalSize)

    // begin or end will be NaN if they were provided as negative numbers and
    // this iterable's size is unknown. In that case, cache first so there is
    // a known size and these do not resolve to NaN.
    if (resolvedBegin !== resolvedBegin || resolvedEnd !== resolvedEnd) {
      return sliceFactory(iterable.toSeq().cacheResult(), begin, end, useKeys)
    }

    // Note: resolvedEnd is undefined when the original sequence's length is
    // unknown and this slice did not supply an end and should contain all
    // elements after resolvedBegin.
    // In that case, resolvedSize will be NaN and sliceSize will remain undefined.
    const resolvedSize = resolvedEnd - resolvedBegin
    let sliceSize
    if (resolvedSize === resolvedSize) {
      sliceSize = resolvedSize < 0 ? 0 : resolvedSize
    }

    const sliceSeq = makeSequence(iterable)

    // If iterable.size is undefined, the size of the realized sliceSeq is
    // unknown at this point unless the number of items to slice is 0
    sliceSeq.size = sliceSize === 0 ? sliceSize : iterable.size && sliceSize || undefined

    if (!useKeys && isSeq(iterable) && sliceSize >= 0) {
      sliceSeq.get = function (index, notSetValue) {
        index = wrapIndex(this, index)
        return index >= 0 && index < sliceSize
          ? iterable.get(index + resolvedBegin, notSetValue)
          : notSetValue
      }
    }

    sliceSeq.__iterateUncached = function (fn, reverse) {
      const this$0 = this
      if (sliceSize === 0) {
        return 0
      }
      if (reverse) {
        return this.cacheResult().__iterate(fn, reverse)
      }
      let skipped = 0
      let isSkipping = true
      let iterations = 0
      iterable.__iterate((v, k) => {
        if (!(isSkipping && (isSkipping = skipped++ < resolvedBegin))) {
          iterations++
          return fn(v, useKeys ? k : iterations - 1, this$0) !== false
                        && iterations !== sliceSize
        }
      })
      return iterations
    }

    sliceSeq.__iteratorUncached = function (type, reverse) {
      if (sliceSize !== 0 && reverse) {
        return this.cacheResult().__iterator(type, reverse)
      }
      // Don't bother instantiating parent iterator if taking 0.
      const iterator = sliceSize !== 0 && iterable.__iterator(type, reverse)
      let skipped = 0
      let iterations = 0
      return new src_Iterator__Iterator((() => {
        while (skipped++ < resolvedBegin) {
          iterator.next()
        }
        if (++iterations > sliceSize) {
          return iteratorDone()
        }
        const step = iterator.next()
        if (useKeys || type === ITERATE_VALUES) {
          return step
        } if (type === ITERATE_KEYS) {
          return iteratorValue(type, iterations - 1, undefined, step)
        }
        return iteratorValue(type, iterations - 1, step.value[1], step)
      }))
    }

    return sliceSeq
  }


  function takeWhileFactory(iterable, predicate, context) {
    const takeSequence = makeSequence(iterable)
    takeSequence.__iterateUncached = function (fn, reverse) {
      const this$0 = this
      if (reverse) {
        return this.cacheResult().__iterate(fn, reverse)
      }
      let iterations = 0
      iterable.__iterate((v, k, c) => predicate.call(context, v, k, c) && ++iterations && fn(v, k, this$0))
      return iterations
    }
    takeSequence.__iteratorUncached = function (type, reverse) {
      const this$0 = this
      if (reverse) {
        return this.cacheResult().__iterator(type, reverse)
      }
      const iterator = iterable.__iterator(ITERATE_ENTRIES, reverse)
      let iterating = true
      return new src_Iterator__Iterator((() => {
        if (!iterating) {
          return iteratorDone()
        }
        const step = iterator.next()
        if (step.done) {
          return step
        }
        const entry = step.value
        const k = entry[0]
        const v = entry[1]
        if (!predicate.call(context, v, k, this$0)) {
          iterating = false
          return iteratorDone()
        }
        return type === ITERATE_ENTRIES ? step
          : iteratorValue(type, k, v, step)
      }))
    }
    return takeSequence
  }


  function skipWhileFactory(iterable, predicate, context, useKeys) {
    const skipSequence = makeSequence(iterable)
    skipSequence.__iterateUncached = function (fn, reverse) {
      const this$0 = this
      if (reverse) {
        return this.cacheResult().__iterate(fn, reverse)
      }
      let isSkipping = true
      let iterations = 0
      iterable.__iterate((v, k, c) => {
        if (!(isSkipping && (isSkipping = predicate.call(context, v, k, c)))) {
          iterations++
          return fn(v, useKeys ? k : iterations - 1, this$0)
        }
      })
      return iterations
    }
    skipSequence.__iteratorUncached = function (type, reverse) {
      const this$0 = this
      if (reverse) {
        return this.cacheResult().__iterator(type, reverse)
      }
      const iterator = iterable.__iterator(ITERATE_ENTRIES, reverse)
      let skipping = true
      let iterations = 0
      return new src_Iterator__Iterator((() => {
        let step; let k; let
          v
        do {
          step = iterator.next()
          if (step.done) {
            if (useKeys || type === ITERATE_VALUES) {
              return step
            } if (type === ITERATE_KEYS) {
              return iteratorValue(type, iterations++, undefined, step)
            }
            return iteratorValue(type, iterations++, step.value[1], step)
          }
          const entry = step.value
          k = entry[0]
          v = entry[1]
          skipping && (skipping = predicate.call(context, v, k, this$0))
        } while (skipping)
        return type === ITERATE_ENTRIES ? step
          : iteratorValue(type, k, v, step)
      }))
    }
    return skipSequence
  }


  function concatFactory(iterable, values) {
    const isKeyedIterable = isKeyed(iterable)
    const iters = [iterable].concat(values).map((v) => {
      if (!isIterable(v)) {
        v = isKeyedIterable
          ? keyedSeqFromValue(v)
          : indexedSeqFromValue(Array.isArray(v) ? v : [v])
      } else if (isKeyedIterable) {
        v = KeyedIterable(v)
      }
      return v
    }).filter((v) => v.size !== 0)

    if (iters.length === 0) {
      return iterable
    }

    if (iters.length === 1) {
      const singleton = iters[0]
      if (singleton === iterable
                || isKeyedIterable && isKeyed(singleton)
                || isIndexed(iterable) && isIndexed(singleton)) {
        return singleton
      }
    }

    let concatSeq = new ArraySeq(iters)
    if (isKeyedIterable) {
      concatSeq = concatSeq.toKeyedSeq()
    } else if (!isIndexed(iterable)) {
      concatSeq = concatSeq.toSetSeq()
    }
    concatSeq = concatSeq.flatten(true)
    concatSeq.size = iters.reduce(
      (sum, seq) => {
        if (sum !== undefined) {
          const { size } = seq
          if (size !== undefined) {
            return sum + size
          }
        }
      },
      0,
    )
    return concatSeq
  }


  function flattenFactory(iterable, depth, useKeys) {
    const flatSequence = makeSequence(iterable)
    flatSequence.__iterateUncached = function (fn, reverse) {
      let iterations = 0
      let stopped = false
      function flatDeep(iter, currentDepth) {
        const this$0 = this
        iter.__iterate((v, k) => {
          if ((!depth || currentDepth < depth) && isIterable(v)) {
            flatDeep(v, currentDepth + 1)
          } else if (fn(v, useKeys ? k : iterations++, this$0) === false) {
            stopped = true
          }
          return !stopped
        }, reverse)
      }
      flatDeep(iterable, 0)
      return iterations
    }
    flatSequence.__iteratorUncached = function (type, reverse) {
      let iterator = iterable.__iterator(type, reverse)
      const stack = []
      let iterations = 0
      return new src_Iterator__Iterator((() => {
        while (iterator) {
          const step = iterator.next()
          if (step.done !== false) {
            iterator = stack.pop()
            continue
          }
          let v = step.value
          if (type === ITERATE_ENTRIES) {
            v = v[1]
          }
          if ((!depth || stack.length < depth) && isIterable(v)) {
            stack.push(iterator)
            iterator = v.__iterator(type, reverse)
          } else {
            return useKeys ? step : iteratorValue(type, iterations++, v, step)
          }
        }
        return iteratorDone()
      }))
    }
    return flatSequence
  }


  function flatMapFactory(iterable, mapper, context) {
    const coerce = iterableClass(iterable)
    return iterable.toSeq().map(
      (v, k) => coerce(mapper.call(context, v, k, iterable)),
    ).flatten(true)
  }


  function interposeFactory(iterable, separator) {
    const interposedSequence = makeSequence(iterable)
    interposedSequence.size = iterable.size && iterable.size * 2 - 1
    interposedSequence.__iterateUncached = function (fn, reverse) {
      const this$0 = this
      let iterations = 0
      iterable.__iterate((v, k) => (!iterations || fn(separator, iterations++, this$0) !== false)
                    && fn(v, iterations++, this$0) !== false,
      reverse)
      return iterations
    }
    interposedSequence.__iteratorUncached = function (type, reverse) {
      const iterator = iterable.__iterator(ITERATE_VALUES, reverse)
      let iterations = 0
      let step
      return new src_Iterator__Iterator((() => {
        if (!step || iterations % 2) {
          step = iterator.next()
          if (step.done) {
            return step
          }
        }
        return iterations % 2
          ? iteratorValue(type, iterations++, separator)
          : iteratorValue(type, iterations++, step.value, step)
      }))
    }
    return interposedSequence
  }


  function sortFactory(iterable, comparator, mapper) {
    if (!comparator) {
      comparator = defaultComparator
    }
    const isKeyedIterable = isKeyed(iterable)
    let index = 0
    const entries = iterable.toSeq().map(
      (v, k) => [k, v, index++, mapper ? mapper(v, k, iterable) : v],
    ).toArray()
    entries.sort((a, b) => comparator(a[3], b[3]) || a[2] - b[2]).forEach(
      isKeyedIterable
        ? (v, i) => { entries[i].length = 2 }
        : (v, i) => { entries[i] = v[1] },
    )
    return isKeyedIterable ? KeyedSeq(entries)
      : isIndexed(iterable) ? IndexedSeq(entries)
        : SetSeq(entries)
  }


  function maxFactory(iterable, comparator, mapper) {
    if (!comparator) {
      comparator = defaultComparator
    }
    if (mapper) {
      const entry = iterable.toSeq()
        .map((v, k) => [v, mapper(v, k, iterable)])
        .reduce((a, b) => (maxCompare(comparator, a[1], b[1]) ? b : a))
      return entry && entry[0]
    }
    return iterable.reduce((a, b) => (maxCompare(comparator, a, b) ? b : a))
  }

  function maxCompare(comparator, a, b) {
    const comp = comparator(b, a)
    // b is considered the new max if the comparator declares them equal, but
    // they are not equal and b is in fact a nullish value.
    return (comp === 0 && b !== a && (b === undefined || b === null || b !== b)) || comp > 0
  }


  function zipWithFactory(keyIter, zipper, iters) {
    const zipSequence = makeSequence(keyIter)
    zipSequence.size = new ArraySeq(iters).map((i) => i.size).min()
    // Note: this a generic base implementation of __iterate in terms of
    // __iterator which may be more generically useful in the future.
    zipSequence.__iterate = function (fn, reverse) {
      /* generic:
             var iterator = this.__iterator(ITERATE_ENTRIES, reverse);
             var step;
             var iterations = 0;
             while (!(step = iterator.next()).done) {
             iterations++;
             if (fn(step.value[1], step.value[0], this) === false) {
             break;
             }
             }
             return iterations;
             */
      // indexed:
      const iterator = this.__iterator(ITERATE_VALUES, reverse)
      let step
      let iterations = 0
      while (!(step = iterator.next()).done) {
        if (fn(step.value, iterations++, this) === false) {
          break
        }
      }
      return iterations
    }
    zipSequence.__iteratorUncached = function (type, reverse) {
      const iterators = iters.map((i) => (i = Iterable(i), getIterator(reverse ? i.reverse() : i)))
      let iterations = 0
      let isDone = false
      return new src_Iterator__Iterator((() => {
        let steps
        if (!isDone) {
          steps = iterators.map((i) => i.next())
          isDone = steps.some((s) => s.done)
        }
        if (isDone) {
          return iteratorDone()
        }
        return iteratorValue(
          type,
          iterations++,
          zipper.apply(null, steps.map((s) => s.value)),
        )
      }))
    }
    return zipSequence
  }


  // #pragma Helper Functions

  function reify(iter, seq) {
    return isSeq(iter) ? seq : iter.constructor(seq)
  }

  function validateEntry(entry) {
    if (entry !== Object(entry)) {
      throw new TypeError(`Expected [K, V] tuple: ${entry}`)
    }
  }

  function resolveSize(iter) {
    assertNotInfinite(iter.size)
    return ensureSize(iter)
  }

  function iterableClass(iterable) {
    return isKeyed(iterable) ? KeyedIterable
      : isIndexed(iterable) ? IndexedIterable
        : SetIterable
  }

  function makeSequence(iterable) {
    return Object.create(
      (
        isKeyed(iterable) ? KeyedSeq
          : isIndexed(iterable) ? IndexedSeq
            : SetSeq
      ).prototype,
    )
  }

  function cacheResultThrough() {
    if (this._iter.cacheResult) {
      this._iter.cacheResult()
      this.size = this._iter.size
      return this
    }
    return Seq.prototype.cacheResult.call(this)
  }

  function defaultComparator(a, b) {
    return a > b ? 1 : a < b ? -1 : 0
  }

  function forceIterator(keyPath) {
    let iter = getIterator(keyPath)
    if (!iter) {
      // Array might not be iterable in this environment, so we need a fallback
      // to our wrapped type.
      if (!isArrayLike(keyPath)) {
        throw new TypeError(`Expected iterable or array-like: ${keyPath}`)
      }
      iter = getIterator(Iterable(keyPath))
    }
    return iter
  }

  createClass(src_Map__Map, KeyedCollection)

  // @pragma Construction

  function src_Map__Map(value) {
    return value === null || value === undefined ? emptyMap()
      : isMap(value) && !isOrdered(value) ? value
        : emptyMap().withMutations((map) => {
          const iter = KeyedIterable(value)
          assertNotInfinite(iter.size)
          iter.forEach((v, k) => map.set(k, v))
        })
  }

  src_Map__Map.prototype.toString = function () {
    return this.__toString('Map {', '}')
  }

  // @pragma Access

  src_Map__Map.prototype.get = function (k, notSetValue) {
    return this._root
      ? this._root.get(0, undefined, k, notSetValue)
      : notSetValue
  }

  // @pragma Modification

  src_Map__Map.prototype.set = function (k, v) {
    return updateMap(this, k, v)
  }

  src_Map__Map.prototype.setIn = function (keyPath, v) {
    return this.updateIn(keyPath, NOT_SET, () => v)
  }

  src_Map__Map.prototype.remove = function (k) {
    return updateMap(this, k, NOT_SET)
  }

  src_Map__Map.prototype.deleteIn = function (keyPath) {
    return this.updateIn(keyPath, () => NOT_SET)
  }

  src_Map__Map.prototype.update = function (k, notSetValue, updater) {
    return arguments.length === 1
      ? k(this)
      : this.updateIn([k], notSetValue, updater)
  }

  src_Map__Map.prototype.updateIn = function (keyPath, notSetValue, updater) {
    if (!updater) {
      updater = notSetValue
      notSetValue = undefined
    }
    const updatedValue = updateInDeepMap(
      this,
      forceIterator(keyPath),
      notSetValue,
      updater,
    )
    return updatedValue === NOT_SET ? undefined : updatedValue
  }

  src_Map__Map.prototype.clear = function () {
    if (this.size === 0) {
      return this
    }
    if (this.__ownerID) {
      this.size = 0
      this._root = null
      this.__hash = undefined
      this.__altered = true
      return this
    }
    return emptyMap()
  }

  // @pragma Composition

  src_Map__Map.prototype.merge = function (/* ...iters */) {
    return mergeIntoMapWith(this, undefined, arguments)
  }

  src_Map__Map.prototype.mergeWith = function (merger) {
    const iters = SLICE$0.call(arguments, 1)
    return mergeIntoMapWith(this, merger, iters)
  }

  src_Map__Map.prototype.mergeIn = function (keyPath) {
    const iters = SLICE$0.call(arguments, 1)
    return this.updateIn(
      keyPath,
      emptyMap(),
      (m) => (typeof m.merge === 'function'
        ? m.merge.apply(m, iters)
        : iters[iters.length - 1]),
    )
  }

  src_Map__Map.prototype.mergeDeep = function (/* ...iters */) {
    return mergeIntoMapWith(this, deepMerger(undefined), arguments)
  }

  src_Map__Map.prototype.mergeDeepWith = function (merger) {
    const iters = SLICE$0.call(arguments, 1)
    return mergeIntoMapWith(this, deepMerger(merger), iters)
  }

  src_Map__Map.prototype.mergeDeepIn = function (keyPath) {
    const iters = SLICE$0.call(arguments, 1)
    return this.updateIn(
      keyPath,
      emptyMap(),
      (m) => (typeof m.mergeDeep === 'function'
        ? m.mergeDeep.apply(m, iters)
        : iters[iters.length - 1]),
    )
  }

  src_Map__Map.prototype.sort = function (comparator) {
    // Late binding
    return OrderedMap(sortFactory(this, comparator))
  }

  src_Map__Map.prototype.sortBy = function (mapper, comparator) {
    // Late binding
    return OrderedMap(sortFactory(this, comparator, mapper))
  }

  // @pragma Mutability

  src_Map__Map.prototype.withMutations = function (fn) {
    const mutable = this.asMutable()
    fn(mutable)
    return mutable.wasAltered() ? mutable.__ensureOwner(this.__ownerID) : this
  }

  src_Map__Map.prototype.asMutable = function () {
    return this.__ownerID ? this : this.__ensureOwner(new OwnerID())
  }

  src_Map__Map.prototype.asImmutable = function () {
    return this.__ensureOwner()
  }

  src_Map__Map.prototype.wasAltered = function () {
    return this.__altered
  }

  src_Map__Map.prototype.__iterator = function (type, reverse) {
    return new MapIterator(this, type, reverse)
  }

  src_Map__Map.prototype.__iterate = function (fn, reverse) {
    const this$0 = this
    let iterations = 0
    this._root && this._root.iterate((entry) => {
      iterations++
      return fn(entry[1], entry[0], this$0)
    }, reverse)
    return iterations
  }

  src_Map__Map.prototype.__ensureOwner = function (ownerID) {
    if (ownerID === this.__ownerID) {
      return this
    }
    if (!ownerID) {
      this.__ownerID = ownerID
      this.__altered = false
      return this
    }
    return makeMap(this.size, this._root, ownerID, this.__hash)
  }


  function isMap(maybeMap) {
    return !!(maybeMap && maybeMap[IS_MAP_SENTINEL])
  }

  src_Map__Map.isMap = isMap

  var IS_MAP_SENTINEL = '@@__IMMUTABLE_MAP__@@'

  const MapPrototype = src_Map__Map.prototype
  MapPrototype[IS_MAP_SENTINEL] = true
  MapPrototype[DELETE] = MapPrototype.remove
  MapPrototype.removeIn = MapPrototype.deleteIn


  // #pragma Trie Nodes


  function ArrayMapNode(ownerID, entries) {
    this.ownerID = ownerID
    this.entries = entries
  }

  ArrayMapNode.prototype.get = function (shift, keyHash, key, notSetValue) {
    const { entries } = this
    for (let ii = 0, len = entries.length; ii < len; ii++) {
      if (is(key, entries[ii][0])) {
        return entries[ii][1]
      }
    }
    return notSetValue
  }

  ArrayMapNode.prototype.update = function (ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
    const removed = value === NOT_SET

    const { entries } = this
    let idx = 0
    for (var len = entries.length; idx < len; idx++) {
      if (is(key, entries[idx][0])) {
        break
      }
    }
    const exists = idx < len

    if (exists ? entries[idx][1] === value : removed) {
      return this
    }

    SetRef(didAlter);
    (removed || !exists) && SetRef(didChangeSize)

    if (removed && entries.length === 1) {
      return // undefined
    }

    if (!exists && !removed && entries.length >= MAX_ARRAY_MAP_SIZE) {
      return createNodes(ownerID, entries, key, value)
    }

    const isEditable = ownerID && ownerID === this.ownerID
    const newEntries = isEditable ? entries : arrCopy(entries)

    if (exists) {
      if (removed) {
        idx === len - 1 ? newEntries.pop() : (newEntries[idx] = newEntries.pop())
      } else {
        newEntries[idx] = [key, value]
      }
    } else {
      newEntries.push([key, value])
    }

    if (isEditable) {
      this.entries = newEntries
      return this
    }

    return new ArrayMapNode(ownerID, newEntries)
  }


  function BitmapIndexedNode(ownerID, bitmap, nodes) {
    this.ownerID = ownerID
    this.bitmap = bitmap
    this.nodes = nodes
  }

  BitmapIndexedNode.prototype.get = function (shift, keyHash, key, notSetValue) {
    if (keyHash === undefined) {
      keyHash = hash(key)
    }
    const bit = (1 << ((shift === 0 ? keyHash : keyHash >>> shift) & MASK))
    const { bitmap } = this
    return (bitmap & bit) === 0 ? notSetValue
      : this.nodes[popCount(bitmap & (bit - 1))].get(shift + SHIFT, keyHash, key, notSetValue)
  }

  BitmapIndexedNode.prototype.update = function (ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
    if (keyHash === undefined) {
      keyHash = hash(key)
    }
    const keyHashFrag = (shift === 0 ? keyHash : keyHash >>> shift) & MASK
    const bit = 1 << keyHashFrag
    const { bitmap } = this
    const exists = (bitmap & bit) !== 0

    if (!exists && value === NOT_SET) {
      return this
    }

    const idx = popCount(bitmap & (bit - 1))
    const { nodes } = this
    const node = exists ? nodes[idx] : undefined
    const newNode = updateNode(node, ownerID, shift + SHIFT, keyHash, key, value, didChangeSize, didAlter)

    if (newNode === node) {
      return this
    }

    if (!exists && newNode && nodes.length >= MAX_BITMAP_INDEXED_SIZE) {
      return expandNodes(ownerID, nodes, bitmap, keyHashFrag, newNode)
    }

    if (exists && !newNode && nodes.length === 2 && isLeafNode(nodes[idx ^ 1])) {
      return nodes[idx ^ 1]
    }

    if (exists && newNode && nodes.length === 1 && isLeafNode(newNode)) {
      return newNode
    }

    const isEditable = ownerID && ownerID === this.ownerID
    const newBitmap = exists ? newNode ? bitmap : bitmap ^ bit : bitmap | bit
    const newNodes = exists ? newNode
      ? setIn(nodes, idx, newNode, isEditable)
      : spliceOut(nodes, idx, isEditable)
      : spliceIn(nodes, idx, newNode, isEditable)

    if (isEditable) {
      this.bitmap = newBitmap
      this.nodes = newNodes
      return this
    }

    return new BitmapIndexedNode(ownerID, newBitmap, newNodes)
  }


  function HashArrayMapNode(ownerID, count, nodes) {
    this.ownerID = ownerID
    this.count = count
    this.nodes = nodes
  }

  HashArrayMapNode.prototype.get = function (shift, keyHash, key, notSetValue) {
    if (keyHash === undefined) {
      keyHash = hash(key)
    }
    const idx = (shift === 0 ? keyHash : keyHash >>> shift) & MASK
    const node = this.nodes[idx]
    return node ? node.get(shift + SHIFT, keyHash, key, notSetValue) : notSetValue
  }

  HashArrayMapNode.prototype.update = function (ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
    if (keyHash === undefined) {
      keyHash = hash(key)
    }
    const idx = (shift === 0 ? keyHash : keyHash >>> shift) & MASK
    const removed = value === NOT_SET
    const { nodes } = this
    const node = nodes[idx]

    if (removed && !node) {
      return this
    }

    const newNode = updateNode(node, ownerID, shift + SHIFT, keyHash, key, value, didChangeSize, didAlter)
    if (newNode === node) {
      return this
    }

    let newCount = this.count
    if (!node) {
      newCount++
    } else if (!newNode) {
      newCount--
      if (newCount < MIN_HASH_ARRAY_MAP_SIZE) {
        return packNodes(ownerID, nodes, newCount, idx)
      }
    }

    const isEditable = ownerID && ownerID === this.ownerID
    const newNodes = setIn(nodes, idx, newNode, isEditable)

    if (isEditable) {
      this.count = newCount
      this.nodes = newNodes
      return this
    }

    return new HashArrayMapNode(ownerID, newCount, newNodes)
  }


  function HashCollisionNode(ownerID, keyHash, entries) {
    this.ownerID = ownerID
    this.keyHash = keyHash
    this.entries = entries
  }

  HashCollisionNode.prototype.get = function (shift, keyHash, key, notSetValue) {
    const { entries } = this
    for (let ii = 0, len = entries.length; ii < len; ii++) {
      if (is(key, entries[ii][0])) {
        return entries[ii][1]
      }
    }
    return notSetValue
  }

  HashCollisionNode.prototype.update = function (ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
    if (keyHash === undefined) {
      keyHash = hash(key)
    }

    const removed = value === NOT_SET

    if (keyHash !== this.keyHash) {
      if (removed) {
        return this
      }
      SetRef(didAlter)
      SetRef(didChangeSize)
      return mergeIntoNode(this, ownerID, shift, keyHash, [key, value])
    }

    const { entries } = this
    let idx = 0
    for (var len = entries.length; idx < len; idx++) {
      if (is(key, entries[idx][0])) {
        break
      }
    }
    const exists = idx < len

    if (exists ? entries[idx][1] === value : removed) {
      return this
    }

    SetRef(didAlter);
    (removed || !exists) && SetRef(didChangeSize)

    if (removed && len === 2) {
      return new ValueNode(ownerID, this.keyHash, entries[idx ^ 1])
    }

    const isEditable = ownerID && ownerID === this.ownerID
    const newEntries = isEditable ? entries : arrCopy(entries)

    if (exists) {
      if (removed) {
        idx === len - 1 ? newEntries.pop() : (newEntries[idx] = newEntries.pop())
      } else {
        newEntries[idx] = [key, value]
      }
    } else {
      newEntries.push([key, value])
    }

    if (isEditable) {
      this.entries = newEntries
      return this
    }

    return new HashCollisionNode(ownerID, this.keyHash, newEntries)
  }


  function ValueNode(ownerID, keyHash, entry) {
    this.ownerID = ownerID
    this.keyHash = keyHash
    this.entry = entry
  }

  ValueNode.prototype.get = function (shift, keyHash, key, notSetValue) {
    return is(key, this.entry[0]) ? this.entry[1] : notSetValue
  }

  ValueNode.prototype.update = function (ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
    const removed = value === NOT_SET
    const keyMatch = is(key, this.entry[0])
    if (keyMatch ? value === this.entry[1] : removed) {
      return this
    }

    SetRef(didAlter)

    if (removed) {
      SetRef(didChangeSize)
      return // undefined
    }

    if (keyMatch) {
      if (ownerID && ownerID === this.ownerID) {
        this.entry[1] = value
        return this
      }
      return new ValueNode(ownerID, this.keyHash, [key, value])
    }

    SetRef(didChangeSize)
    return mergeIntoNode(this, ownerID, shift, hash(key), [key, value])
  }


  // #pragma Iterators

  ArrayMapNode.prototype.iterate = HashCollisionNode.prototype.iterate = function (fn, reverse) {
    const { entries } = this
    for (let ii = 0, maxIndex = entries.length - 1; ii <= maxIndex; ii++) {
      if (fn(entries[reverse ? maxIndex - ii : ii]) === false) {
        return false
      }
    }
  }

  BitmapIndexedNode.prototype.iterate = HashArrayMapNode.prototype.iterate = function (fn, reverse) {
    const { nodes } = this
    for (let ii = 0, maxIndex = nodes.length - 1; ii <= maxIndex; ii++) {
      const node = nodes[reverse ? maxIndex - ii : ii]
      if (node && node.iterate(fn, reverse) === false) {
        return false
      }
    }
  }

  ValueNode.prototype.iterate = function (fn, reverse) {
    return fn(this.entry)
  }

  createClass(MapIterator, src_Iterator__Iterator)

  function MapIterator(map, type, reverse) {
    this._type = type
    this._reverse = reverse
    this._stack = map._root && mapIteratorFrame(map._root)
  }

  MapIterator.prototype.next = function () {
    const type = this._type
    let stack = this._stack
    while (stack) {
      const { node } = stack
      const index = stack.index++
      var maxIndex
      if (node.entry) {
        if (index === 0) {
          return mapIteratorValue(type, node.entry)
        }
      } else if (node.entries) {
        maxIndex = node.entries.length - 1
        if (index <= maxIndex) {
          return mapIteratorValue(type, node.entries[this._reverse ? maxIndex - index : index])
        }
      } else {
        maxIndex = node.nodes.length - 1
        if (index <= maxIndex) {
          const subNode = node.nodes[this._reverse ? maxIndex - index : index]
          if (subNode) {
            if (subNode.entry) {
              return mapIteratorValue(type, subNode.entry)
            }
            stack = this._stack = mapIteratorFrame(subNode, stack)
          }
          continue
        }
      }
      stack = this._stack = this._stack.__prev
    }
    return iteratorDone()
  }


  function mapIteratorValue(type, entry) {
    return iteratorValue(type, entry[0], entry[1])
  }

  function mapIteratorFrame(node, prev) {
    return {
      node,
      index: 0,
      __prev: prev,
    }
  }

  function makeMap(size, root, ownerID, hash) {
    const map = Object.create(MapPrototype)
    map.size = size
    map._root = root
    map.__ownerID = ownerID
    map.__hash = hash
    map.__altered = false
    return map
  }

  let EMPTY_MAP
  function emptyMap() {
    return EMPTY_MAP || (EMPTY_MAP = makeMap(0))
  }

  function updateMap(map, k, v) {
    let newRoot
    let newSize
    if (!map._root) {
      if (v === NOT_SET) {
        return map
      }
      newSize = 1
      newRoot = new ArrayMapNode(map.__ownerID, [[k, v]])
    } else {
      const didChangeSize = MakeRef(CHANGE_LENGTH)
      const didAlter = MakeRef(DID_ALTER)
      newRoot = updateNode(map._root, map.__ownerID, 0, undefined, k, v, didChangeSize, didAlter)
      if (!didAlter.value) {
        return map
      }
      newSize = map.size + (didChangeSize.value ? v === NOT_SET ? -1 : 1 : 0)
    }
    if (map.__ownerID) {
      map.size = newSize
      map._root = newRoot
      map.__hash = undefined
      map.__altered = true
      return map
    }
    return newRoot ? makeMap(newSize, newRoot) : emptyMap()
  }

  function updateNode(node, ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
    if (!node) {
      if (value === NOT_SET) {
        return node
      }
      SetRef(didAlter)
      SetRef(didChangeSize)
      return new ValueNode(ownerID, keyHash, [key, value])
    }
    return node.update(ownerID, shift, keyHash, key, value, didChangeSize, didAlter)
  }

  function isLeafNode(node) {
    return node.constructor === ValueNode || node.constructor === HashCollisionNode
  }

  function mergeIntoNode(node, ownerID, shift, keyHash, entry) {
    if (node.keyHash === keyHash) {
      return new HashCollisionNode(ownerID, keyHash, [node.entry, entry])
    }

    const idx1 = (shift === 0 ? node.keyHash : node.keyHash >>> shift) & MASK
    const idx2 = (shift === 0 ? keyHash : keyHash >>> shift) & MASK

    let newNode
    const nodes = idx1 === idx2
      ? [mergeIntoNode(node, ownerID, shift + SHIFT, keyHash, entry)]
      : ((newNode = new ValueNode(ownerID, keyHash, entry)), idx1 < idx2 ? [node, newNode] : [newNode, node])

    return new BitmapIndexedNode(ownerID, (1 << idx1) | (1 << idx2), nodes)
  }

  function createNodes(ownerID, entries, key, value) {
    if (!ownerID) {
      ownerID = new OwnerID()
    }
    let node = new ValueNode(ownerID, hash(key), [key, value])
    for (let ii = 0; ii < entries.length; ii++) {
      const entry = entries[ii]
      node = node.update(ownerID, 0, undefined, entry[0], entry[1])
    }
    return node
  }

  function packNodes(ownerID, nodes, count, excluding) {
    let bitmap = 0
    let packedII = 0
    const packedNodes = new Array(count)
    for (let ii = 0, bit = 1, len = nodes.length; ii < len; ii++, bit <<= 1) {
      const node = nodes[ii]
      if (node !== undefined && ii !== excluding) {
        bitmap |= bit
        packedNodes[packedII++] = node
      }
    }
    return new BitmapIndexedNode(ownerID, bitmap, packedNodes)
  }

  function expandNodes(ownerID, nodes, bitmap, including, node) {
    let count = 0
    const expandedNodes = new Array(SIZE)
    for (let ii = 0; bitmap !== 0; ii++, bitmap >>>= 1) {
      expandedNodes[ii] = bitmap & 1 ? nodes[count++] : undefined
    }
    expandedNodes[including] = node
    return new HashArrayMapNode(ownerID, count + 1, expandedNodes)
  }

  function mergeIntoMapWith(map, merger, iterables) {
    const iters = []
    for (let ii = 0; ii < iterables.length; ii++) {
      const value = iterables[ii]
      let iter = KeyedIterable(value)
      if (!isIterable(value)) {
        iter = iter.map((v) => fromJS(v))
      }
      iters.push(iter)
    }
    return mergeIntoCollectionWith(map, merger, iters)
  }

  function deepMerger(merger) {
    return function (existing, value, key) {
      return existing && existing.mergeDeepWith && isIterable(value)
        ? existing.mergeDeepWith(merger, value)
        : merger ? merger(existing, value, key) : value
    }
  }

  function mergeIntoCollectionWith(collection, merger, iters) {
    iters = iters.filter((x) => x.size !== 0)
    if (iters.length === 0) {
      return collection
    }
    if (collection.size === 0 && !collection.__ownerID && iters.length === 1) {
      return collection.constructor(iters[0])
    }
    return collection.withMutations((collection) => {
      const mergeIntoMap = merger
        ? function (value, key) {
          collection.update(key, NOT_SET, (existing) => (existing === NOT_SET ? value : merger(existing, value, key)))
        }
        : function (value, key) {
          collection.set(key, value)
        }
      for (let ii = 0; ii < iters.length; ii++) {
        iters[ii].forEach(mergeIntoMap)
      }
    })
  }

  function updateInDeepMap(existing, keyPathIter, notSetValue, updater) {
    const isNotSet = existing === NOT_SET
    const step = keyPathIter.next()
    if (step.done) {
      const existingValue = isNotSet ? notSetValue : existing
      const newValue = updater(existingValue)
      return newValue === existingValue ? existing : newValue
    }
    invariant(
      isNotSet || (existing && existing.set),
      'invalid keyPath',
    )
    const key = step.value
    const nextExisting = isNotSet ? NOT_SET : existing.get(key, NOT_SET)
    const nextUpdated = updateInDeepMap(
      nextExisting,
      keyPathIter,
      notSetValue,
      updater,
    )
    return nextUpdated === nextExisting ? existing
      : nextUpdated === NOT_SET ? existing.remove(key)
        : (isNotSet ? emptyMap() : existing).set(key, nextUpdated)
  }

  function popCount(x) {
    x -= ((x >> 1) & 0x55555555)
    x = (x & 0x33333333) + ((x >> 2) & 0x33333333)
    x = (x + (x >> 4)) & 0x0f0f0f0f
    x += (x >> 8)
    x += (x >> 16)
    return x & 0x7f
  }

  function setIn(array, idx, val, canEdit) {
    const newArray = canEdit ? array : arrCopy(array)
    newArray[idx] = val
    return newArray
  }

  function spliceIn(array, idx, val, canEdit) {
    const newLen = array.length + 1
    if (canEdit && idx + 1 === newLen) {
      array[idx] = val
      return array
    }
    const newArray = new Array(newLen)
    let after = 0
    for (let ii = 0; ii < newLen; ii++) {
      if (ii === idx) {
        newArray[ii] = val
        after = -1
      } else {
        newArray[ii] = array[ii + after]
      }
    }
    return newArray
  }

  function spliceOut(array, idx, canEdit) {
    const newLen = array.length - 1
    if (canEdit && idx === newLen) {
      array.pop()
      return array
    }
    const newArray = new Array(newLen)
    let after = 0
    for (let ii = 0; ii < newLen; ii++) {
      if (ii === idx) {
        after = 1
      }
      newArray[ii] = array[ii + after]
    }
    return newArray
  }

  var MAX_ARRAY_MAP_SIZE = SIZE / 4
  var MAX_BITMAP_INDEXED_SIZE = SIZE / 2
  var MIN_HASH_ARRAY_MAP_SIZE = SIZE / 4

  createClass(List, IndexedCollection)

  // @pragma Construction

  function List(value) {
    const empty = emptyList()
    if (value === null || value === undefined) {
      return empty
    }
    if (isList(value)) {
      return value
    }
    const iter = IndexedIterable(value)
    const { size } = iter
    if (size === 0) {
      return empty
    }
    assertNotInfinite(size)
    if (size > 0 && size < SIZE) {
      return makeList(0, size, SHIFT, null, new VNode(iter.toArray()))
    }
    return empty.withMutations((list) => {
      list.setSize(size)
      iter.forEach((v, i) => list.set(i, v))
    })
  }

  List.of = function (/* ...values */) {
    return this(arguments)
  }

  List.prototype.toString = function () {
    return this.__toString('List [', ']')
  }

  // @pragma Access

  List.prototype.get = function (index, notSetValue) {
    index = wrapIndex(this, index)
    if (index >= 0 && index < this.size) {
      index += this._origin
      const node = listNodeFor(this, index)
      return node && node.array[index & MASK]
    }
    return notSetValue
  }

  // @pragma Modification

  List.prototype.set = function (index, value) {
    return updateList(this, index, value)
  }

  List.prototype.remove = function (index) {
    return !this.has(index) ? this
      : index === 0 ? this.shift()
        : index === this.size - 1 ? this.pop()
          : this.splice(index, 1)
  }

  List.prototype.clear = function () {
    if (this.size === 0) {
      return this
    }
    if (this.__ownerID) {
      this.size = this._origin = this._capacity = 0
      this._level = SHIFT
      this._root = this._tail = null
      this.__hash = undefined
      this.__altered = true
      return this
    }
    return emptyList()
  }

  List.prototype.push = function (/* ...values */) {
    const values = arguments
    const oldSize = this.size
    return this.withMutations((list) => {
      setListBounds(list, 0, oldSize + values.length)
      for (let ii = 0; ii < values.length; ii++) {
        list.set(oldSize + ii, values[ii])
      }
    })
  }

  List.prototype.pop = function () {
    return setListBounds(this, 0, -1)
  }

  List.prototype.unshift = function (/* ...values */) {
    const values = arguments
    return this.withMutations((list) => {
      setListBounds(list, -values.length)
      for (let ii = 0; ii < values.length; ii++) {
        list.set(ii, values[ii])
      }
    })
  }

  List.prototype.shift = function () {
    return setListBounds(this, 1)
  }

  // @pragma Composition

  List.prototype.merge = function (/* ...iters */) {
    return mergeIntoListWith(this, undefined, arguments)
  }

  List.prototype.mergeWith = function (merger) {
    const iters = SLICE$0.call(arguments, 1)
    return mergeIntoListWith(this, merger, iters)
  }

  List.prototype.mergeDeep = function (/* ...iters */) {
    return mergeIntoListWith(this, deepMerger(undefined), arguments)
  }

  List.prototype.mergeDeepWith = function (merger) {
    const iters = SLICE$0.call(arguments, 1)
    return mergeIntoListWith(this, deepMerger(merger), iters)
  }

  List.prototype.setSize = function (size) {
    return setListBounds(this, 0, size)
  }

  // @pragma Iteration

  List.prototype.slice = function (begin, end) {
    const { size } = this
    if (wholeSlice(begin, end, size)) {
      return this
    }
    return setListBounds(
      this,
      resolveBegin(begin, size),
      resolveEnd(end, size),
    )
  }

  List.prototype.__iterator = function (type, reverse) {
    let index = 0
    const values = iterateList(this, reverse)
    return new src_Iterator__Iterator((() => {
      const value = values()
      return value === DONE
        ? iteratorDone()
        : iteratorValue(type, index++, value)
    }))
  }

  List.prototype.__iterate = function (fn, reverse) {
    let index = 0
    const values = iterateList(this, reverse)
    let value
    while ((value = values()) !== DONE) {
      if (fn(value, index++, this) === false) {
        break
      }
    }
    return index
  }

  List.prototype.__ensureOwner = function (ownerID) {
    if (ownerID === this.__ownerID) {
      return this
    }
    if (!ownerID) {
      this.__ownerID = ownerID
      return this
    }
    return makeList(this._origin, this._capacity, this._level, this._root, this._tail, ownerID, this.__hash)
  }


  function isList(maybeList) {
    return !!(maybeList && maybeList[IS_LIST_SENTINEL])
  }

  List.isList = isList

  var IS_LIST_SENTINEL = '@@__IMMUTABLE_LIST__@@'

  const ListPrototype = List.prototype
  ListPrototype[IS_LIST_SENTINEL] = true
  ListPrototype[DELETE] = ListPrototype.remove
  ListPrototype.setIn = MapPrototype.setIn
  ListPrototype.deleteIn = ListPrototype.removeIn = MapPrototype.removeIn
  ListPrototype.update = MapPrototype.update
  ListPrototype.updateIn = MapPrototype.updateIn
  ListPrototype.mergeIn = MapPrototype.mergeIn
  ListPrototype.mergeDeepIn = MapPrototype.mergeDeepIn
  ListPrototype.withMutations = MapPrototype.withMutations
  ListPrototype.asMutable = MapPrototype.asMutable
  ListPrototype.asImmutable = MapPrototype.asImmutable
  ListPrototype.wasAltered = MapPrototype.wasAltered


  function VNode(array, ownerID) {
    this.array = array
    this.ownerID = ownerID
  }

  // TODO: seems like these methods are very similar

  VNode.prototype.removeBefore = function (ownerID, level, index) {
    if (index === level ? 1 << level : 0 || this.array.length === 0) {
      return this
    }
    const originIndex = (index >>> level) & MASK
    if (originIndex >= this.array.length) {
      return new VNode([], ownerID)
    }
    const removingFirst = originIndex === 0
    let newChild
    if (level > 0) {
      const oldChild = this.array[originIndex]
      newChild = oldChild && oldChild.removeBefore(ownerID, level - SHIFT, index)
      if (newChild === oldChild && removingFirst) {
        return this
      }
    }
    if (removingFirst && !newChild) {
      return this
    }
    const editable = editableVNode(this, ownerID)
    if (!removingFirst) {
      for (let ii = 0; ii < originIndex; ii++) {
        editable.array[ii] = undefined
      }
    }
    if (newChild) {
      editable.array[originIndex] = newChild
    }
    return editable
  }

  VNode.prototype.removeAfter = function (ownerID, level, index) {
    if (index === (level ? 1 << level : 0) || this.array.length === 0) {
      return this
    }
    const sizeIndex = ((index - 1) >>> level) & MASK
    if (sizeIndex >= this.array.length) {
      return this
    }

    let newChild
    if (level > 0) {
      const oldChild = this.array[sizeIndex]
      newChild = oldChild && oldChild.removeAfter(ownerID, level - SHIFT, index)
      if (newChild === oldChild && sizeIndex === this.array.length - 1) {
        return this
      }
    }

    const editable = editableVNode(this, ownerID)
    editable.array.splice(sizeIndex + 1)
    if (newChild) {
      editable.array[sizeIndex] = newChild
    }
    return editable
  }


  var DONE = {}

  function iterateList(list, reverse) {
    const left = list._origin
    const right = list._capacity
    const tailPos = getTailOffset(right)
    const tail = list._tail

    return iterateNodeOrLeaf(list._root, list._level, 0)

    function iterateNodeOrLeaf(node, level, offset) {
      return level === 0
        ? iterateLeaf(node, offset)
        : iterateNode(node, level, offset)
    }

    function iterateLeaf(node, offset) {
      const array = offset === tailPos ? tail && tail.array : node && node.array
      let from = offset > left ? 0 : left - offset
      let to = right - offset
      if (to > SIZE) {
        to = SIZE
      }
      return function () {
        if (from === to) {
          return DONE
        }
        const idx = reverse ? --to : from++
        return array && array[idx]
      }
    }

    function iterateNode(node, level, offset) {
      let values
      const array = node && node.array
      let from = offset > left ? 0 : (left - offset) >> level
      let to = ((right - offset) >> level) + 1
      if (to > SIZE) {
        to = SIZE
      }
      return function () {
        do {
          if (values) {
            const value = values()
            if (value !== DONE) {
              return value
            }
            values = null
          }
          if (from === to) {
            return DONE
          }
          const idx = reverse ? --to : from++
          values = iterateNodeOrLeaf(
            array && array[idx], level - SHIFT, offset + (idx << level),
          )
        } while (true)
      }
    }
  }

  function makeList(origin, capacity, level, root, tail, ownerID, hash) {
    const list = Object.create(ListPrototype)
    list.size = capacity - origin
    list._origin = origin
    list._capacity = capacity
    list._level = level
    list._root = root
    list._tail = tail
    list.__ownerID = ownerID
    list.__hash = hash
    list.__altered = false
    return list
  }

  let EMPTY_LIST
  function emptyList() {
    return EMPTY_LIST || (EMPTY_LIST = makeList(0, 0, SHIFT))
  }

  function updateList(list, index, value) {
    index = wrapIndex(list, index)

    if (index !== index) {
      return list
    }

    if (index >= list.size || index < 0) {
      return list.withMutations((list) => {
        index < 0
          ? setListBounds(list, index).set(0, value)
          : setListBounds(list, 0, index + 1).set(index, value)
      })
    }

    index += list._origin

    let newTail = list._tail
    let newRoot = list._root
    const didAlter = MakeRef(DID_ALTER)
    if (index >= getTailOffset(list._capacity)) {
      newTail = updateVNode(newTail, list.__ownerID, 0, index, value, didAlter)
    } else {
      newRoot = updateVNode(newRoot, list.__ownerID, list._level, index, value, didAlter)
    }

    if (!didAlter.value) {
      return list
    }

    if (list.__ownerID) {
      list._root = newRoot
      list._tail = newTail
      list.__hash = undefined
      list.__altered = true
      return list
    }
    return makeList(list._origin, list._capacity, list._level, newRoot, newTail)
  }

  function updateVNode(node, ownerID, level, index, value, didAlter) {
    const idx = (index >>> level) & MASK
    const nodeHas = node && idx < node.array.length
    if (!nodeHas && value === undefined) {
      return node
    }

    let newNode

    if (level > 0) {
      const lowerNode = node && node.array[idx]
      const newLowerNode = updateVNode(lowerNode, ownerID, level - SHIFT, index, value, didAlter)
      if (newLowerNode === lowerNode) {
        return node
      }
      newNode = editableVNode(node, ownerID)
      newNode.array[idx] = newLowerNode
      return newNode
    }

    if (nodeHas && node.array[idx] === value) {
      return node
    }

    SetRef(didAlter)

    newNode = editableVNode(node, ownerID)
    if (value === undefined && idx === newNode.array.length - 1) {
      newNode.array.pop()
    } else {
      newNode.array[idx] = value
    }
    return newNode
  }

  function editableVNode(node, ownerID) {
    if (ownerID && node && ownerID === node.ownerID) {
      return node
    }
    return new VNode(node ? node.array.slice() : [], ownerID)
  }

  function listNodeFor(list, rawIndex) {
    if (rawIndex >= getTailOffset(list._capacity)) {
      return list._tail
    }
    if (rawIndex < 1 << (list._level + SHIFT)) {
      let node = list._root
      let level = list._level
      while (node && level > 0) {
        node = node.array[(rawIndex >>> level) & MASK]
        level -= SHIFT
      }
      return node
    }
  }

  function setListBounds(list, begin, end) {
    // Sanitize begin & end using this shorthand for ToInt32(argument)
    // http://www.ecma-international.org/ecma-262/6.0/#sec-toint32
    if (begin !== undefined) {
      begin |= 0
    }
    if (end !== undefined) {
      end |= 0
    }
    const owner = list.__ownerID || new OwnerID()
    let oldOrigin = list._origin
    let oldCapacity = list._capacity
    let newOrigin = oldOrigin + begin
    let newCapacity = end === undefined ? oldCapacity : end < 0 ? oldCapacity + end : oldOrigin + end
    if (newOrigin === oldOrigin && newCapacity === oldCapacity) {
      return list
    }

    // If it's going to end after it starts, it's empty.
    if (newOrigin >= newCapacity) {
      return list.clear()
    }

    let newLevel = list._level
    let newRoot = list._root

    // New origin might need creating a higher root.
    let offsetShift = 0
    while (newOrigin + offsetShift < 0) {
      newRoot = new VNode(newRoot && newRoot.array.length ? [undefined, newRoot] : [], owner)
      newLevel += SHIFT
      offsetShift += 1 << newLevel
    }
    if (offsetShift) {
      newOrigin += offsetShift
      oldOrigin += offsetShift
      newCapacity += offsetShift
      oldCapacity += offsetShift
    }

    const oldTailOffset = getTailOffset(oldCapacity)
    const newTailOffset = getTailOffset(newCapacity)

    // New size might need creating a higher root.
    while (newTailOffset >= 1 << (newLevel + SHIFT)) {
      newRoot = new VNode(newRoot && newRoot.array.length ? [newRoot] : [], owner)
      newLevel += SHIFT
    }

    // Locate or create the new tail.
    const oldTail = list._tail
    let newTail = newTailOffset < oldTailOffset
      ? listNodeFor(list, newCapacity - 1)
      : newTailOffset > oldTailOffset ? new VNode([], owner) : oldTail

    // Merge Tail into tree.
    if (oldTail && newTailOffset > oldTailOffset && newOrigin < oldCapacity && oldTail.array.length) {
      newRoot = editableVNode(newRoot, owner)
      let node = newRoot
      for (let level = newLevel; level > SHIFT; level -= SHIFT) {
        const idx = (oldTailOffset >>> level) & MASK
        node = node.array[idx] = editableVNode(node.array[idx], owner)
      }
      node.array[(oldTailOffset >>> SHIFT) & MASK] = oldTail
    }

    // If the size has been reduced, there's a chance the tail needs to be trimmed.
    if (newCapacity < oldCapacity) {
      newTail = newTail && newTail.removeAfter(owner, 0, newCapacity)
    }

    // If the new origin is within the tail, then we do not need a root.
    if (newOrigin >= newTailOffset) {
      newOrigin -= newTailOffset
      newCapacity -= newTailOffset
      newLevel = SHIFT
      newRoot = null
      newTail = newTail && newTail.removeBefore(owner, 0, newOrigin)

      // Otherwise, if the root has been trimmed, garbage collect.
    } else if (newOrigin > oldOrigin || newTailOffset < oldTailOffset) {
      offsetShift = 0

      // Identify the new top root node of the subtree of the old root.
      while (newRoot) {
        const beginIndex = (newOrigin >>> newLevel) & MASK
        if (beginIndex !== (newTailOffset >>> newLevel) & MASK) {
          break
        }
        if (beginIndex) {
          offsetShift += (1 << newLevel) * beginIndex
        }
        newLevel -= SHIFT
        newRoot = newRoot.array[beginIndex]
      }

      // Trim the new sides of the new root.
      if (newRoot && newOrigin > oldOrigin) {
        newRoot = newRoot.removeBefore(owner, newLevel, newOrigin - offsetShift)
      }
      if (newRoot && newTailOffset < oldTailOffset) {
        newRoot = newRoot.removeAfter(owner, newLevel, newTailOffset - offsetShift)
      }
      if (offsetShift) {
        newOrigin -= offsetShift
        newCapacity -= offsetShift
      }
    }

    if (list.__ownerID) {
      list.size = newCapacity - newOrigin
      list._origin = newOrigin
      list._capacity = newCapacity
      list._level = newLevel
      list._root = newRoot
      list._tail = newTail
      list.__hash = undefined
      list.__altered = true
      return list
    }
    return makeList(newOrigin, newCapacity, newLevel, newRoot, newTail)
  }

  function mergeIntoListWith(list, merger, iterables) {
    const iters = []
    let maxSize = 0
    for (let ii = 0; ii < iterables.length; ii++) {
      const value = iterables[ii]
      let iter = IndexedIterable(value)
      if (iter.size > maxSize) {
        maxSize = iter.size
      }
      if (!isIterable(value)) {
        iter = iter.map((v) => fromJS(v))
      }
      iters.push(iter)
    }
    if (maxSize > list.size) {
      list = list.setSize(maxSize)
    }
    return mergeIntoCollectionWith(list, merger, iters)
  }

  function getTailOffset(size) {
    return size < SIZE ? 0 : (((size - 1) >>> SHIFT) << SHIFT)
  }

  createClass(OrderedMap, src_Map__Map)

  // @pragma Construction

  function OrderedMap(value) {
    return value === null || value === undefined ? emptyOrderedMap()
      : isOrderedMap(value) ? value
        : emptyOrderedMap().withMutations((map) => {
          const iter = KeyedIterable(value)
          assertNotInfinite(iter.size)
          iter.forEach((v, k) => map.set(k, v))
        })
  }

  OrderedMap.of = function (/* ...values */) {
    return this(arguments)
  }

  OrderedMap.prototype.toString = function () {
    return this.__toString('OrderedMap {', '}')
  }

  // @pragma Access

  OrderedMap.prototype.get = function (k, notSetValue) {
    const index = this._map.get(k)
    return index !== undefined ? this._list.get(index)[1] : notSetValue
  }

  // @pragma Modification

  OrderedMap.prototype.clear = function () {
    if (this.size === 0) {
      return this
    }
    if (this.__ownerID) {
      this.size = 0
      this._map.clear()
      this._list.clear()
      return this
    }
    return emptyOrderedMap()
  }

  OrderedMap.prototype.set = function (k, v) {
    return updateOrderedMap(this, k, v)
  }

  OrderedMap.prototype.remove = function (k) {
    return updateOrderedMap(this, k, NOT_SET)
  }

  OrderedMap.prototype.wasAltered = function () {
    return this._map.wasAltered() || this._list.wasAltered()
  }

  OrderedMap.prototype.__iterate = function (fn, reverse) {
    const this$0 = this
    return this._list.__iterate(
      (entry) => entry && fn(entry[1], entry[0], this$0),
      reverse,
    )
  }

  OrderedMap.prototype.__iterator = function (type, reverse) {
    return this._list.fromEntrySeq().__iterator(type, reverse)
  }

  OrderedMap.prototype.__ensureOwner = function (ownerID) {
    if (ownerID === this.__ownerID) {
      return this
    }
    const newMap = this._map.__ensureOwner(ownerID)
    const newList = this._list.__ensureOwner(ownerID)
    if (!ownerID) {
      this.__ownerID = ownerID
      this._map = newMap
      this._list = newList
      return this
    }
    return makeOrderedMap(newMap, newList, ownerID, this.__hash)
  }


  function isOrderedMap(maybeOrderedMap) {
    return isMap(maybeOrderedMap) && isOrdered(maybeOrderedMap)
  }

  OrderedMap.isOrderedMap = isOrderedMap

  OrderedMap.prototype[IS_ORDERED_SENTINEL] = true
  OrderedMap.prototype[DELETE] = OrderedMap.prototype.remove


  function makeOrderedMap(map, list, ownerID, hash) {
    const omap = Object.create(OrderedMap.prototype)
    omap.size = map ? map.size : 0
    omap._map = map
    omap._list = list
    omap.__ownerID = ownerID
    omap.__hash = hash
    return omap
  }

  let EMPTY_ORDERED_MAP
  function emptyOrderedMap() {
    return EMPTY_ORDERED_MAP || (EMPTY_ORDERED_MAP = makeOrderedMap(emptyMap(), emptyList()))
  }

  function updateOrderedMap(omap, k, v) {
    const map = omap._map
    const list = omap._list
    const i = map.get(k)
    const has = i !== undefined
    let newMap
    let newList
    if (v === NOT_SET) { // removed
      if (!has) {
        return omap
      }
      if (list.size >= SIZE && list.size >= map.size * 2) {
        newList = list.filter((entry, idx) => entry !== undefined && i !== idx)
        newMap = newList.toKeyedSeq().map((entry) => entry[0]).flip().toMap()
        if (omap.__ownerID) {
          newMap.__ownerID = newList.__ownerID = omap.__ownerID
        }
      } else {
        newMap = map.remove(k)
        newList = i === list.size - 1 ? list.pop() : list.set(i, undefined)
      }
    } else if (has) {
      if (v === list.get(i)[1]) {
        return omap
      }
      newMap = map
      newList = list.set(i, [k, v])
    } else {
      newMap = map.set(k, list.size)
      newList = list.set(list.size, [k, v])
    }
    if (omap.__ownerID) {
      omap.size = newMap.size
      omap._map = newMap
      omap._list = newList
      omap.__hash = undefined
      return omap
    }
    return makeOrderedMap(newMap, newList)
  }

  createClass(Stack, IndexedCollection)

  // @pragma Construction

  function Stack(value) {
    return value === null || value === undefined ? emptyStack()
      : isStack(value) ? value
        : emptyStack().unshiftAll(value)
  }

  Stack.of = function (/* ...values */) {
    return this(arguments)
  }

  Stack.prototype.toString = function () {
    return this.__toString('Stack [', ']')
  }

  // @pragma Access

  Stack.prototype.get = function (index, notSetValue) {
    let head = this._head
    index = wrapIndex(this, index)
    while (head && index--) {
      head = head.next
    }
    return head ? head.value : notSetValue
  }

  Stack.prototype.peek = function () {
    return this._head && this._head.value
  }

  // @pragma Modification

  Stack.prototype.push = function (/* ...values */) {
    if (arguments.length === 0) {
      return this
    }
    const newSize = this.size + arguments.length
    let head = this._head
    for (let ii = arguments.length - 1; ii >= 0; ii--) {
      head = {
        value: arguments[ii],
        next: head,
      }
    }
    if (this.__ownerID) {
      this.size = newSize
      this._head = head
      this.__hash = undefined
      this.__altered = true
      return this
    }
    return makeStack(newSize, head)
  }

  Stack.prototype.pushAll = function (iter) {
    iter = IndexedIterable(iter)
    if (iter.size === 0) {
      return this
    }
    assertNotInfinite(iter.size)
    let newSize = this.size
    let head = this._head
    iter.reverse().forEach((value) => {
      newSize++
      head = {
        value,
        next: head,
      }
    })
    if (this.__ownerID) {
      this.size = newSize
      this._head = head
      this.__hash = undefined
      this.__altered = true
      return this
    }
    return makeStack(newSize, head)
  }

  Stack.prototype.pop = function () {
    return this.slice(1)
  }

  Stack.prototype.unshift = function (/* ...values */) {
    return this.push.apply(this, arguments)
  }

  Stack.prototype.unshiftAll = function (iter) {
    return this.pushAll(iter)
  }

  Stack.prototype.shift = function () {
    return this.pop.apply(this, arguments)
  }

  Stack.prototype.clear = function () {
    if (this.size === 0) {
      return this
    }
    if (this.__ownerID) {
      this.size = 0
      this._head = undefined
      this.__hash = undefined
      this.__altered = true
      return this
    }
    return emptyStack()
  }

  Stack.prototype.slice = function (begin, end) {
    if (wholeSlice(begin, end, this.size)) {
      return this
    }
    let resolvedBegin = resolveBegin(begin, this.size)
    const resolvedEnd = resolveEnd(end, this.size)
    if (resolvedEnd !== this.size) {
      // super.slice(begin, end);
      return IndexedCollection.prototype.slice.call(this, begin, end)
    }
    const newSize = this.size - resolvedBegin
    let head = this._head
    while (resolvedBegin--) {
      head = head.next
    }
    if (this.__ownerID) {
      this.size = newSize
      this._head = head
      this.__hash = undefined
      this.__altered = true
      return this
    }
    return makeStack(newSize, head)
  }

  // @pragma Mutability

  Stack.prototype.__ensureOwner = function (ownerID) {
    if (ownerID === this.__ownerID) {
      return this
    }
    if (!ownerID) {
      this.__ownerID = ownerID
      this.__altered = false
      return this
    }
    return makeStack(this.size, this._head, ownerID, this.__hash)
  }

  // @pragma Iteration

  Stack.prototype.__iterate = function (fn, reverse) {
    if (reverse) {
      return this.reverse().__iterate(fn)
    }
    let iterations = 0
    let node = this._head
    while (node) {
      if (fn(node.value, iterations++, this) === false) {
        break
      }
      node = node.next
    }
    return iterations
  }

  Stack.prototype.__iterator = function (type, reverse) {
    if (reverse) {
      return this.reverse().__iterator(type)
    }
    let iterations = 0
    let node = this._head
    return new src_Iterator__Iterator((() => {
      if (node) {
        const { value } = node
        node = node.next
        return iteratorValue(type, iterations++, value)
      }
      return iteratorDone()
    }))
  }


  function isStack(maybeStack) {
    return !!(maybeStack && maybeStack[IS_STACK_SENTINEL])
  }

  Stack.isStack = isStack

  var IS_STACK_SENTINEL = '@@__IMMUTABLE_STACK__@@'

  const StackPrototype = Stack.prototype
  StackPrototype[IS_STACK_SENTINEL] = true
  StackPrototype.withMutations = MapPrototype.withMutations
  StackPrototype.asMutable = MapPrototype.asMutable
  StackPrototype.asImmutable = MapPrototype.asImmutable
  StackPrototype.wasAltered = MapPrototype.wasAltered


  function makeStack(size, head, ownerID, hash) {
    const map = Object.create(StackPrototype)
    map.size = size
    map._head = head
    map.__ownerID = ownerID
    map.__hash = hash
    map.__altered = false
    return map
  }

  let EMPTY_STACK
  function emptyStack() {
    return EMPTY_STACK || (EMPTY_STACK = makeStack(0))
  }

  createClass(src_Set__Set, SetCollection)

  // @pragma Construction

  function src_Set__Set(value) {
    return value === null || value === undefined ? emptySet()
      : isSet(value) && !isOrdered(value) ? value
        : emptySet().withMutations((set) => {
          const iter = SetIterable(value)
          assertNotInfinite(iter.size)
          iter.forEach((v) => set.add(v))
        })
  }

  src_Set__Set.of = function (/* ...values */) {
    return this(arguments)
  }

  src_Set__Set.fromKeys = function (value) {
    return this(KeyedIterable(value).keySeq())
  }

  src_Set__Set.prototype.toString = function () {
    return this.__toString('Set {', '}')
  }

  // @pragma Access

  src_Set__Set.prototype.has = function (value) {
    return this._map.has(value)
  }

  // @pragma Modification

  src_Set__Set.prototype.add = function (value) {
    return updateSet(this, this._map.set(value, true))
  }

  src_Set__Set.prototype.remove = function (value) {
    return updateSet(this, this._map.remove(value))
  }

  src_Set__Set.prototype.clear = function () {
    return updateSet(this, this._map.clear())
  }

  // @pragma Composition

  src_Set__Set.prototype.union = function () {
    let iters = SLICE$0.call(arguments, 0)
    iters = iters.filter((x) => x.size !== 0)
    if (iters.length === 0) {
      return this
    }
    if (this.size === 0 && !this.__ownerID && iters.length === 1) {
      return this.constructor(iters[0])
    }
    return this.withMutations((set) => {
      for (let ii = 0; ii < iters.length; ii++) {
        SetIterable(iters[ii]).forEach((value) => set.add(value))
      }
    })
  }

  src_Set__Set.prototype.intersect = function () {
    let iters = SLICE$0.call(arguments, 0)
    if (iters.length === 0) {
      return this
    }
    iters = iters.map((iter) => SetIterable(iter))
    const originalSet = this
    return this.withMutations((set) => {
      originalSet.forEach((value) => {
        if (!iters.every((iter) => iter.includes(value))) {
          set.remove(value)
        }
      })
    })
  }

  src_Set__Set.prototype.subtract = function () {
    let iters = SLICE$0.call(arguments, 0)
    if (iters.length === 0) {
      return this
    }
    iters = iters.map((iter) => SetIterable(iter))
    const originalSet = this
    return this.withMutations((set) => {
      originalSet.forEach((value) => {
        if (iters.some((iter) => iter.includes(value))) {
          set.remove(value)
        }
      })
    })
  }

  src_Set__Set.prototype.merge = function () {
    return this.union.apply(this, arguments)
  }

  src_Set__Set.prototype.mergeWith = function (merger) {
    const iters = SLICE$0.call(arguments, 1)
    return this.union.apply(this, iters)
  }

  src_Set__Set.prototype.sort = function (comparator) {
    // Late binding
    return OrderedSet(sortFactory(this, comparator))
  }

  src_Set__Set.prototype.sortBy = function (mapper, comparator) {
    // Late binding
    return OrderedSet(sortFactory(this, comparator, mapper))
  }

  src_Set__Set.prototype.wasAltered = function () {
    return this._map.wasAltered()
  }

  src_Set__Set.prototype.__iterate = function (fn, reverse) {
    const this$0 = this
    return this._map.__iterate((_, k) => fn(k, k, this$0), reverse)
  }

  src_Set__Set.prototype.__iterator = function (type, reverse) {
    return this._map.map((_, k) => k).__iterator(type, reverse)
  }

  src_Set__Set.prototype.__ensureOwner = function (ownerID) {
    if (ownerID === this.__ownerID) {
      return this
    }
    const newMap = this._map.__ensureOwner(ownerID)
    if (!ownerID) {
      this.__ownerID = ownerID
      this._map = newMap
      return this
    }
    return this.__make(newMap, ownerID)
  }


  function isSet(maybeSet) {
    return !!(maybeSet && maybeSet[IS_SET_SENTINEL])
  }

  src_Set__Set.isSet = isSet

  var IS_SET_SENTINEL = '@@__IMMUTABLE_SET__@@'

  const SetPrototype = src_Set__Set.prototype
  SetPrototype[IS_SET_SENTINEL] = true
  SetPrototype[DELETE] = SetPrototype.remove
  SetPrototype.mergeDeep = SetPrototype.merge
  SetPrototype.mergeDeepWith = SetPrototype.mergeWith
  SetPrototype.withMutations = MapPrototype.withMutations
  SetPrototype.asMutable = MapPrototype.asMutable
  SetPrototype.asImmutable = MapPrototype.asImmutable

  SetPrototype.__empty = emptySet
  SetPrototype.__make = makeSet

  function updateSet(set, newMap) {
    if (set.__ownerID) {
      set.size = newMap.size
      set._map = newMap
      return set
    }
    return newMap === set._map ? set
      : newMap.size === 0 ? set.__empty()
        : set.__make(newMap)
  }

  function makeSet(map, ownerID) {
    const set = Object.create(SetPrototype)
    set.size = map ? map.size : 0
    set._map = map
    set.__ownerID = ownerID
    return set
  }

  let EMPTY_SET
  function emptySet() {
    return EMPTY_SET || (EMPTY_SET = makeSet(emptyMap()))
  }

  createClass(OrderedSet, src_Set__Set)

  // @pragma Construction

  function OrderedSet(value) {
    return value === null || value === undefined ? emptyOrderedSet()
      : isOrderedSet(value) ? value
        : emptyOrderedSet().withMutations((set) => {
          const iter = SetIterable(value)
          assertNotInfinite(iter.size)
          iter.forEach((v) => set.add(v))
        })
  }

  OrderedSet.of = function (/* ...values */) {
    return this(arguments)
  }

  OrderedSet.fromKeys = function (value) {
    return this(KeyedIterable(value).keySeq())
  }

  OrderedSet.prototype.toString = function () {
    return this.__toString('OrderedSet {', '}')
  }


  function isOrderedSet(maybeOrderedSet) {
    return isSet(maybeOrderedSet) && isOrdered(maybeOrderedSet)
  }

  OrderedSet.isOrderedSet = isOrderedSet

  const OrderedSetPrototype = OrderedSet.prototype
  OrderedSetPrototype[IS_ORDERED_SENTINEL] = true

  OrderedSetPrototype.__empty = emptyOrderedSet
  OrderedSetPrototype.__make = makeOrderedSet

  function makeOrderedSet(map, ownerID) {
    const set = Object.create(OrderedSetPrototype)
    set.size = map ? map.size : 0
    set._map = map
    set.__ownerID = ownerID
    return set
  }

  let EMPTY_ORDERED_SET
  function emptyOrderedSet() {
    return EMPTY_ORDERED_SET || (EMPTY_ORDERED_SET = makeOrderedSet(emptyOrderedMap()))
  }

  createClass(Record, KeyedCollection)

  function Record(defaultValues, name) {
    let hasInitialized

    var RecordType = function Record(values) {
      if (values instanceof RecordType) {
        return values
      }
      if (!(this instanceof RecordType)) {
        return new RecordType(values)
      }
      if (!hasInitialized) {
        hasInitialized = true
        const keys = Object.keys(defaultValues)
        setProps(RecordTypePrototype, keys)
        RecordTypePrototype.size = keys.length
        RecordTypePrototype._name = name
        RecordTypePrototype._keys = keys
        RecordTypePrototype._defaultValues = defaultValues
      }
      this._map = src_Map__Map(values)
    }

    var RecordTypePrototype = RecordType.prototype = Object.create(RecordPrototype)
    RecordTypePrototype.constructor = RecordType

    return RecordType
  }

  Record.prototype.toString = function () {
    return this.__toString(`${recordName(this)} {`, '}')
  }

  // @pragma Access

  Record.prototype.has = function (k) {
    return this._defaultValues.hasOwnProperty(k)
  }

  Record.prototype.get = function (k, notSetValue) {
    if (!this.has(k)) {
      return notSetValue
    }
    const defaultVal = this._defaultValues[k]
    return this._map ? this._map.get(k, defaultVal) : defaultVal
  }

  // @pragma Modification

  Record.prototype.clear = function () {
    if (this.__ownerID) {
      this._map && this._map.clear()
      return this
    }
    const RecordType = this.constructor
    return RecordType._empty || (RecordType._empty = makeRecord(this, emptyMap()))
  }

  Record.prototype.set = function (k, v) {
    if (!this.has(k)) {
      throw new Error(`Cannot set unknown key "${k}" on ${recordName(this)}`)
    }
    const newMap = this._map && this._map.set(k, v)
    if (this.__ownerID || newMap === this._map) {
      return this
    }
    return makeRecord(this, newMap)
  }

  Record.prototype.remove = function (k) {
    if (!this.has(k)) {
      return this
    }
    const newMap = this._map && this._map.remove(k)
    if (this.__ownerID || newMap === this._map) {
      return this
    }
    return makeRecord(this, newMap)
  }

  Record.prototype.wasAltered = function () {
    return this._map.wasAltered()
  }

  Record.prototype.__iterator = function (type, reverse) {
    const this$0 = this
    return KeyedIterable(this._defaultValues).map((_, k) => this$0.get(k)).__iterator(type, reverse)
  }

  Record.prototype.__iterate = function (fn, reverse) {
    const this$0 = this
    return KeyedIterable(this._defaultValues).map((_, k) => this$0.get(k)).__iterate(fn, reverse)
  }

  Record.prototype.__ensureOwner = function (ownerID) {
    if (ownerID === this.__ownerID) {
      return this
    }
    const newMap = this._map && this._map.__ensureOwner(ownerID)
    if (!ownerID) {
      this.__ownerID = ownerID
      this._map = newMap
      return this
    }
    return makeRecord(this, newMap, ownerID)
  }


  var RecordPrototype = Record.prototype
  RecordPrototype[DELETE] = RecordPrototype.remove
  RecordPrototype.deleteIn = RecordPrototype.removeIn = MapPrototype.removeIn
  RecordPrototype.merge = MapPrototype.merge
  RecordPrototype.mergeWith = MapPrototype.mergeWith
  RecordPrototype.mergeIn = MapPrototype.mergeIn
  RecordPrototype.mergeDeep = MapPrototype.mergeDeep
  RecordPrototype.mergeDeepWith = MapPrototype.mergeDeepWith
  RecordPrototype.mergeDeepIn = MapPrototype.mergeDeepIn
  RecordPrototype.setIn = MapPrototype.setIn
  RecordPrototype.update = MapPrototype.update
  RecordPrototype.updateIn = MapPrototype.updateIn
  RecordPrototype.withMutations = MapPrototype.withMutations
  RecordPrototype.asMutable = MapPrototype.asMutable
  RecordPrototype.asImmutable = MapPrototype.asImmutable


  function makeRecord(likeRecord, map, ownerID) {
    const record = Object.create(Object.getPrototypeOf(likeRecord))
    record._map = map
    record.__ownerID = ownerID
    return record
  }

  function recordName(record) {
    return record._name || record.constructor.name || 'Record'
  }

  function setProps(prototype, names) {
    try {
      names.forEach(setProp.bind(undefined, prototype))
    } catch (error) {
      // Object.defineProperty failed. Probably IE8.
    }
  }

  function setProp(prototype, name) {
    Object.defineProperty(prototype, name, {
      get() {
        return this.get(name)
      },
      set(value) {
        invariant(this.__ownerID, 'Cannot set on an immutable record.')
        this.set(name, value)
      },
    })
  }

  function deepEqual(a, b) {
    if (a === b) {
      return true
    }

    if (
      !isIterable(b)
            || a.size !== undefined && b.size !== undefined && a.size !== b.size
            || a.__hash !== undefined && b.__hash !== undefined && a.__hash !== b.__hash
            || isKeyed(a) !== isKeyed(b)
            || isIndexed(a) !== isIndexed(b)
            || isOrdered(a) !== isOrdered(b)
    ) {
      return false
    }

    if (a.size === 0 && b.size === 0) {
      return true
    }

    const notAssociative = !isAssociative(a)

    if (isOrdered(a)) {
      const entries = a.entries()
      return b.every((v, k) => {
        const entry = entries.next().value
        return entry && is(entry[1], v) && (notAssociative || is(entry[0], k))
      }) && entries.next().done
    }

    let flipped = false

    if (a.size === undefined) {
      if (b.size === undefined) {
        if (typeof a.cacheResult === 'function') {
          a.cacheResult()
        }
      } else {
        flipped = true
        const _ = a
        a = b
        b = _
      }
    }

    let allEqual = true
    const bSize = b.__iterate((v, k) => {
      if (notAssociative ? !a.has(v)
        : flipped ? !is(v, a.get(k, NOT_SET)) : !is(a.get(k, NOT_SET), v)) {
        allEqual = false
        return false
      }
    })

    return allEqual && a.size === bSize
  }

  createClass(Range, IndexedSeq)

  function Range(start, end, step) {
    if (!(this instanceof Range)) {
      return new Range(start, end, step)
    }
    invariant(step !== 0, 'Cannot step a Range by 0')
    start = start || 0
    if (end === undefined) {
      end = Infinity
    }
    step = step === undefined ? 1 : Math.abs(step)
    if (end < start) {
      step = -step
    }
    this._start = start
    this._end = end
    this._step = step
    this.size = Math.max(0, Math.ceil((end - start) / step - 1) + 1)
    if (this.size === 0) {
      if (EMPTY_RANGE) {
        return EMPTY_RANGE
      }
      EMPTY_RANGE = this
    }
  }

  Range.prototype.toString = function () {
    if (this.size === 0) {
      return 'Range []'
    }
    return `Range [ ${
      this._start}...${this._end
    }${this._step > 1 ? ` by ${this._step}` : ''
    } ]`
  }

  Range.prototype.get = function (index, notSetValue) {
    return this.has(index)
      ? this._start + wrapIndex(this, index) * this._step
      : notSetValue
  }

  Range.prototype.includes = function (searchValue) {
    const possibleIndex = (searchValue - this._start) / this._step
    return possibleIndex >= 0
            && possibleIndex < this.size
            && possibleIndex === Math.floor(possibleIndex)
  }

  Range.prototype.slice = function (begin, end) {
    if (wholeSlice(begin, end, this.size)) {
      return this
    }
    begin = resolveBegin(begin, this.size)
    end = resolveEnd(end, this.size)
    if (end <= begin) {
      return new Range(0, 0)
    }
    return new Range(this.get(begin, this._end), this.get(end, this._end), this._step)
  }

  Range.prototype.indexOf = function (searchValue) {
    const offsetValue = searchValue - this._start
    if (offsetValue % this._step === 0) {
      const index = offsetValue / this._step
      if (index >= 0 && index < this.size) {
        return index
      }
    }
    return -1
  }

  Range.prototype.lastIndexOf = function (searchValue) {
    return this.indexOf(searchValue)
  }

  Range.prototype.__iterate = function (fn, reverse) {
    const maxIndex = this.size - 1
    const step = this._step
    let value = reverse ? this._start + maxIndex * step : this._start
    for (var ii = 0; ii <= maxIndex; ii++) {
      if (fn(value, ii, this) === false) {
        return ii + 1
      }
      value += reverse ? -step : step
    }
    return ii
  }

  Range.prototype.__iterator = function (type, reverse) {
    const maxIndex = this.size - 1
    const step = this._step
    let value = reverse ? this._start + maxIndex * step : this._start
    let ii = 0
    return new src_Iterator__Iterator((() => {
      const v = value
      value += reverse ? -step : step
      return ii > maxIndex ? iteratorDone() : iteratorValue(type, ii++, v)
    }))
  }

  Range.prototype.equals = function (other) {
    return other instanceof Range
      ? this._start === other._start
        && this._end === other._end
        && this._step === other._step
      : deepEqual(this, other)
  }


  let EMPTY_RANGE

  createClass(Repeat, IndexedSeq)

  function Repeat(value, times) {
    if (!(this instanceof Repeat)) {
      return new Repeat(value, times)
    }
    this._value = value
    this.size = times === undefined ? Infinity : Math.max(0, times)
    if (this.size === 0) {
      if (EMPTY_REPEAT) {
        return EMPTY_REPEAT
      }
      EMPTY_REPEAT = this
    }
  }

  Repeat.prototype.toString = function () {
    if (this.size === 0) {
      return 'Repeat []'
    }
    return `Repeat [ ${this._value} ${this.size} times ]`
  }

  Repeat.prototype.get = function (index, notSetValue) {
    return this.has(index) ? this._value : notSetValue
  }

  Repeat.prototype.includes = function (searchValue) {
    return is(this._value, searchValue)
  }

  Repeat.prototype.slice = function (begin, end) {
    const { size } = this
    return wholeSlice(begin, end, size) ? this
      : new Repeat(this._value, resolveEnd(end, size) - resolveBegin(begin, size))
  }

  Repeat.prototype.reverse = function () {
    return this
  }

  Repeat.prototype.indexOf = function (searchValue) {
    if (is(this._value, searchValue)) {
      return 0
    }
    return -1
  }

  Repeat.prototype.lastIndexOf = function (searchValue) {
    if (is(this._value, searchValue)) {
      return this.size
    }
    return -1
  }

  Repeat.prototype.__iterate = function (fn, reverse) {
    for (var ii = 0; ii < this.size; ii++) {
      if (fn(this._value, ii, this) === false) {
        return ii + 1
      }
    }
    return ii
  }

  Repeat.prototype.__iterator = function (type, reverse) {
    const this$0 = this
    let ii = 0
    return new src_Iterator__Iterator((() => (ii < this$0.size ? iteratorValue(type, ii++, this$0._value) : iteratorDone())))
  }

  Repeat.prototype.equals = function (other) {
    return other instanceof Repeat
      ? is(this._value, other._value)
      : deepEqual(other)
  }


  let EMPTY_REPEAT

  /**
     * Contributes additional methods to a constructor
     */
  function mixin(ctor, methods) {
    const keyCopier = function (key) { ctor.prototype[key] = methods[key] }
    Object.keys(methods).forEach(keyCopier)
    Object.getOwnPropertySymbols
        && Object.getOwnPropertySymbols(methods).forEach(keyCopier)
    return ctor
  }

  Iterable.Iterator = src_Iterator__Iterator

  mixin(Iterable, {

    // ### Conversion to other types

    toArray() {
      assertNotInfinite(this.size)
      const array = new Array(this.size || 0)
      this.valueSeq().__iterate((v, i) => { array[i] = v })
      return array
    },

    toIndexedSeq() {
      return new ToIndexedSequence(this)
    },

    toJS() {
      return this.toSeq().map(
        (value) => (value && typeof value.toJS === 'function' ? value.toJS() : value),
      ).__toJS()
    },

    toJSON() {
      return this.toSeq().map(
        (value) => (value && typeof value.toJSON === 'function' ? value.toJSON() : value),
      ).__toJS()
    },

    toKeyedSeq() {
      return new ToKeyedSequence(this, true)
    },

    toMap() {
      // Use Late Binding here to solve the circular dependency.
      return src_Map__Map(this.toKeyedSeq())
    },

    toObject() {
      assertNotInfinite(this.size)
      const object = {}
      this.__iterate((v, k) => { object[k] = v })
      return object
    },

    toOrderedMap() {
      // Use Late Binding here to solve the circular dependency.
      return OrderedMap(this.toKeyedSeq())
    },

    toOrderedSet() {
      // Use Late Binding here to solve the circular dependency.
      return OrderedSet(isKeyed(this) ? this.valueSeq() : this)
    },

    toSet() {
      // Use Late Binding here to solve the circular dependency.
      return src_Set__Set(isKeyed(this) ? this.valueSeq() : this)
    },

    toSetSeq() {
      return new ToSetSequence(this)
    },

    toSeq() {
      return isIndexed(this) ? this.toIndexedSeq()
        : isKeyed(this) ? this.toKeyedSeq()
          : this.toSetSeq()
    },

    toStack() {
      // Use Late Binding here to solve the circular dependency.
      return Stack(isKeyed(this) ? this.valueSeq() : this)
    },

    toList() {
      // Use Late Binding here to solve the circular dependency.
      return List(isKeyed(this) ? this.valueSeq() : this)
    },


    // ### Common JavaScript methods and properties

    toString() {
      return '[Iterable]'
    },

    __toString(head, tail) {
      if (this.size === 0) {
        return head + tail
      }
      return `${head} ${this.toSeq().map(this.__toStringMapper).join(', ')} ${tail}`
    },


    // ### ES6 Collection methods (ES6 Array and Map)

    concat() {
      const values = SLICE$0.call(arguments, 0)
      return reify(this, concatFactory(this, values))
    },

    includes(searchValue) {
      return this.some((value) => is(value, searchValue))
    },

    entries() {
      return this.__iterator(ITERATE_ENTRIES)
    },

    every(predicate, context) {
      assertNotInfinite(this.size)
      let returnValue = true
      this.__iterate((v, k, c) => {
        if (!predicate.call(context, v, k, c)) {
          returnValue = false
          return false
        }
      })
      return returnValue
    },

    filter(predicate, context) {
      return reify(this, filterFactory(this, predicate, context, true))
    },

    find(predicate, context, notSetValue) {
      const entry = this.findEntry(predicate, context)
      return entry ? entry[1] : notSetValue
    },

    findEntry(predicate, context) {
      let found
      this.__iterate((v, k, c) => {
        if (predicate.call(context, v, k, c)) {
          found = [k, v]
          return false
        }
      })
      return found
    },

    findLastEntry(predicate, context) {
      return this.toSeq().reverse().findEntry(predicate, context)
    },

    forEach(sideEffect, context) {
      assertNotInfinite(this.size)
      return this.__iterate(context ? sideEffect.bind(context) : sideEffect)
    },

    join(separator) {
      assertNotInfinite(this.size)
      separator = separator !== undefined ? `${separator}` : ','
      let joined = ''
      let isFirst = true
      this.__iterate((v) => {
        isFirst ? (isFirst = false) : (joined += separator)
        joined += v !== null && v !== undefined ? v.toString() : ''
      })
      return joined
    },

    keys() {
      return this.__iterator(ITERATE_KEYS)
    },

    map(mapper, context) {
      return reify(this, mapFactory(this, mapper, context))
    },

    reduce(reducer, initialReduction, context) {
      assertNotInfinite(this.size)
      let reduction
      let useFirst
      if (arguments.length < 2) {
        useFirst = true
      } else {
        reduction = initialReduction
      }
      this.__iterate((v, k, c) => {
        if (useFirst) {
          useFirst = false
          reduction = v
        } else {
          reduction = reducer.call(context, reduction, v, k, c)
        }
      })
      return reduction
    },

    reduceRight(reducer, initialReduction, context) {
      const reversed = this.toKeyedSeq().reverse()
      return reversed.reduce.apply(reversed, arguments)
    },

    reverse() {
      return reify(this, reverseFactory(this, true))
    },

    slice(begin, end) {
      return reify(this, sliceFactory(this, begin, end, true))
    },

    some(predicate, context) {
      return !this.every(not(predicate), context)
    },

    sort(comparator) {
      return reify(this, sortFactory(this, comparator))
    },

    values() {
      return this.__iterator(ITERATE_VALUES)
    },


    // ### More sequential methods

    butLast() {
      return this.slice(0, -1)
    },

    isEmpty() {
      return this.size !== undefined ? this.size === 0 : !this.some(() => true)
    },

    count(predicate, context) {
      return ensureSize(
        predicate ? this.toSeq().filter(predicate, context) : this,
      )
    },

    countBy(grouper, context) {
      return countByFactory(this, grouper, context)
    },

    equals(other) {
      return deepEqual(this, other)
    },

    entrySeq() {
      const iterable = this
      if (iterable._cache) {
        // We cache as an entries array, so we can just return the cache!
        return new ArraySeq(iterable._cache)
      }
      const entriesSequence = iterable.toSeq().map(entryMapper).toIndexedSeq()
      entriesSequence.fromEntrySeq = function () { return iterable.toSeq() }
      return entriesSequence
    },

    filterNot(predicate, context) {
      return this.filter(not(predicate), context)
    },

    findLast(predicate, context, notSetValue) {
      return this.toKeyedSeq().reverse().find(predicate, context, notSetValue)
    },

    first() {
      return this.find(returnTrue)
    },

    flatMap(mapper, context) {
      return reify(this, flatMapFactory(this, mapper, context))
    },

    flatten(depth) {
      return reify(this, flattenFactory(this, depth, true))
    },

    fromEntrySeq() {
      return new FromEntriesSequence(this)
    },

    get(searchKey, notSetValue) {
      return this.find((_, key) => is(key, searchKey), undefined, notSetValue)
    },

    getIn(searchKeyPath, notSetValue) {
      let nested = this
      // Note: in an ES6 environment, we would prefer:
      // for (var key of searchKeyPath) {
      const iter = forceIterator(searchKeyPath)
      let step
      while (!(step = iter.next()).done) {
        const key = step.value
        nested = nested && nested.get ? nested.get(key, NOT_SET) : NOT_SET
        if (nested === NOT_SET) {
          return notSetValue
        }
      }
      return nested
    },

    groupBy(grouper, context) {
      return groupByFactory(this, grouper, context)
    },

    has(searchKey) {
      return this.get(searchKey, NOT_SET) !== NOT_SET
    },

    hasIn(searchKeyPath) {
      return this.getIn(searchKeyPath, NOT_SET) !== NOT_SET
    },

    isSubset(iter) {
      iter = typeof iter.includes === 'function' ? iter : Iterable(iter)
      return this.every((value) => iter.includes(value))
    },

    isSuperset(iter) {
      iter = typeof iter.isSubset === 'function' ? iter : Iterable(iter)
      return iter.isSubset(this)
    },

    keySeq() {
      return this.toSeq().map(keyMapper).toIndexedSeq()
    },

    last() {
      return this.toSeq().reverse().first()
    },

    max(comparator) {
      return maxFactory(this, comparator)
    },

    maxBy(mapper, comparator) {
      return maxFactory(this, comparator, mapper)
    },

    min(comparator) {
      return maxFactory(this, comparator ? neg(comparator) : defaultNegComparator)
    },

    minBy(mapper, comparator) {
      return maxFactory(this, comparator ? neg(comparator) : defaultNegComparator, mapper)
    },

    rest() {
      return this.slice(1)
    },

    skip(amount) {
      return this.slice(Math.max(0, amount))
    },

    skipLast(amount) {
      return reify(this, this.toSeq().reverse().skip(amount).reverse())
    },

    skipWhile(predicate, context) {
      return reify(this, skipWhileFactory(this, predicate, context, true))
    },

    skipUntil(predicate, context) {
      return this.skipWhile(not(predicate), context)
    },

    sortBy(mapper, comparator) {
      return reify(this, sortFactory(this, comparator, mapper))
    },

    take(amount) {
      return this.slice(0, Math.max(0, amount))
    },

    takeLast(amount) {
      return reify(this, this.toSeq().reverse().take(amount).reverse())
    },

    takeWhile(predicate, context) {
      return reify(this, takeWhileFactory(this, predicate, context))
    },

    takeUntil(predicate, context) {
      return this.takeWhile(not(predicate), context)
    },

    valueSeq() {
      return this.toIndexedSeq()
    },


    // ### Hashable Object

    hashCode() {
      return this.__hash || (this.__hash = hashIterable(this))
    },


    // ### Internal

    // abstract __iterate(fn, reverse)

    // abstract __iterator(type, reverse)
  })

  // var IS_ITERABLE_SENTINEL = '@@__IMMUTABLE_ITERABLE__@@';
  // var IS_KEYED_SENTINEL = '@@__IMMUTABLE_KEYED__@@';
  // var IS_INDEXED_SENTINEL = '@@__IMMUTABLE_INDEXED__@@';
  // var IS_ORDERED_SENTINEL = '@@__IMMUTABLE_ORDERED__@@';

  const IterablePrototype = Iterable.prototype
  IterablePrototype[IS_ITERABLE_SENTINEL] = true
  IterablePrototype[ITERATOR_SYMBOL] = IterablePrototype.values
  IterablePrototype.__toJS = IterablePrototype.toArray
  IterablePrototype.__toStringMapper = quoteString
  IterablePrototype.inspect = IterablePrototype.toSource = function () { return this.toString() }
  IterablePrototype.chain = IterablePrototype.flatMap
  IterablePrototype.contains = IterablePrototype.includes;

  // Temporary warning about using length
  (function () {
    try {
      Object.defineProperty(IterablePrototype, 'length', {
        get() {
          if (!Iterable.noLengthWarning) {
            let stack
            try {
              throw new Error()
            } catch (error) {
              stack = error.stack
            }
            if (stack.indexOf('_wrapObject') === -1) {
              console && console.warn && console.warn(
                `${'iterable.length has been deprecated, '
                                + 'use iterable.size or iterable.count(). '
                                + 'This warning will become a silent error in a future version. '}${
                  stack}`,
              )
              return this.size
            }
          }
        },
      })
    } catch (e) {}
  }())


  mixin(KeyedIterable, {

    // ### More sequential methods

    flip() {
      return reify(this, flipFactory(this))
    },

    findKey(predicate, context) {
      const entry = this.findEntry(predicate, context)
      return entry && entry[0]
    },

    findLastKey(predicate, context) {
      return this.toSeq().reverse().findKey(predicate, context)
    },

    keyOf(searchValue) {
      return this.findKey((value) => is(value, searchValue))
    },

    lastKeyOf(searchValue) {
      return this.findLastKey((value) => is(value, searchValue))
    },

    mapEntries(mapper, context) {
      const this$0 = this
      let iterations = 0
      return reify(this,
        this.toSeq().map(
          (v, k) => mapper.call(context, [k, v], iterations++, this$0),
        ).fromEntrySeq())
    },

    mapKeys(mapper, context) {
      const this$0 = this
      return reify(this,
        this.toSeq().flip().map(
          (k, v) => mapper.call(context, k, v, this$0),
        ).flip())
    },

  })

  const KeyedIterablePrototype = KeyedIterable.prototype
  KeyedIterablePrototype[IS_KEYED_SENTINEL] = true
  KeyedIterablePrototype[ITERATOR_SYMBOL] = IterablePrototype.entries
  KeyedIterablePrototype.__toJS = IterablePrototype.toObject
  KeyedIterablePrototype.__toStringMapper = function (v, k) { return `${JSON.stringify(k)}: ${quoteString(v)}` }


  mixin(IndexedIterable, {

    // ### Conversion to other types

    toKeyedSeq() {
      return new ToKeyedSequence(this, false)
    },


    // ### ES6 Collection methods (ES6 Array and Map)

    filter(predicate, context) {
      return reify(this, filterFactory(this, predicate, context, false))
    },

    findIndex(predicate, context) {
      const entry = this.findEntry(predicate, context)
      return entry ? entry[0] : -1
    },

    indexOf(searchValue) {
      const key = this.toKeyedSeq().keyOf(searchValue)
      return key === undefined ? -1 : key
    },

    lastIndexOf(searchValue) {
      return this.toSeq().reverse().indexOf(searchValue)
    },

    reverse() {
      return reify(this, reverseFactory(this, false))
    },

    slice(begin, end) {
      return reify(this, sliceFactory(this, begin, end, false))
    },

    splice(index, removeNum /* , ...values */) {
      const numArgs = arguments.length
      removeNum = Math.max(removeNum | 0, 0)
      if (numArgs === 0 || (numArgs === 2 && !removeNum)) {
        return this
      }
      // If index is negative, it should resolve relative to the size of the
      // collection. However size may be expensive to compute if not cached, so
      // only call count() if the number is in fact negative.
      index = resolveBegin(index, index < 0 ? this.count() : this.size)
      const spliced = this.slice(0, index)
      return reify(
        this,
        numArgs === 1
          ? spliced
          : spliced.concat(arrCopy(arguments, 2), this.slice(index + removeNum)),
      )
    },


    // ### More collection methods

    findLastIndex(predicate, context) {
      const key = this.toKeyedSeq().findLastKey(predicate, context)
      return key === undefined ? -1 : key
    },

    first() {
      return this.get(0)
    },

    flatten(depth) {
      return reify(this, flattenFactory(this, depth, false))
    },

    get(index, notSetValue) {
      index = wrapIndex(this, index)
      return (index < 0 || (this.size === Infinity
            || (this.size !== undefined && index > this.size)))
        ? notSetValue
        : this.find((_, key) => key === index, undefined, notSetValue)
    },

    has(index) {
      index = wrapIndex(this, index)
      return index >= 0 && (this.size !== undefined
        ? this.size === Infinity || index < this.size
        : this.indexOf(index) !== -1
      )
    },

    interpose(separator) {
      return reify(this, interposeFactory(this, separator))
    },

    interleave(/* ...iterables */) {
      const iterables = [this].concat(arrCopy(arguments))
      const zipped = zipWithFactory(this.toSeq(), IndexedSeq.of, iterables)
      const interleaved = zipped.flatten(true)
      if (zipped.size) {
        interleaved.size = zipped.size * iterables.length
      }
      return reify(this, interleaved)
    },

    last() {
      return this.get(-1)
    },

    skipWhile(predicate, context) {
      return reify(this, skipWhileFactory(this, predicate, context, false))
    },

    zip(/* , ...iterables */) {
      const iterables = [this].concat(arrCopy(arguments))
      return reify(this, zipWithFactory(this, defaultZipper, iterables))
    },

    zipWith(zipper/* , ...iterables */) {
      const iterables = arrCopy(arguments)
      iterables[0] = this
      return reify(this, zipWithFactory(this, zipper, iterables))
    },

  })

  IndexedIterable.prototype[IS_INDEXED_SENTINEL] = true
  IndexedIterable.prototype[IS_ORDERED_SENTINEL] = true


  mixin(SetIterable, {

    // ### ES6 Collection methods (ES6 Array and Map)

    get(value, notSetValue) {
      return this.has(value) ? value : notSetValue
    },

    includes(value) {
      return this.has(value)
    },


    // ### More sequential methods

    keySeq() {
      return this.valueSeq()
    },

  })

  SetIterable.prototype.has = IterablePrototype.includes


  // Mixin subclasses

  mixin(KeyedSeq, KeyedIterable.prototype)
  mixin(IndexedSeq, IndexedIterable.prototype)
  mixin(SetSeq, SetIterable.prototype)

  mixin(KeyedCollection, KeyedIterable.prototype)
  mixin(IndexedCollection, IndexedIterable.prototype)
  mixin(SetCollection, SetIterable.prototype)


  // #pragma Helper functions

  function keyMapper(v, k) {
    return k
  }

  function entryMapper(v, k) {
    return [k, v]
  }

  function not(predicate) {
    return function () {
      return !predicate.apply(this, arguments)
    }
  }

  function neg(predicate) {
    return function () {
      return -predicate.apply(this, arguments)
    }
  }

  function quoteString(value) {
    return typeof value === 'string' ? JSON.stringify(value) : value
  }

  function defaultZipper() {
    return arrCopy(arguments)
  }

  function defaultNegComparator(a, b) {
    return a < b ? 1 : a > b ? -1 : 0
  }

  function hashIterable(iterable) {
    if (iterable.size === Infinity) {
      return 0
    }
    const ordered = isOrdered(iterable)
    const keyed = isKeyed(iterable)
    let h = ordered ? 1 : 0
    const size = iterable.__iterate(
      keyed
        ? ordered
          ? (v, k) => { h = 31 * h + hashMerge(hash(v), hash(k)) | 0 }
          : (v, k) => { h = h + hashMerge(hash(v), hash(k)) | 0 }
        : ordered
          ? (v) => { h = 31 * h + hash(v) | 0 }
          : (v) => { h = h + hash(v) | 0 },
    )
    return murmurHashOfSize(size, h)
  }

  function murmurHashOfSize(size, h) {
    h = src_Math__imul(h, 0xCC9E2D51)
    h = src_Math__imul(h << 15 | h >>> -15, 0x1B873593)
    h = src_Math__imul(h << 13 | h >>> -13, 5)
    h = (h + 0xE6546B64 | 0) ^ size
    h = src_Math__imul(h ^ h >>> 16, 0x85EBCA6B)
    h = src_Math__imul(h ^ h >>> 13, 0xC2B2AE35)
    h = smi(h ^ h >>> 16)
    return h
  }

  function hashMerge(a, b) {
    return a ^ b + 0x9E3779B9 + (a << 6) + (a >> 2) | 0 // int
  }

  const Immutable = {

    Iterable,

    Seq,
    Collection,
    Map: src_Map__Map,
    OrderedMap,
    List,
    Stack,
    Set: src_Set__Set,
    OrderedSet,

    Record,
    Range,
    Repeat,

    is,
    fromJS,

  }

  return Immutable
}))
