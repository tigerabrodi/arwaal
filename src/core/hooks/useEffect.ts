import { hookIndex, incrementHookIndex, wipFiber } from '../render'
import { Fiber, Hook } from '../types'

export type EffectHook = Hook & {
  effect: () => void | (() => void)
  cleanup: (() => void) | undefined
  deps: Array<unknown> | undefined
}

export function useEffect(
  effect: () => void | (() => void),
  deps?: Array<unknown>
): void {
  const oldHook = wipFiber?.alternate?.hooks?.[hookIndex] as
    | EffectHook
    | undefined

  const hook: EffectHook = {
    state: null,
    queue: [],
    effect,
    cleanup: undefined,
    deps,
  }

  if (oldHook) {
    // If no deps provided, always run effect
    // If deps provided, check if they've changed
    const hasDepsChanged =
      !deps || !oldHook.deps || deps.some((dep, i) => dep !== oldHook.deps?.[i])

    if (hasDepsChanged) {
      // Save cleanup function for later execution
      hook.cleanup = oldHook.cleanup
    } else {
      // No change in deps, skip this effect
      hook.cleanup = oldHook.cleanup
      hook.effect = oldHook.effect
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

export function isEffectHook(hook: Hook): hook is EffectHook {
  return 'effect' in hook && 'cleanup' in hook
}
