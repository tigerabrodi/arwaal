# Arwaal 🔄

A React-like library built from scratch in TypeScript.

Just for fun to learn and experiment.

## What is this?

Arwaal is an educational implementation of React, built step by step to understand how React actually works under the hood. It implements the core architecture including fiber reconciliation, hooks, and the virtual DOM.

## Features ✨

- 📦 Complete fiber architecture implementation
- 🔄 Concurrent rendering with work loop
- 🪝 Hooks implementation
  - useState
  - useEffect
  - useRef
  - useMemo
  - useCallback
- 🌳 Virtual DOM with efficient diffing
- 🧩 Function components support

## What I learned 🧠

- The fiber reconciliation algorithm
- Hooks rely on a stable call order, explaining their restrictions
- React's performance comes from smart diffing and batched updates
- Effect timing explains many React behaviors that seem puzzling at first

## Running the code

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm run test
```

## Project Structure 📁

```
src/
├── core/              # Core implementation
│   ├── createElement.ts
│   ├── dom.ts
│   ├── fiber.ts
│   ├── render.ts
│   ├── hooks/         # All hooks in one folder
│   └── types.ts
├── lib.ts             # Main library exports
└── main.ts            # Demo code
```
