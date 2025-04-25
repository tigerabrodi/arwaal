import { createDom } from './dom'
import { Element, Fiber } from './types'

export let nextUnitOfWork: Fiber | null = null
export let currentRoot: Fiber | null = null
export let wipRoot: Fiber | null = null
export let deletions: Array<Fiber> = []

/**
 * Renders an element into a container
 * This is the main entry point for the library
 */
export function render({
  element,
  container,
}: {
  element: Element
  container: HTMLElement
}): void {
  // Set up the initial fiber tree
  wipRoot = {
    type: 'ROOT',
    dom: container,
    props: {
      children: [element],
    },
    parent: null,
    child: null,
    sibling: null,
    alternate: currentRoot,
  }

  deletions = []
  nextUnitOfWork = wipRoot

  // Start the work loop
  requestIdleCallback(workLoop)
}

/**
 * The work loop processes units of work during idle browser time
 */
function workLoop(deadline: IdleDeadline): void {
  let shouldYield = false

  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork({ fiber: nextUnitOfWork })
    shouldYield = deadline.timeRemaining() < 1
  }

  // If we've finished all work, commit the fiber tree
  if (!nextUnitOfWork && wipRoot) {
    commitRoot()
  }

  // Schedule the next work loop
  requestIdleCallback(workLoop)
}

/**
 * Processes a single unit of work and returns the next unit
 */
function performUnitOfWork({ fiber }: { fiber: Fiber }): Fiber | null {
  // Create DOM node if it doesn't exist
  if (!fiber.dom) {
    fiber.dom = createDom({ fiber })
  }

  // Create fibers for children
  const elements = fiber.props.children || []
  reconcileChildren({
    wipFiber: fiber,
    elements,
  })

  // Return next unit of work - first child, then sibling, then uncle
  if (fiber.child) {
    return fiber.child
  }

  let nextFiber: Fiber | null = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }

  return null
}

/**
 * Reconciles current children with the new element children
 */
function reconcileChildren({
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

/**
 * Commits the root fiber to the DOM
 */
function commitRoot(): void {
  // Deletions are handled first to avoid potential DOM conflicts. If you're moving a node to a new position, you want to remove it from its old position before adding it to the new one.
  deletions.forEach((fiber) => commitWork({ fiber }))

  commitWork({ fiber: wipRoot!.child })

  currentRoot = wipRoot

  wipRoot = null
}

/**
 * Commits a single fiber's changes to the DOM
 */
function commitWork({ fiber }: { fiber: Fiber | null }): void {
  if (!fiber) return

  let domParentFiber = fiber.parent
  while (domParentFiber && !domParentFiber.dom) {
    domParentFiber = domParentFiber.parent
  }

  // This is the first parent with a dom element
  // We need this to know which parent to e.g. append to
  const domParent = domParentFiber!.dom!

  if (fiber.effectTag === 'PLACEMENT' && fiber.dom) {
    // If a placement, we know to just append to the parent
    domParent.appendChild(fiber.dom)
  } else if (fiber.effectTag === 'UPDATE' && fiber.dom) {
    // If an update, we know to update the dom
    updateDom({
      dom: fiber.dom,
      prevProps: fiber.alternate!.props,
      nextProps: fiber.props,
    })
  } else if (fiber.effectTag === 'DELETION') {
    // If a deletion, we know to remove the dom
    commitDeletion({ fiber, domParent })
  }

  commitWork({ fiber: fiber.child })
  commitWork({ fiber: fiber.sibling })
}

/**
 * Helper for committing deletion
 */
function commitDeletion({
  fiber,
  domParent,
}: {
  fiber: Fiber
  domParent: HTMLElement | Text
}): void {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom)
  } else {
    commitDeletion({
      fiber: fiber.child!,
      domParent,
    })
  }
}

// For testing - we need to import this
import { updateDom } from './dom'
