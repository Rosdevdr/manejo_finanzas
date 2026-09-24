import { useState, useRef, useEffect } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Bell,
  Menu,
  Lightbulb,
  ShieldCheck,
  LogOut,
  Sparkles,
  RefreshCw,
  ChevronDown,
  Shield,
} from 'lucide-react'
import type { CreditCard, CreditCardTransaction } from '../../types/finance'
import { getRandomDailyTip, FINANCIAL_TIPS_BANK } from '../../utils/financialTips'
import { triggerHaptic } from '../../utils/haptics'
import './AppHeader.css'

interface AppHeaderProps {
  periodLabel: string
  onPrev: () => void
  onNext: () => void
  prevDisabled?: boolean
  nextDisabled?: boolean
  balanceLabel: string
  balancePositive: boolean
  carriedOverBalance?: number
  monthNetFlow?: number
  isDemoMode?: boolean
  userEmail?: string | null
  currentPeriod?: string
  creditCards?: CreditCard[]
  creditTransactions?: CreditCardTransaction[]
  onSignOut?: () => void
  onOpenSecurity?: () => void
  onOpenLicense?: () => void
  isInstallable?: boolean
  onInstallApp?: () => void
  onOpenMenu?: () => void
  theme?: 'light' | 'dark'
  onToggleTheme?: () => void
}

export function AppHeader({
  periodLabel,
  onPrev,
  onNext,
  prevDisabled,
  nextDisabled,
  balanceLabel,
  userEmail,
  currentPeriod = '2026-09',
  onSignOut,
  onOpenSecurity,
  onOpenMenu,
  theme = 'dark',
  onToggleTheme,
}: AppHeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  // Daily tip modal / popover
  const [tipOpen, setTipOpen] = useState(false)
  const [tipIndex, setTipIndex] = useState(() => {
    const defaultTip = getRandomDailyTip(currentPeriod)
    const idx = FINANCIAL_TIPS_BANK.findIndex(t => t.id === defaultTip.id)
    return idx >= 0 ? idx : 0
  })
  const tipRef = useRef<HTMLDivElement>(null)

  const activeTip = FINANCIAL_TIPS_BANK[tipIndex] || FINANCIAL_TIPS_BANK[0]

  const handleNextTip = (e: React.MouseEvent) => {
    e.stopPropagation()
    triggerHaptic('light')
    setTipIndex(prev => (prev + 1) % FINANCIAL_TIPS_BANK.length)
  }

  // Close dropdowns on outside click or escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false)
      }
      if (tipRef.current && !tipRef.current.contains(event.target as Node)) {
        setTipOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setProfileOpen(false)
        setTipOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const displayName = userEmail ? userEmail.split('@')[0] : 'Alejandro Silva'
  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : 'AS'

  return (
    <header className="app-header-obsidian">
      {/* Left: Mobile Toggle + Title + Period */}
      <div className="header-left">
        {onOpenMenu && (
          <button
            type="button"
            className="icon-btn-glass lg:hidden"
            onClick={onOpenMenu}
            title="Abrir menú"
            aria-label="Abrir menú"
          >
            <Menu size={18} />
          </button>
        )}

        <div className="header-brand-title">
          <span className="header-icon">
            <Shield size={18} />
          </span>
          <span>Dashboard Financiero Consolidado</span>
        </div>
      </div>

      {/* Center: Period Selector Moved Left of Balance Pill for Perfect Visual Balance */}
      <div className="header-center">
        <div className="period-nav" aria-label="Navegación de período">
          <button
            type="button"
            className="nav-btn"
            onClick={onPrev}
            disabled={prevDisabled}
            title="Mes anterior"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="period-label">{periodLabel}</span>
          <button
            type="button"
            className="nav-btn"
            onClick={onNext}
            disabled={nextDisabled}
            title="Mes siguiente"
            aria-label="Mes siguiente"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Right: Available Total Pill + Tools + Theme + Profile */}
      <div className="header-right">
        {/* Disponible Total Pill */}
        <div className="header-balance-pill">
          <span className="header-balance-label">Disponible Total:</span>
          <span className="header-balance-amount">{balanceLabel}</span>
          <span className="header-balance-badge">+3.8%</span>
        </div>

        {/* Action Controls */}
        <div className="header-controls">
          {/* Tip Popover */}
          <div ref={tipRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className="icon-btn-glass"
              onClick={() => setTipOpen(prev => !prev)}
              title="Consejo Financiero del Día"
              aria-label="Consejo Financiero del Día"
            >
              <Lightbulb size={17} />
            </button>

            {tipOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 10,
                  width: 320,
                  backgroundColor: 'var(--color-surface-container, #1c2028)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 14,
                  padding: 16,
                  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5)',
                  zIndex: 99,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--color-primary, #ffc174)' }}>
                    <Sparkles size={14} />
                    <span>Inteligencia AUREUS</span>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-primary-container, #f59e0b)' }}>
                    {activeTip.category}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-on-surface, #dfe2ee)', marginBottom: 6 }}>
                  {activeTip.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-on-surface-variant, #d8c3ad)', lineHeight: 1.4, marginBottom: 12 }}>
                  {activeTip.content}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <button
                    type="button"
                    onClick={handleNextTip}
                    style={{ background: 'transparent', border: 'none', color: 'var(--color-primary, #ffc174)', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <RefreshCw size={12} /> Siguiente
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipOpen(false)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--color-outline, #a08e7a)', fontSize: 11, cursor: 'pointer' }}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notifications Button */}
          <button
            type="button"
            className="icon-btn-glass"
            title="Notificaciones"
            aria-label="Notificaciones"
            onClick={() => setTipOpen(prev => !prev)}
          >
            <Bell size={17} />
            <span className="icon-badge-dot" />
          </button>

          {/* Theme Toggle Button */}
          {onToggleTheme && (
            <button
              type="button"
              className="icon-btn-glass"
              onClick={onToggleTheme}
              title={`Cambiar a tema ${theme === 'dark' ? 'claro' : 'oscuro'}`}
              aria-label={`Cambiar a tema ${theme === 'dark' ? 'claro' : 'oscuro'}`}
            >
              {theme === 'dark' ? <Moon size={17} /> : <Sun size={17} />}
            </button>
          )}

          {/* User Profile */}
          <div ref={profileRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className="header-profile-widget"
              onClick={() => setProfileOpen(prev => !prev)}
              aria-label="Menú de perfil"
            >
              <div
                className="header-profile-avatar"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--color-primary, #ffc174)',
                }}
              >
                {initials}
              </div>
              <div className="header-profile-meta">
                <span className="header-profile-name">{displayName}</span>
                <span className="header-profile-role">CFA • Wealth Owner</span>
              </div>
              <ChevronDown size={14} style={{ color: 'var(--color-outline, #a08e7a)' }} />
            </button>

            {profileOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 10,
                  width: 200,
                  backgroundColor: 'var(--color-surface-container, #1c2028)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 12,
                  padding: 8,
                  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5)',
                  zIndex: 99,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                {onOpenSecurity && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false)
                      onOpenSecurity()
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-on-surface, #dfe2ee)',
                      fontSize: 13,
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-container-high, #262a33)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <ShieldCheck size={16} style={{ color: 'var(--color-tertiary, #56e5a9)' }} />
                    <span>Seguridad &amp; 2FA</span>
                  </button>
                )}

                {onSignOut && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false)
                      onSignOut()
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-error, #ffb4ab)',
                      fontSize: 13,
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(147, 0, 10, 0.2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <LogOut size={16} />
                    <span>Cerrar Sesión</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
