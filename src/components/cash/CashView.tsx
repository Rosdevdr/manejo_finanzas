import { useState, useEffect } from 'react'
import { Banknote, AlertTriangle, Plus, Trash2, Pencil, X, Calendar, Search } from 'lucide-react'
import type { CashWithdrawal, CashReason, Expense } from '../../types/finance'
import { formatCurrency } from '../../utils/formatters'
import { formatPeriodLabel } from '../../utils/calendar'
import { evaluateCashWithdrawal } from '../../utils/cashAdvisor'
import './CashView.css'

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

  // Escuchar tecla Escape para cerrar modal
  useEffect(() => {
    if (!isModalOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen])

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
    <div className="cash-obsidian-root fade-in">
      {/* ── CABECERA INSTITUCIONAL ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 11, color: '#C9A84C', fontWeight: 700, letterSpacing: '0.15em', marginBottom: 4 }}>LIQUIDEZ EN EFECTIVO</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em', margin: 0 }}>Control de Efectivo</h1>
        </div>
        <div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#C9A84C', color: '#121420',
              padding: '10px 20px', borderRadius: 10,
              fontWeight: 600, fontSize: 13, border: 'none',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <Plus size={16} />
            <span>Registrar Retiro</span>
          </button>
        </div>
      </div>

      {/* ── METRIC STRIP ── */}
      <div className="cash-obsidian-kpi-row">
        <div className="cash-obsidian-kpi-card" style={{ borderTop: '2px solid #C9A84C' }}>
          <div className="cash-obsidian-kpi-header">
            <span className="cash-obsidian-kpi-label">Total Retirado</span>
            <Banknote size={16} color="#C9A84C" />
          </div>
          <div className="cash-obsidian-kpi-val">{formatCurrency(totalCash)}</div>
          <div style={{ fontSize: 12, color: '#717182' }}>{pCash.length} retiros en {currentPeriod}</div>
        </div>

        <div className="cash-obsidian-kpi-card">
          <div className="cash-obsidian-kpi-header">
            <span className="cash-obsidian-kpi-label">Intensidad Efectivo</span>
            <span style={{
              background: cashPct > 25 ? 'rgba(248, 113, 113, 0.1)' : 'rgba(52, 211, 153, 0.1)',
              color: cashPct > 25 ? '#F87171' : '#34D399',
              padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 700
            }}>
              {cashPct.toFixed(1)}% / EGRESOS
            </span>
          </div>
          <div className="cash-obsidian-kpi-val" style={{ color: cashPct > 25 ? '#F87171' : '#F3CA65' }}>{cashPct.toFixed(1)}%</div>
          <div style={{ fontSize: 12, color: '#717182' }}>
            {cashPct > 25 ? 'Umbral excedido (> 25%)' : 'Nivel de fuga óptimo'}
          </div>
        </div>

        <div className="cash-obsidian-kpi-card">
          <div className="cash-obsidian-kpi-header">
            <span className="cash-obsidian-kpi-label">Riesgo de Fuga</span>
            <AlertTriangle size={16} color={hasRisk ? '#F87171' : '#34D399'} />
          </div>
          <div className="cash-obsidian-kpi-val" style={{ color: hasRisk ? '#F87171' : '#34D399' }}>
            {hasRisk ? 'Vulnerable' : 'Controlado'}
          </div>
          <div style={{ fontSize: 12, color: '#717182' }}>
            {hasRisk ? 'Se detectaron retiros sin destino' : 'Trazabilidad impecable'}
          </div>
        </div>
      </div>

      {/* ── HIGH DENSITY DATA GRID ── */}
      <div className="obsidian-data-grid-container">
        <div className="obsidian-data-grid-header">
          <div className="obsidian-data-grid-title">
            {showAllPeriods ? 'Registro Histórico de Efectivo' : `Movimientos de ${formatPeriodLabel(currentPeriod)}`}
          </div>
          <div style={{ display: 'flex', gap: 8, background: 'rgba(0,0,0,0.3)', padding: 4, borderRadius: 10 }}>
            <button
              className={`obsidian-icon-btn ${!showAllPeriods ? 'active' : ''}`}
              style={!showAllPeriods ? { background: '#2B2D3C', color: '#fff' } : {}}
              onClick={() => setShowAllPeriods(false)}
            >
              <span style={{ fontSize: 12, fontWeight: 600, padding: '0 8px' }}>Mes Actual</span>
            </button>
            <button
              className={`obsidian-icon-btn ${showAllPeriods ? 'active' : ''}`}
              style={showAllPeriods ? { background: '#2B2D3C', color: '#fff' } : {}}
              onClick={() => setShowAllPeriods(true)}
            >
              <span style={{ fontSize: 12, fontWeight: 600, padding: '0 8px' }}>Historial</span>
            </button>
          </div>
        </div>

        {displayedCash.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#717182' }}>
            <Search size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
            <div style={{ fontSize: 14, fontWeight: 500 }}>No hay movimientos en este período</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Registra un retiro usando el botón superior dorado.</div>
          </div>
        ) : (
          <div className="obsidian-table-wrapper">
            <table className="obsidian-table">
              <thead>
                <tr>
                  <th>FECHA</th>
                  <th>CATEGORÍA / DESTINO</th>
                  <th>DESCRIPCIÓN / CAJERO</th>
                  <th>PERÍODO</th>
                  <th style={{ textAlign: 'right' }}>MONTO</th>
                  <th style={{ textAlign: 'right', width: 100 }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {displayedCash.map(c => {
                  const r = REASON_MAP[c.reason] || REASON_MAP.pocket_money

                  if (editingId === c.id) {
                    return (
                      <tr key={c.id}>
                        <td className="cell-date">{c.date}</td>
                        <td>
                          <select
                            style={{ background: '#121420', color: '#fff', border: '1px solid #333', padding: '6px 12px', borderRadius: 6, fontSize: 12 }}
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
                            style={{ background: '#121420', color: '#fff', border: '1px solid #333', padding: '6px 12px', borderRadius: 6, fontSize: 12, width: '100%' }}
                            value={editNote}
                            onChange={e => setEditNote(e.target.value)}
                          />
                        </td>
                        <td className="cell-date" style={{ color: '#C9A84C' }}>{c.period}</td>
                        <td style={{ textAlign: 'right' }}>
                          <input
                            type="number"
                            style={{ background: '#121420', color: '#fff', border: '1px solid #333', padding: '6px 12px', borderRadius: 6, fontSize: 12, width: 90, textAlign: 'right' }}
                            value={editAmount}
                            onChange={e => setEditAmount(e.target.value)}
                          />
                        </td>
                        <td className="action-cell">
                          <button className="obsidian-icon-btn" style={{ color: '#34D399' }} onClick={() => saveEdit(c)}>✓</button>
                          <button className="obsidian-icon-btn" onClick={() => setEditingId(null)}>✕</button>
                        </td>
                      </tr>
                    )
                  }

                  return (
                    <tr key={c.id}>
                      <td className="cell-date">{c.date}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 14 }}>{r.emoji}</span>
                          <span style={{ fontWeight: 500, color: '#E2E2EB' }}>{r.label}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ color: c.note ? '#C0C0D0' : '#555566', fontStyle: c.note ? 'normal' : 'italic' }}>
                          {c.note || 'Sin nota'}
                        </span>
                      </td>
                      <td className="cell-date" style={{ color: '#C9A84C' }}>{c.period}</td>
                      <td className="cell-amount negative">
                        -{formatCurrency(c.amount)}
                      </td>
                      <td className="action-cell">
                        <button className="obsidian-icon-btn" onClick={() => startEdit(c)} title="Editar"><Pencil size={14} /></button>
                        <button className="obsidian-icon-btn danger" onClick={() => onDeleteWithdrawal(c.id)} title="Eliminar"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL (Reutilizando los estilos base, pero simplificado) ── */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#121420', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, width: '100%', maxWidth: 480, overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 600, color: '#E2E2EB' }}>
                <Banknote size={18} color="#C9A84C" /> Registrar Retiro
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#717182', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, color: '#888899', fontWeight: 600 }}>Monto (RD$)</label>
                  <input
                    type="number" step="0.01" min="0.01"
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', color: '#fff', fontSize: 14 }}
                    value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                    autoFocus required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, color: '#888899', fontWeight: 600 }}>Destino</label>
                  <select
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', color: '#fff', fontSize: 14 }}
                    value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value as CashReason }))}
                  >
                    {Object.entries(REASON_MAP).map(([k, v]) => (
                      <option key={k} value={k}>{v.emoji} {v.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {advice && (
                <div style={{
                  padding: '12px 16px', borderRadius: 10, fontSize: 12,
                  background: advice.level === 'danger' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                  border: `1px solid ${advice.level === 'danger' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
                  color: advice.level === 'danger' ? '#F87171' : '#FBBF24',
                }}>
                  {advice.message}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, color: '#888899', fontWeight: 600 }}>Nota u origen (Opcional)</label>
                <input
                  style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', color: '#fff', fontSize: 14 }}
                  placeholder="Ej: Cajero Bravo"
                  value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, color: '#888899', fontWeight: 600 }}>
                  <Calendar size={12} style={{ marginRight: 4, display: 'inline-block', verticalAlign: 'middle' }} color="#C9A84C" />
                  Fecha
                </label>
                <input
                  type="date"
                  style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', color: '#fff', fontSize: 14 }}
                  value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '10px 20px', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" style={{ background: '#C9A84C', border: 'none', color: '#121420', padding: '10px 20px', borderRadius: 10, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={16} /> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
