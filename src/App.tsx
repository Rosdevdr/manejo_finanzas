import { Wallet } from 'lucide-react'

function App() {
  return (
    <main className="app-container">
      <header className="app-header">
        <div className="header-brand">
          <Wallet className="brand-icon" size={32} />
          <div>
            <h1>Asesor Financiero Personal</h1>
            <p>Control mensual de sueldo, gastos y retiros en efectivo</p>
          </div>
        </div>
      </header>
    </main>
  )
}

export default App
