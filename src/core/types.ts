export type ElementType = string | ((props: Props) => Element)

export type Props = {
  children?: Array<Element>
  [key: string]: unknown
}

export interface Element {
  type: ElementType
  props: Props
}

export interface Hook<State = unknown> {
  state: State
  queue: Array<(state: State) => State>
}

export interface ExtendedHook<State = unknown> extends Hook<State> {
  [key: string]: unknown
}

// Branded hook interface for stronger type safety
export interface BrandedHook<State = unknown, Brand extends string = string>
  extends Hook<State> {
  __brand: Brand
  [key: string]: unknown
}

// Specific hook types with brands
export type StateHook<T> = BrandedHook<T, 'state'>
export type EffectHook = BrandedHook<null, 'effect'> & {
  effect: () => void | (() => void)
  cleanup: (() => void) | undefined
  deps: Array<unknown> | undefined
}
export type RefHook<T> = BrandedHook<{ current: T | null }, 'ref'>
export type CallbackHook<T> = BrandedHook<T, 'callback'> & {
  deps: Array<unknown> | undefined
}
export type MemoHook<T> = BrandedHook<T, 'memo'> & {
  deps: Array<unknown> | undefined
}

// Fiber does NOT use a generic parameter since it contains hooks with different state types
export interface Fiber {
  type: ElementType
  props: Props
  dom: HTMLElement | Text | null
  parent: Fiber | null
  child: Fiber | null
  sibling: Fiber | null
  alternate: Fiber | null
  effectTag?: 'PLACEMENT' | 'UPDATE' | 'DELETION'
  hooks?: Array<ExtendedHook | BrandedHook> // Can contain hooks with different state types and properties
}
