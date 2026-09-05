import { useState } from 'react'
import { Banknote, AlertTriangle, Plus, Trash2, Pencil, X, Calendar } from 'lucide-react'
import type { CashWithdrawal, CashReason, Expense } from '../../types/finance'
import { formatCurrency } from '../../utils/formatters'
import { formatPeriodLabel } from '../../utils/calendar'
import { evaluateCashWithdrawal } from '../../utils/cashAdvisor'

interface CashViewProps {
  currentPeriod:    string
  withdrawals:      CashWithdrawal[]
  expenses:         Expense[]
  availableBalance: number
  onAddWithdrawal:    (d: Omit<CashWithdrawal, 'id'>) => void
  onDeleteWithdrawal: (id: string) => void
}

const REASON_MAP: Record<CashReason, { label: string; emoji: string; badge: string }> = {
  pocket_money:     { label: 'Bolsillo / Menudeo', emoji: '👛', badge: 'badge-bolsillo' },
  specific_service: { label: 'Servicio Específico', emoji: '🔧', badge: 'badge-servicios' },
  leisure_nightout: { label: 'Ocio / Salida',       emoji: '🎉', badge: 'badge-ocio'     },
  emergency:        { label: 'Emergencia',          emoji: '🚨', badge: 'badge-salud'    },
  unassigned:       { label: 'Sin destino claro',   emoji: '❓', badge: 'badge-fijo'     },
}

export function CashView({ currentPeriod, withdrawals, expenses, availableBalance, onAddWithdrawal, onDeleteWithdrawal }: CashViewProps) {
  const getPeriod = (c: { period?: string; date?: string }) =>
    c.period && c.period.trim().length === 7 ? c.period.trim() : (c.date ? c.date.slice(0, 7) : currentPeriod)

  const pCash    = withdrawals.filter(c => getPeriod(c) === currentPeriod)
  const totalCash = pCash.reduce((s, c) => s + c.amount, 0)
  const pExp     = expenses.filter(e => getPeriod(e) === currentPeriod)
  const totalExp = pExp.reduce((s, e) => s + e.amount, 0)
  const cashPct  = totalExp > 0 ? (totalCash / totalExp) * 100 : 0
  const hasRisk  = pCash.some(c => c.reason === 'unassigned') || cashPct > 25

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState({
    amount: '', reason: 'pocket_money' as CashReason,
    note: '', date: new Date().toISOString().slice(0, 10),
  })

  const [showAllPeriods, setShowAllPeriods] = useState(false)
  const displayedCash = (showAllPeriods || (pCash.length === 0 && withdrawals.length > 0))
    ? [...withdrawals].sort((a, b) => b.date.localeCompare(a.date))
    : pCash

  const parsedAmount = parseFloat(form.amount) || 0
  const advice = parsedAmount > 0 ? evaluateCashWithdrawal(parsedAmount, form.reason, availableBalance) : null

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNote,  setEditNote]  = useState('')
  const [editReason, setEditReason] = useState<CashReason>('pocket_money')
  const [editAmount, setEditAmount] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.amount || parsedAmount <= 0) return
    const computedPeriod = form.date ? form.date.slice(0, 7) : currentPeriod
    onAddWithdrawal({ ...form, amount: parsedAmount, period: computedPeriod })
    setForm({ amount: '', reason: 'pocket_money', note: '', date: new Date().toISOString().slice(0, 10) })
    setIsModalOpen(false)
  }

  function startEdit(c: CashWithdrawal) {
    setEditingId(c.id)
    setEditNote(c.note ?? '')
    setEditReason(c.reason)
    setEditAmount(String(c.amount))
  }

  function saveEdit(c: CashWithdrawal) {
    onDeleteWithdrawal(c.id)
    onAddWithdrawal({ amount: parseFloat(editAmount), reason: editReason, note: editNote, date: c.date, period: c.period })
    setEditingId(null)
  }

  return (
    <div className="fade-in sandbox-view">
      {/* ── CABECERA INSTITUCIONAL CON BOTÓN MODAL ── */}
      <div className="sandbox-header-strip">
        <div>
          <div className="sandbox-subhead">LIQUIDEZ EN EFECTIVO · {formatPeriodLabel(currentPeriod).toUpperCase()}</div>
          <h1 className="sandbox-title">Control de Efectivo</h1>
        </div>
        <div className="sandbox-header-actions">
          <button
            type="button"
            className="sandbox-btn-gold"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={15} />
            <span>Registrar Retiro</span>
          </button>
        </div>
      </div>

      {/* ── METRIC STRIP COMPACTO ── */}
      <div className="sandbox-kpi-row" style={{ marginBottom: 20 }}>
        <div className="sandbox-kpi-card gold-glow">
          <div className="sandbox-kpi-header">
            <span className="sandbox-kpi-label">Total Retirado</span>
            <Banknote size={14} className="text-gold" />
          </div>
          <div className="sandbox-kpi-value">{formatCurrency(totalCash)}</div>
          <div className="sandbox-kpi-sub">{pCash.length} retiros en {currentPeriod}</div>
        </div>

        <div className="sandbox-kpi-card">
          <div className="sandbox-kpi-header">
            <span className="sandbox-kpi-label">Intensidad de Efectivo</span>
            <span className={`sandbox-kpi-pill ${cashPct > 25 ? 'neg' : 'pos'}`}>
              {cashPct.toFixed(1)}% de egresos
            </span>
          </div>
          <div className="sandbox-kpi-value text-amber">{cashPct.toFixed(1)}%</div>
          <div className="sandbox-kpi-sub">{cashPct > 25 ? '⚠️ Excede el umbral del 25%' : 'Nivel de fuga controlado'}</div>
        </div>

        <div className="sandbox-kpi-card">
          <div className="sandbox-kpi-header">
            <span className="sandbox-kpi-label">Diagnóstico de Fuga</span>
            <AlertTriangle size={14} className={hasRisk ? 'text-rose' : 'text-emerald'} />
          </div>
          <div className={`sandbox-kpi-value ${hasRisk ? 'text-rose' : 'text-emerald'}`}>
            {hasRisk ? 'Vulnerable' : 'Controlado'}
          </div>
          <div className="sandbox-kpi-sub">{hasRisk ? 'Retiros sin destino detectados' : 'Trazabilidad óptima'}</div>
        </div>
      </div>

      {/* ── TABLA DE RETIROS DE HISTORIAL INMEDIATAMENTE VISIBLE ── */}
      <div className="sandbox-panel transactions-table-panel">
        <div className="sandbox-panel-header">
          <div>
            <div className="sandbox-panel-title">
              {showAllPeriods ? 'Registro Histórico de Efectivo' : `Retiros de ${formatPeriodLabel(currentPeriod)}`}
            </div>
            <div className="sandbox-panel-sub">
              {displayedCash.length} movimiento{displayedCash.length !== 1 ? 's' : ''} registrado{displayedCash.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="sandbox-pills">
            <button
              type="button"
              className={`sandbox-pill-btn ${!showAllPeriods ? 'active' : ''}`}
              onClick={() => setShowAllPeriods(false)}
            >
              {currentPeriod} ({pCash.length})
            </button>
            <button
              type="button"
              className={`sandbox-pill-btn ${showAllPeriods ? 'active' : ''}`}
              onClick={() => setShowAllPeriods(true)}
            >
              Ver Todo el Historial ({withdrawals.length})
            </button>
          </div>
        </div>

        {displayedCash.length === 0 ? (
          <div className="sandbox-empty">
            <p style={{ margin: 0 }}>No hay retiros de efectivo registrados en {formatPeriodLabel(currentPeriod)}.</p>
            {withdrawals.length > 0 && !showAllPeriods && (
              <button
                type="button"
                className="sandbox-btn-outline"
                style={{ marginTop: 12 }}
                onClick={() => setShowAllPeriods(true)}
              >
                Ver los {withdrawals.length} retiros de otros meses
              </button>
            )}
          </div>
        ) : (
          <div className="sandbox-table-wrapper">
            <table className="sandbox-table">
              <thead>
                <tr>
                  <th>FECHA</th>
                  <th>DESTINO / PROPÓSITO</th>
                  <th>NOTA / CAJERO</th>
                  <th>PERÍODO</th>
                  <th>MONTO</th>
                  <th style={{ textAlign: 'right' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {displayedCash.map(c => {
                  const r = REASON_MAP[c.reason] || REASON_MAP.pocket_money

                  if (editingId === c.id) {
                    return (
                      <tr key={c.id} className="edit-active-row">
                        <td className="cell-date">{c.date}</td>
                        <td>
                          <select
                            className="sandbox-edit-select"
                            value={editReason}
                            onChange={e => setEditReason(e.target.value as CashReason)}
                          >
                            {Object.entries(REASON_MAP).map(([k, v]) => (
                              <option key={k} value={k}>{v.emoji} {v.label}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            className="sandbox-edit-input"
                            value={editNote}
                            onChange={e => setEditNote(e.target.value)}
                          />
                        </td>
                        <td style={{ color: '#888' }}>{c.period}</td>
                        <td>
                          <input
                            type="number"
                            className="sandbox-edit-input"
                            style={{ width: 110 }}
                            value={editAmount}
                            onChange={e => setEditAmount(e.target.value)}
                          />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="sandbox-btn-save"
                            onClick={() => saveEdit(c)}
                          >
                            ✓
                          </button>
                          <button
                            type="button"
                            className="sandbox-btn-cancel"
                            onClick={() => setEditingId(null)}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    )
                  }

                  return (
                    <tr key={c.id}>
                      <td className="cell-date">{c.date}</td>
                      <td>
                        <span className="sandbox-type-pill out">
                          {r.emoji} {r.label}
                        </span>
                      </td>
                      <td className="cell-item">
                        <div className="item-title">{c.note || '— Sin nota adjunta —'}</div>
                      </td>
                      <td style={{ fontFamily: 'Space Mono', fontSize: 11.5, color: '#C9A84C' }}>
                        {c.period}
                      </td>
                      <td className="cell-total text-amber">
                        -{formatCurrency(c.amount)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 4 }}>
                          <button
                            type="button"
                            className="table-action-btn"
                            onClick={() => startEdit(c)}
                            title="Editar"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            className="table-action-btn danger"
                            onClick={() => onDeleteWithdrawal(c.id)}
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

      {/* ── MODAL PARA REGISTRAR RETIRO DE EFECTIVO ── */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                <Banknote size={16} className="text-gold" />
                <span>Registrar Retiro de Efectivo</span>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="modal-form-group">
                  <label className="modal-label">Monto a Retirar (RD$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="modal-input"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                    autoFocus
                    required
                  />
                </div>

                <div className="modal-form-group">
                  <label className="modal-label">Destino / Uso Previsto</label>
                  <select
                    className="modal-select"
                    value={form.reason}
                    onChange={e => setForm(p => ({ ...p, reason: e.target.value as CashReason }))}
                  >
                    {Object.entries(REASON_MAP).map(([k, v]) => (
                      <option key={k} value={k}>{v.emoji} {v.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {advice && (
                <div style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  marginBottom: 12,
                  fontSize: 11.5,
                  background: advice.level === 'danger' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                  border: `1px solid ${advice.level === 'danger' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
                  color: advice.level === 'danger' ? '#F87171' : '#FBBF24',
                }}>
                  {advice.message}
                </div>
              )}

              <div className="modal-form-group">
                <label className="modal-label">Cajero o Nota Opcional</label>
                <input
                  className="modal-input"
                  placeholder="Ej: Cajero BHD Bella Vista, Propina, Mercado..."
                  value={form.note}
                  onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                />
              </div>

              <div className="modal-form-group">
                <label className="modal-label">
                  <Calendar size={13} className="text-gold" />
                  <span>Fecha</span>
                </label>
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
                  <span>Guardar Retiro</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
