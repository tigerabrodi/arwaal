// fiber.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createElement } from '../createElement'
import * as dom from '../dom'
import { performUnitOfWork, reconcileChildren } from '../fiber'
import { Fiber } from '../types'

// Mock DOM operations
vi.mock('../dom', () => ({
  createDom: vi.fn(() => document.createElement('div')),
  updateDom: vi.fn(),
}))

describe('Fiber', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('performUnitOfWork', () => {
    it('should create DOM for fiber without one', () => {
      const fiber = {
        type: 'div',
        props: { children: [] },
        dom: null,
        parent: null,
        child: null,
        sibling: null,
        alternate: null,
      }

      performUnitOfWork({ fiber })

      expect(dom.createDom).toHaveBeenCalledWith({ fiber })
    })

    it('should return child as next unit of work when present', () => {
      const childFiber: Fiber = {
        type: 'span',
        props: { children: [] },
        dom: null,
        parent: null,
        child: null,
        sibling: null,
        alternate: null,
      }

      const fiber: Fiber = {
        type: 'div',
        props: { children: [] },
        dom: document.createElement('div'),
        parent: null,
        child: childFiber,
        sibling: null,
        alternate: null,
      }

      childFiber.parent = fiber

      const nextFiber = performUnitOfWork({ fiber })

      expect(nextFiber).toBe(childFiber)
    })
  })

  describe('reconcileChildren', () => {
    it('should create child fibers for new elements', () => {
      const wipFiber: Fiber = {
        type: 'div',
        props: { children: [] },
        dom: document.createElement('div'),
        parent: null,
        child: null,
        sibling: null,
        alternate: null,
      }

      const elements = [
        createElement({
          type: 'h1',
          props: { id: 'title' },
          children: ['Hello'],
        }),
      ]

      reconcileChildren({ wipFiber, elements })

      expect(wipFiber.child).not.toBeNull()
      expect(wipFiber.child?.type).toBe('h1')
      expect(wipFiber.child?.props.id).toBe('title')
      expect(wipFiber.child?.effectTag).toBe('PLACEMENT')
    })

    it('should update existing fibers when types match', () => {
      const oldChildFiber: Fiber = {
        type: 'h1',
        props: { id: 'old-title' },
        dom: document.createElement('h1'),
        parent: null,
        child: null,
        sibling: null,
        alternate: null,
      }

      const wipFiber: Fiber = {
        type: 'div',
        props: { children: [] },
        dom: document.createElement('div'),
        parent: null,
        child: null,
        sibling: null,
        alternate: {
          type: 'div',
          props: { children: [] },
          dom: document.createElement('div'),
          parent: null,
          child: oldChildFiber,
          sibling: null,
          alternate: null,
        },
      }

      const elements = [
        createElement({
          type: 'h1',
          props: { id: 'new-title' },
          children: ['Updated'],
        }),
      ]

      reconcileChildren({ wipFiber, elements })

      expect(wipFiber.child).not.toBeNull()
      expect(wipFiber.child?.type).toBe('h1')
      expect(wipFiber.child?.props.id).toBe('new-title')
      expect(wipFiber.child?.effectTag).toBe('UPDATE')
      expect(wipFiber.child?.dom).toBe(oldChildFiber.dom)
    })
  })
})
