import { updateDom } from './dom'
import { performUnitOfWork } from './fiber'
import { isEffectHook, runEffectsRecursively } from './hooks'
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

  // Initial trigger
  scheduleNextIteration()
}

// Time slice constants
const FRAME_LENGTH = 5 // milliseconds per work chunk
let isWorking = false

function workLoop(currentTime = performance.now()): void {
  // Prevent concurrent execution
  if (isWorking) return
  isWorking = true

  const deadline = currentTime + FRAME_LENGTH

  try {
    // Process work until we need to yield
    while (nextUnitOfWork && performance.now() < deadline) {
      nextUnitOfWork = performUnitOfWork({ fiber: nextUnitOfWork })
    }

    // Commit if all work is done
    if (!nextUnitOfWork && wipRoot) {
      commitRoot()
    }
  } finally {
    // Always ensure we clear the working flag
    isWorking = false
  }

  // Always schedule next iteration regardless of work status
  // This maintains continuous execution
  scheduleNextIteration()
}

function scheduleNextIteration(): void {
  // Prefer requestAnimationFrame for visual updates
  // With setTimeout fallback for reliability
  const timeoutId = setTimeout(() => {
    workLoop(performance.now())
  }, FRAME_LENGTH)

  requestAnimationFrame((rafTime) => {
    clearTimeout(timeoutId)
    workLoop(rafTime)
  })
}

/**
 * Commits the root fiber to the DOM
 */
function commitRoot(): void {
  // Deletions are handled first to avoid potential DOM conflicts. If you're moving a node to a new position, you want to remove it from its old position before adding it to the new one.
  deletions.forEach((fiber) => commitWork({ fiber }))

  // Commit the work
  commitWork({ fiber: wipRoot!.child })

  // Run effects recursively on all fibers after DOM updates
  runEffectsRecursively(wipRoot!)

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
  // Run cleanup for any hooks before removing the component
  if (fiber.hooks) {
    fiber.hooks.forEach((hook) => {
      if (isEffectHook(hook) && hook.cleanup) {
        hook.cleanup()
      }
    })
  }

  if (fiber.dom) {
    domParent.removeChild(fiber.dom)
  } else if (fiber.child) {
    commitDeletion({
      fiber: fiber.child,
      domParent,
    })
  }
}
