import { hookIndex, incrementHookIndex, wipFiber } from '../render'

export interface RefObject<T> {
  current: T | null
}

export function useRef<T>(initialValue: T | null = null): RefObject<T> {
  const oldHook = wipFiber?.alternate?.hooks?.[hookIndex]

  const hook = {
    state: oldHook ? oldHook.state : { current: initialValue },
    queue: [],
  }

  wipFiber!.hooks!.push(hook)
  incrementHookIndex()

  return hook.state as RefObject<T>
}
