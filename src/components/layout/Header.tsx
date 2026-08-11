import { Wallet, Calendar } from 'lucide-react'
import './Header.css'

interface HeaderProps {
  currentPeriod: string; // Formato "YYYY-MM", ej: "2026-08"
  onPeriodChange: (period: string) => void;
}

export function Header({ currentPeriod, onPeriodChange }: HeaderProps) {
  // Lista de meses recientes para navegación rápida
  const availablePeriods = [
    { value: '2026-08', label: 'Agosto 2026 (Actual)' },
    { value: '2026-07', label: 'Julio 2026' },
    { value: '2026-06', label: 'Junio 2026' },
    { value: '2026-05', label: 'Mayo 2026' },
  ]

  return (
    <header className="header-container">
      <div className="header-brand">
        <div className="brand-badge">
          <Wallet size={24} className="brand-icon" />
        </div>
        <div className="brand-text">
          <h1>Asesor Financiero Personal</h1>
          <p>Control de sueldo, presupuesto y retiros en efectivo</p>
        </div>
      </div>

      <div className="period-selector">
        <label htmlFor="period-select" className="period-label">
          <Calendar size={16} />
          <span>Período:</span>
        </label>
        <select
          id="period-select"
          value={currentPeriod}
          onChange={(e) => onPeriodChange(e.target.value)}
          className="period-select"
        >
          {availablePeriods.map((period) => (
            <option key={period.value} value={period.value}>
              {period.label}
            </option>
          ))}
        </select>
      </div>
    </header>
  )
}
