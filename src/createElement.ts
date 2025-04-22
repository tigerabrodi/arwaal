export type ElementType = string | ((props: Props) => Element)
export type Props = {
  children?: Array<Element>
  [key: string]: unknown
}

export interface Element {
  type: ElementType
  props: Props
}

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
