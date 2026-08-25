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
  Flame,
} from 'lucide-react'
import { GithubIcon } from '../ui/GithubIcon'

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
  onSignOut?: () => void
  onOpenSecurity?: () => void
  onOpenLicense?: () => void
  onOpenExport?: () => void
  onOpenFireCalculator?: () => void
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
  onSignOut,
  onOpenSecurity,
  onOpenLicense,
  onOpenExport,
  onOpenFireCalculator,
  isInstallable,
  onInstallApp,
  onOpenMenu,
}: AppHeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  const initials = userEmail
    ? userEmail.slice(0, 2).toUpperCase()
    : 'JR'

  const displayName = userEmail
    ? userEmail.split('@')[0]
    : 'Jesús Rosario'

  // Close dropdown when clicking outside
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
    <header className="header">
      {/* Left side: Hamburger menu button (Mobile) + Month Navigator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {onOpenMenu && (
          <button
            type="button"
            className="header-menu-btn"
            onClick={onOpenMenu}
            title="Abrir menú de navegación"
            aria-label="Abrir menú de navegación"
          >
            <Menu size={19} />
          </button>
        )}

        <div className="month-nav">
          <button className="month-btn" onClick={onPrev} disabled={prevDisabled} title="Mes anterior">
            <ChevronLeft size={14} />
          </button>
          <div className="month-badge">{periodLabel}</div>
          <button className="month-btn" onClick={onNext} disabled={nextDisabled} title="Mes siguiente">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="header-spacer" />

      {/* Sync indicator pill (Desktop/Tablet) */}
      <div
        className="header-sync-pill"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          fontWeight: 600,
          color: isDemoMode ? '#FBBF24' : '#34D399',
          background: isDemoMode ? 'rgba(251, 191, 36, 0.08)' : 'rgba(52, 211, 153, 0.08)',
          border: `1px solid ${isDemoMode ? 'rgba(251, 191, 36, 0.2)' : 'rgba(52, 211, 153, 0.2)'}`,
          padding: '4px 10px',
          borderRadius: 20,
        }}
      >
        {isDemoMode ? <HardDrive size={12} /> : <Cloud size={12} />}
        <span>{isDemoMode ? 'Modo Local' : 'Sync IRT'}</span>
      </div>

      {/* PWA Install Button (Desktop/Tablet) */}
      {isInstallable && onInstallApp && (
        <button
          type="button"
          onClick={onInstallApp}
          className="header-install-btn"
          title="Instalar AUREUS como App en tu dispositivo"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11.5,
            fontWeight: 700,
            fontFamily: 'Space Grotesk',
            color: '#34D399',
            background: 'rgba(52, 211, 153, 0.1)',
            border: '1px solid rgba(52, 211, 153, 0.3)',
            padding: '5px 12px',
            borderRadius: 10,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Smartphone size={13} />
          <span>Instalar App</span>
        </button>
      )}

      {/* Export Report Button */}
      {onOpenExport && (
        <button
          type="button"
          onClick={onOpenExport}
          className="header-export-btn"
          title="Exportar Reporte Financiero (PDF / CSV)"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11.5,
            fontWeight: 700,
            fontFamily: 'Space Grotesk',
            color: '#F3CA65',
            background: 'rgba(201, 168, 76, 0.1)',
            border: '1px solid rgba(201, 168, 76, 0.3)',
            padding: '5px 12px',
            borderRadius: 10,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <FileText size={13} />
          <span>Exportar</span>
        </button>
      )}

      {/* FIRE Calculator Button */}
      {onOpenFireCalculator && (
        <button
          type="button"
          onClick={onOpenFireCalculator}
          className="header-export-btn"
          title="Calculadora FIRE (Retiro Temprano)"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11.5,
            fontWeight: 700,
            fontFamily: 'Space Grotesk',
            color: '#F59E0B',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            padding: '5px 12px',
            borderRadius: 10,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Flame size={13} />
          <span>Calculadora FIRE</span>
        </button>
      )}

      {/* GitHub shortcut (Desktop) */}
      <a
        href="https://github.com/Rosdevdr/manejo_finanzas"
        target="_blank"
        rel="noopener noreferrer"
        title="Repositorio en GitHub"
        className="header-github-btn"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          borderRadius: 8,
          border: '1px solid #2A2A38',
          background: '#16161E',
          color: '#888898',
          textDecoration: 'none',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.borderColor = '#C9A84C' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#888898'; e.currentTarget.style.borderColor = '#2A2A38' }}
      >
        <GithubIcon size={14} />
      </a>

      {/* Balance pill */}
      <div
        className={`balance-pill${balancePositive ? '' : ' negative'}`}
        style={!balancePositive ? { background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#F87171' } : {}}
      >
        <span className="pill-dot" style={!balancePositive ? { background: '#F87171' } : {}} />
        Balance: {balanceLabel}
      </div>

      {/* User Profile Avatar & Dropdown (Mobile + Desktop) */}
      <div className="header-profile-wrap" ref={profileRef} style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setProfileOpen(!profileOpen)}
          className="header-avatar-btn"
          title={`Perfil: ${displayName}`}
          aria-label="Abrir menú de perfil"
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #F3CA65 0%, #C9A84C 100%)',
            border: '2px solid rgba(201, 168, 76, 0.4)',
            color: '#0A0A0C',
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
            transition: 'transform 0.15s ease',
            touchAction: 'manipulation',
          }}
        >
          {initials}
        </button>

        {profileOpen && (
          <div
            className="header-profile-dropdown fade-in"
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: 220,
              background: '#13131A',
              border: '1px solid #262634',
              borderRadius: 14,
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(201, 168, 76, 0.15)',
              padding: '12px',
              zIndex: 10001,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 8, borderBottom: '1px solid #1E1E28' }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #F3CA65 0%, #C9A84C 100%)',
                  color: '#0A0A0C',
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayName}
                </div>
                <div style={{ fontSize: 11, color: '#888898', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {userEmail || 'Modo Local'}
                </div>
              </div>
            </div>

            {onOpenExport && (
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false)
                  onOpenExport()
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: 'transparent',
                  border: 'none',
                  color: '#D4D4E0',
                  fontSize: 12.5,
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.12s ease',
                  width: '100%',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#1C1C26' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <FileText size={15} color="#F3CA65" />
                <span>Exportar Reportes</span>
              </button>
            )}

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
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: 'transparent',
                  border: 'none',
                  color: '#D4D4E0',
                  fontSize: 12.5,
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.12s ease',
                  width: '100%',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#1C1C26' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <ShieldCheck size={15} color="#F3CA65" />
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
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: 'transparent',
                  border: 'none',
                  color: '#D4D4E0',
                  fontSize: 12.5,
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.12s ease',
                  width: '100%',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#1C1C26' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ fontSize: 13 }}>📜</span>
                <span>Licencia MIT</span>
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
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#F87171',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.12s ease',
                  width: '100%',
                  marginTop: 2,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.16)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)' }}
              >
                <LogOut size={15} />
                <span>Cerrar Sesión</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
