// src/dom.test.ts
import { describe, expect, it, vi } from 'vitest'
import { createDom, updateDom } from '../core/dom'

describe('DOM operations', () => {
  describe('createDom', () => {
    it('should create a DOM element when type is a regular element', () => {
      const fiber = {
        type: 'div',
        props: { id: 'test', className: 'container' },
        dom: null,
        parent: null,
        child: null,
        sibling: null,
        alternate: null,
      }

      const dom = createDom({ fiber })

      expect(dom.nodeName).toBe('DIV')
      expect((dom as unknown as HTMLElement).id).toBe('test')
      expect((dom as unknown as HTMLElement).className).toBe('container')
    })

    it('should create a text node when type is TEXT_ELEMENT', () => {
      const fiber = {
        type: 'TEXT_ELEMENT',
        props: { nodeValue: 'Hello World', children: [] },
        dom: null,
        parent: null,
        child: null,
        sibling: null,
        alternate: null,
      }

      const dom = createDom({ fiber })

      expect(dom.nodeName).toBe('#text')
      expect(dom.nodeValue).toBe('Hello World')
    })
  })

  describe('updateDom', () => {
    it('should add new properties', () => {
      const dom = document.createElement('div')
      const prevProps = {}
      const nextProps = { id: 'test', className: 'container' }

      updateDom({ dom, prevProps, nextProps })

      expect(dom.id).toBe('test')
      expect(dom.className).toBe('container')
    })

    it('should update changed properties', () => {
      const dom = document.createElement('div')
      dom.id = 'old'
      dom.className = 'old-container'

      const prevProps = { id: 'old', className: 'old-container' }
      const nextProps = { id: 'new', className: 'new-container' }

      updateDom({ dom, prevProps, nextProps })

      expect(dom.id).toBe('new')
      expect(dom.className).toBe('new-container')
    })

    it('should remove old properties', () => {
      const dom = document.createElement('div')
      dom.id = 'test'
      dom.setAttribute('data-test', 'value')

      const prevProps = { id: 'test', 'data-test': 'value' }
      const nextProps = { id: 'test' }

      updateDom({ dom, prevProps, nextProps })

      expect(dom.id).toBe('test')
      expect(dom.hasAttribute('data-test')).toBe(false)
    })

    it('should handle event listeners correctly', () => {
      const dom = document.createElement('div')
      const clickHandler1 = vi.fn()
      const clickHandler2 = vi.fn()

      // Add initial event listener
      const prevProps = { onClick: clickHandler1 }
      const nextProps = { onClick: clickHandler2 }

      // Need to manually add the event listener since jsdom doesn't handle this in props
      dom.addEventListener('click', clickHandler1)

      // Update with new listener
      updateDom({ dom, prevProps, nextProps })

      // Simulate clicks
      dom.dispatchEvent(new MouseEvent('click'))

      expect(clickHandler1).not.toHaveBeenCalled()
      expect(clickHandler2).toHaveBeenCalledTimes(1)
    })

    it('should update text node value', () => {
      const textNode = document.createTextNode('old text')

      const prevProps = { nodeValue: 'old text' }
      const nextProps = { nodeValue: 'new text' }

      updateDom({ dom: textNode, prevProps, nextProps })

      expect(textNode.nodeValue).toBe('new text')
    })
  })
})
