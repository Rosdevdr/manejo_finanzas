import { useState, useRef, useEffect } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Cloud,
  HardDrive,
  LogOut,
  ShieldCheck,
  FileText,
  Smartphone,
  Menu,
  Lightbulb,
  Sparkles,
  RefreshCw,
} from 'lucide-react'
import { GithubIcon } from '../ui/GithubIcon'
import { CardAlertsPopover } from '../alerts/CardAlertsPopover'
import type { CreditCard, CreditCardTransaction } from '../../types/finance'
import { getRandomDailyTip, FINANCIAL_TIPS_BANK } from '../../utils/financialTips'
import { triggerHaptic } from '../../utils/haptics'

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
}

export function AppHeader({
  periodLabel,
  onPrev,
  onNext,
  prevDisabled,
  nextDisabled,
  balanceLabel,
  balancePositive,
  carriedOverBalance,
  monthNetFlow,
  isDemoMode,
  userEmail,
  currentPeriod = '2026-09',
  creditCards = [],
  creditTransactions = [],
  onSignOut,
  onOpenSecurity,
  onOpenLicense,
  isInstallable,
  onInstallApp,
  onOpenMenu,
}: AppHeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  // Estado y popover del Consejo del Día
  const [tipOpen, setTipOpen] = useState(false)
  const [tipIndex, setTipIndex] = useState(() => {
    const defaultTip = getRandomDailyTip(currentPeriod)
    const idx = FINANCIAL_TIPS_BANK.findIndex(t => t.id === defaultTip.id)
    return idx >= 0 ? idx : 0
  })
  const tipRef = useRef<HTMLDivElement>(null)

  // Pulso dorado reactivo en Saldo Disponible
  const [balancePulse, setBalancePulse] = useState(false)
  const prevBalanceRef = useRef(balanceLabel)

  useEffect(() => {
    if (prevBalanceRef.current !== balanceLabel) {
      prevBalanceRef.current = balanceLabel
      setBalancePulse(true)
      const timer = setTimeout(() => setBalancePulse(false), 900)
      return () => clearTimeout(timer)
    }
  }, [balanceLabel])

  const activeTip = FINANCIAL_TIPS_BANK[tipIndex] || FINANCIAL_TIPS_BANK[0]

  const handleNextTip = (e: React.MouseEvent) => {
    e.stopPropagation()
    triggerHaptic('light')
    setTipIndex(prev => (prev + 1) % FINANCIAL_TIPS_BANK.length)
  }

  // Cerrar menús al hacer clic fuera o presionar Escape
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

  return (
    <header className="app-header">
      {/* Botón menú hamburguesa (Móvil) */}
      {onOpenMenu && (
        <button
          type="button"
          className="header-menu-btn"
          onClick={onOpenMenu}
          title="Abrir menú"
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Navegador de Período (Meses) */}
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

      {/* Balances & Acciones a la derecha */}
      <div className="header-right">
        {/* Pastilla de Consejo Financiero del Día */}
        <div className="profile-wrapper" ref={tipRef}>
          <button
            type="button"
            className={`header-tip-btn ${tipOpen ? 'active' : ''}`}
            onClick={() => setTipOpen(prev => !prev)}
            title="Consejo Financiero del Día"
            aria-label="Consejo Financiero del Día"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 8,
              background: tipOpen ? 'rgba(243, 202, 101, 0.2)' : 'rgba(243, 202, 101, 0.1)',
              border: '1px solid rgba(243, 202, 101, 0.3)',
              color: '#F3CA65',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
            }}
          >
            <Lightbulb size={16} className={tipOpen ? 'spin-subtle' : ''} />
          </button>

          {tipOpen && (
            <>
              <div className="tip-mobile-backdrop" onClick={() => setTipOpen(false)} />
              <div className="profile-dropdown tip-dropdown fade-in">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#F3CA65' }}>
                  <Sparkles size={14} />
                  <span>Consejo del Día</span>
                </div>
                <span style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: 'rgba(243, 202, 101, 0.15)',
                  color: '#F3CA65',
                  border: '1px solid rgba(243, 202, 101, 0.3)',
                }}>
                  {activeTip.category}
                </span>
              </div>

              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#FFFFFF', marginBottom: 6, lineHeight: 1.35 }}>
                {activeTip.title}
              </div>

              <div style={{ fontSize: 11.5, color: '#9CA3AF', lineHeight: 1.45, marginBottom: 12 }}>
                {activeTip.content}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <button
                  type="button"
                  onClick={handleNextTip}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#F3CA65',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 6px',
                    borderRadius: 6,
                  }}
                >
                  <RefreshCw size={11} /> Siguiente
                </button>
                <button
                  type="button"
                  onClick={() => setTipOpen(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#D1D5DB',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '4px 10px',
                    borderRadius: 6,
                  }}
                >
                  Entendido
                </button>
              </div>
            </div>
          </>
        )}
        </div>

        {/* Pill de Saldo Disponible con Pulso Reactivo */}
        <div
          className={`balance-pill ${balancePulse ? 'pulse-gold-confirm' : ''}`}
          title={
            carriedOverBalance !== undefined && carriedOverBalance !== 0
              ? `Balance Acumulado Total: ${balanceLabel}\n• Saldo arrastrado de meses previos: ${carriedOverBalance >= 0 ? '+' : ''}${carriedOverBalance.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}\n• Flujo neto de este mes: ${(monthNetFlow ?? 0).toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}`
              : 'Dinero libre disponible en el período'
          }
        >
          <span className="balance-pill-label">Disponible</span>
          <span className={`balance-pill-value ${balancePositive ? 'positive' : 'negative'}`}>
            {balanceLabel}
          </span>
        </div>

        {/* Notificaciones (Icono Campanita de Alertas de Tarjetas) */}
        <CardAlertsPopover creditCards={creditCards} creditTransactions={creditTransactions} />

        {/* Repositorio GitHub */}
        <a
          href="https://github.com/Rosdevdr/manejo_finanzas"
          target="_blank"
          rel="noopener noreferrer"
          title="Repositorio en GitHub"
          className="github-shortcut"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#D1D5DB',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: 6,
            borderRadius: 8,
            transition: 'all 0.15s ease',
          }}
        >
          <GithubIcon size={16} />
        </a>

        {/* Perfil del Usuario / Menu Dropdown */}
        <div className="profile-wrapper" ref={profileRef}>
          <button
            type="button"
            className="profile-trigger"
            onClick={() => {
              triggerHaptic('light')
              setProfileOpen(prev => !prev)
            }}
            title={userEmail || 'Perfil de Usuario'}
            aria-label="Menú de perfil"
            aria-expanded={profileOpen}
          >
            <div className="avatar header-avatar">
              {userEmail ? userEmail.slice(0, 2).toUpperCase() : 'JR'}
            </div>
          </button>

          {profileOpen && (
            <div className="profile-dropdown fade-in">
              <div className="profile-header">
                <div className="profile-email">{userEmail || 'Usuario AUREUS'}</div>
                <div className="profile-badge">
                  {isDemoMode ? (
                    <>
                      <HardDrive size={11} /> <span>Modo Demo Local</span>
                    </>
                  ) : (
                    <>
                      <Cloud size={11} /> <span>Supabase Conectado</span>
                    </>
                  )}
                </div>
              </div>

              {/* Indicador de Seguridad Institucional Estilo Revolut */}
              <div
                style={{
                  background: 'rgba(52, 211, 153, 0.08)',
                  border: '1px solid rgba(52, 211, 153, 0.25)',
                  borderRadius: 8,
                  padding: '7px 10px',
                  margin: '8px 12px 6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, fontWeight: 700, color: '#34D399' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399', boxShadow: '0 0 6px #34D399' }} />
                  <span>Conexión Cifrada TLS 256-bit</span>
                </div>
                <div style={{ fontSize: 9.5, color: '#9CA3AF', paddingLeft: 12 }}>
                  Row Level Security (RLS) Activo
                </div>
              </div>

              <div className="dropdown-divider" />

              {isInstallable && onInstallApp && (
                <button
                  type="button"
                  className="dropdown-item"
                  onClick={() => {
                    setProfileOpen(false)
                    onInstallApp()
                  }}
                  style={{ color: '#34D399' }}
                >
                  <Smartphone size={14} />
                  <span>Instalar Aplicación</span>
                </button>
              )}

              {onOpenSecurity && (
                <button
                  type="button"
                  className="dropdown-item"
                  onClick={() => {
                    setProfileOpen(false)
                    onOpenSecurity()
                  }}
                >
                  <ShieldCheck size={14} />
                  <span>Seguridad & 2FA</span>
                </button>
              )}

              {onOpenLicense && (
                <button
                  type="button"
                  className="dropdown-item"
                  onClick={() => {
                    setProfileOpen(false)
                    onOpenLicense()
                  }}
                >
                  <FileText size={14} />
                  <span>Licencia MIT</span>
                </button>
              )}

              {onSignOut && (
                <>
                  <div className="dropdown-divider" />
                  <button
                    type="button"
                    className="dropdown-item danger"
                    onClick={() => {
                      setProfileOpen(false)
                      onSignOut()
                    }}
                  >
                    <LogOut size={14} />
                    <span>Cerrar Sesión</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
