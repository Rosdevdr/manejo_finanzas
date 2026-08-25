import { useState } from 'react'
import { TrendingDown, Lock, Shuffle, Plus, Trash2, Pencil } from 'lucide-react'
import type { Expense, ExpenseCategory, ExpenseType, PaymentMethod } from '../../types/finance'
import { formatCurrency } from '../../utils/formatters'

interface ExpensesViewProps {
  currentPeriod: string
  expenses: Expense[]
  onAddExpense:    (d: Omit<Expense, 'id'>) => void
  onUpdateExpense: (u: Expense) => void
  onDeleteExpense: (id: string) => void
}

const CATEGORY_MAP: Record<ExpenseCategory, { label: string; badge: string; emoji: string }> = {
  housing:       { label: 'Vivienda',     badge: 'badge-vivienda',     emoji: '🏠' },
  food:          { label: 'Alimentación', badge: 'badge-alimentacion', emoji: '🛒' },
  transport:     { label: 'Transporte',   badge: 'badge-transporte',   emoji: '🚗' },
  utilities:     { label: 'Servicios',    badge: 'badge-servicios',    emoji: '⚡' },
  health:        { label: 'Salud',        badge: 'badge-salud',        emoji: '💊' },
  entertainment: { label: 'Ocio',         badge: 'badge-ocio',         emoji: '🎭' },
  education:     { label: 'Educación',    badge: 'badge-inversion',    emoji: '📚' },
  debt:          { label: 'Deudas',       badge: 'badge-fijo',         emoji: '💳' },
  other:         { label: 'Otros',        badge: 'badge-fijo',         emoji: '📦' },
}

const PAYMENT_MAP: Record<PaymentMethod, string> = {
  bank_transfer: 'Transferencia',
  debit_card:    'Débito',
  credit_card:   'Crédito',
  cash:          'Efectivo',
}

export function ExpensesView({ currentPeriod, expenses, onAddExpense, onUpdateExpense, onDeleteExpense }: ExpensesViewProps) {
  const pExp     = expenses.filter(e => e.period === currentPeriod)
  const totalExp = pExp.reduce((s, e) => s + e.amount, 0)
  const fixedExp = pExp.filter(e => e.type === 'fixed').reduce((s, e) => s + e.amount, 0)
  const varExp   = pExp.filter(e => e.type === 'variable').reduce((s, e) => s + e.amount, 0)

  const [form, setForm] = useState({
    description: '', amount: '', category: 'food' as ExpenseCategory,
    type: 'variable' as ExpenseType, paymentMethod: 'debit_card' as PaymentMethod,
    date: new Date().toISOString().slice(0, 10),
  })

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm]   = useState<{
    description: string; amount: string; category: ExpenseCategory
    type: ExpenseType; paymentMethod: PaymentMethod; date: string
  }>({ description: '', amount: '', category: 'food', type: 'variable', paymentMethod: 'debit_card', date: '' })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.description || !form.amount) return
    const computedPeriod = form.date ? form.date.slice(0, 7) : currentPeriod
    onAddExpense({ ...form, amount: parseFloat(form.amount), period: computedPeriod })
    setForm({ description: '', amount: '', category: 'food', type: 'variable', paymentMethod: 'debit_card', date: new Date().toISOString().slice(0, 10) })
  }

  function startEdit(exp: Expense) {
    setEditingId(exp.id)
    setEditForm({ description: exp.description, amount: String(exp.amount), category: exp.category, type: exp.type, paymentMethod: exp.paymentMethod, date: exp.date })
  }

  function saveEdit(exp: Expense) {
    const computedPeriod = editForm.date ? editForm.date.slice(0, 7) : exp.period
    onUpdateExpense({
      ...exp,
      description: editForm.description,
      amount: parseFloat(editForm.amount),
      category: editForm.category,
      type: editForm.type,
      paymentMethod: editForm.paymentMethod,
      date: editForm.date,
      period: computedPeriod,
    })
    setEditingId(null)
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="breadcrumb">AUREUS · <span className="breadcrumb-accent">Gastos</span></div>
        <h1 className="page-title">Control de Gastos</h1>
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="kpi-card red">
          <div className="kpi-top"><span className="kpi-label">Total Gastado</span><TrendingDown size={14} className="kpi-icon" /></div>
          <div className="kpi-value">{formatCurrency(totalExp)}</div>
          <div className="kpi-sub">{pExp.length} registro{pExp.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="kpi-card gold">
          <div className="kpi-top"><span className="kpi-label">Gastos Fijos</span><Lock size={14} className="kpi-icon" /></div>
          <div className="kpi-value">{formatCurrency(fixedExp)}</div>
          <div className="kpi-sub">Compromisos innegociables</div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-top"><span className="kpi-label">Gastos Variables</span><Shuffle size={14} className="kpi-icon" /></div>
          <div className="kpi-value">{formatCurrency(varExp)}</div>
          <div className="kpi-sub">Optimizables este mes</div>
        </div>
      </div>

      {/* Add form */}
      <div className="section-header" style={{ marginTop: 4 }}>
        <div className="section-label">REGISTRAR</div>
        <div className="section-title">Nuevo egreso / gasto</div>
      </div>
      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div style={{ gridColumn: 'span 8' }}>
            <label className="field-label">Descripción / Concepto</label>
            <input
              className="field-input"
              placeholder="Ej: Supermercado mensual, Alquiler, Internet..."
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              required
            />
          </div>
          <div style={{ gridColumn: 'span 4' }}>
            <label className="field-label">Monto (RD$)</label>
            <input
              type="number"
              className="field-input"
              placeholder="0.00"
              min={0.01}
              step="0.01"
              value={form.amount}
              onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
              required
            />
          </div>
          <div style={{ gridColumn: 'span 3' }}>
            <label className="field-label">Categoría</label>
            <select
              className="field-select"
              value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value as ExpenseCategory }))}
            >
              {Object.entries(CATEGORY_MAP).map(([k, v]) => (
                <option key={k} value={k}>{v.emoji} {v.label}</option>
              ))}
            </select>
          </div>
          <div style={{ gridColumn: 'span 3' }}>
            <label className="field-label">Compromiso</label>
            <select
              className="field-select"
              value={form.type}
              onChange={e => setForm(p => ({ ...p, type: e.target.value as ExpenseType }))}
            >
              <option value="fixed">Gasto Fijo (Obligatorio)</option>
              <option value="variable">Gasto Variable (Controlable)</option>
            </select>
          </div>
          <div style={{ gridColumn: 'span 3' }}>
            <label className="field-label">Método de Pago</label>
            <select
              className="field-select"
              value={form.paymentMethod}
              onChange={e => setForm(p => ({ ...p, paymentMethod: e.target.value as PaymentMethod }))}
            >
              <option value="debit_card">Tarjeta de Débito</option>
              <option value="credit_card">Tarjeta de Crédito</option>
              <option value="bank_transfer">Transferencia Bancaria</option>
              <option value="cash">Efectivo</option>
            </select>
          </div>
          <div style={{ gridColumn: 'span 3' }}>
            <label className="field-label">Fecha del Gasto</label>
            <input
              type="date"
              className="field-input"
              value={form.date}
              onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
              required
            />
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-primary btn-expense">
            <Plus size={16} />
            <span>Registrar Gasto</span>
          </button>
        </div>
      </form>

      {/* List */}
      <div className="section-header">
        <div className="section-label">HISTORIAL</div>
        <div className="section-title">Gastos registrados</div>
      </div>
      <div className="tx-list">
        <div className="tx-header">
          <span className="tx-title">Egresos del Período</span>
          <span className="tx-count">{pExp.length} registro{pExp.length !== 1 ? 's' : ''}</span>
        </div>
        {pExp.length === 0 ? (
          <div className="empty-state"><p className="empty-text">Sin gastos registrados para este período</p></div>
        ) : pExp.map(exp => {
          const c = CATEGORY_MAP[exp.category]

          if (editingId === exp.id) {
            return (
              <div key={exp.id} className="tx-edit-row">
                <input className="edit-input" style={{ minWidth: 180 }} value={editForm.description}
                  onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
                <input type="number" className="edit-input" style={{ maxWidth: 120 }} value={editForm.amount}
                  onChange={e => setEditForm(p => ({ ...p, amount: e.target.value }))} />
                <select className="edit-select" value={editForm.category}
                  onChange={e => setEditForm(p => ({ ...p, category: e.target.value as ExpenseCategory }))}>
                  {Object.entries(CATEGORY_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <select className="edit-select" value={editForm.type}
                  onChange={e => setEditForm(p => ({ ...p, type: e.target.value as ExpenseType }))}>
                  <option value="fixed">Fijo</option>
                  <option value="variable">Variable</option>
                </select>
                <input type="date" className="edit-input" style={{ maxWidth: 140 }} value={editForm.date}
                  onChange={e => setEditForm(p => ({ ...p, date: e.target.value }))} />
                <div className="edit-actions">
                  <button className="edit-save-btn" onClick={() => saveEdit(exp)}>✓ Guardar</button>
                  <button className="edit-cancel-btn" onClick={() => setEditingId(null)}>Cancelar</button>
                </div>
              </div>
            )
          }

          return (
            <div key={exp.id} className="tx-row">
              <div className="tx-icon" style={{ background: 'rgba(248,113,113,0.08)', fontSize: 18 }}>{c.emoji}</div>
              <div className="tx-body">
                <div className="tx-name">{exp.description}</div>
                <div className="tx-meta">
                  <span className={`tx-badge ${c.badge}`}>{c.label}</span>
                  <span className={`tx-badge ${exp.type === 'fixed' ? 'badge-fijo' : 'badge-variable'}`}>{exp.type === 'fixed' ? 'Fijo' : 'Variable'}</span>
                  <span className="tx-date">{exp.date}</span>
                </div>
              </div>
              <div className="tx-right">
                <div className="tx-amount amount-red">-{formatCurrency(exp.amount)}</div>
                <div className="tx-method">{PAYMENT_MAP[exp.paymentMethod]}</div>
              </div>
              <div className="tx-actions">
                <button className="tx-action-btn" onClick={() => startEdit(exp)} title="Editar"><Pencil size={11} /></button>
                <button className="tx-action-btn danger" onClick={() => onDeleteExpense(exp.id)} title="Eliminar"><Trash2 size={11} /></button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
