import type { ReactNode } from 'react'
import { LayoutDashboard, ArrowDownCircle, ArrowUpCircle, Banknote, BrainCircuit } from 'lucide-react'
import type { TabType } from '../../types/navigation'

interface SidebarProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

const NAV_ITEMS: { id: TabType; icon: ReactNode; label: string }[] = [
  { id: 'dashboard', icon: <LayoutDashboard size={15} />, label: 'Dashboard'   },
  { id: 'incomes',   icon: <ArrowDownCircle size={15} />, label: 'Ingresos'    },
  { id: 'expenses',  icon: <ArrowUpCircle   size={15} />, label: 'Gastos'      },
  { id: 'cash',      icon: <Banknote        size={15} />, label: 'Efectivo'    },
  { id: 'advisor',   icon: <BrainCircuit    size={15} />, label: 'Asesor IA'   },
]

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <nav className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-mark">
          <div className="logo-icon">A</div>
          <div>
            <div className="logo-name">AUREUS</div>
            <div className="logo-sub">WEALTH ADVISOR</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="nav-section">
        <div className="nav-label">Menu</div>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`nav-item${activeTab === item.id ? ' active' : ''}`}
            onClick={() => onTabChange(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      {/* Footer user */}
      <div className="sidebar-footer">
        <div className="avatar">JR</div>
        <div>
          <div className="user-name">Jesús Rosario</div>
          <div className="user-status">
            <span className="status-dot" />
            Premium
          </div>
        </div>
      </div>
    </nav>
  )
}
