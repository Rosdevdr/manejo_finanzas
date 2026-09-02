import { useState } from 'react'
import { Wallet, Briefcase, TrendingUp, Plus, Trash2, Pencil, X, Check } from 'lucide-react'
import type { Income, IncomeType } from '../../types/finance'
import { formatCurrency } from '../../utils/formatters'
import { formatPeriodLabel } from '../../utils/calendar'

interface IncomesViewProps {
  currentPeriod: string
  incomes: Income[]
  onAddIncome:    (d: Omit<Income, 'id'>) => void
  onUpdateIncome: (u: Income) => void
  onDeleteIncome: (id: string) => void
}

const TYPE_MAP: Record<IncomeType, { label: string; badge: string; emoji: string }> = {
  salary:     { label: 'Salario',   badge: 'badge-ingreso',   emoji: '💼' },
  freelance:  { label: 'Freelance', badge: 'badge-freelance', emoji: '💻' },
  investment: { label: 'Inversión', badge: 'badge-inversion', emoji: '📈' },
  extra:      { label: 'Extra',     badge: 'badge-variable',  emoji: '⚡' },
}

export function IncomesView({ currentPeriod, incomes, onAddIncome, onUpdateIncome, onDeleteIncome }: IncomesViewProps) {
  const getPeriod = (i: { period?: string; date?: string }) =>
    i.period && i.period.trim().length === 7 ? i.period.trim() : (i.date ? i.date.slice(0, 7) : currentPeriod)

  const periodIncomes = incomes.filter(i => getPeriod(i) === currentPeriod)
  const totalIncome   = periodIncomes.reduce((s, i) => s + i.amount, 0)
  const salary        = periodIncomes.filter(i => i.type === 'salary').reduce((s, i) => s + i.amount, 0)
  const extra         = periodIncomes.filter(i => i.type !== 'salary').reduce((s, i) => s + i.amount, 0)

  // Modal de registro
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState({
    description: '', amount: '', type: 'salary' as IncomeType,
    date: new Date().toISOString().slice(0, 10),
  })

  // Filtro de períodos
  const [showAllPeriods, setShowAllPeriods] = useState(false)
  const displayedIncomes = (showAllPeriods || (periodIncomes.length === 0 && incomes.length > 0))
    ? [...incomes].sort((a, b) => b.date.localeCompare(a.date))
    : periodIncomes

  // Edición rápida inline
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm]   = useState<{ description: string; amount: string; type: IncomeType; date: string }>({
    description: '', amount: '', type: 'salary', date: '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.description || !form.amount) return
    const computedPeriod = form.date ? form.date.slice(0, 7) : currentPeriod
    onAddIncome({ ...form, amount: parseFloat(form.amount), period: computedPeriod })
    setForm({ description: '', amount: '', type: 'salary', date: new Date().toISOString().slice(0, 10) })
    setIsModalOpen(false)
  }

  function startEdit(inc: Income) {
    setEditingId(inc.id)
    setEditForm({ description: inc.description, amount: String(inc.amount), type: inc.type, date: inc.date })
  }

  function cancelEdit() { setEditingId(null) }

  function saveEdit(inc: Income) {
    const computedPeriod = editForm.date ? editForm.date.slice(0, 7) : inc.period
    onUpdateIncome({
      ...inc,
      description: editForm.description,
      amount: parseFloat(editForm.amount),
      type: editForm.type,
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
          <div className="sandbox-subhead">GESTIÓN DE CAPITAL · {formatPeriodLabel(currentPeriod).toUpperCase()}</div>
          <h1 className="sandbox-title">Entradas & Salarios</h1>
        </div>
        <div className="sandbox-header-actions">
          <button
            type="button"
            className="sandbox-btn-gold"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={15} />
            <span>Registrar Ingreso</span>
          </button>
        </div>
      </div>

      {/* ── METRIC STRIP COMPACTO ── */}
      <div className="sandbox-kpi-row" style={{ marginBottom: 20 }}>
        <div className="sandbox-kpi-card gold-glow">
          <div className="sandbox-kpi-header">
            <span className="sandbox-kpi-label">Total del Período</span>
            <Wallet size={14} className="text-gold" />
          </div>
          <div className="sandbox-kpi-value text-emerald">{formatCurrency(totalIncome)}</div>
          <div className="sandbox-kpi-sub">{periodIncomes.length} ingresos en {currentPeriod}</div>
        </div>

        <div className="sandbox-kpi-card">
          <div className="sandbox-kpi-header">
            <span className="sandbox-kpi-label">Ingresos Fijos</span>
            <Briefcase size={14} className="text-gold" />
          </div>
          <div className="sandbox-kpi-value">{formatCurrency(salary)}</div>
          <div className="sandbox-kpi-sub">Salario principal y nómina</div>
        </div>

        <div className="sandbox-kpi-card">
          <div className="sandbox-kpi-header">
            <span className="sandbox-kpi-label">Ingresos Variables</span>
            <TrendingUp size={14} className="text-emerald" />
          </div>
          <div className="sandbox-kpi-value">{formatCurrency(extra)}</div>
          <div className="sandbox-kpi-sub">Honorarios, Freelance & Inversiones</div>
        </div>
      </div>

      {/* ── TABLA DE REGISTROS DE HISTORIAL INMEDIATAMENTE VISIBLE ── */}
      <div className="sandbox-panel transactions-table-panel">
        <div className="sandbox-panel-header">
          <div>
            <div className="sandbox-panel-title">
              {showAllPeriods ? 'Registro Histórico Completo' : `Entradas de ${formatPeriodLabel(currentPeriod)}`}
            </div>
            <div className="sandbox-panel-sub">
              {displayedIncomes.length} movimiento{displayedIncomes.length !== 1 ? 's' : ''} registrado{displayedIncomes.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="sandbox-pills">
            <button
              type="button"
              className={`sandbox-pill-btn ${!showAllPeriods ? 'active' : ''}`}
              onClick={() => setShowAllPeriods(false)}
            >
              {currentPeriod} ({periodIncomes.length})
            </button>
            <button
              type="button"
              className={`sandbox-pill-btn ${showAllPeriods ? 'active' : ''}`}
              onClick={() => setShowAllPeriods(true)}
            >
              Ver Todo el Historial ({incomes.length})
            </button>
          </div>
        </div>

        {displayedIncomes.length === 0 ? (
          <div className="sandbox-empty">
            <p style={{ margin: 0 }}>No hay ingresos registrados en {formatPeriodLabel(currentPeriod)}.</p>
            {incomes.length > 0 && !showAllPeriods && (
              <button
                type="button"
                className="sandbox-btn-outline"
                style={{ marginTop: 12 }}
                onClick={() => setShowAllPeriods(true)}
              >
                Ver los {incomes.length} ingresos de otros meses
              </button>
            )}
          </div>
        ) : (
          <div className="sandbox-table-wrapper">
            <table className="sandbox-table">
              <thead>
                <tr>
                  <th>FECHA</th>
                  <th>CONCEPTO / DESCRIPCIÓN</th>
                  <th>CATEGORÍA</th>
                  <th>PERÍODO</th>
                  <th>MONTO</th>
                  <th style={{ textAlign: 'right' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {displayedIncomes.map(inc => {
                  const t = TYPE_MAP[inc.type]
                  if (editingId === inc.id) {
                    return (
                      <tr key={inc.id} className="edit-active-row">
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
                            value={editForm.type}
                            onChange={e => setEditForm(p => ({ ...p, type: e.target.value as IncomeType }))}
                          >
                            <option value="salary">Salario</option>
                            <option value="freelance">Freelance</option>
                            <option value="investment">Inversión</option>
                            <option value="extra">Extra</option>
                          </select>
                        </td>
                        <td style={{ color: '#888' }}>{inc.period}</td>
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
                              onClick={() => saveEdit(inc)}
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
                    <tr key={inc.id}>
                      <td className="cell-date">{inc.date}</td>
                      <td className="cell-item">
                        <div className="item-title">{inc.description}</div>
                      </td>
                      <td>
                        <span className={`sandbox-type-pill in`}>
                          {t.emoji} {t.label}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'Space Mono', fontSize: 11.5, color: '#C9A84C' }}>
                        {inc.period}
                      </td>
                      <td className="cell-total text-emerald">
                        +{formatCurrency(inc.amount)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 4 }}>
                          <button
                            type="button"
                            className="table-action-btn"
                            onClick={() => startEdit(inc)}
                            title="Editar"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            className="table-action-btn danger"
                            onClick={() => onDeleteIncome(inc.id)}
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

      {/* ── MODAL INSTITUCIONAL SANDBOX PARA REGISTRAR INGRESO ── */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                <Plus size={16} className="text-gold" />
                <span>Registrar Entrada de Capital</span>
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
                  placeholder="Ej: Salario mensual, Consultoría, Dividendos..."
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
                  <label className="modal-label">Tipo de Ingreso</label>
                  <select
                    className="modal-select"
                    value={form.type}
                    onChange={e => setForm(p => ({ ...p, type: e.target.value as IncomeType }))}
                  >
                    <option value="salary">Sueldo / Salario Fijo</option>
                    <option value="freelance">Freelance / Honorarios</option>
                    <option value="investment">Inversiones / Rendimientos</option>
                    <option value="extra">Extra / Ocasional</option>
                  </select>
                </div>
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Fecha de Entrada</label>
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
                  <span>Guardar Ingreso</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
