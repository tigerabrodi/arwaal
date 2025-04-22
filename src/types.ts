export type ElementType = string | ((props: Props) => Element)

export type Props = {
  children?: Array<Element>
  [key: string]: unknown
}

export interface Element {
  type: ElementType
  props: Props
}

export interface Fiber {
  type: ElementType
  props: Props
  dom: HTMLElement | Text | null
  parent: Fiber | null
  child: Fiber | null
  sibling: Fiber | null
  alternate: Fiber | null
  effectTag?: 'PLACEMENT' | 'UPDATE' | 'DELETION'
  hooks?: Array<Hook>
}

export interface Hook {
  state: unknown
  queue: Array<(state: unknown) => unknown>
}
