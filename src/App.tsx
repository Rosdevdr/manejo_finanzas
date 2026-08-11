import { useState } from 'react'
import { Header } from './components/layout/Header'
import { Navigation } from './components/layout/Navigation'
import type { TabType } from './types/navigation'

function App() {
  const [currentPeriod, setCurrentPeriod] = useState('2026-08')
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')

  return (
    <div className="app-layout">
      {/* Encabezado con marca y selector de mes */}
      <Header currentPeriod={currentPeriod} onPeriodChange={setCurrentPeriod} />

      {/* Barra de pestañas de navegación */}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Contenedor dinámico según la pestaña activa */}
      <main className="content-container">
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Vista: <span style={{ color: 'var(--color-income)' }}>{activeTab.toUpperCase()}</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Período seleccionado en el sistema: <strong style={{ color: 'var(--text-primary)' }}>{currentPeriod}</strong>
          </p>
        </div>
      </main>
    </div>
  )
}

export default App
