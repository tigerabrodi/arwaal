import { Arwaal } from './lib'

function Counter() {
  const [count, setCount] = Arwaal.useState({ initial: 0 })

  Arwaal.useEffect(() => {
    console.log('Count:', count)
    ref.current = count
  }, [count])

  const ref = Arwaal.useRef<number>(null)

  console.log('Ref:', ref)

  return Arwaal.createElement({
    type: 'div',
    props: {},
    children: [
      Arwaal.createElement({
        type: 'h1',
        props: {},
        children: [`Count: ${count}`],
      }),
      Arwaal.createElement({
        type: 'button',
        props: { onClick: () => setCount((c) => c + 1) },
        children: ['Increment'],
      }),
    ],
  })
}

const element = Arwaal.createElement({
  type: Counter,
  props: {},
})

const container = document.getElementById('app')
Arwaal.render({ element, container: container! })
