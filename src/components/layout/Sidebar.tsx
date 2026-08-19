import type { ReactNode } from 'react'
import { LayoutDashboard, ArrowDownCircle, ArrowUpCircle, CreditCard, Banknote, BrainCircuit, LogOut, Cloud, HardDrive, ShieldCheck } from 'lucide-react'
import { AureusLogo } from '../ui/AureusLogo'
import type { TabType } from '../../types/navigation'

interface SidebarProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  userEmail?: string | null
  isDemoMode?: boolean
  onSignOut?: () => void
  onOpenSecurity?: () => void
}

const NAV_ITEMS: { id: TabType; icon: ReactNode; label: string }[] = [
  { id: 'dashboard', icon: <LayoutDashboard size={15} />, label: 'Dashboard'   },
  { id: 'incomes',   icon: <ArrowDownCircle size={15} />, label: 'Ingresos'    },
  { id: 'expenses',  icon: <ArrowUpCircle   size={15} />, label: 'Gastos'      },
  { id: 'credit',    icon: <CreditCard      size={15} />, label: 'Tarjetas'    },
  { id: 'cash',      icon: <Banknote        size={15} />, label: 'Efectivo'    },
  { id: 'advisor',   icon: <BrainCircuit    size={15} />, label: 'Asesor IA'   },
]

export function Sidebar({ activeTab, onTabChange, userEmail, isDemoMode, onSignOut, onOpenSecurity }: SidebarProps) {
  const initials = userEmail
    ? userEmail.slice(0, 2).toUpperCase()
    : 'JR'

  const displayName = userEmail
    ? userEmail.split('@')[0]
    : 'Jesús Rosario'

  return (
    <nav className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-mark">
          <AureusLogo size={34} />
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

      {/* Footer user & Sync Status */}
      <div className="sidebar-footer" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div className="avatar">{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div className="user-name" title={userEmail || displayName}>{displayName}</div>
            <div className="user-status" style={{ color: isDemoMode ? '#FBBF24' : '#34D399' }}>
              {isDemoMode ? <HardDrive size={10} /> : <Cloud size={10} />}
              <span>{isDemoMode ? 'Modo Local' : 'Sync IRT'}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {onOpenSecurity && (
            <button
              type="button"
              onClick={onOpenSecurity}
              title="Seguridad & 2FA"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#717182',
                cursor: 'pointer',
                padding: 6,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#F3CA65')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#717182')}
            >
              <ShieldCheck size={15} />
            </button>
          )}

          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              title="Cerrar Sesión"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#717182',
                cursor: 'pointer',
                padding: 6,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#F87171')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#717182')}
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
