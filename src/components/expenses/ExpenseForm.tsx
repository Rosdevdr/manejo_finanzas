import { useState, type FormEvent } from 'react'
import {
  Plus,
  Receipt,
  Calendar,
  Tag,
  DollarSign,
  FileText,
  CreditCard,
  Layers,
  Home,
  Utensils,
  Car,
  Zap,
  HeartPulse,
  Gamepad2,
  GraduationCap,
  Package,
  SlidersHorizontal,
  Lock,
  Landmark,
  ArrowRightLeft,
  Banknote,
} from 'lucide-react'
import type { Expense, ExpenseCategory, ExpenseType, PaymentMethod } from '../../types/finance'
import { sanitizeAmount, sanitizeText, isValidDate } from '../../utils/security'
import { formatCurrency } from '../../utils/formatters'
import { CustomIconSelect, type CustomSelectOption } from '../ui/CustomIconSelect'

interface ExpenseFormProps {
  currentPeriod: string
  availableBalance?: number
  onAdd: (data: Omit<Expense, 'id'>) => void
}

const CATEGORIES: CustomSelectOption<ExpenseCategory>[] = [
  { value: 'housing',       label: 'Vivienda / Alquiler', subtitle: 'Renta, mantenimiento', icon: <Home size={15} />,          accentColor: '#60A5FA' },
  { value: 'food',          label: 'Alimentación / Súper', subtitle: 'Supermercado, despensa', icon: <Utensils size={15} />,   accentColor: '#34D399' },
  { value: 'transport',     label: 'Transporte / Gasolina', subtitle: 'Combustible, movilidad', icon: <Car size={15} />,       accentColor: '#FBBF24' },
  { value: 'utilities',     label: 'Servicios (Luz, Internet)', subtitle: 'Servicios básicos', icon: <Zap size={15} />,        accentColor: '#38BDF8' },
  { value: 'health',        label: 'Salud & Farmacia',    subtitle: 'Consultas, seguro',    icon: <HeartPulse size={15} />,    accentColor: '#F87171' },
  { value: 'entertainment', label: 'Entretenimiento & Salidas', subtitle: 'Ocio, restaurantes', icon: <Gamepad2 size={15} />,  accentColor: '#A78BFA' },
  { value: 'education',     label: 'Educación & Cursos',  subtitle: 'Libros, formación',    icon: <GraduationCap size={15} />, accentColor: '#C9A84C' },
  { value: 'debt',          label: 'Cuotas / Deudas',     subtitle: 'Préstamos y abonos',   icon: <CreditCard size={15} />,    accentColor: '#FB7185' },
  { value: 'other',         label: 'Otros Gastos',        subtitle: 'Misceláneos',          icon: <Package size={15} />,       accentColor: '#94A3B8' },
]

const EXPENSE_TYPES: CustomSelectOption<ExpenseType>[] = [
  { value: 'variable', label: 'Gasto Variable (Ajustable)', subtitle: 'Optimizable', icon: <SlidersHorizontal size={15} />, accentColor: '#34D399' },
  { value: 'fixed',    label: 'Gasto Fijo (Obligatorio)',   subtitle: 'Compromiso fijo', icon: <Lock size={15} />,          accentColor: '#F87171' },
]

const PAYMENT_METHODS: CustomSelectOption<PaymentMethod>[] = [
  { value: 'debit_card',    label: 'Tarjeta de Débito',  subtitle: 'Cargo directo',       icon: <CreditCard size={15} />,     accentColor: '#38BDF8' },
  { value: 'bank_transfer', label: 'Transferencia Bancaria', subtitle: 'ACH / Al instante', icon: <ArrowRightLeft size={15} />, accentColor: '#34D399' },
  { value: 'credit_card',   label: 'Tarjeta de Crédito', subtitle: 'Al corte',            icon: <Landmark size={15} />,       accentColor: '#C9A84C' },
  { value: 'cash',          label: 'Efectivo en Mano',   subtitle: 'Liquidez física',     icon: <Banknote size={15} />,       accentColor: '#A78BFA' },
]

export function ExpenseForm({ currentPeriod, availableBalance, onAdd }: ExpenseFormProps) {
  const [description,   setDescription]   = useState('')
  const [amount,        setAmount]        = useState('')
  const [category,      setCategory]      = useState<ExpenseCategory>('food')
  const [type,          setType]          = useState<ExpenseType>('variable')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('debit_card')
  const [date,          setDate]          = useState(() => new Date().toISOString().slice(0, 10))
  const [error,         setError]         = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const cleanDesc   = sanitizeText(description, 100)
    const cleanAmount = sanitizeAmount(amount)

    if (!cleanDesc) {
      setError('Ingresa un concepto válido para el gasto.')
      return
    }
    if (cleanAmount <= 0) {
      setError('El monto del gasto debe ser mayor a RD$0.')
      return
    }
    if (availableBalance !== undefined && cleanAmount > Math.max(0, availableBalance)) {
      setError(
        `Saldo insuficiente: dispones de ${formatCurrency(Math.max(0, availableBalance))} y no puedes registrar un gasto de ${formatCurrency(cleanAmount)} que lleve el balance a negativo.`
      )
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
      category,
      type,
      paymentMethod,
      date,
    })

    setDescription('')
    setAmount('')
    setCategory('food')
    setType('variable')
    setPaymentMethod('debit_card')
  }

  return (
    <div className="panel form-card-rose">
      <div className="panel-header">
        <div className="panel-title">
          <span className="title-icon-badge rose">
            <Receipt size={14} />
          </span>
          Registrar Nuevo Gasto
        </div>
        <span className="badge badge-rose">- Egreso</span>
      </div>

      <form onSubmit={handleSubmit} className="entry-form" noValidate>
        {error && <div className="form-alert-error">{error}</div>}

        <div className="form-grid-row">
          <div className="form-field flex-2">
            <label htmlFor="exp-desc">
              <FileText size={12} /> Concepto del Gasto
            </label>
            <input
              id="exp-desc"
              type="text"
              placeholder="Ej. Supermercado Nacional, Alquiler, Combustible..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={100}
              required
            />
          </div>

          <div className="form-field flex-1">
            <label htmlFor="exp-amount">
              <DollarSign size={12} /> Monto (RD$)
            </label>
            <input
              id="exp-amount"
              type="number"
              step="0.01"
              min="1"
              max={availableBalance !== undefined && availableBalance > 0 ? availableBalance : 999999999}
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-grid-row">
          <div className="form-field flex-1">
            <label htmlFor="exp-cat">
              <Tag size={12} /> Categoría
            </label>
            <CustomIconSelect
              id="exp-cat"
              options={CATEGORIES}
              value={category}
              onChange={val => setCategory(val)}
              ariaLabel="Categoría"
            />
          </div>

          <div className="form-field flex-1">
            <label htmlFor="exp-type">
              <Layers size={12} /> Naturaleza del Gasto
            </label>
            <CustomIconSelect
              id="exp-type"
              options={EXPENSE_TYPES}
              value={type}
              onChange={val => setType(val)}
              ariaLabel="Naturaleza del Gasto"
            />
          </div>
        </div>

        <div className="form-grid-row">
          <div className="form-field flex-1">
            <label htmlFor="exp-method">
              <CreditCard size={12} /> Método de Pago
            </label>
            <CustomIconSelect
              id="exp-method"
              options={PAYMENT_METHODS}
              value={paymentMethod}
              onChange={val => setPaymentMethod(val)}
              ariaLabel="Método de Pago"
            />
          </div>

          <div className="form-field flex-1">
            <label htmlFor="exp-date">
              <Calendar size={12} /> Fecha del Gasto
            </label>
            <input
              id="exp-date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>

          <div className="form-field form-submit-col">
            <button type="submit" className="btn-submit-rose">
              <Plus size={16} />
              <span>Registrar Gasto</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
