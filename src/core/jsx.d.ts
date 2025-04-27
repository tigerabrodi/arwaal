import type React from 'react'

declare global {
  namespace Arwaal {
    namespace JSX {
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      interface IntrinsicElements extends React.JSX.IntrinsicElements {}
      type Element = import('./types').Element
    }
  }
}
