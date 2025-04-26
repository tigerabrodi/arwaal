import { hookIndex, incrementHookIndex, wipFiber } from '../render'
import { ExtendedHook } from '../types'

// CallbackHook extends ExtendedHook with callback function
export interface CallbackHook<T> extends ExtendedHook<T> {
  deps: Array<unknown> | undefined
}

// Type guard to check if a hook is a CallbackHook
export function isCallbackHook(
  hook: ExtendedHook<unknown>
): hook is CallbackHook<unknown> {
  return 'deps' in hook && typeof hook.state === 'function'
}

export function useCallback<T extends (...args: Array<unknown>) => unknown>(
  callback: T,
  deps?: Array<unknown>
): T {
  // Cast to specific hook type
  const oldHook = wipFiber?.alternate?.hooks?.[hookIndex]

  // Create our hook
  const hook: CallbackHook<T> = {
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
      hook.state = oldHook.state as T
    }
  }

  // Explicitly cast to satisfy TypeScript
  wipFiber!.hooks!.push(hook as unknown as ExtendedHook<unknown>)
  incrementHookIndex()

  return hook.state
}
