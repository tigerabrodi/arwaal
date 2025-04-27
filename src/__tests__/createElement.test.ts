import { describe, expect, it } from 'vitest'
import { createElement } from '../core/createElement'

describe('createElement', () => {
  it('should create an element with the correct type and props', () => {
    const element = createElement({
      type: 'div',
      props: { id: 'test' },
      children: ['Hello'],
    })

    expect(element.type).toBe('div')
    expect(element.props.id).toBe('test')
    expect(element.props.children?.length).toBe(1)
    expect(element.props.children?.[0].type).toBe('TEXT_ELEMENT')
    expect(element.props.children?.[0].props.nodeValue).toBe('Hello')
  })

  it('should handle nested children', () => {
    const child = createElement({
      type: 'span',
      props: {},
      children: [],
    })

    const element = createElement({
      type: 'div',
      props: {},
      children: [child, 'text'],
    })

    expect(element.props.children?.length).toBe(2)
    expect(element.props.children?.[0]).toBe(child)
    expect(element.props.children?.[1].type).toBe('TEXT_ELEMENT')
  })
})
