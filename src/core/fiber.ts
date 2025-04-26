import { createDom } from './dom'
import { deletions, resetWipFiberHooks, setWipFiber } from './render'
import { Element, Fiber, Props } from './types'

/**
 * Processes a single unit of work and returns the next unit
 */
export function performUnitOfWork({ fiber }: { fiber: Fiber }): Fiber | null {
  const isFunctionComponent = typeof fiber.type === 'function'

  if (isFunctionComponent) {
    updateFunctionComponent({ fiber })
  } else {
    updateHostComponent({ fiber })
  }

  if (fiber.child) return fiber.child

  let nextFiber: Fiber | null = fiber
  while (nextFiber) {
    if (nextFiber.sibling) return nextFiber.sibling
    nextFiber = nextFiber.parent
  }

  return null
}

function updateHostComponent({ fiber }: { fiber: Fiber }): void {
  // Safety net to ensure every fiber has a dom
  // Here we know it is not a function component, so we can safely create a dom element
  if (!fiber.dom) {
    fiber.dom = createDom({ fiber })
  }

  reconcileChildren({
    wipFiber: fiber,
    elements: fiber.props.children || [],
  })
}

// Each function component becomes a new wip fiber
// This is the "component" we're in and working on
// This helps us understand where to push e.g. hooks etc.
function updateFunctionComponent({ fiber }: { fiber: Fiber }): void {
  setWipFiber(fiber)
  resetWipFiberHooks()

  // For function components, we need to call the function to get the children
  // If you've seen function components before, you know they return an element
  // Or actually they return an array of elements
  const children = [(fiber.type as (props: Props) => Element)(fiber.props)]

  reconcileChildren({
    wipFiber: fiber,
    elements: children,
  })
}

/**
 * Reconciles current children with the new element children
 */
export function reconcileChildren({
  wipFiber,
  elements,
}: {
  wipFiber: Fiber
  elements: Array<Element>
}): void {
  let index = 0
  let oldFiber = wipFiber.alternate?.child || null
  let prevSibling: Fiber | null = null

  while (index < elements.length || oldFiber !== null) {
    const element = elements[index]
    let newFiber: Fiber | null = null

    const isSameType = oldFiber && element && element.type === oldFiber.type

    // If same type and old fiber, we know this is an update
    if (isSameType && oldFiber) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        child: null,
        sibling: null,
        effectTag: 'UPDATE',
      }
    }

    // If new element and not same type, we know this is a placement
    // Because either:
    // 1. It is a new component
    // 2. It is a new instance of the same component
    // That's why in hindsight, React.memo for example would help, but not currently in scope for this implementation
    if (element && !isSameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        child: null,
        sibling: null,
        effectTag: 'PLACEMENT',
      }
    }

    // If old fiber and not same type, we know this is a deletion
    // Question: Is it worth sanity checking that the new `element` should NOT exist in this case?
    // It's actually fine
    // Either element doesn't exist
    // Or it exists but is a different type
    // So we can just delete the old fiber
    // If type is different, it means a new instance here
    if (oldFiber && !isSameType) {
      oldFiber.effectTag = 'DELETION'
      deletions.push(oldFiber)
    }

    if (oldFiber) {
      // Move old fiber to the next sibling
      oldFiber = oldFiber.sibling
    }

    if (index === 0) {
      // Set the first child of the wipFiber if it is the first element
      wipFiber.child = newFiber
    } else if (element && prevSibling) {
      // Set the sibling of the previous sibling
      // You can think: {prevSibling} -> {newFiber}
      // It's like setting "next" on a linked list of previous siblings
      prevSibling.sibling = newFiber
    }

    // Set the previous sibling to the new fiber
    prevSibling = newFiber

    // New fiber always gets reassigned (newFiber = {}) hence doesn't collide with the old fiber
    index++
  }
}
