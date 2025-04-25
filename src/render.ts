import { updateDom } from './dom'
import { performUnitOfWork } from './fiber'
import { Element, Fiber } from './types'

export let wipFiber: Fiber | null = null

export let hookIndex: number = 0
export let nextUnitOfWork: Fiber | null = null
export let currentRoot: Fiber | null = null
export let wipRoot: Fiber | null = null
export let deletions: Array<Fiber> = []

// Add setter functions for variables that need to be modified from outside
export function setWipRoot(newWipRoot: Fiber | null): void {
  wipRoot = newWipRoot
}

export function setWipFiber(newWipFiber: Fiber | null): void {
  wipFiber = newWipFiber
}

export function resetWipFiberHooks(): void {
  wipFiber!.hooks = []
  hookIndex = 0
}

export function setNextUnitOfWork(newNextUnitOfWork: Fiber | null): void {
  nextUnitOfWork = newNextUnitOfWork
}

export function setDeletions(newDeletions: Array<Fiber>): void {
  deletions = newDeletions
}

export function incrementHookIndex(): void {
  hookIndex++
}

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
