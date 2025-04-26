import { hookIndex, incrementHookIndex, wipFiber } from '../render'
import { BrandedHook, CallbackHook } from '../types'

// Type guard to check if a hook has the callback brand
export function isCallbackHook(hook: unknown): hook is CallbackHook<unknown> {
  return (
    hook !== null &&
    typeof hook === 'object' &&
    '__brand' in hook &&
    (hook as { __brand: string }).__brand === 'callback'
  )
}

// More flexible type signature for useCallback
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useCallback<T extends (...args: Array<any>) => any>(
  callback: T,
  deps?: Array<unknown>
): T {
  // Cast to specific hook type
  const oldHook = wipFiber?.alternate?.hooks?.[hookIndex] as
    | CallbackHook<T>
    | undefined

  // Create our hook
  const hook: CallbackHook<T> = {
    __brand: 'callback',
    state: callback,
    queue: [],
    deps,
  }

  if (oldHook && isCallbackHook(oldHook)) {
    // If no deps provided, always return a new callback
    // If deps provided, check if they've changed
    const hasDepsChanged =
      !deps || !oldHook.deps || deps.some((dep, i) => dep !== oldHook.deps?.[i])

    if (!hasDepsChanged) {
      // No change in deps, return the memoized callback
      hook.state = oldHook.state
    }
  }

  // Add to hooks array
  wipFiber!.hooks!.push(hook as unknown as BrandedHook<unknown, string>)
  incrementHookIndex()

  return hook.state
}
