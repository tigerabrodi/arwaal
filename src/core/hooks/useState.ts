import {
  currentRoot,
  hookIndex,
  incrementHookIndex,
  setDeletions,
  setNextUnitOfWork,
  setWipRoot,
  wipFiber,
} from '../render'
import { BrandedHook, StateHook } from '../types'

// Type guard for state hooks
export function isStateHook<T>(hook: unknown): hook is StateHook<T> {
  return (
    hook !== null &&
    typeof hook === 'object' &&
    '__brand' in hook &&
    (hook as { __brand: string }).__brand === 'state'
  )
}

export function useState<T>({
  initial,
}: {
  initial: T
}): [T, (action: (state: T) => T) => void] {
  const oldHook = wipFiber?.alternate?.hooks?.[hookIndex] as
    | StateHook<T>
    | undefined

  const hook: StateHook<T> = {
    __brand: 'state',
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

  wipFiber!.hooks!.push(hook as unknown as BrandedHook<unknown, string>)
  incrementHookIndex()

  return [hook.state, setState]
}
