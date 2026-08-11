import { useState, useEffect, type FormEvent } from 'react'
import { PlusCircle, CheckCircle2, X } from 'lucide-react'
import type { Expense, ExpenseCategory, ExpenseType, PaymentMethod } from '../../types/finance'
import { CATEGORY_MAP } from '../../utils/categoryHelpers'
import { getTodayDateString } from '../../utils/formatters'

interface ExpenseFormProps {
  currentPeriod: string;
  expenseToEdit?: Expense | null;
  onSave: (expense: Omit<Expense, 'id'> | Expense) => void;
  onCancelEdit?: () => void;
}

export function ExpenseForm({ currentPeriod, expenseToEdit, onSave, onCancelEdit }: ExpenseFormProps) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('food')
  const [type, setType] = useState<ExpenseType>('variable')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('debit_card')
  const [date, setDate] = useState(getTodayDateString())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (expenseToEdit) {
      setDescription(expenseToEdit.description)
      setAmount(expenseToEdit.amount.toString())
      setCategory(expenseToEdit.category)
      setType(expenseToEdit.type)
      setPaymentMethod(expenseToEdit.paymentMethod)
      setDate(expenseToEdit.date)
      setError(null)
    } else {
      resetForm()
    }
  }, [expenseToEdit])

  const resetForm = () => {
    setDescription('')
    setAmount('')
    setCategory('food')
    setType('variable')
    setPaymentMethod('debit_card')
    setDate(getTodayDateString())
    setError(null)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (!description.trim()) {
      setError('La descripción del gasto es obligatoria.')
      return
    }

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Por favor ingresa un monto válido mayor a 0.')
      return
    }

    if (expenseToEdit) {
      onSave({
        ...expenseToEdit,
        description: description.trim(),
        amount: parsedAmount,
        category,
        type,
        paymentMethod,
        date,
        period: currentPeriod,
      })
    } else {
      onSave({
        description: description.trim(),
        amount: parsedAmount,
        category,
        type,
        paymentMethod,
        date,
        period: currentPeriod,
      })
      resetForm()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#16161A] border border-[#2C2C35] rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-[#2C2C35] pb-3">
        <h3 className="text-base font-heading font-bold text-[#F5F5F5]">
          {expenseToEdit ? 'Editar Gasto' : 'Registrar Nuevo Egreso'}
        </h3>
        {expenseToEdit && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl border border-[#2C2C35] text-xs text-[#9CA3AF] hover:text-[#F5F5F5] hover:bg-[#202026] transition-colors cursor-pointer"
          >
            <X size={13} /> Cancelar edición
          </button>
        )}
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-[rgba(248,113,113,0.12)] border border-[#F87171]/30 text-[#F87171] text-xs font-medium">
          {error}
        </div>
      )}

      {/* Fila 1: Descripción (60%) + Monto (40%) */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        <div className="sm:col-span-3">
          <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#71717A] mb-1.5 block">
            Descripción / Concepto
          </label>
          <input
            type="text"
            placeholder="Ej: Supermercado mensual, Pago de Internet..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-[#202026] border border-[#2C2C35] rounded-xl px-4 py-2.5 min-h-[44px] text-sm text-[#F5F5F5] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 outline-none transition-all"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#71717A] mb-1.5 block">
            Monto (RD$)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-[#202026] border border-[#2C2C35] rounded-xl px-4 py-2.5 min-h-[44px] text-sm font-mono text-[#F5F5F5] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 outline-none transition-all"
          />
        </div>
      </div>

      {/* Fila 2: Categoría (33%) + Tipo (33%) + Método (33%) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#71717A] mb-1.5 block">
            Categoría
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            className="w-full bg-[#202026] border border-[#2C2C35] rounded-xl px-4 py-2.5 min-h-[44px] text-sm text-[#F5F5F5] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 outline-none transition-all"
          >
            {Object.entries(CATEGORY_MAP).map(([key, info]) => (
              <option key={key} value={key} className="bg-[#16161A]">
                {info.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#71717A] mb-1.5 block">
            Tipo de Compromiso
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ExpenseType)}
            className="w-full bg-[#202026] border border-[#2C2C35] rounded-xl px-4 py-2.5 min-h-[44px] text-sm text-[#F5F5F5] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 outline-none transition-all"
          >
            <option value="fixed">Gasto Fijo (Obligatorio)</option>
            <option value="variable">Gasto Variable (Controlable)</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#71717A] mb-1.5 block">
            Método de Pago
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            className="w-full bg-[#202026] border border-[#2C2C35] rounded-xl px-4 py-2.5 min-h-[44px] text-sm text-[#F5F5F5] focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/30 outline-none transition-all"
          >
            <option value="debit_card">Tarjeta de Débito</option>
            <option value="credit_card">Tarjeta de Crédito</option>
            <option value="bank_transfer">Transferencia Bancaria</option>
            <option value="cash">Efectivo</option>
          </select>
        </div>
      </div>

      {/* Fila 3: Fecha + Botón Submit */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
        <div className="w-full sm:w-auto">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full sm:w-auto bg-[#202026] border border-[#2C2C35] rounded-xl px-4 py-2 min-h-[40px] text-xs text-[#9CA3AF] focus:border-[#C9A84C] outline-none"
          />
        </div>

        <button
          type="submit"
          className="w-full sm:w-auto px-6 py-2.5 min-h-[44px] rounded-xl bg-[#F87171] text-[#09090B] font-bold tracking-wide text-sm hover:bg-[#F87171]/90 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          {expenseToEdit ? (
            <>
              <CheckCircle2 size={16} /> Guardar Cambios
            </>
          ) : (
            <>
              <PlusCircle size={16} /> Registrar Gasto
            </>
          )}
        </button>
      </div>
    </form>
  )
}
