import { LayoutDashboard, ArrowDownCircle, ArrowUpCircle, CreditCard, Banknote, BrainCircuit } from 'lucide-react'
import type { TabType } from '../../types/navigation'

interface BottomNavProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

const NAV_ITEMS: { id: TabType; icon: React.ComponentType<{ size?: number }>; label: string }[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Panel'     },
  { id: 'incomes',   icon: ArrowDownCircle, label: 'Ingresos'  },
  { id: 'expenses',  icon: ArrowUpCircle,   label: 'Gastos'    },
  { id: 'credit',    icon: CreditCard,      label: 'Tarjetas'  },
  { id: 'cash',      icon: Banknote,        label: 'Efectivo'  },
  { id: 'advisor',   icon: BrainCircuit,    label: 'Asesor IA' },
]

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="mobile-bottom-nav" aria-label="Navegación principal móvil">
      {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
        const isActive = activeTab === id
        return (
          <button
            key={id}
            type="button"
            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => onTabChange(id)}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={18} />
            <span className="mobile-nav-label">{label}</span>
            {isActive && <span className="mobile-nav-indicator" />}
          </button>
        )
      })}
    </nav>
  )
}
