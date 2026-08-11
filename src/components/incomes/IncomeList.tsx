// src/components/incomes/IncomeList.tsx
import { Briefcase, Sparkles, TrendingUp, DollarSign, Pencil, Trash2 } from 'lucide-react'
import type { Income, IncomeType } from '../../types/finance'
import { formatCurrency } from '../../utils/formatters'
import './IncomeList.css'

interface IncomeListProps {
  incomes: Income[];
  onEdit: (income: Income) => void;
  onDelete: (id: string) => void;
}

export function IncomeList({ incomes, onEdit, onDelete }: IncomeListProps) {
  // Helper para mostrar un badge visual con icono según el tipo de ingreso
  const getTypeBadge = (type: IncomeType) => {
    switch (type) {
      case 'salary':
        return { label: 'Sueldo Base', icon: Briefcase, className: 'badge-salary' }
      case 'freelance':
        return { label: 'Freelance', icon: Sparkles, className: 'badge-freelance' }
      case 'investment':
        return { label: 'Inversión', icon: TrendingUp, className: 'badge-investment' }
      case 'extra':
      default:
        return { label: 'Extra', icon: DollarSign, className: 'badge-extra' }
    }
  }

  if (incomes.length === 0) {
    return (
      <div className="empty-incomes-card">
        <DollarSign size={40} className="empty-icon" />
        <h4>No hay ingresos registrados en este período</h4>
        <p>Utiliza el formulario superior para registrar tu sueldo base o ingresos adicionales.</p>
      </div>
    )
  }

  return (
    <div className="income-list-container">
      <div className="income-list-header">
        <h4>Historial de Ingresos ({incomes.length})</h4>
      </div>

      <div className="income-items">
        {incomes.map((income) => {
          const badge = getTypeBadge(income.type)
          const BadgeIcon = badge.icon

          return (
            <div key={income.id} className="income-item-card">
              <div className="income-main-info">
                <div className="income-title-row">
                  <span className="income-desc">{income.description}</span>
                  <span className={`income-badge ${badge.className}`}>
                    <BadgeIcon size={12} /> {badge.label}
                  </span>
                </div>
                <span className="income-date">{income.date}</span>
              </div>

              <div className="income-actions-group">
                <span className="income-amount">+{formatCurrency(income.amount)}</span>

                <div className="item-buttons">
                  <button
                    type="button"
                    className="btn-icon btn-edit"
                    onClick={() => onEdit(income)}
                    title="Editar ingreso"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    className="btn-icon btn-delete"
                    onClick={() => onDelete(income.id)}
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
