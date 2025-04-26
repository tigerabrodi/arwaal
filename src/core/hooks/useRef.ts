import { hookIndex, incrementHookIndex, wipFiber } from '../render'
import { BrandedHook, RefHook } from '../types'

export interface RefObject<T> {
  current: T | null
}

// Type guard for ref hooks
export function isRefHook<T>(hook: unknown): hook is RefHook<T> {
  return (
    hook !== null &&
    typeof hook === 'object' &&
    '__brand' in hook &&
    (hook as { __brand: string }).__brand === 'ref'
  )
}

export function useRef<T>(initialValue: T | null = null): RefObject<T> {
  const oldHook = wipFiber?.alternate?.hooks?.[hookIndex] as
    | RefHook<T>
    | undefined

  const hook: RefHook<T> = {
    __brand: 'ref',
    state: oldHook ? oldHook.state : { current: initialValue },
    queue: [],
  }

  wipFiber!.hooks!.push(hook as unknown as BrandedHook<unknown, string>)
  incrementHookIndex()

  return hook.state as RefObject<T>
}
