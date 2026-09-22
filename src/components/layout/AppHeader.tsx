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
    <header className="app-header-obsidian">
      {/* Botón menú hamburguesa (Móvil) */}
      {onOpenMenu && (
        <button
          type="button"
          className="header-menu-btn icon-btn-glass"
          onClick={onOpenMenu}
          title="Abrir menú"
          aria-label="Abrir menú"
          style={{ marginRight: 16 }}
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
        <div className="profile-wrapper" ref={tipRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className={`icon-btn-glass ${tipOpen ? 'active-gold' : ''}`}
            onClick={() => setTipOpen(prev => !prev)}
            title="Consejo Financiero del Día"
            aria-label="Consejo Financiero del Día"
          >
            <Lightbulb size={16} className={tipOpen ? 'spin-subtle' : ''} />
          </button>

          {tipOpen && (
            <>
              <div className="tip-mobile-backdrop" onClick={() => setTipOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 90 }} />
              <div className="dropdown-glass" style={{ right: 0, width: 340 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#F3CA65' }}>
                    <Sparkles size={15} />
                    <span>Consejo del Día</span>
                  </div>
                  <span style={{
                    fontSize: 10,
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

                <div style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF', marginBottom: 8, lineHeight: 1.35 }}>
                  {activeTip.title}
                </div>

                <div style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.5, marginBottom: 16 }}>
                  {activeTip.content}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <button
                    type="button"
                    onClick={handleNextTip}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#F3CA65',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '6px 8px',
                      borderRadius: 6,
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(243, 202, 101, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <RefreshCw size={13} /> Siguiente
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipOpen(false)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#D1D5DB',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '6px 12px',
                      borderRadius: 6,
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
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
          className={`balance-pill-glass ${balancePulse ? 'pulse-gold-confirm' : ''}`}
          title={
            carriedOverBalance !== undefined && carriedOverBalance !== 0
              ? `Balance Acumulado Total: ${balanceLabel}\n• Saldo arrastrado de meses previos: ${carriedOverBalance >= 0 ? '+' : ''}${carriedOverBalance.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}\n• Flujo neto de este mes: ${(monthNetFlow ?? 0).toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}`
              : 'Dinero libre disponible en el período'
          }
        >
          <span className="label">Disponible</span>
          <span className={`value ${balancePositive ? 'positive' : 'negative'}`}>
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
          className="icon-btn-glass"
          style={{ textDecoration: 'none' }}
        >
          <GithubIcon size={16} />
        </a>

        {/* Perfil del Usuario / Menu Dropdown */}
        <div className="profile-wrapper" ref={profileRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className="icon-btn-glass"
            onClick={() => {
              triggerHaptic('light')
              setProfileOpen(prev => !prev)
            }}
            title={userEmail || 'Perfil de Usuario'}
            aria-label="Menú de perfil"
            aria-expanded={profileOpen}
            style={{ borderRadius: '50%', background: 'linear-gradient(135deg, rgba(201,168,76,0.2) 0%, rgba(15,15,23,0.8) 100%)', border: '1px solid rgba(201, 168, 76, 0.3)', color: '#F3CA65', fontWeight: 'bold', fontSize: 13 }}
          >
            {userEmail ? userEmail.slice(0, 2).toUpperCase() : 'JR'}
          </button>

          {profileOpen && (
            <div className="dropdown-glass" style={{ right: 0, width: 280 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#E2E2EB' }}>{userEmail || 'Usuario AUREUS'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 100, color: isDemoMode ? '#FBBF24' : '#34D399' }}>
                  {isDemoMode ? <HardDrive size={11} /> : <Cloud size={11} />}
                  <span>{isDemoMode ? 'Demo' : 'Online'}</span>
                </div>
              </div>

              {/* Indicador de Seguridad Institucional */}
              <div
                style={{
                  background: 'rgba(52, 211, 153, 0.08)',
                  border: '1px solid rgba(52, 211, 153, 0.25)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  marginBottom: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#34D399' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399', boxShadow: '0 0 6px #34D399' }} />
                  <span>Conexión Cifrada TLS 256-bit</span>
                </div>
                <div style={{ fontSize: 10, color: '#9CA3AF', paddingLeft: 12 }}>
                  Row Level Security (RLS) Activo
                </div>
              </div>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 -16px 12px -16px' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {isInstallable && onInstallApp && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false)
                      onInstallApp()
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'transparent', border: 'none', color: '#34D399', cursor: 'pointer', borderRadius: 8, fontSize: 13, fontWeight: 500, transition: 'background 0.2s', textAlign: 'left' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(52, 211, 153, 0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Smartphone size={16} />
                    <span>Instalar Aplicación</span>
                  </button>
                )}

                {onOpenSecurity && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false)
                      onOpenSecurity()
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'transparent', border: 'none', color: '#D0D0DC', cursor: 'pointer', borderRadius: 8, fontSize: 13, fontWeight: 500, transition: 'background 0.2s', textAlign: 'left' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <ShieldCheck size={16} />
                    <span>Seguridad & 2FA</span>
                  </button>
                )}

                {onOpenLicense && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false)
                      onOpenLicense()
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'transparent', border: 'none', color: '#D0D0DC', cursor: 'pointer', borderRadius: 8, fontSize: 13, fontWeight: 500, transition: 'background 0.2s', textAlign: 'left' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <FileText size={16} />
                    <span>Licencia MIT</span>
                  </button>
                )}

                {onSignOut && (
                  <>
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '8px -16px' }} />
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false)
                        onSignOut()
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'transparent', border: 'none', color: '#F87171', cursor: 'pointer', borderRadius: 8, fontSize: 13, fontWeight: 500, transition: 'background 0.2s', textAlign: 'left' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(248, 113, 113, 0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <LogOut size={16} />
                      <span>Cerrar Sesión</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
