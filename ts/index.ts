declare module '*.png'

declare module '*.png' {
  const content: any
  export default content
}
declare module '*.svg'

declare module '*.svg' {
  const content: any
  export default content
}

type TNull<T> = T | null | undefined

type TPromise<T> = (...args: any[]) => Promise<T>
type Exclude2<T, P> = T extends P ? never : T
type Omit<T, K> = Pick<T, Exclude<keyof T, K>>

type Partial2<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

type FunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? K : never
}[keyof T]

type FunctionProperties<T> = Pick<T, FunctionPropertyNames<T>>

type NonFunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? never : K
}[keyof T]

type Record2<T, P> = { [K in keyof T]: P }

type NoneFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>

type ReturnType2<T> = T extends (...args: any[]) => infer R ? R : any

type Values<T> = T[keyof T]

type CC = {
  aa: string
  bb: number
}
type ValuesCC = Values<CC>

type Unpacked<T> = T extends (infer R)[]
  ? R
  : T extends (...args: any[]) => infer R
  ? R
  : T extends Promise<infer P>
  ? P
  : T

type T0 = Unpacked<string>
type T1 = Unpacked<string[]>
type T2 = Unpacked<() => string>

type Foo<T> = T extends { a: infer U; b: infer U } ? U : never

interface IA {
  a: string
}

interface IB extends IA {
  name: string
}

type F1 = Foo<IA>
