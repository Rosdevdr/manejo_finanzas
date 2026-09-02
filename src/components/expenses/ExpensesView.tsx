import { useState } from 'react'
import { TrendingDown, Lock, Shuffle, Plus, Trash2, Pencil, X, Check } from 'lucide-react'
import type { Expense, ExpenseCategory, ExpenseType, PaymentMethod } from '../../types/finance'
import { formatCurrency } from '../../utils/formatters'
import { formatPeriodLabel } from '../../utils/calendar'

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
  const getPeriod = (e: { period?: string; date?: string }) =>
    e.period && e.period.trim().length === 7 ? e.period.trim() : (e.date ? e.date.slice(0, 7) : currentPeriod)

  const pExp     = expenses.filter(e => getPeriod(e) === currentPeriod)
  const totalExp = pExp.reduce((s, e) => s + e.amount, 0)
  const fixedExp = pExp.filter(e => e.type === 'fixed').reduce((s, e) => s + e.amount, 0)
  const varExp   = pExp.filter(e => e.type === 'variable').reduce((s, e) => s + e.amount, 0)

  // Modal de registro
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState({
    description: '', amount: '', category: 'food' as ExpenseCategory,
    type: 'variable' as ExpenseType, paymentMethod: 'debit_card' as PaymentMethod,
    date: new Date().toISOString().slice(0, 10),
  })

  // Filtro de períodos
  const [showAllPeriods, setShowAllPeriods] = useState(false)
  const displayedExpenses = (showAllPeriods || (pExp.length === 0 && expenses.length > 0))
    ? [...expenses].sort((a, b) => b.date.localeCompare(a.date))
    : pExp

  // Edición rápida inline
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
    setIsModalOpen(false)
  }

  function startEdit(exp: Expense) {
    setEditingId(exp.id)
    setEditForm({ description: exp.description, amount: String(exp.amount), category: exp.category, type: exp.type, paymentMethod: exp.paymentMethod, date: exp.date })
  }

  function cancelEdit() { setEditingId(null) }

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
    <div className="fade-in sandbox-view">
      {/* ── CABECERA INSTITUCIONAL CON BOTÓN DE ACCIÓN MODAL ── */}
      <div className="sandbox-header-strip">
        <div>
          <div className="sandbox-subhead">GESTIÓN DE EGRESOS · {formatPeriodLabel(currentPeriod).toUpperCase()}</div>
          <h1 className="sandbox-title">Control de Gastos</h1>
        </div>
        <div className="sandbox-header-actions">
          <button
            type="button"
            className="sandbox-btn-gold"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={15} />
            <span>Registrar Gasto</span>
          </button>
        </div>
      </div>

      {/* ── METRIC STRIP COMPACTO ── */}
      <div className="sandbox-kpi-row" style={{ marginBottom: 20 }}>
        <div className="sandbox-kpi-card">
          <div className="sandbox-kpi-header">
            <span className="sandbox-kpi-label">Total Gastado</span>
            <TrendingDown size={14} className="text-rose" />
          </div>
          <div className="sandbox-kpi-value text-rose">{formatCurrency(totalExp)}</div>
          <div className="sandbox-kpi-sub">{pExp.length} egresos en {currentPeriod}</div>
        </div>

        <div className="sandbox-kpi-card">
          <div className="sandbox-kpi-header">
            <span className="sandbox-kpi-label">Gastos Fijos</span>
            <Lock size={14} className="text-gold" />
          </div>
          <div className="sandbox-kpi-value">{formatCurrency(fixedExp)}</div>
          <div className="sandbox-kpi-sub">Compromisos innegociables</div>
        </div>

        <div className="sandbox-kpi-card">
          <div className="sandbox-kpi-header">
            <span className="sandbox-kpi-label">Gastos Variables</span>
            <Shuffle size={14} className="text-sand" />
          </div>
          <div className="sandbox-kpi-value">{formatCurrency(varExp)}</div>
          <div className="sandbox-kpi-sub">Presupuesto optimizable</div>
        </div>
      </div>

      {/* ── TABLA DE REGISTROS DE HISTORIAL INMEDIATAMENTE VISIBLE ── */}
      <div className="sandbox-panel transactions-table-panel">
        <div className="sandbox-panel-header">
          <div>
            <div className="sandbox-panel-title">
              {showAllPeriods ? 'Registro Histórico de Gastos' : `Gastos de ${formatPeriodLabel(currentPeriod)}`}
            </div>
            <div className="sandbox-panel-sub">
              {displayedExpenses.length} movimiento{displayedExpenses.length !== 1 ? 's' : ''} registrado{displayedExpenses.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="sandbox-pills">
            <button
              type="button"
              className={`sandbox-pill-btn ${!showAllPeriods ? 'active' : ''}`}
              onClick={() => setShowAllPeriods(false)}
            >
              {currentPeriod} ({pExp.length})
            </button>
            <button
              type="button"
              className={`sandbox-pill-btn ${showAllPeriods ? 'active' : ''}`}
              onClick={() => setShowAllPeriods(true)}
            >
              Ver Todo el Historial ({expenses.length})
            </button>
          </div>
        </div>

        {displayedExpenses.length === 0 ? (
          <div className="sandbox-empty">
            <p style={{ margin: 0 }}>No hay gastos registrados en {formatPeriodLabel(currentPeriod)}.</p>
            {expenses.length > 0 && !showAllPeriods && (
              <button
                type="button"
                className="sandbox-btn-outline"
                style={{ marginTop: 12 }}
                onClick={() => setShowAllPeriods(true)}
              >
                Ver los {expenses.length} gastos de otros meses
              </button>
            )}
          </div>
        ) : (
          <div className="sandbox-table-wrapper">
            <table className="sandbox-table">
              <thead>
                <tr>
                  <th>FECHA</th>
                  <th>CONCEPTO / COMERCIO</th>
                  <th>CATEGORÍA</th>
                  <th>COMPROMISO</th>
                  <th>CANAL</th>
                  <th>MONTO</th>
                  <th style={{ textAlign: 'right' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {displayedExpenses.map(exp => {
                  const c = CATEGORY_MAP[exp.category] || CATEGORY_MAP.other

                  if (editingId === exp.id) {
                    return (
                      <tr key={exp.id} className="edit-active-row">
                        <td>
                          <input
                            type="date"
                            className="sandbox-edit-input"
                            value={editForm.date}
                            onChange={e => setEditForm(p => ({ ...p, date: e.target.value }))}
                          />
                        </td>
                        <td>
                          <input
                            className="sandbox-edit-input"
                            value={editForm.description}
                            onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                          />
                        </td>
                        <td>
                          <select
                            className="sandbox-edit-select"
                            value={editForm.category}
                            onChange={e => setEditForm(p => ({ ...p, category: e.target.value as ExpenseCategory }))}
                          >
                            {Object.entries(CATEGORY_MAP).map(([k, v]) => (
                              <option key={k} value={k}>{v.label}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            className="sandbox-edit-select"
                            value={editForm.type}
                            onChange={e => setEditForm(p => ({ ...p, type: e.target.value as ExpenseType }))}
                          >
                            <option value="fixed">Fijo</option>
                            <option value="variable">Variable</option>
                          </select>
                        </td>
                        <td>
                          <select
                            className="sandbox-edit-select"
                            value={editForm.paymentMethod}
                            onChange={e => setEditForm(p => ({ ...p, paymentMethod: e.target.value as PaymentMethod }))}
                          >
                            <option value="debit_card">Débito</option>
                            <option value="credit_card">Crédito</option>
                            <option value="bank_transfer">Transferencia</option>
                            <option value="cash">Efectivo</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            className="sandbox-edit-input"
                            style={{ width: 110 }}
                            value={editForm.amount}
                            onChange={e => setEditForm(p => ({ ...p, amount: e.target.value }))}
                          />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button
                              type="button"
                              className="sandbox-btn-save"
                              onClick={() => saveEdit(exp)}
                              title="Guardar"
                            >
                              <Check size={13} />
                            </button>
                            <button
                              type="button"
                              className="sandbox-btn-cancel"
                              onClick={cancelEdit}
                              title="Cancelar"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  }

                  return (
                    <tr key={exp.id}>
                      <td className="cell-date">{exp.date}</td>
                      <td className="cell-item">
                        <div className="item-title">{exp.description}</div>
                      </td>
                      <td>
                        <span className={`sandbox-type-pill in`} style={{ color: '#D4AF37', borderColor: 'rgba(212,175,55,0.3)', background: 'rgba(212,175,55,0.08)' }}>
                          {c.emoji} {c.label}
                        </span>
                      </td>
                      <td>
                        <span className={`sandbox-type-pill ${exp.type === 'fixed' ? 'out' : 'neutral'}`}>
                          {exp.type === 'fixed' ? 'Fijo' : 'Variable'}
                        </span>
                      </td>
                      <td style={{ fontSize: 11.5, color: '#9CA3AF' }}>
                        {PAYMENT_MAP[exp.paymentMethod]}
                      </td>
                      <td className="cell-total text-rose">
                        -{formatCurrency(exp.amount)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 4 }}>
                          <button
                            type="button"
                            className="table-action-btn"
                            onClick={() => startEdit(exp)}
                            title="Editar"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            className="table-action-btn danger"
                            onClick={() => onDeleteExpense(exp.id)}
                            title="Eliminar"
                          >
                            <Trash2 size={13} />
                          </button>
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

      {/* ── MODAL INSTITUCIONAL SANDBOX PARA REGISTRAR GASTO ── */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                <Plus size={16} className="text-gold" />
                <span>Registrar Nuevo Gasto</span>
              </h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-form-group">
                <label className="modal-label">Descripción o Concepto</label>
                <input
                  className="modal-input"
                  placeholder="Ej: Supermercado Nacional, Alquiler, Combustible..."
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  autoFocus
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="modal-form-group">
                  <label className="modal-label">Monto (RD$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="modal-input"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                    required
                  />
                </div>

                <div className="modal-form-group">
                  <label className="modal-label">Categoría</label>
                  <select
                    className="modal-select"
                    value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value as ExpenseCategory }))}
                  >
                    {Object.entries(CATEGORY_MAP).map(([k, v]) => (
                      <option key={k} value={k}>{v.emoji} {v.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="modal-form-group">
                  <label className="modal-label">Compromiso</label>
                  <select
                    className="modal-select"
                    value={form.type}
                    onChange={e => setForm(p => ({ ...p, type: e.target.value as ExpenseType }))}
                  >
                    <option value="variable">Gasto Variable (Optimizable)</option>
                    <option value="fixed">Gasto Fijo (Obligatorio)</option>
                  </select>
                </div>

                <div className="modal-form-group">
                  <label className="modal-label">Método de Pago</label>
                  <select
                    className="modal-select"
                    value={form.paymentMethod}
                    onChange={e => setForm(p => ({ ...p, paymentMethod: e.target.value as PaymentMethod }))}
                  >
                    <option value="debit_card">Tarjeta de Débito</option>
                    <option value="credit_card">Tarjeta de Crédito</option>
                    <option value="bank_transfer">Transferencia Bancaria</option>
                    <option value="cash">Efectivo</option>
                  </select>
                </div>
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Fecha del Gasto</label>
                <input
                  type="date"
                  className="modal-input"
                  value={form.date}
                  onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                  required
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="sandbox-btn-gold">
                  <Plus size={14} />
                  <span>Guardar Gasto</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
