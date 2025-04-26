import { hookIndex, incrementHookIndex, wipFiber } from '../render'
import { ExtendedHook, Fiber } from '../types'

// Effect hook extends ExtendedHook with null state
export interface EffectHook extends ExtendedHook {
  effect: () => void | (() => void)
  cleanup: (() => void) | undefined
  deps: Array<unknown> | undefined
}

// Type guard to check if a hook is an EffectHook
export function isEffectHook(hook: ExtendedHook): hook is EffectHook {
  return 'effect' in hook && typeof hook.effect === 'function'
}

// Determine if an effect should run based on its dependencies
export function shouldRunEffect({
  currentHook,
  previousHook,
}: {
  currentHook: EffectHook
  previousHook?: EffectHook
}): boolean {
  // Always run if it's the first time or no deps array was provided
  if (!previousHook || !currentHook.deps) {
    return true
  }

  // If previous hook doesn't have deps, always run
  if (!previousHook.deps) {
    return true
  }

  // Check if any dependency has changed
  return currentHook.deps.some((dep, i) => dep !== previousHook.deps?.[i])
}

export function useEffect(
  effect: () => void | (() => void),
  deps?: Array<unknown>
): void {
  // Cast to specific hook type
  const oldHook = wipFiber?.alternate?.hooks?.[hookIndex] as
    | EffectHook
    | undefined

  const hook: EffectHook = {
    state: null, // Effect hooks don't use state
    queue: [], // Effect hooks don't use queue
    effect,
    cleanup: undefined,
    deps,
  }

  if (oldHook) {
    if (isEffectHook(oldHook)) {
      // If no deps provided, always run effect
      // If deps provided, check if they've changed
      const hasDepsChanged =
        !deps ||
        !oldHook.deps ||
        deps.some((dep, i) => dep !== oldHook.deps?.[i])

      if (hasDepsChanged) {
        // Save cleanup function for later execution
        hook.cleanup = oldHook.cleanup
      } else {
        // No change in deps, skip this effect
        hook.cleanup = oldHook.cleanup
        hook.effect = oldHook.effect
      }
    }
  }

  wipFiber!.hooks!.push(hook)
  incrementHookIndex()
}

// This should be called during commit phase
export function runEffects(fiber: Fiber): void {
  console.log('Running effects', {
    fiber,
  })

  if (!fiber.hooks || !fiber.alternate?.hooks) return

  // Run through hooks
  fiber.hooks.forEach((hook, index) => {
    if (!isEffectHook(hook)) return

    const prevHook = fiber.alternate?.hooks?.[index] as EffectHook | undefined

    // Determine if we should run this effect
    const shouldRun = shouldRunEffect({
      currentHook: hook,
      previousHook: prevHook,
    })

    // Run cleanup if needed (only if we're about to run the effect)
    if (shouldRun && hook.cleanup) {
      hook.cleanup()
      hook.cleanup = undefined
    }

    // Run effect if dependencies changed
    if (shouldRun) {
      const cleanup = hook.effect()
      if (cleanup && typeof cleanup === 'function') {
        hook.cleanup = cleanup
      }
    }
  })
}
