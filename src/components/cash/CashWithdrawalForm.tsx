import { useState, type FormEvent } from 'react'
import { Banknote, AlertTriangle, Info, AlertOctagon, CheckCircle, PlusCircle } from 'lucide-react'
import type { CashWithdrawal, CashReason } from '../../types/finance'
import { evaluateCashWithdrawal } from '../../utils/cashAdvisor'
import { getTodayDateString } from '../../utils/formatters'

interface CashWithdrawalFormProps {
  currentPeriod: string;
  availableBalance: number;
  onAddWithdrawal: (withdrawal: Omit<CashWithdrawal, 'id'>) => void;
}

export function CashWithdrawalForm({
  currentPeriod,
  availableBalance,
  onAddWithdrawal,
}: CashWithdrawalFormProps) {
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState<CashReason>('pocket_money')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(getTodayDateString())
  const [error, setError] = useState<string | null>(null)

  const parsedAmount = parseFloat(amount) || 0
  const advice = evaluateCashWithdrawal(parsedAmount, reason, availableBalance)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (parsedAmount <= 0) {
      setError('Por favor ingresa un monto de retiro válido mayor a 0.')
      return
    }

    onAddWithdrawal({
      period: currentPeriod,
      amount: parsedAmount,
      reason,
      note: note.trim() || undefined,
      date,
    })

    setAmount('')
    setNote('')
    setReason('pocket_money')
    setDate(getTodayDateString())
    setError(null)
  }

  const getAdviceColor = (level: string) => {
    switch (level) {
      case 'danger':
        return 'bg-[rgba(248,113,113,0.12)] border-[#F87171]/40 text-[#F87171]'
      case 'warning':
        return 'bg-[rgba(251,191,36,0.12)] border-[#FBBF24]/40 text-[#FBBF24]'
      case 'success':
        return 'bg-[rgba(52,211,153,0.12)] border-[#34D399]/40 text-[#34D399]'
      default:
        return 'bg-[rgba(59,130,246,0.12)] border-[#3B82F6]/40 text-[#93C5FD]'
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#16161A] border border-[#2C2C35] rounded-2xl p-7 sm:p-8 shadow-md space-y-6">
      <div className="flex items-center gap-3 border-b border-[#2C2C35] pb-4">
        <div className="w-11 h-11 rounded-2xl bg-[rgba(245,158,11,0.14)] text-[#F59E0B] flex items-center justify-center shrink-0 shadow-inner">
          <Banknote size={22} />
        </div>
        <div>
          <span className="text-[11px] uppercase tracking-[0.14em] text-[#71717A] font-semibold block mb-0.5">
            TRANSFERENCIA DE LIQUIDEZ
          </span>
          <h3 className="text-lg font-heading font-bold text-[#F5F5F5]">
            Registrar Retiro en Efectivo / Cajero
          </h3>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[rgba(248,113,113,0.12)] border border-[#F87171]/30 text-[#F87171] text-xs font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#71717A] mb-2.5 block">
            Monto Retirado (RD$)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-[#202026] border border-[#2C2C35] rounded-xl px-4 py-3.5 min-h-[48px] text-sm font-mono text-[#F5F5F5] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 outline-none transition-all"
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#71717A] mb-2.5 block">
            Motivo del Retiro
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as CashReason)}
            className="w-full bg-[#202026] border border-[#2C2C35] rounded-xl px-4 py-3.5 min-h-[48px] text-sm text-[#F5F5F5] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 outline-none transition-all"
          >
            <option value="pocket_money">Dinero de Bolsillo / Menudeo</option>
            <option value="specific_service">Pago de Servicio Específico</option>
            <option value="leisure_nightout">Ocio / Fiesta / Salida</option>
            <option value="emergency">Emergencia / Imprevisto</option>
            <option value="unassigned">Sin Destino Específico</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#71717A] mb-2.5 block">
            Fecha
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-[#202026] border border-[#2C2C35] rounded-xl px-4 py-2.5 min-h-[44px] text-xs text-[#9CA3AF] focus:border-[#C9A84C] outline-none"
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#71717A] mb-2.5 block">
            Nota Opcional
          </label>
          <input
            type="text"
            placeholder="Ej: Cajero Plaza Central..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-[#202026] border border-[#2C2C35] rounded-xl px-4 py-3.5 min-h-[48px] text-sm text-[#F5F5F5] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 outline-none transition-all"
          />
        </div>
      </div>

      {/* Tarjeta de Asesoría en Vivo */}
      {parsedAmount > 0 && (
        <div className={`p-5 rounded-xl border ${getAdviceColor(advice.level)} space-y-2.5 animate-fade-in-up shadow-sm`}>
          <div className="flex items-center gap-2 text-sm font-bold">
            {advice.level === 'danger' && <AlertOctagon size={18} />}
            {advice.level === 'warning' && <AlertTriangle size={18} />}
            {advice.level === 'success' && <CheckCircle size={18} />}
            {advice.level === 'info' && <Info size={18} />}
            <span>{advice.title}</span>
          </div>
          <p className="text-xs text-[#F5F5F5] leading-relaxed">{advice.message}</p>
          <p className="text-xs text-[#9CA3AF] leading-relaxed pt-2 border-t border-[#2C2C35]/50 font-medium">
            💡 <strong>Consejo del Asesor:</strong> {advice.recommendation}
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          className="w-full sm:w-auto px-7 py-3.5 min-h-[48px] rounded-xl bg-[#F59E0B] text-[#09090B] font-bold tracking-wide text-sm hover:bg-[#F59E0B]/90 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          <PlusCircle size={18} />
          <span>Registrar Retiro</span>
        </button>
      </div>
    </form>
  )
}
