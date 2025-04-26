import {
  currentRoot,
  hookIndex,
  incrementHookIndex,
  setDeletions,
  setNextUnitOfWork,
  setWipRoot,
  wipFiber,
} from '../render'
import { ExtendedHook } from '../types'

export function useState<T>({
  initial,
}: {
  initial: T
}): [T, (action: (state: T) => T) => void] {
  const oldHook = wipFiber?.alternate?.hooks?.[hookIndex] as
    | ExtendedHook<T>
    | undefined

  const hook: ExtendedHook<T> = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  }

  const actions = (oldHook?.queue || []) as Array<(state: T) => T>

  // Call all the actions on the old hook
  // This gives us the initial state for the new hook
  actions.forEach((action) => {
    hook.state = action(hook.state)
  })

  const setState = (action: (state: T) => T): void => {
    // Push new action to the queue
    hook.queue.push(action)

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

  wipFiber!.hooks!.push(hook as ExtendedHook<unknown>)
  incrementHookIndex()

  return [hook.state, setState]
}
