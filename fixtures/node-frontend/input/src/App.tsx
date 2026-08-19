import { useState } from "react";

export function App() {
  const [count, setCount] = useState(0);

  return (
    <main>
      <h1>AgentInstall frontend fixture</h1>
      <button type="button" onClick={() => setCount((value) => value + 1)}>
        Count: {count}
      </button>
    </main>
  );
}
