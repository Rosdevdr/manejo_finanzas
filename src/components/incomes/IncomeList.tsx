import { Briefcase, Sparkles, TrendingUp, DollarSign, Pencil, Trash2 } from 'lucide-react'
import type { Income, IncomeType } from '../../types/finance'
import { formatCurrency } from '../../utils/formatters'

interface IncomeListProps {
  incomes: Income[];
  onEdit: (income: Income) => void;
  onDelete: (id: string) => void;
}

export function IncomeList({ incomes, onEdit, onDelete }: IncomeListProps) {
  const getTypeBadge = (type: IncomeType) => {
    switch (type) {
      case 'salary':
        return { label: 'Sueldo Base', icon: Briefcase, color: 'text-[#C9A84C] bg-[rgba(201,168,76,0.14)] border-[#C9A84C]/30' }
      case 'freelance':
        return { label: 'Freelance', icon: Sparkles, color: 'text-[#A855F7] bg-[rgba(168,85,247,0.14)] border-[#A855F7]/30' }
      case 'investment':
        return { label: 'Inversión', icon: TrendingUp, color: 'text-[#3B82F6] bg-[rgba(59,130,246,0.14)] border-[#3B82F6]/30' }
      case 'extra':
      default:
        return { label: 'Extra', icon: DollarSign, color: 'text-[#34D399] bg-[rgba(52,211,153,0.14)] border-[#34D399]/30' }
    }
  }

  if (incomes.length === 0) {
    return (
      <div className="bg-[#16161A] border border-dashed border-[#2C2C35] rounded-2xl p-16 text-center flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#202026] flex items-center justify-center text-[#71717A]">
          <DollarSign size={24} />
        </div>
        <h4 className="text-base font-semibold text-[#F5F5F5]">No hay ingresos registrados en este período</h4>
        <p className="text-xs text-[#71717A] max-w-md">
          Utiliza el formulario superior para registrar tu sueldo base o ingresos adicionales.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-[#16161A] border border-[#2C2C35] rounded-2xl p-7 sm:p-8 shadow-md space-y-4">
      <div className="flex items-center justify-between border-b border-[#2C2C35] pb-5">
        <div>
          <span className="text-[11px] uppercase tracking-[0.14em] text-[#71717A] font-semibold block mb-0.5">
            HISTORIAL DETALLADO
          </span>
          <h4 className="text-lg font-heading font-bold text-[#F5F5F5]">
            Entradas Registradas ({incomes.length})
          </h4>
        </div>
        <span className="text-xs text-[#71717A] font-mono">Orden cronológico</span>
      </div>

      <div className="divide-y divide-[#2C2C35]/50">
        {incomes.map((income) => {
          const badge = getTypeBadge(income.type)
          const BadgeIcon = badge.icon

          return (
            <div
              key={income.id}
              className="py-4 px-4 sm:px-5 min-h-[72px] flex items-center justify-between gap-4 hover:bg-[#202026]/70 rounded-2xl transition-all group"
            >
              {/* ZONA IZQUIERDA: Ancla visual con Icono estilo iOS App */}
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-[#202026] border border-[#2C2C35] flex items-center justify-center text-[#34D399] shrink-0 shadow-inner">
                  <BadgeIcon size={20} />
                </div>

                {/* ZONA MEDIA: 2 Líneas limpias con espacio entre ellas */}
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-[15px] text-[#F5F5F5] truncate mb-1">
                    {income.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${badge.color}`}>
                      {badge.label}
                    </span>
                    <span className="text-[#3C3C48]">•</span>
                    <span className="text-xs text-[#71717A] font-mono">{income.date}</span>
                  </div>
                </div>
              </div>

              {/* ZONA DERECHA: Monto Hero + Acciones fantasma */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <span className="text-base sm:text-lg font-mono font-bold text-[#34D399] block">
                    +{formatCurrency(income.amount)}
                  </span>
                  <span className="text-[11px] text-[#71717A] font-mono">Depósito confirmado</span>
                </div>

                {/* Acciones fantasma que aparecen en hover */}
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    type="button"
                    onClick={() => onEdit(income)}
                    className="p-2 rounded-xl border border-[#2C2C35] text-[#9CA3AF] hover:text-[#C9A84C] hover:bg-[#202026] transition-colors cursor-pointer"
                    title="Editar ingreso"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(income.id)}
                    className="p-2 rounded-xl border border-[#2C2C35] text-[#9CA3AF] hover:text-[#F87171] hover:bg-[rgba(248,113,113,0.12)] transition-colors cursor-pointer"
                    title="Eliminar ingreso"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
