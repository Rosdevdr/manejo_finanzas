import { ChevronLeft, ChevronRight } from 'lucide-react'

interface AppHeaderProps {
  periodLabel: string
  onPrev: () => void
  onNext: () => void
  prevDisabled: boolean
  nextDisabled: boolean
  balanceLabel: string
  balancePositive: boolean
}

export function AppHeader({
  periodLabel, onPrev, onNext, prevDisabled, nextDisabled, balanceLabel, balancePositive
}: AppHeaderProps) {
  return (
    <header className="header">
      <div className="month-nav">
        <button className="month-btn" onClick={onPrev} disabled={prevDisabled}>
          <ChevronLeft size={14} />
        </button>
        <div className="month-badge">{periodLabel}</div>
        <button className="month-btn" onClick={onNext} disabled={nextDisabled}>
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="header-spacer" />

      <div className={`balance-pill${balancePositive ? '' : ' negative'}`}
        style={!balancePositive ? { background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#F87171' } : {}}>
        <span className="pill-dot" style={!balancePositive ? { background: '#F87171' } : {}} />
        Balance: {balanceLabel}
      </div>
    </header>
  )
}
