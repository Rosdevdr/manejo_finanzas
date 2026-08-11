import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Bell, 
  Menu
} from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'

interface HeaderProps {
  currentPeriod: string; // "YYYY-MM"
  onPeriodChange: (period: string) => void;
  availableBalance: number;
  onOpenMobileMenu: () => void;
}

export function Header({
  currentPeriod,
  onPeriodChange,
  availableBalance,
  onOpenMobileMenu,
}: HeaderProps) {
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

  return (
    <header className="h-20 bg-[#09090B]/85 backdrop-blur-md border-b border-[#2C2C35] sticky top-0 z-30 px-6 lg:px-8 flex items-center justify-between">
      {/* Botón Móvil y Selector de Mes */}
      <div className="flex items-center gap-3 lg:gap-6">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl bg-[#16161A] border border-[#2C2C35] text-[#9CA3AF] hover:text-[#F5F5F5] cursor-pointer"
        >
          <Menu size={20} />
        </button>

        {/* Month Selector con flechas y color oro */}
        <div className="flex items-center bg-[#16161A] border border-[#2C2C35] rounded-xl p-1 shadow-sm">
          <button
            type="button"
            onClick={handlePrevMonth}
            disabled={currentIndex === availablePeriods.length - 1}
            className="p-2 rounded-lg text-[#71717A] hover:text-[#C9A84C] hover:bg-[#202026] disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
            title="Mes anterior"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-2.5 px-3">
            <Calendar size={16} className="text-[#C9A84C]" />
            <select
              value={currentPeriod}
              onChange={(e) => onPeriodChange(e.target.value)}
              className="bg-transparent text-[#F5F5F5] font-bold text-xs sm:text-sm cursor-pointer outline-none font-sans"
            >
              {availablePeriods.map((period) => (
                <option key={period.value} value={period.value} className="bg-[#16161A] text-[#F5F5F5]">
                  {period.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            disabled={currentIndex === 0}
            className="p-2 rounded-lg text-[#71717A] hover:text-[#C9A84C] hover:bg-[#202026] disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
            title="Mes siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Indicador de Liquidez Neta & Notificaciones */}
      <div className="flex items-center gap-4">
        {/* Pill Badge en tiempo real */}
        <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-full bg-[#16161A] border border-[#2C2C35] shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse"></span>
          <div className="text-xs">
            <span className="text-[#71717A] mr-1.5 font-medium">Disponible:</span>
            <span className={`font-mono font-bold ${availableBalance >= 0 ? 'text-[#34D399]' : 'text-[#F87171]'}`}>
              {formatCurrency(availableBalance)}
            </span>
          </div>
        </div>

        {/* Campana de notificaciones */}
        <button
          type="button"
          className="relative p-2.5 rounded-xl bg-[#16161A] border border-[#2C2C35] text-[#71717A] hover:text-[#C9A84C] hover:border-[#C9A84C]/40 transition-colors cursor-pointer"
          title="Notificaciones patrimoniales"
        >
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#C9A84C]"></span>
        </button>
      </div>
    </header>
  )
}
