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
  hooks?: Array<ExtendedHook> // Can contain hooks with different state types and properties
}
