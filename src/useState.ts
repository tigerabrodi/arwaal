import {
  currentRoot,
  hookIndex,
  incrementHookIndex,
  setDeletions,
  setNextUnitOfWork,
  setWipRoot,
  wipFiber,
} from './render'
import { Hook } from './types'

export function useState<T>({
  initial,
}: {
  initial: T
}): [T, (action: (state: T) => T) => void] {
  const oldHook = wipFiber?.alternate?.hooks?.[hookIndex]

  const hook: Hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  }

  const actions = oldHook?.queue || []

  // Call all the actions on the old hook
  // This gives us the initial state for the new hook
  actions.forEach((action) => {
    hook.state = (action as (state: T) => T)(hook.state as T)
  })

  const setState = (action: (state: T) => T): void => {
    // Push new action to the queue
    hook.queue.push(action as (state: unknown) => unknown)

    // Schedule a new render
    // Clone of the current root but a new reference
    // Inside workLoop, we only call commitRoot() if nextUnitOfWork is null and wipRoot is set
    const newRoot = {
      type: currentRoot!.type,
      dom: currentRoot!.dom,
      props: currentRoot!.props,
      parent: null,
      child: null,
      sibling: null,
      alternate: currentRoot,
    }
    setWipRoot(newRoot)
    setNextUnitOfWork(newRoot)
    setDeletions([])
  }

  wipFiber!.hooks!.push(hook)
  incrementHookIndex()

  return [hook.state as T, setState]
}
