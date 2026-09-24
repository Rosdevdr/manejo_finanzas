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
  Scale,
  ExternalLink,
  Shield,
} from 'lucide-react'
import { AureusLogo } from '../ui/AureusLogo'
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

interface NavItemDef {
  id: TabType
  icon: ReactNode
  label: string
}

const PATRIMONIO_ITEMS: NavItemDef[] = [
  { id: 'dashboard',    icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { id: 'incomes',      icon: <ArrowDownCircle size={18} />, label: 'Ingresos' },
  { id: 'expenses',     icon: <ArrowUpCircle size={18} />,   label: 'Gastos' },
  { id: 'budgets',      icon: <Target size={18} />,          label: 'Mi Plan (Presupuesto & FIRE)' },
  { id: 'credit',       icon: <CreditCard size={18} />,      label: 'Tarjetas & Deudas' },
  { id: 'cash',         icon: <Banknote size={18} />,        label: 'Efectivo' },
  { id: 'advisor',      icon: <BrainCircuit size={18} />,    label: 'Análisis IA' },
  { id: 'chat-advisor', icon: <Bot size={18} />,             label: 'Asistente IA' },
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
  onOpenFireCalculator,
  onOpenScenarioSimulator,
  onOpenLicense,
  onOpenTerms,
  onOpenGuide,
  isInstallable,
  onInstallApp,
  onOpenSubscription,
}: SidebarProps) {
  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : 'AS'
  const displayName = userEmail ? userEmail.split('@')[0] : 'Alejandro Silva'

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="sidebar-backdrop-glass"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar-obsidian ${isOpen ? 'mobile-open' : ''}`} aria-label="Navegación principal">
        <div>
          {/* Logo Brand Header */}
          <div className="logo-container">
            <AureusLogo size={32} />
            <div className="logo-text">
              <span className="logo-title">AUREUS</span>
              <span className="logo-subtitle">Wealth Advisor</span>
            </div>

            {onClose && isOpen && (
              <button
                type="button"
                className="action-icon-btn"
                style={{ marginLeft: 'auto' }}
                onClick={onClose}
                title="Cerrar menú"
                aria-label="Cerrar menú"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Section 1: Patrimonio & Control */}
          <nav className="nav-section">
            <span className="nav-label">Patrimonio &amp; Control</span>
            {PATRIMONIO_ITEMS.map(item => {
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    onTabChange(item.id)
                    onClose?.()
                  }}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Divider */}
          <div className="nav-divider" />

          {/* Section 2: Legal & Plataforma */}
          <nav className="nav-section">
            <span className="nav-label">Legal &amp; Plataforma</span>

            {onOpenLicense && (
              <button
                type="button"
                className="nav-item"
                onClick={() => {
                  onClose?.()
                  onOpenLicense()
                }}
              >
                <span className="nav-icon"><Scale size={18} /></span>
                <span>Licencia MIT</span>
                <span className="badge-mit">MIT</span>
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
                <span className="nav-icon"><FileText size={18} /></span>
                <span>Términos &amp; Condiciones</span>
              </button>
            )}

            <a
              href="https://github.com/Rosdevdr/manejo_finanzas"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-item"
              onClick={onClose}
            >
              <span className="nav-icon"><Shield size={18} /></span>
              <span>Repositorio GitHub</span>
              <ExternalLink size={14} style={{ marginLeft: 'auto', opacity: 0.6 }} />
            </a>

            {onOpenFireCalculator && (
              <button
                type="button"
                className="nav-item"
                onClick={() => {
                  onClose?.()
                  onOpenFireCalculator()
                }}
              >
                <span className="nav-icon" style={{ color: 'var(--color-primary-container, #f59e0b)' }}><Flame size={18} /></span>
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
                <span className="nav-icon"><Sliders size={18} /></span>
                <span>Simulador What-If</span>
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
                <span className="nav-icon"><BookOpen size={18} /></span>
                <span>Guía de Módulos</span>
              </button>
            )}

            {isInstallable && onInstallApp && (
              <button
                type="button"
                className="nav-item"
                style={{ color: 'var(--color-tertiary, #56e5a9)' }}
                onClick={() => {
                  onClose?.()
                  onInstallApp()
                }}
              >
                <span className="nav-icon"><Download size={18} /></span>
                <span>Instalar App</span>
              </button>
            )}
          </nav>
        </div>

        {/* Section 3: Membresía Private (Stitch Exact Bottom Card) */}
        <div className="sidebar-membership-card">
          <div className="membership-header">
            <span className="membership-tag">Membresía Private</span>
            <ShieldCheck size={14} style={{ color: 'var(--color-primary, #ffc174)' }} />
          </div>

          <div className="membership-title-row">
            <span className="membership-tier">AUREUS Black</span>
            <span className="membership-dot" />
          </div>

          <span className="membership-desc">Private Wealth • Tier 1</span>

          <div className="membership-footer">
            <div className="user-info">
              <div className="user-avatar">{initials}</div>
              <div className="user-meta">
                <span className="user-name" title={userEmail || displayName}>
                  {displayName}
                </span>
                <span className="user-sync">
                  {isDemoMode ? <HardDrive size={10} /> : <Cloud size={10} />}
                  <span>{isDemoMode ? 'Modo Local' : 'Sync IRT'}</span>
                </span>
              </div>
            </div>

            <div className="membership-actions">
              {onOpenSubscription && (
                <button
                  type="button"
                  className="action-icon-btn"
                  onClick={onOpenSubscription}
                  title="Gestionar Plan"
                  aria-label="Gestionar Plan"
                >
                  <Shield size={14} />
                </button>
              )}

              {onOpenSecurity && (
                <button
                  type="button"
                  className="action-icon-btn"
                  onClick={onOpenSecurity}
                  title="Seguridad & 2FA"
                  aria-label="Seguridad & 2FA"
                >
                  <ShieldCheck size={14} />
                </button>
              )}

              {onSignOut && (
                <button
                  type="button"
                  className="action-icon-btn"
                  onClick={onSignOut}
                  title="Cerrar Sesión"
                  aria-label="Cerrar Sesión"
                >
                  <LogOut size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
