import { ShoppingBag, Pencil, Trash2 } from 'lucide-react'
import type { Expense, PaymentMethod } from '../../types/finance'
import { CATEGORY_MAP } from '../../utils/categoryHelpers'
import { formatCurrency } from '../../utils/formatters'

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export function ExpenseList({ expenses, onEdit, onDelete }: ExpenseListProps) {
  const getPaymentLabel = (method: PaymentMethod) => {
    switch (method) {
      case 'cash':
        return 'Efectivo en Mano'
      case 'credit_card':
        return 'Tarjeta de Crédito'
      case 'debit_card':
        return 'Tarjeta de Débito'
      case 'bank_transfer':
        return 'Transferencia'
    }
  }

  if (expenses.length === 0) {
    return (
      <div className="bg-[#16161A] border border-dashed border-[#2C2C35] rounded-2xl p-16 text-center flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#202026] flex items-center justify-center text-[#71717A]">
          <ShoppingBag size={24} />
        </div>
        <h4 className="text-base font-semibold text-[#F5F5F5]">No hay gastos registrados en este período</h4>
        <p className="text-xs text-[#71717A] max-w-md">
          Registra tus gastos fijos y variables para calcular tu balance y margen de ahorro.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-[#16161A] border border-[#2C2C35] rounded-2xl p-7 sm:p-8 shadow-md space-y-4">
      <div className="flex items-center justify-between border-b border-[#2C2C35] pb-5">
        <div>
          <span className="text-[11px] uppercase tracking-[0.14em] text-[#71717A] font-semibold block mb-0.5">
            HISTORIAL DE EGRESOS
          </span>
          <h4 className="text-lg font-heading font-bold text-[#F5F5F5]">
            Gastos Registrados ({expenses.length})
          </h4>
        </div>
        <span className="text-xs text-[#71717A] font-mono">Fijos y Variables</span>
      </div>

      <div className="divide-y divide-[#2C2C35]/50">
        {expenses.map((expense) => {
          const categoryInfo = CATEGORY_MAP[expense.category]
          const CategoryIcon = categoryInfo.icon

          return (
            <div
              key={expense.id}
              className="py-4 px-4 sm:px-5 min-h-[72px] flex items-center justify-between gap-4 hover:bg-[#202026]/70 rounded-2xl transition-all group"
            >
              {/* ZONA IZQUIERDA: Ancla visual con Icono de Categoría */}
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-inner"
                  style={{
                    backgroundColor: categoryInfo.bgLight,
                    color: categoryInfo.color,
                  }}
                >
                  <CategoryIcon size={20} />
                </div>

                {/* ZONA MEDIA: 2 Líneas limpias con espacio vertical */}
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-[15px] text-[#F5F5F5] truncate mb-1">
                    {expense.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <span
                      className="text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: categoryInfo.bgLight,
                        color: categoryInfo.color,
                      }}
                    >
                      {categoryInfo.label}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        expense.type === 'fixed'
                          ? 'bg-[#202026] text-[#9CA3AF] border border-[#2C2C35]'
                          : 'bg-[rgba(251,191,36,0.14)] text-[#FBBF24] border border-[#FBBF24]/30'
                      }`}
                    >
                      {expense.type === 'fixed' ? 'Fijo' : 'Variable'}
                    </span>
                    <span className="text-[#3C3C48]">•</span>
                    <span className="text-xs text-[#71717A] font-mono">{expense.date}</span>
                  </div>
                </div>
              </div>

              {/* ZONA DERECHA: Monto Hero + Método de Pago + Acciones fantasma */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <span className="text-base sm:text-lg font-mono font-bold text-[#F87171] block">
                    -{formatCurrency(expense.amount)}
                  </span>
                  <span className="text-[11px] text-[#71717A] font-mono">
                    💳 {getPaymentLabel(expense.paymentMethod)}
                  </span>
                </div>

                {/* Acciones fantasma */}
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    type="button"
                    onClick={() => onEdit(expense)}
                    className="p-2 rounded-xl border border-[#2C2C35] text-[#9CA3AF] hover:text-[#C9A84C] hover:bg-[#202026] transition-colors cursor-pointer"
                    title="Editar gasto"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(expense.id)}
                    className="p-2 rounded-xl border border-[#2C2C35] text-[#9CA3AF] hover:text-[#F87171] hover:bg-[rgba(248,113,113,0.12)] transition-colors cursor-pointer"
                    title="Eliminar gasto"
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
