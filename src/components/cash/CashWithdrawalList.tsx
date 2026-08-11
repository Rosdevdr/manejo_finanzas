import { Banknote, Trash2, Tag } from 'lucide-react'
import type { CashWithdrawal, CashReason } from '../../types/finance'
import { formatCurrency } from '../../utils/formatters'

interface CashWithdrawalListProps {
  withdrawals: CashWithdrawal[];
  onDelete: (id: string) => void;
}

export function CashWithdrawalList({ withdrawals, onDelete }: CashWithdrawalListProps) {
  const getReasonBadge = (reason: CashReason) => {
    switch (reason) {
      case 'pocket_money':
        return { label: 'Bolsillo / Menudeo', color: 'text-[#F59E0B] bg-[rgba(245,158,11,0.14)] border-[#F59E0B]/30' }
      case 'specific_service':
        return { label: 'Servicio Específico', color: 'text-[#3B82F6] bg-[rgba(59,130,246,0.14)] border-[#3B82F6]/30' }
      case 'leisure_nightout':
        return { label: 'Ocio / Fiesta', color: 'text-[#EC4899] bg-[rgba(236,72,153,0.14)] border-[#EC4899]/30' }
      case 'emergency':
        return { label: 'Emergencia', color: 'text-[#34D399] bg-[rgba(52,211,153,0.14)] border-[#34D399]/30' }
      case 'unassigned':
      default:
        return { label: 'Sin Destino Claro', color: 'text-[#F87171] bg-[rgba(248,113,113,0.14)] border-[#F87171]/30' }
    }
  }

  if (withdrawals.length === 0) {
    return (
      <div className="bg-[#16161A] border border-dashed border-[#2C2C35] rounded-2xl p-16 text-center flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#202026] flex items-center justify-center text-[#71717A]">
          <Banknote size={24} />
        </div>
        <h4 className="text-base font-semibold text-[#F5F5F5]">No hay retiros de efectivo registrados este mes</h4>
        <p className="text-xs text-[#71717A] max-w-md">
          Registra cuando retires dinero del cajero para auditar tus gastos físicos y detectar microgastos.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-[#16161A] border border-[#2C2C35] rounded-2xl p-7 sm:p-8 shadow-md space-y-4">
      <div className="flex items-center justify-between border-b border-[#2C2C35] pb-5">
        <div>
          <span className="text-[11px] uppercase tracking-[0.14em] text-[#71717A] font-semibold block mb-0.5">
            AUDITORÍA DE FONDOS
          </span>
          <h4 className="text-lg font-heading font-bold text-[#F5F5F5]">
            Retiros de Cajero ({withdrawals.length})
          </h4>
        </div>
        <span className="text-xs text-[#71717A] font-mono">Control de liquidez</span>
      </div>

      <div className="divide-y divide-[#2C2C35]/50">
        {withdrawals.map((item) => {
          const badge = getReasonBadge(item.reason)

          return (
            <div
              key={item.id}
              className="py-4 px-4 sm:px-5 min-h-[72px] flex items-center justify-between gap-4 hover:bg-[#202026]/70 rounded-2xl transition-all group"
            >
              {/* ZONA IZQUIERDA: Ancla visual */}
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-[rgba(245,158,11,0.14)] border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B] shrink-0 shadow-inner">
                  <Banknote size={20} />
                </div>

                {/* ZONA MEDIA: 2 Líneas limpias */}
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-[15px] text-[#F5F5F5] truncate mb-1">
                    {item.note ? item.note : 'Retiro en Cajero Automático'}
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${badge.color}`}>
                      <Tag size={11} /> {badge.label}
                    </span>
                    <span className="text-[#3C3C48]">•</span>
                    <span className="text-xs text-[#71717A] font-mono">{item.date}</span>
                  </div>
                </div>
              </div>

              {/* ZONA DERECHA: Monto Hero + Acciones fantasma */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <span className="text-base sm:text-lg font-mono font-bold text-[#F59E0B] block">
                    -{formatCurrency(item.amount)}
                  </span>
                  <span className="text-[11px] text-[#71717A] font-mono">Transferencia a bolsillo</span>
                </div>

                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    className="p-2 rounded-xl border border-[#2C2C35] text-[#9CA3AF] hover:text-[#F87171] hover:bg-[rgba(248,113,113,0.12)] transition-colors cursor-pointer"
                    title="Eliminar retiro"
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
