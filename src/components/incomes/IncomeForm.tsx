import { useState, useEffect, type FormEvent } from 'react'
import { PlusCircle, CheckCircle2, X } from 'lucide-react'
import type { Income, IncomeType } from '../../types/finance'
import { getTodayDateString } from '../../utils/formatters'

interface IncomeFormProps {
  currentPeriod: string;
  incomeToEdit?: Income | null;
  onSave: (income: Omit<Income, 'id'> | Income) => void;
  onCancelEdit?: () => void;
}

export function IncomeForm({ currentPeriod, incomeToEdit, onSave, onCancelEdit }: IncomeFormProps) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<IncomeType>('salary')
  const [date, setDate] = useState(getTodayDateString())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (incomeToEdit) {
      setDescription(incomeToEdit.description)
      setAmount(incomeToEdit.amount.toString())
      setType(incomeToEdit.type)
      setDate(incomeToEdit.date)
      setError(null)
    } else {
      resetForm()
    }
  }, [incomeToEdit])

  const resetForm = () => {
    setDescription('')
    setAmount('')
    setType('salary')
    setDate(getTodayDateString())
    setError(null)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (!description.trim()) {
      setError('La descripción del ingreso es obligatoria.')
      return
    }

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Por favor ingresa un monto válido mayor a 0.')
      return
    }

    if (incomeToEdit) {
      onSave({
        ...incomeToEdit,
        description: description.trim(),
        amount: parsedAmount,
        type,
        date,
        period: currentPeriod,
      })
    } else {
      onSave({
        description: description.trim(),
        amount: parsedAmount,
        type,
        date,
        period: currentPeriod,
      })
      resetForm()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#16161A] border border-[#2C2C35] rounded-2xl p-7 sm:p-8 shadow-md space-y-6">
      <div className="flex items-center justify-between border-b border-[#2C2C35] pb-4">
        <div>
          <span className="text-[11px] uppercase tracking-[0.14em] text-[#71717A] font-semibold block mb-0.5">
            NUEVO REGISTRO
          </span>
          <h3 className="text-lg font-heading font-bold text-[#F5F5F5]">
            {incomeToEdit ? 'Editar Ingreso' : 'Registrar Entrada de Capital'}
          </h3>
        </div>
        {incomeToEdit && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#2C2C35] text-xs text-[#9CA3AF] hover:text-[#F5F5F5] hover:bg-[#202026] transition-colors cursor-pointer"
          >
            <X size={14} /> Cancelar edición
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[rgba(248,113,113,0.12)] border border-[#F87171]/30 text-[#F87171] text-xs font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="lg:col-span-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#71717A] mb-2.5 block">
            Descripción / Concepto
          </label>
          <input
            type="text"
            placeholder="Ej: Sueldo quincenal, Proyecto Web..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-[#202026] border border-[#2C2C35] rounded-xl px-4 py-3.5 min-h-[48px] text-sm text-[#F5F5F5] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 outline-none transition-all"
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#71717A] mb-2.5 block">
            Monto (RD$)
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
            Tipo de Ingreso
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as IncomeType)}
            className="w-full bg-[#202026] border border-[#2C2C35] rounded-xl px-4 py-3.5 min-h-[48px] text-sm text-[#F5F5F5] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 outline-none transition-all"
          >
            <option value="salary">Sueldo / Salario Fijo</option>
            <option value="freelance">Freelance / Honorarios</option>
            <option value="investment">Inversiones / Dividendos</option>
            <option value="extra">Extra / Ocasional</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="w-full sm:w-auto">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full sm:w-auto bg-[#202026] border border-[#2C2C35] rounded-xl px-4 py-2.5 min-h-[44px] text-xs text-[#9CA3AF] focus:border-[#C9A84C] outline-none"
          />
        </div>

        <button
          type="submit"
          className="w-full sm:w-auto px-7 py-3.5 min-h-[48px] rounded-xl bg-[#C9A84C] text-[#09090B] font-bold tracking-wide text-sm hover:bg-[#E2BC5E] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          {incomeToEdit ? (
            <>
              <CheckCircle2 size={18} /> Guardar Cambios
            </>
          ) : (
            <>
              <PlusCircle size={18} /> Registrar Ingreso
            </>
          )}
        </button>
      </div>
    </form>
  )
}
