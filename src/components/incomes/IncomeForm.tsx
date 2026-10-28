import { useState, type FormEvent } from 'react'
import { Plus, Sparkles, Calendar, Tag, DollarSign, FileText, Briefcase, Laptop, TrendingUp, Zap } from 'lucide-react'
import type { Income, IncomeType } from '../../types/finance'
import { sanitizeAmount, sanitizeText, isValidDate } from '../../utils/security'
import { CustomIconSelect, type CustomSelectOption } from '../ui/CustomIconSelect'

interface IncomeFormProps {
  currentPeriod: string
  onAdd: (data: Omit<Income, 'id'>) => void
}

const INCOME_TYPES: CustomSelectOption<IncomeType>[] = [
  { value: 'salary',     label: 'Sueldo / Nómina',     subtitle: 'Ingreso recurrente',    icon: <Briefcase size={15} />,  accentColor: '#34D399' },
  { value: 'freelance',  label: 'Freelance / Extra',   subtitle: 'Servicios & proyectos', icon: <Laptop size={15} />,     accentColor: '#38BDF8' },
  { value: 'investment', label: 'Inversión / Interés', subtitle: 'Dividendos & rentas',   icon: <TrendingUp size={15} />, accentColor: '#C9A84C' },
  { value: 'extra',      label: 'Otro Ingreso',        subtitle: 'Bonos & reembolsos',    icon: <Zap size={15} />,        accentColor: '#A78BFA' },
]

export function IncomeForm({ currentPeriod, onAdd }: IncomeFormProps) {
  const [description, setDescription] = useState('')
  const [amount,      setAmount]      = useState('')
  const [type,        setType]        = useState<IncomeType>('salary')
  const [date,        setDate]        = useState(() => new Date().toISOString().slice(0, 10))
  const [error,       setError]       = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const cleanDesc   = sanitizeText(description, 100)
    const cleanAmount = sanitizeAmount(amount)

    if (!cleanDesc) {
      setError('Ingresa una descripción válida para el ingreso.')
      return
    }
    if (cleanAmount <= 0) {
      setError('El monto debe ser mayor a RD$0.')
      return
    }
    if (!isValidDate(date)) {
      setError('Selecciona una fecha válida.')
      return
    }

    onAdd({
      period: currentPeriod,
      description: cleanDesc,
      amount: cleanAmount,
      type,
      date,
    })

    setDescription('')
    setAmount('')
    setType('salary')
  }

  return (
    <div className="panel form-card-emerald">
      <div className="panel-header">
        <div className="panel-title">
          <span className="title-icon-badge emerald">
            <Sparkles size={14} />
          </span>
          Registrar Nuevo Ingreso
        </div>
        <span className="badge badge-emerald">+ Capital</span>
      </div>

      <form onSubmit={handleSubmit} className="entry-form" noValidate>
        {error && <div className="form-alert-error">{error}</div>}

        <div className="form-grid-row">
          <div className="form-field flex-2">
            <label htmlFor="inc-desc">
              <FileText size={12} /> Concepto o Fuente de Ingreso
            </label>
            <input
              id="inc-desc"
              type="text"
              placeholder="Ej. Quincena, Proyecto Web, Dividendos..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={100}
              required
            />
          </div>

          <div className="form-field flex-1">
            <label htmlFor="inc-amount">
              <DollarSign size={12} /> Monto (RD$)
            </label>
            <input
              id="inc-amount"
              type="number"
              step="0.01"
              min="1"
              max="999999999"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-grid-row">
          <div className="form-field flex-1">
            <label htmlFor="inc-type">
              <Tag size={12} /> Categoría de Ingreso
            </label>
            <CustomIconSelect
              id="inc-type"
              options={INCOME_TYPES}
              value={type}
              onChange={val => setType(val)}
              ariaLabel="Categoría de Ingreso"
            />
          </div>

          <div className="form-field flex-1">
            <label htmlFor="inc-date">
              <Calendar size={12} /> Fecha de Recepción
            </label>
            <input
              id="inc-date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>

          <div className="form-field form-submit-col">
            <button type="submit" className="btn-submit-emerald">
              <Plus size={16} />
              <span>Agregar Ingreso</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
