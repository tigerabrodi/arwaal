import { Fiber } from './types'

/**
 * Helper to find the DOM parent for a fiber
 * Useful when dealing with function components that don't have DOM nodes
 */
export function findDOMParent(fiber: Fiber): Fiber | null {
  let domParentFiber = fiber.parent

  while (domParentFiber && !domParentFiber.dom) {
    domParentFiber = domParentFiber.parent
  }

  return domParentFiber
}

/**
 * Finds the next unit of work following fiber tree traversal rules
 * This implements the child -> sibling -> uncle traversal pattern
 */
export function getNextUnitOfWork(fiber: Fiber): Fiber | null {
  // First try to go down (to child)
  if (fiber.child) {
    return fiber.child
  }

  // Then try to go across (to sibling)
  // If no sibling, go up until we find a parent with a sibling
  let nextFiber: Fiber | null = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }

  return null
}
