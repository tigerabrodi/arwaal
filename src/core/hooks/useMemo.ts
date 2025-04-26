import { hookIndex, incrementHookIndex, wipFiber } from '../render'
import { BrandedHook, MemoHook } from '../types'

// Type guard for memo hooks
export function isMemoHook<T>(hook: unknown): hook is MemoHook<T> {
  return (
    hook !== null &&
    typeof hook === 'object' &&
    '__brand' in hook &&
    (hook as { __brand: string }).__brand === 'memo'
  )
}

export function useMemo<T>(factory: () => T, deps?: Array<unknown>): T {
  // Cast to specific hook type
  const oldHook = wipFiber?.alternate?.hooks?.[hookIndex] as
    | MemoHook<T>
    | undefined

  // Check if we need to recompute the value
  let value: T

  if (oldHook && isMemoHook<T>(oldHook)) {
    // If no deps provided, always recompute
    // If deps provided, check if they've changed
    const hasDepsChanged =
      !deps || !oldHook.deps || deps.some((dep, i) => dep !== oldHook.deps?.[i])

    if (hasDepsChanged) {
      // Deps changed, recompute the value
      value = factory()
    } else {
      // No change in deps, return the memoized value
      value = oldHook.state
    }
  } else {
    // First time, compute the value
    value = factory()
  }

  // Create our hook
  const hook: MemoHook<T> = {
    __brand: 'memo',
    state: value,
    queue: [],
    deps,
  }

  // Add to hooks array
  wipFiber!.hooks!.push(hook as unknown as BrandedHook<unknown, string>)
  incrementHookIndex()

  return hook.state
}
