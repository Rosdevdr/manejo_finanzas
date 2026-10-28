import { useState, type FormEvent, type ReactNode } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  TrendingDown,
  Lock,
  SlidersHorizontal,
  Calendar,
  X,
  Home,
  Utensils,
  Car,
  Zap,
  HeartPulse,
  Gamepad2,
  GraduationCap,
  CreditCard,
  Package,
  ArrowRightLeft,
  Banknote,
  Landmark,
  AlertTriangle,
  ShieldCheck,
  Check,
} from 'lucide-react'
import type { Expense, ExpenseCategory, ExpenseType, PaymentMethod } from '../../types/finance'
import { formatCurrency } from '../../utils/formatters'
import { sanitizeAmount, sanitizeText } from '../../utils/security'
import { TransactionConfirmationFlow } from '../common/TransactionConfirmationFlow'
import { CustomIconSelect, type CustomSelectOption } from '../ui/CustomIconSelect'
import './ExpensesView.css'

const CATEGORY_MAP: Record<ExpenseCategory, { label: string; subtitle: string; icon: ReactNode; color: string }> = {
  housing:       { label: 'Vivienda / Alquiler', subtitle: 'Renta, hipoteca, mantenimiento', icon: <Home size={15} />,          color: '#60A5FA' },
  food:          { label: 'Alimentación',        subtitle: 'Supermercado, despensa',         icon: <Utensils size={15} />,      color: '#34D399' },
  transport:     { label: 'Transporte',          subtitle: 'Combustible, movilidad',         icon: <Car size={15} />,           color: '#FBBF24' },
  utilities:     { label: 'Servicios',           subtitle: 'Luz, agua, internet, móvil',     icon: <Zap size={15} />,           color: '#38BDF8' },
  health:        { label: 'Salud',               subtitle: 'Farmacia, consultas, seguro',    icon: <HeartPulse size={15} />,    color: '#F87171' },
  entertainment: { label: 'Entretenimiento',     subtitle: 'Restaurantes, ocio, salidas',    icon: <Gamepad2 size={15} />,      color: '#A78BFA' },
  education:     { label: 'Educación',           subtitle: 'Cursos, libros, formación',      icon: <GraduationCap size={15} />, color: '#C9A84C' },
  debt:          { label: 'Deudas / Cuotas',     subtitle: 'Préstamos y abonos',             icon: <CreditCard size={15} />,    color: '#FB7185' },
  other:         { label: 'Otros Gastos',        subtitle: 'Imprevistos y misceláneos',      icon: <Package size={15} />,       color: '#94A3B8' },
}

const EXPENSE_CATEGORY_OPTIONS: CustomSelectOption<ExpenseCategory>[] = (
  Object.entries(CATEGORY_MAP) as [ExpenseCategory, (typeof CATEGORY_MAP)[ExpenseCategory]][]
).map(([value, meta]) => ({
  value,
  label: meta.label,
  subtitle: meta.subtitle,
  icon: meta.icon,
  accentColor: meta.color,
}))

const EXPENSE_TYPE_OPTIONS: CustomSelectOption<ExpenseType>[] = [
  {
    value: 'variable',
    label: 'Gasto Variable',
    subtitle: 'Ajustable / Optimizable',
    icon: <SlidersHorizontal size={15} />,
    accentColor: '#34D399',
  },
  {
    value: 'fixed',
    label: 'Gasto Fijo',
    subtitle: 'Compromiso obligatorio',
    icon: <Lock size={15} />,
    accentColor: '#F87171',
  },
]

const PAYMENT_METHOD_OPTIONS: CustomSelectOption<PaymentMethod>[] = [
  {
    value: 'debit_card',
    label: 'Tarjeta de Débito',
    subtitle: 'Cargo directo a cuenta',
    icon: <CreditCard size={15} />,
    accentColor: '#38BDF8',
  },
  {
    value: 'credit_card',
    label: 'Tarjeta de Crédito',
    subtitle: 'Financiamiento al corte',
    icon: <Landmark size={15} />,
    accentColor: '#C9A84C',
  },
  {
    value: 'bank_transfer',
    label: 'Transferencia',
    subtitle: 'ACH / Pago al instante',
    icon: <ArrowRightLeft size={15} />,
    accentColor: '#34D399',
  },
  {
    value: 'cash',
    label: 'Efectivo',
    subtitle: 'Liquidez en mano',
    icon: <Banknote size={15} />,
    accentColor: '#A78BFA',
  },
]

const PAYMENT_MAP: Record<PaymentMethod, string> = {
  bank_transfer: 'Transferencia',
  debit_card:    'Tarjeta Débito',
  credit_card:   'Tarjeta Crédito',
  cash:          'Efectivo',
}

interface ExpensesViewProps {
  expenses: Expense[]
  currentPeriod: string
  availableBalance?: number
  onAddExpense: (data: Omit<Expense, 'id'>) => void
  onUpdateExpense: (expense: Expense) => void
  onDeleteExpense: (id: string) => void
  activeFilter?: ExpenseType | null
  onFilterByType?: (type: ExpenseType | null) => void
}

export function ExpensesView({
  expenses,
  currentPeriod,
  availableBalance,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  activeFilter,
}: ExpensesViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [periodMode, setPeriodMode] = useState<'current' | 'all'>('current')
  const [pendingConfirmation, setPendingConfirmation] = useState<Omit<Expense, 'id'> | null>(null)
  const [balanceError, setBalanceError] = useState<string | null>(null)
  const [inlineEditError, setInlineEditError] = useState<string | null>(null)
  const [form, setForm] = useState({
    description: '',
    amount: '',
    category: 'food' as ExpenseCategory,
    type: 'variable' as ExpenseType,
    paymentMethod: 'debit_card' as PaymentMethod,
    date: new Date().toISOString().slice(0, 10),
  })

  // Inline Edit State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDesc, setEditDesc] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editCategory, setEditCategory] = useState<ExpenseCategory>('food')
  const [editType, setEditType] = useState<ExpenseType>('variable')
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod>('debit_card')
  const [editDate, setEditDate] = useState('')

  const startEdit = (exp: Expense) => {
    setInlineEditError(null)
    setEditingId(exp.id)
    setEditDesc(exp.description)
    setEditAmount(String(exp.amount))
    setEditCategory(exp.category)
    setEditType(exp.type)
    setEditPaymentMethod(exp.paymentMethod)
    setEditDate(exp.date)
  }

  const cancelEdit = () => {
    setInlineEditError(null)
    setEditingId(null)
  }

  const saveEdit = (exp: Expense) => {
    const cleanAmount = sanitizeAmount(editAmount)
    const cleanDesc = sanitizeText(editDesc, 100)
    if (!cleanDesc || cleanAmount <= 0) return

    if (availableBalance !== undefined) {
      const maxAllowedForEdit = Math.max(0, availableBalance + exp.amount)
      if (cleanAmount > maxAllowedForEdit) {
        setInlineEditError(
          `Saldo insuficiente: el monto (${formatCurrency(cleanAmount)}) supera tu saldo disponible máximo (${formatCurrency(maxAllowedForEdit)}) y llevaría la cuenta a negativo.`
        )
        return
      }
    }

    setInlineEditError(null)
    const derivedPeriod = editDate && editDate.length >= 7 ? editDate.slice(0, 7) : exp.period
    onUpdateExpense({
      ...exp,
      description: cleanDesc,
      amount: cleanAmount,
      category: editCategory,
      type: editType,
      paymentMethod: editPaymentMethod,
      date: editDate,
      period: derivedPeriod,
    })
    setEditingId(null)
  }

  const parsedDraftAmount = sanitizeAmount(form.amount)
  const isOverdraftDraft =
    availableBalance !== undefined &&
    parsedDraftAmount > 0 &&
    parsedDraftAmount > Math.max(0, availableBalance)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setBalanceError(null)
    const parsed = sanitizeAmount(form.amount)
    const cleanDesc = sanitizeText(form.description, 100)
    if (!cleanDesc || parsed <= 0) return

    if (availableBalance !== undefined) {
      const safeAvailable = Math.max(0, availableBalance)
      if (parsed > safeAvailable) {
        setBalanceError(
          `Operación bloqueada: dispones de ${formatCurrency(safeAvailable)} y no puedes registrar un gasto de ${formatCurrency(parsed)} porque llevaría tu saldo a negativo.`
        )
        return
      }
    }

    const derivedPeriod = form.date && form.date.length >= 7 ? form.date.slice(0, 7) : currentPeriod
    setPendingConfirmation({
      description: cleanDesc,
      amount: parsed,
      category: form.category,
      type: form.type,
      paymentMethod: form.paymentMethod,
      date: form.date,
      period: derivedPeriod,
    })
    setIsModalOpen(false)
  }

  // Filtrado por período (Mes Actual vs Todo el Historial)
  const periodScopedExpenses = periodMode === 'current'
    ? expenses.filter(e => (e.period || e.date?.slice(0, 7)) === currentPeriod)
    : expenses

  // KPIs calculados sobre el alcance seleccionado
  const totalExpenses = periodScopedExpenses.reduce((s, e) => s + e.amount, 0)
  const fixedTotal = periodScopedExpenses.filter(e => e.type === 'fixed').reduce((s, e) => s + e.amount, 0)
  const variableTotal = totalExpenses - fixedTotal

  const filtered = activeFilter
    ? periodScopedExpenses.filter(e => e.type === activeFilter)
    : periodScopedExpenses

  return (
    <div className="expenses-obsidian-root">

      {/* ── KPIs SUPERIORES (3 TARJETAS BENTO) ── */}
      <div className="expenses-obsidian-kpi-row">

        {/* Total Gastos */}
        <div className="expenses-obsidian-kpi-card">
          <div className="expenses-obsidian-kpi-header">
            <span className="expenses-obsidian-kpi-label">Flujo de Salida Total</span>
            <TrendingDown size={16} color="#F87171" />
          </div>
          <div className="expenses-obsidian-kpi-val" style={{ color: '#F87171' }}>
            {formatCurrency(totalExpenses)}
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {availableBalance !== undefined
              ? `Saldo disponible para gastar: ${formatCurrency(Math.max(0, availableBalance))}`
              : `${expenses.length} transacciones registradas`}
          </span>
        </div>

        {/* Gastos Fijos */}
        <div className="expenses-obsidian-kpi-card">
          <div className="expenses-obsidian-kpi-header">
            <span className="expenses-obsidian-kpi-label">Compromisos Fijos (Obligatorios)</span>
            <Lock size={16} color="#FBBF24" />
          </div>
          <div className="expenses-obsidian-kpi-val">
            {formatCurrency(fixedTotal)}
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {totalExpenses > 0 ? Math.round((fixedTotal / totalExpenses) * 100) : 0}% de tus salidas
          </span>
        </div>

        {/* Gastos Variables */}
        <div className="expenses-obsidian-kpi-card">
          <div className="expenses-obsidian-kpi-header">
            <span className="expenses-obsidian-kpi-label">Gastos Variables (Optimizables)</span>
            <SlidersHorizontal size={16} color="#38BDF8" />
          </div>
          <div className="expenses-obsidian-kpi-val">
            {formatCurrency(variableTotal)}
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {totalExpenses > 0 ? Math.round((variableTotal / totalExpenses) * 100) : 0}% de tus salidas
          </span>
        </div>

      </div>

      {inlineEditError && (
        <div className="aureus-overdraft-alert">
          <AlertTriangle size={16} />
          <span>{inlineEditError}</span>
        </div>
      )}

      {/* ── TABLA DE ALTA DENSIDAD (ESTILO STRIPE/LINEAR) ── */}
      <div className="obsidian-data-grid-container" style={{ overflow: 'visible' }}>
        <div className="obsidian-data-grid-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div className="obsidian-data-grid-title">Registro de Gastos</div>

            {/* Selector Mes Actual vs Todo el Historial */}
            <div className="obsidian-period-filter-switch">
              <button
                type="button"
                onClick={() => setPeriodMode('current')}
                className={`obsidian-period-filter-btn ${periodMode === 'current' ? 'active' : ''}`}
              >
                Mes Actual ({currentPeriod})
              </button>
              <button
                type="button"
                onClick={() => setPeriodMode('all')}
                className={`obsidian-period-filter-btn ${periodMode === 'all' ? 'active' : ''}`}
              >
                Todo el Historial ({expenses.length})
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              setBalanceError(null)
              setIsModalOpen(true)
            }}
            style={{
              background: 'var(--gold-primary)',
              color: '#08080C',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-gold)',
            }}
          >
            <Plus size={16} /> Registrar Gasto
          </button>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            No hay gastos registrados en este período. Haz clic en "+ Registrar Gasto" para añadir uno.
          </div>
        ) : (
          <div className="obsidian-table-wrapper" style={{ overflow: 'visible' }}>
            <table className="obsidian-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Categoría</th>
                  <th>Descripción / Concepto</th>
                  <th>Tipo / Pago</th>
                  <th style={{ textAlign: 'right' }}>Monto</th>
                  <th style={{ width: '90px', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(exp => {
                  const c = CATEGORY_MAP[exp.category] || CATEGORY_MAP.other

                  if (editingId === exp.id) {
                    return (
                      <tr key={exp.id} style={{ background: 'rgba(201,168,76,0.06)' }}>
                        <td>
                          <input
                            type="date"
                            className="aureus-adaptive-input compact"
                            value={editDate}
                            onChange={e => setEditDate(e.target.value)}
                          />
                        </td>
                        <td style={{ minWidth: 190 }}>
                          <CustomIconSelect
                            options={EXPENSE_CATEGORY_OPTIONS}
                            value={editCategory}
                            onChange={val => setEditCategory(val)}
                            compact
                            ariaLabel="Categoría de gasto"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="aureus-adaptive-input compact"
                            style={{ width: '100%' }}
                            value={editDesc}
                            onChange={e => setEditDesc(e.target.value)}
                          />
                        </td>
                        <td style={{ minWidth: 185 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <CustomIconSelect
                              options={EXPENSE_TYPE_OPTIONS}
                              value={editType}
                              onChange={val => setEditType(val)}
                              compact
                              ariaLabel="Compromiso"
                            />
                            <CustomIconSelect
                              options={PAYMENT_METHOD_OPTIONS}
                              value={editPaymentMethod}
                              onChange={val => setEditPaymentMethod(val)}
                              compact
                              ariaLabel="Método de pago"
                            />
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <input
                            type="number"
                            className="aureus-adaptive-input compact"
                            style={{ width: 110, textAlign: 'right' }}
                            value={editAmount}
                            onChange={e => setEditAmount(e.target.value)}
                          />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 4 }}>
                            <button className="obsidian-icon-btn" style={{ color: 'var(--emerald-success)' }} onClick={() => saveEdit(exp)} title="Guardar">
                              <Check size={15} />
                            </button>
                            <button className="obsidian-icon-btn" onClick={cancelEdit} title="Cancelar">
                              <X size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  }

                  return (
                    <tr key={exp.id}>
                      <td className="cell-date">{exp.date}</td>
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
                          <span
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 8,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: `${c.color}18`,
                              border: `1px solid ${c.color}35`,
                              color: c.color,
                              flexShrink: 0,
                            }}
                          >
                            {c.icon}
                          </span>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{c.label}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                          {exp.description}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: 11, color: exp.type === 'fixed' ? '#F87171' : '#34D399', fontWeight: 600 }}>
                            {exp.type === 'fixed' ? 'Obligatorio' : 'Optimizable'}
                          </span>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                            {PAYMENT_MAP[exp.paymentMethod]}
                          </span>
                        </div>
                      </td>
                      <td className="cell-amount negative">
                        -{formatCurrency(exp.amount)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 4, justifyContent: 'flex-end' }}>
                          <button className="obsidian-icon-btn" onClick={() => startEdit(exp)} title="Editar"><Pencil size={14} /></button>
                          <button className="obsidian-icon-btn danger" onClick={() => onDeleteExpense(exp.id)} title="Eliminar"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL PARA REGISTRAR GASTO ── */}
      {isModalOpen && (
        <div className="aureus-modal-backdrop">
          <div className="aureus-modal-card" style={{ overflow: 'visible' }}>
            <div className="aureus-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                <Plus size={18} color="#C9A84C" /> Registrar Nuevo Gasto
              </div>
              <button onClick={() => setIsModalOpen(false)} className="aureus-modal-close"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {availableBalance !== undefined && (
                <div className={`aureus-balance-guard-banner ${isOverdraftDraft || availableBalance <= 0 ? 'danger' : 'safe'}`}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700 }}>
                      {isOverdraftDraft || availableBalance <= 0 ? <AlertTriangle size={14} /> : <ShieldCheck size={14} />}
                      Saldo Disponible Actual:
                    </span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 13 }}>
                      {formatCurrency(Math.max(0, availableBalance))}
                    </span>
                  </div>
                  {parsedDraftAmount > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, marginTop: 4, opacity: 0.9 }}>
                      <span>Saldo restante tras este gasto:</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
                        {isOverdraftDraft
                          ? 'Excede tu liquidez disponible'
                          : formatCurrency(Math.max(0, availableBalance - parsedDraftAmount))}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {(balanceError || isOverdraftDraft) && (
                <div className="aureus-overdraft-alert">
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <span>
                    {balanceError ||
                      `No puedes registrar un gasto de ${formatCurrency(parsedDraftAmount)} porque supera tu saldo disponible (${formatCurrency(Math.max(0, availableBalance ?? 0))}) y llevaría tu cuenta a negativo.`}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label className="aureus-field-label">Descripción / Concepto</label>
                <input
                  className="aureus-adaptive-input"
                  placeholder="Ej: Supermercado, Alquiler..."
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  autoFocus
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label className="aureus-field-label">Monto (RD$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={availableBalance !== undefined && availableBalance > 0 ? availableBalance : undefined}
                    className="aureus-adaptive-input"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={e => {
                      setBalanceError(null)
                      setForm(p => ({ ...p, amount: e.target.value }))
                    }}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label className="aureus-field-label">Categoría</label>
                  <CustomIconSelect
                    options={EXPENSE_CATEGORY_OPTIONS}
                    value={form.category}
                    onChange={val => setForm(p => ({ ...p, category: val }))}
                    ariaLabel="Categoría"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label className="aureus-field-label">Compromiso</label>
                  <CustomIconSelect
                    options={EXPENSE_TYPE_OPTIONS}
                    value={form.type}
                    onChange={val => setForm(p => ({ ...p, type: val }))}
                    ariaLabel="Compromiso"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label className="aureus-field-label">Método Pago</label>
                  <CustomIconSelect
                    options={PAYMENT_METHOD_OPTIONS}
                    value={form.paymentMethod}
                    onChange={val => setForm(p => ({ ...p, paymentMethod: val }))}
                    ariaLabel="Método Pago"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label className="aureus-field-label">
                  <Calendar size={12} style={{ marginRight: 4, display: 'inline-block', verticalAlign: 'middle' }} color="#C9A84C" />
                  Fecha
                </label>
                <input
                  type="date"
                  className="aureus-adaptive-input"
                  value={form.date}
                  onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="aureus-btn-secondary">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isOverdraftDraft || (availableBalance !== undefined && availableBalance <= 0)}
                  style={{
                    background: isOverdraftDraft ? 'rgba(248, 113, 113, 0.25)' : 'var(--gold-primary)',
                    border: 'none',
                    color: isOverdraftDraft ? '#F87171' : '#08080C',
                    padding: '10px 20px',
                    borderRadius: 10,
                    fontWeight: 700,
                    cursor: isOverdraftDraft ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    opacity: isOverdraftDraft ? 0.7 : 1,
                  }}
                >
                  <Plus size={16} /> Guardar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pendingConfirmation && (
        <TransactionConfirmationFlow
          amount={pendingConfirmation.amount}
          category={CATEGORY_MAP[pendingConfirmation.category]?.label || 'Egreso'}
          concept={pendingConfirmation.description}
          date={pendingConfirmation.date}
          paymentMethod={PAYMENT_MAP[pendingConfirmation.paymentMethod] || pendingConfirmation.paymentMethod}
          onConfirm={() => {
            onAddExpense(pendingConfirmation)
            setPendingConfirmation(null)
            setForm({ description: '', amount: '', category: 'food', type: 'variable', paymentMethod: 'debit_card', date: new Date().toISOString().slice(0, 10) })
          }}
          onCancel={() => {
            setPendingConfirmation(null)
          }}
        />
      )}
    </div>
  )
}
