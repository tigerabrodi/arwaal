import { Fiber, Props } from './types'

// Helper functions for property checks
export const isEvent = ({ key }: { key: string }): boolean =>
  key.startsWith('on')
export const isProperty = ({ key }: { key: string }): boolean =>
  key !== 'children' && !isEvent({ key })
export const isNew = ({
  prevValue,
  nextValue,
}: {
  prevValue: unknown
  nextValue: unknown
}): boolean => prevValue !== nextValue
export const isGone = ({ key, next }: { key: string; next: Props }): boolean =>
  !(key in next)

/**
 * Creates a DOM node from a fiber
 */
export function createDom({ fiber }: { fiber: Fiber }): HTMLElement | Text {
  const dom =
    fiber.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(fiber.type as string)

  updateDom({
    dom,
    prevProps: {},
    nextProps: fiber.props,
  })

  return dom
}

/**
 * Updates a DOM node with new properties
 */
export function updateDom({
  dom,
  prevProps,
  nextProps,
}: {
  dom: HTMLElement | Text
  prevProps: Props
  nextProps: Props
}): void {
  // Remove old or changed event listeners
  Object.keys(prevProps)
    .filter((key) => isEvent({ key }))
    .filter(
      (key) =>
        isGone({ key, next: nextProps }) ||
        isNew({
          prevValue: prevProps[key],
          nextValue: nextProps[key],
        })
    )
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2)
      dom.removeEventListener(eventType, prevProps[name] as EventListener)
    })

  // Remove old properties
  Object.keys(prevProps)
    .filter((key) => isProperty({ key }))
    .filter((key) => isGone({ key, next: nextProps }))
    .forEach((name) => {
      if (dom instanceof HTMLElement) {
        dom.removeAttribute(name)
      }
    })

  // Set new or changed properties
  Object.keys(nextProps)
    .filter((key) => isProperty({ key }))
    .filter((key) =>
      isNew({
        prevValue: prevProps[key],
        nextValue: nextProps[key],
      })
    )
    .forEach((name) => {
      if (dom instanceof HTMLElement && name in dom) {
        ;(dom as unknown as Record<string, unknown>)[name] = nextProps[name]
      } else if (dom instanceof HTMLElement) {
        dom.setAttribute(name, String(nextProps[name]))
      } else if (dom instanceof Text && name === 'nodeValue') {
        dom.nodeValue = String(nextProps[name])
      }
    })

  // Add new event listeners
  Object.keys(nextProps)
    .filter((key) => isEvent({ key }))
    .filter((key) =>
      isNew({
        prevValue: prevProps[key],
        nextValue: nextProps[key],
      })
    )
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2)
      dom.addEventListener(eventType, nextProps[name] as EventListener)
    })
}
