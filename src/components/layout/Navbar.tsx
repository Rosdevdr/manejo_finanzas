import { 
  LayoutDashboard, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Banknote, 
  BrainCircuit, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Wallet
} from 'lucide-react'
import type { TabType } from '../../types/navigation'
import { formatCurrency } from '../../utils/formatters'

interface NavbarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  currentPeriod: string;
  onPeriodChange: (period: string) => void;
  availableBalance: number;
}

export function Navbar({
  activeTab,
  onTabChange,
  currentPeriod,
  onPeriodChange,
  availableBalance,
}: NavbarProps) {
  const availablePeriods = [
    { value: '2026-09', label: 'Septiembre 2026' },
    { value: '2026-08', label: 'Agosto 2026' },
    { value: '2026-07', label: 'Julio 2026' },
    { value: '2026-06', label: 'Junio 2026' },
    { value: '2026-05', label: 'Mayo 2026' },
  ]

  const currentIndex = availablePeriods.findIndex((p) => p.value === currentPeriod)

  const handlePrevMonth = () => {
    if (currentIndex < availablePeriods.length - 1) {
      onPeriodChange(availablePeriods[currentIndex + 1].value)
    }
  }

  const handleNextMonth = () => {
    if (currentIndex > 0) {
      onPeriodChange(availablePeriods[currentIndex - 1].value)
    }
  }

  const navItems = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'incomes' as TabType, label: 'Ingresos', icon: ArrowDownCircle },
    { id: 'expenses' as TabType, label: 'Gastos', icon: ArrowUpCircle },
    { id: 'cash' as TabType, label: 'Efectivo / Cajero', icon: Banknote },
    { id: 'advisor' as TabType, label: 'Asesor IA', icon: BrainCircuit },
  ]

  return (
    <header className="aureus-navbar">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-4">
        {/* 1. Logo de la Marca */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-[rgba(201,168,76,0.15)] border border-[#C9A84C]/40 flex items-center justify-center text-[#C9A84C] shadow-inner">
            <ShieldCheck size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <span className="font-heading font-extrabold text-lg tracking-tight text-[#FFFFFF] block leading-none">
              AUREUS<span className="text-[#C9A84C]">.</span>
            </span>
            <span className="text-[9px] uppercase tracking-[0.2em] text-[#C9A84C] font-bold block mt-0.5">
              WEALTH ADVISOR
            </span>
          </div>
        </div>

        {/* 2. Navegación Central (Pills Elegantes) */}
        <nav className="hidden md:flex items-center gap-1.5 bg-[#17171C] p-1.5 rounded-2xl border border-[#262630]">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`aureus-nav-btn ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} className={isActive ? 'text-[#C9A84C]' : 'text-[#71717A]'} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* 3. Selector de Mes & Balance en Tiempo Real */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Selector de Mes */}
          <div className="flex items-center bg-[#17171C] border border-[#262630] rounded-xl p-1 shadow-sm">
            <button
              type="button"
              onClick={handlePrevMonth}
              disabled={currentIndex === availablePeriods.length - 1}
              className="p-1.5 rounded-lg text-[#71717A] hover:text-[#C9A84C] hover:bg-[#22222A] disabled:opacity-20 transition-colors cursor-pointer"
              title="Mes anterior"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-2 px-2.5">
              <Calendar size={14} className="text-[#C9A84C]" />
              <select
                value={currentPeriod}
                onChange={(e) => onPeriodChange(e.target.value)}
                className="bg-transparent text-[#FFFFFF] font-bold text-xs sm:text-sm cursor-pointer outline-none font-sans"
              >
                {availablePeriods.map((period) => (
                  <option key={period.value} value={period.value} className="bg-[#17171C] text-[#FFFFFF]">
                    {period.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              disabled={currentIndex === 0}
              className="p-1.5 rounded-lg text-[#71717A] hover:text-[#C9A84C] hover:bg-[#22222A] disabled:opacity-20 transition-colors cursor-pointer"
              title="Mes siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Badge de Balance */}
          <div className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#17171C] border border-[#262630]">
            <Wallet size={14} className={availableBalance >= 0 ? 'text-[#34D399]' : 'text-[#F87171]'} />
            <span className="text-xs text-[#71717A]">Disp:</span>
            <span className={`text-xs font-mono font-bold ${availableBalance >= 0 ? 'text-[#34D399]' : 'text-[#F87171]'}`}>
              {formatCurrency(availableBalance)}
            </span>
          </div>

          {/* Avatar Usuario */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C9A84C] to-[#8C6D27] flex items-center justify-center font-bold text-xs text-[#0A0A0D] shadow-sm shrink-0">
            JR
          </div>
        </div>
      </div>

      {/* Navegación Móvil Inferior */}
      <div className="md:hidden flex items-center justify-around border-t border-[#262630] py-2 px-2 bg-[#131317]">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-medium ${
                isActive ? 'text-[#C9A84C] font-semibold' : 'text-[#71717A]'
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
    </header>
  )
}
