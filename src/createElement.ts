import { Element, ElementType, Props } from './types'

export function createElement({
  type,
  props = {},
  children = [],
}: {
  type: ElementType
  props?: Omit<Props, 'children'>
  children?: Array<Element | string | number>
}): Element {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === 'object'
          ? child
          : createTextElement({ text: String(child) })
      ),
    },
  }
}

export function createTextElement({ text }: { text: string }): Element {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: [],
    },
  }
}
