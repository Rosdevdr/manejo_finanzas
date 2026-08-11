import { useState } from 'react'
import { Header } from './components/layout/Header'
import { Navigation } from './components/layout/Navigation'
import { IncomesView } from './components/incomes/IncomesView'
import type { TabType } from './types/navigation'
import type { Income } from './types/finance'

function App() {
  const [currentPeriod, setCurrentPeriod] = useState('2026-08')
  const [activeTab, setActiveTab] = useState<TabType>('incomes') // Abrir directo en incomes para probar

  // Estado central de ingresos
  const [incomes, setIncomes] = useState<Income[]>([
    {
      id: '1',
      period: '2026-08',
      description: 'Sueldo Principal',
      amount: 65000,
      type: 'salary',
      date: '2026-08-01',
    },
    {
      id: '2',
      period: '2026-08',
      description: 'Proyecto Web Freelance',
      amount: 15000,
      type: 'freelance',
      date: '2026-08-05',
    },
  ])

  const handleAddIncome = (newIncome: Omit<Income, 'id'>) => {
    const incomeWithId: Income = {
      ...newIncome,
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    }
    setIncomes((prev) => [incomeWithId, ...prev])
  }

  const handleUpdateIncome = (updatedIncome: Income) => {
    setIncomes((prev) =>
      prev.map((i) => (i.id === updatedIncome.id ? updatedIncome : i))
    )
  }

  const handleDeleteIncome = (id: string) => {
    setIncomes((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <div className="app-layout">
      <Header currentPeriod={currentPeriod} onPeriodChange={setCurrentPeriod} />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="content-container">
        {activeTab === 'incomes' && (
          <IncomesView
            currentPeriod={currentPeriod}
            incomes={incomes}
            onAddIncome={handleAddIncome}
            onUpdateIncome={handleUpdateIncome}
            onDeleteIncome={handleDeleteIncome}
          />
        )}
        {activeTab !== 'incomes' && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Módulo {activeTab.toUpperCase()} en construcción...
          </div>
        )}
      </main>
    </div>
  )
}

export default App
