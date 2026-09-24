import { useState, useEffect } from 'react'
import { TrendingDown, Lock, Shuffle, Plus, Trash2, Pencil, X, Calendar, Search } from 'lucide-react'
import type { Expense, ExpenseCategory, ExpenseType, PaymentMethod } from '../../types/finance'
import { formatCurrency } from '../../utils/formatters'
import { formatPeriodLabel } from '../../utils/calendar'
import { TransactionConfirmationFlow } from '../common/TransactionConfirmationFlow'
import './ExpensesView.css'

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
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    description: string
    amount: number
    category: ExpenseCategory
    type: ExpenseType
    paymentMethod: PaymentMethod
    date: string
    period: string
  } | null>(null)

  const [form, setForm] = useState({
    description: '', amount: '', category: 'food' as ExpenseCategory,
    type: 'variable' as ExpenseType, paymentMethod: 'debit_card' as PaymentMethod,
    date: new Date().toISOString().slice(0, 10),
  })

  // Escuchar tecla Escape para cerrar modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen])

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
    const parsedAmount = parseFloat(form.amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) return

    const computedPeriod = form.date ? form.date.slice(0, 7) : currentPeriod
    const expenseData = {
      description: form.description.trim(),
      amount: parsedAmount,
      category: form.category,
      type: form.type,
      paymentMethod: form.paymentMethod,
      date: form.date,
      period: computedPeriod,
    }

    // Si el monto supera el umbral de control de riesgo (>= RD$ 25,000), activar fricción intencional
    if (parsedAmount >= 25000) {
      setPendingConfirmation(expenseData)
      setIsModalOpen(false)
      return
    }

    onAddExpense(expenseData)
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
    <div className="expenses-obsidian-root fade-in">
      {/* ── CABECERA INSTITUCIONAL ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--gold-primary)', fontWeight: 700, letterSpacing: '0.15em', marginBottom: 4 }}>GESTIÓN DE EGRESOS</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>Control de Gastos</h1>
        </div>
        <div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--gold-primary)', color: '#08080C',
              padding: '10px 20px', borderRadius: 10,
              fontWeight: 600, fontSize: 13, border: 'none',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <Plus size={16} />
            <span>Registrar Gasto</span>
          </button>
        </div>
      </div>

      {/* ── METRIC STRIP ── */}
      <div className="expenses-obsidian-kpi-row">
        <div className="expenses-obsidian-kpi-card" style={{ borderTop: '2px solid #F87171' }}>
          <div className="expenses-obsidian-kpi-header">
            <span className="expenses-obsidian-kpi-label">Total Gastado</span>
            <TrendingDown size={16} color="#F87171" />
          </div>
          <div className="expenses-obsidian-kpi-val" style={{ color: 'var(--rose-danger)' }}>{formatCurrency(totalExp)}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{pExp.length} egresos en {currentPeriod}</div>
        </div>

        <div className="expenses-obsidian-kpi-card">
          <div className="expenses-obsidian-kpi-header">
            <span className="expenses-obsidian-kpi-label">Gastos Fijos</span>
            <Lock size={16} color="#C9A84C" />
          </div>
          <div className="expenses-obsidian-kpi-val">{formatCurrency(fixedExp)}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Compromisos innegociables</div>
        </div>

        <div className="expenses-obsidian-kpi-card">
          <div className="expenses-obsidian-kpi-header">
            <span className="expenses-obsidian-kpi-label">Gastos Variables</span>
            <Shuffle size={16} color="#D0D0DC" />
          </div>
          <div className="expenses-obsidian-kpi-val">{formatCurrency(varExp)}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Presupuesto optimizable</div>
        </div>
      </div>

      {/* ── HIGH DENSITY DATA GRID ── */}
      <div className="obsidian-data-grid-container">
        <div className="obsidian-data-grid-header">
          <div className="obsidian-data-grid-title">
            {showAllPeriods ? 'Registro Histórico de Gastos' : `Movimientos de ${formatPeriodLabel(currentPeriod)}`}
          </div>
          <div style={{ display: 'flex', gap: 8, background: 'rgba(0,0,0,0.3)', padding: 4, borderRadius: 10 }}>
            <button
              className={`obsidian-icon-btn ${!showAllPeriods ? 'active' : ''}`}
              style={!showAllPeriods ? { background: '#2B2D3C', color: 'var(--text-primary)' } : {}}
              onClick={() => setShowAllPeriods(false)}
            >
              <span style={{ fontSize: 12, fontWeight: 600, padding: '0 8px' }}>Mes Actual</span>
            </button>
            <button
              className={`obsidian-icon-btn ${showAllPeriods ? 'active' : ''}`}
              style={showAllPeriods ? { background: '#2B2D3C', color: 'var(--text-primary)' } : {}}
              onClick={() => setShowAllPeriods(true)}
            >
              <span style={{ fontSize: 12, fontWeight: 600, padding: '0 8px' }}>Historial</span>
            </button>
          </div>
        </div>

        {displayedExpenses.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Search size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
            <div style={{ fontSize: 14, fontWeight: 500 }}>No hay gastos en este período</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Registra un gasto usando el botón superior dorado.</div>
          </div>
        ) : (
          <div className="obsidian-table-wrapper">
            <table className="obsidian-table">
              <thead>
                <tr>
                  <th>FECHA</th>
                  <th>CATEGORÍA</th>
                  <th>CONCEPTO</th>
                  <th>COMPROMISO / CANAL</th>
                  <th style={{ textAlign: 'right' }}>MONTO</th>
                  <th style={{ textAlign: 'right', width: 100 }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {displayedExpenses.map(exp => {
                  const c = CATEGORY_MAP[exp.category] || CATEGORY_MAP.other

                  if (editingId === exp.id) {
                    return (
                      <tr key={exp.id}>
                        <td className="cell-date">{exp.date}</td>
                        <td>
                          <select
                            style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', padding: '6px 12px', borderRadius: 6, fontSize: 12 }}
                            value={editForm.category}
                            onChange={e => setEditForm(p => ({ ...p, category: e.target.value as ExpenseCategory }))}
                          >
                            {Object.entries(CATEGORY_MAP).map(([k, v]) => (
                              <option key={k} value={k}>{v.emoji} {v.label}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', padding: '6px 12px', borderRadius: 6, fontSize: 12, width: '100%' }}
                            value={editForm.description}
                            onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                          />
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <select
                              style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', padding: '6px 8px', borderRadius: 6, fontSize: 11 }}
                              value={editForm.type}
                              onChange={e => setEditForm(p => ({ ...p, type: e.target.value as ExpenseType }))}
                            >
                              <option value="fixed">Fijo</option>
                              <option value="variable">Variable</option>
                            </select>
                            <select
                              style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', padding: '6px 8px', borderRadius: 6, fontSize: 11 }}
                              value={editForm.paymentMethod}
                              onChange={e => setEditForm(p => ({ ...p, paymentMethod: e.target.value as PaymentMethod }))}
                            >
                              <option value="debit_card">Débito</option>
                              <option value="credit_card">Crédito</option>
                              <option value="bank_transfer">Transferencia</option>
                              <option value="cash">Efectivo</option>
                            </select>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <input
                            type="number"
                            style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', padding: '6px 12px', borderRadius: 6, fontSize: 12, width: 90, textAlign: 'right' }}
                            value={editForm.amount}
                            onChange={e => setEditForm(p => ({ ...p, amount: e.target.value }))}
                          />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 4, justifyContent: 'flex-end' }}>
                            <button className="obsidian-icon-btn" style={{ color: 'var(--emerald-success)' }} onClick={() => saveEdit(exp)}>✓</button>
                            <button className="obsidian-icon-btn" onClick={cancelEdit}>✕</button>
                          </div>
                        </td>
                      </tr>
                    )
                  }

                  return (
                    <tr key={exp.id}>
                      <td className="cell-date">{exp.date}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 14 }}>{c.emoji}</span>
                          <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{c.label}</span>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 20, width: '100%', maxWidth: 480, overflow: 'hidden', boxShadow: 'var(--shadow-modal), var(--specular-top)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                <Plus size={18} color="#C9A84C" /> Registrar Nuevo Gasto
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, color: '#888899', fontWeight: 600 }}>Descripción / Concepto</label>
                <input
                  style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', color: 'var(--text-primary)', fontSize: 14 }}
                  placeholder="Ej: Supermercado, Alquiler..."
                  value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  autoFocus required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, color: '#888899', fontWeight: 600 }}>Monto (RD$)</label>
                  <input
                    type="number" step="0.01" min="0.01"
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', color: 'var(--text-primary)', fontSize: 14 }}
                    value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, color: '#888899', fontWeight: 600 }}>Categoría</label>
                  <select
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', color: 'var(--text-primary)', fontSize: 14 }}
                    value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value as ExpenseCategory }))}
                  >
                    {Object.entries(CATEGORY_MAP).map(([k, v]) => (
                      <option key={k} value={k}>{v.emoji} {v.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, color: '#888899', fontWeight: 600 }}>Compromiso</label>
                  <select
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', color: 'var(--text-primary)', fontSize: 14 }}
                    value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as ExpenseType }))}
                  >
                    <option value="variable">Gasto Variable</option>
                    <option value="fixed">Gasto Fijo</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, color: '#888899', fontWeight: 600 }}>Método Pago</label>
                  <select
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', color: 'var(--text-primary)', fontSize: 14 }}
                    value={form.paymentMethod} onChange={e => setForm(p => ({ ...p, paymentMethod: e.target.value as PaymentMethod }))}
                  >
                    <option value="debit_card">Tarjeta de Débito</option>
                    <option value="credit_card">Tarjeta de Crédito</option>
                    <option value="bank_transfer">Transferencia</option>
                    <option value="cash">Efectivo</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, color: '#888899', fontWeight: 600 }}>
                  <Calendar size={12} style={{ marginRight: 4, display: 'inline-block', verticalAlign: 'middle' }} color="#C9A84C" />
                  Fecha
                </label>
                <input
                  type="date"
                  style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', color: 'var(--text-primary)', fontSize: 14 }}
                  value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'var(--text-primary)', padding: '10px 20px', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" style={{ background: 'var(--gold-primary)', border: 'none', color: '#08080C', padding: '10px 20px', borderRadius: 10, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={16} /> Guardar
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
