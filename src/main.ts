import { Arwaal } from './lib'

function Counter() {
  const [count, setCount] = Arwaal.useState({ initial: 0 })
  const [inputValue, setInputValue] = Arwaal.useState({ initial: '' })

  // Track when count changes
  Arwaal.useEffect(() => {
    console.log('Count changed:', count)
  }, [count])

  // Runs once on mount
  Arwaal.useEffect(() => {
    console.log('Counter component mounted')
    return () => console.log('Counter component unmounted')
  }, [])

  // Track input value changes
  Arwaal.useEffect(() => {
    if (inputValue) {
      console.log('Input value changed:', inputValue)
    }
  }, [inputValue])

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
      Arwaal.createElement({
        type: 'input',
        props: {
          type: 'text',
          value: inputValue,
          placeholder: 'Enter text here',
          // Try multiple event handlers to see which one works
          onChange: (e: Event) => {
            const value = (e.target as HTMLInputElement).value
            console.log('Raw input event value:', value)
            setInputValue(() => value)
          },
        },
        children: [],
      }),
      Arwaal.createElement({
        type: 'p',
        props: {},
        children: [`Current input: ${inputValue}`],
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
