import { LayoutDashboard, ArrowDownCircle, ArrowUpCircle, Banknote, BrainCircuit } from 'lucide-react'
import type { TabType } from '../../types/navigation'
import './Navigation.css'

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'incomes' as TabType, label: 'Ingresos', icon: ArrowDownCircle },
    { id: 'expenses' as TabType, label: 'Gastos', icon: ArrowUpCircle },
    { id: 'cash' as TabType, label: 'Efectivo / Cajero', icon: Banknote },
    { id: 'advisor' as TabType, label: 'Asesor IA Local', icon: BrainCircuit },
  ]

  return (
    <nav className="nav-tabs-container">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            className={`nav-tab-button ${isActive ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <Icon size={18} />
            <span>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
