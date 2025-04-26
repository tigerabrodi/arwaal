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
function shouldRunEffect({
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

/**
 * Recursively runs effects on a fiber and its children
 */
export function runEffectsRecursively(fiber: Fiber): void {
  // Run effects on current fiber if it has hooks
  if (fiber.hooks && fiber.hooks.length > 0) {
    // Check if we have a previous fiber with hooks
    const prevFiber = fiber.alternate

    // Process each hook individually
    fiber.hooks.forEach((hook, index) => {
      if (!isEffectHook(hook)) return

      const effectHook = hook
      const prevHook = prevFiber?.hooks?.[index] as EffectHook | undefined

      // Use the imported shouldRunEffect function instead of inline logic
      const shouldRun = shouldRunEffect({
        currentHook: effectHook,
        previousHook: prevHook,
      })

      // Run cleanup if needed (only if we're about to run the effect or unmounting)
      if (shouldRun && effectHook.cleanup) {
        effectHook.cleanup()
        effectHook.cleanup = undefined
      }

      // Run effect if dependencies changed
      if (shouldRun) {
        const cleanup = effectHook.effect()
        if (cleanup && typeof cleanup === 'function') {
          effectHook.cleanup = cleanup
        }
      }
    })
  }

  // Recursively run effects on children
  if (fiber.child) {
    runEffectsRecursively(fiber.child)
  }

  // Recursively run effects on siblings
  if (fiber.sibling) {
    runEffectsRecursively(fiber.sibling)
  }
}
