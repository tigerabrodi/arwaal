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
  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
      <input
        type="text"
        value={inputValue}
        placeholder="Enter text here"
        onInput={(e: Event) => {
          const value = (e.target as HTMLInputElement).value
          console.log('Raw input event value:', value)
          setInputValue(() => value)
        }}
      />
      <p>Current input: {inputValue}</p>
    </div>
  )
}

const container = document.getElementById('app')
Arwaal.render({ element: <Counter />, container: container! })
