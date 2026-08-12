import { ChevronLeft, ChevronRight, Cloud, HardDrive } from 'lucide-react'
import { GithubIcon } from '../ui/GithubIcon'

interface AppHeaderProps {
  periodLabel: string
  onPrev: () => void
  onNext: () => void
  prevDisabled: boolean
  nextDisabled: boolean
  balanceLabel: string
  balancePositive: boolean
  isDemoMode?: boolean
}

export function AppHeader({
  periodLabel, onPrev, onNext, prevDisabled, nextDisabled, balanceLabel, balancePositive, isDemoMode
}: AppHeaderProps) {
  return (
    <header className="header">
      <div className="month-nav">
        <button className="month-btn" onClick={onPrev} disabled={prevDisabled} title="Mes anterior">
          <ChevronLeft size={14} />
        </button>
        <div className="month-badge">{periodLabel}</div>
        <button className="month-btn" onClick={onNext} disabled={nextDisabled} title="Mes siguiente">
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="header-spacer" />

      {/* Sync indicator pill */}
      <div style={{
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
      }}>
        {isDemoMode ? <HardDrive size={12} /> : <Cloud size={12} />}
        <span>{isDemoMode ? 'Modo Local' : 'Sync IRT'}</span>
      </div>

      {/* GitHub shortcut */}
      <a
        href="https://github.com/Rosdevdr/manejo_finanzas"
        target="_blank"
        rel="noopener noreferrer"
        title="Repositorio en GitHub"
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
          transition: 'all 0.15s ease'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.borderColor = '#C9A84C' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#888898'; e.currentTarget.style.borderColor = '#2A2A38' }}
      >
        <GithubIcon size={14} />
      </a>

      {/* Balance pill */}
      <div className={`balance-pill${balancePositive ? '' : ' negative'}`}
        style={!balancePositive ? { background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#F87171' } : {}}>
        <span className="pill-dot" style={!balancePositive ? { background: '#F87171' } : {}} />
        Balance: {balanceLabel}
      </div>
    </header>
  )
}
