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

  if (!fiber.hooks) return

  // Run cleanup functions first
  fiber.hooks.forEach((hook) => {
    if (isEffectHook(hook) && hook.cleanup) {
      hook.cleanup()
    }
  })

  // Run effects
  fiber.hooks.forEach((hook) => {
    if (isEffectHook(hook)) {
      const cleanup = hook.effect()
      if (cleanup && typeof cleanup === 'function') {
        hook.cleanup = cleanup
      }
    }
  })
}
