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
} from 'lucide-react'
import { GithubIcon } from '../ui/GithubIcon'
import { CardAlertsPopover } from '../alerts/CardAlertsPopover'
import type { CreditCard, CreditCardTransaction } from '../../types/finance'

interface AppHeaderProps {
  periodLabel: string
  onPrev: () => void
  onNext: () => void
  prevDisabled?: boolean
  nextDisabled?: boolean
  balanceLabel: string
  balancePositive: boolean
  isDemoMode?: boolean
  userEmail?: string | null
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
  isDemoMode,
  userEmail,
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

  // Cerrar el menú si se hace clic fuera de él
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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
        {/* Pill de Saldo Disponible */}
        <div className="balance-pill" title="Dinero libre en el período actual">
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
            color: '#717182',
            padding: 6,
            borderRadius: 8,
            transition: 'color 0.15s ease',
          }}
        >
          <GithubIcon size={16} />
        </a>

        {/* Perfil del Usuario / Menu Dropdown */}
        <div className="profile-wrapper" ref={profileRef}>
          <button
            type="button"
            className="profile-trigger"
            onClick={() => setProfileOpen(prev => !prev)}
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
