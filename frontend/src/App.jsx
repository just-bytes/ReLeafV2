import { useEffect, useState } from 'react'
import './App.css'

const MESSAGES = {
  checking: 'Checking backend…',
  ok: 'Backend: ok ✅',
  error: 'Backend unreachable ❌',
}

function App() {
  const [backend, setBackend] = useState('checking')

  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => setBackend(data.status === 'ok' ? 'ok' : 'error'))
      .catch(() => setBackend('error'))
  }, [])

  return (
    <main>
      <h1>ReLeaf</h1>
      <p>Satellite deforestation monitoring for NGOs</p>
      <p>{MESSAGES[backend]}</p>
    </main>
  )
}

export default App
