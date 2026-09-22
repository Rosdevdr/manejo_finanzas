import type { ReactNode } from 'react'
import {
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpCircle,
  CreditCard,
  Banknote,
  Target,
  BrainCircuit,
  LogOut,
  Cloud,
  HardDrive,
  ShieldCheck,
  FileText,
  Download,
  X,
  Bot,
  Flame,
  Sliders,
  BookOpen,
  Zap,
} from 'lucide-react'
import { AureusLogo } from '../ui/AureusLogo'
import { GithubIcon } from '../ui/GithubIcon'
import type { TabType } from '../../types/navigation'
import './Sidebar.css'

interface SidebarProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  userEmail?: string | null
  isDemoMode?: boolean
  isOpen?: boolean
  onClose?: () => void
  onSignOut?: () => void
  onOpenSecurity?: () => void
  onOpenExport?: () => void
  onOpenFireCalculator?: () => void
  onOpenScenarioSimulator?: () => void
  onOpenLicense?: () => void
  onOpenTerms?: () => void
  onOpenGuide?: () => void
  isInstallable?: boolean
  onInstallApp?: () => void
  onOpenSubscription?: () => void
  currentPlan?: 'free' | 'personal' | 'pro'
}

const NAV_ITEMS: { id: TabType; icon: ReactNode; label: string }[] = [
  { id: 'dashboard',    icon: <LayoutDashboard size={16} />, label: 'Dashboard'    },
  { id: 'incomes',      icon: <ArrowDownCircle size={16} />, label: 'Ingresos'     },
  { id: 'expenses',     icon: <ArrowUpCircle   size={16} />, label: 'Gastos'       },
  { id: 'credit',       icon: <CreditCard      size={16} />, label: 'Tarjetas'     },
  { id: 'cash',         icon: <Banknote        size={16} />, label: 'Efectivo'     },
  { id: 'budgets',      icon: <Target          size={16} />, label: 'Presupuestos' },
  { id: 'advisor',      icon: <BrainCircuit    size={16} />, label: 'Análisis IA'  },
  { id: 'chat-advisor', icon: <Bot             size={16} />, label: 'Asistente IA' },
]

export function Sidebar({
  activeTab,
  onTabChange,
  userEmail,
  isDemoMode,
  isOpen,
  onClose,
  onSignOut,
  onOpenSecurity,
  onOpenExport,
  onOpenFireCalculator,
  onOpenScenarioSimulator,
  onOpenLicense,
  onOpenTerms,
  onOpenGuide,
  onInstallApp,
  onOpenSubscription,
  currentPlan = 'free',
}: SidebarProps) {
  const PLAN_LABELS: Record<string, string> = { free: 'Free', personal: 'Personal', pro: 'Pro ⚡' }
  const PLAN_COLORS: Record<string, string> = { free: '#71717A', personal: '#F59E0B', pro: '#818CF8' }
  const initials = userEmail
    ? userEmail.slice(0, 2).toUpperCase()
    : 'JR'

  const displayName = userEmail
    ? userEmail.split('@')[0]
    : 'Jesús Rosario'

  return (
    <>
      {/* Backdrop overlay for mobile drawer */}
      {isOpen && (
        <div
          className="sidebar-backdrop-glass"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <nav className={`sidebar-obsidian ${isOpen ? 'mobile-open' : ''}`} aria-label="Navegación principal">
        {/* Logo & Mobile Close */}
        <div className="logo-container">
          <AureusLogo size={34} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#E2E2EB', letterSpacing: '0.05em' }}>AUREUS</div>
            <div style={{ fontSize: 9, fontWeight: 600, color: '#888899', letterSpacing: '0.1em' }}>WEALTH ADVISOR</div>
          </div>

          {onClose && (
            <button
              type="button"
              style={{ background: 'transparent', border: 'none', color: '#D0D0DC', cursor: 'pointer', marginLeft: 'auto', padding: 4 }}
              onClick={onClose}
              title="Cerrar menú"
              aria-label="Cerrar menú"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation Modules */}
        <div className="nav-section">
          <div className="nav-label">Módulos</div>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => {
                onTabChange(item.id)
                onClose?.()
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Herramientas Permanentes */}
        <div className="nav-section">
          <div className="nav-label">Herramientas</div>

          {onOpenExport && (
            <button
              type="button"
              className="nav-item"
              onClick={() => {
                onClose?.()
                onOpenExport()
              }}
            >
              <span className="nav-icon" style={{ color: '#F3CA65' }}><FileText size={16} /></span>
              <span>Exportar Reportes</span>
            </button>
          )}

          {onOpenFireCalculator && (
            <button
              type="button"
              className="nav-item"
              onClick={() => {
                onClose?.()
                onOpenFireCalculator()
              }}
            >
              <span className="nav-icon" style={{ color: '#F59E0B' }}><Flame size={16} /></span>
              <span>Calculadora FIRE</span>
            </button>
          )}

          {onOpenScenarioSimulator && (
            <button
              type="button"
              className="nav-item"
              onClick={() => {
                onClose?.()
                onOpenScenarioSimulator()
              }}
            >
              <span className="nav-icon" style={{ color: '#F3CA65' }}><Sliders size={16} /></span>
              <span>Simulador What-If</span>
            </button>
          )}

          {onInstallApp && (
            <button
              type="button"
              className="nav-item"
              onClick={() => {
                onClose?.()
                onInstallApp()
              }}
              style={{ color: '#34D399' }}
            >
              <span className="nav-icon"><Download size={16} /></span>
              <span>Instalar App</span>
            </button>
          )}

          {onOpenGuide && (
            <button
              type="button"
              className="nav-item"
              onClick={() => {
                onClose?.()
                onOpenGuide()
              }}
            >
              <span className="nav-icon" style={{ color: '#F3CA65' }}><BookOpen size={16} /></span>
              <span>Guía de Módulos</span>
            </button>
          )}

          {/* ── BOTÓN DE SUSCRIPCIÓN ── */}
          {onOpenSubscription && (
            <button
              type="button"
              className="nav-item"
              onClick={() => {
                onClose?.()
                onOpenSubscription()
              }}
              style={{ marginTop: 2 }}
            >
              <span className="nav-icon" style={{ color: PLAN_COLORS[currentPlan] || '#F59E0B' }}>
                <Zap size={16} />
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                Mi Plan
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 100,
                  background: `${PLAN_COLORS[currentPlan]}22`,
                  border: `1px solid ${PLAN_COLORS[currentPlan]}44`,
                  color: PLAN_COLORS[currentPlan],
                  letterSpacing: '0.05em',
                }}>
                  {isDemoMode ? 'DEMO' : PLAN_LABELS[currentPlan]}
                </span>
              </span>
            </button>
          )}

          {onOpenLicense && (
            <button
              type="button"
              className="nav-item"
              onClick={() => {
                onClose?.()
                onOpenLicense()
              }}
            >
              <span className="nav-icon">📜</span>
              <span>Licencia MIT</span>
            </button>
          )}

          {onOpenTerms && (
            <button
              type="button"
              className="nav-item"
              onClick={() => {
                onClose?.()
                onOpenTerms()
              }}
            >
              <span className="nav-icon" style={{ color: '#60A5FA' }}><FileText size={16} /></span>
              <span>Términos & Condiciones</span>
            </button>
          )}

          <a
            href="https://github.com/Rosdevdr/manejo_finanzas"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-item"
            style={{ textDecoration: 'none' }}
            onClick={onClose}
          >
            <span className="nav-icon"><GithubIcon size={16} /></span>
            <span>Repositorio GitHub</span>
          </a>
        </div>

        {/* Footer user & Sync Status */}
        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div className="avatar-glass">{initials}</div>
            <div className="user-details">
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
                onClick={() => {
                  onClose?.()
                  onOpenSecurity()
                }}
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
                onClick={() => {
                  onClose?.()
                  onSignOut()
                }}
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
    </>
  )
}
