import type React from 'react'

declare global {
  namespace Arwaal {
    namespace JSX {
      interface IntrinsicElements extends React.JSX.IntrinsicElements {}
      type Element = import('./types').Element
    }
  }
}
