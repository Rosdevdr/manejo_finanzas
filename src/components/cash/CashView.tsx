import { useState } from 'react'
import { Banknote, AlertTriangle, Plus, Trash2, Pencil } from 'lucide-react'
import type { CashWithdrawal, CashReason, Expense } from '../../types/finance'
import { formatCurrency } from '../../utils/formatters'
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

  const [showAllPeriods, setShowAllPeriods] = useState<boolean>(() => pCash.length === 0 && withdrawals.length > 0)
  const displayedCash = (showAllPeriods || (pCash.length === 0 && withdrawals.length > 0))
    ? [...withdrawals].sort((a, b) => b.date.localeCompare(a.date))
    : pCash

  const [form, setForm] = useState({
    amount: '', reason: 'pocket_money' as CashReason,
    note: '', date: new Date().toISOString().slice(0, 10),
  })

  // Live advisor advice
  const parsedAmount = parseFloat(form.amount) || 0
  const advice = parsedAmount > 0 ? evaluateCashWithdrawal(parsedAmount, form.reason, availableBalance) : null

  // Inline edit state
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
    <div className="fade-in">
      <div className="page-header">
        <div className="breadcrumb">AUREUS · <span className="breadcrumb-accent">Efectivo</span></div>
        <h1 className="page-title">Control de Efectivo</h1>
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="kpi-card amber">
          <div className="kpi-top"><span className="kpi-label">Total Retirado</span><Banknote size={14} className="kpi-icon" /></div>
          <div className="kpi-value">{formatCurrency(totalCash)}</div>
          <div className="kpi-sub">{pCash.length} retiro{pCash.length !== 1 ? 's' : ''}</div>
        </div>
        <div className={`kpi-card ${cashPct > 25 ? 'red' : cashPct > 15 ? 'amber' : 'emerald'}`}>
          <div className="kpi-top"><span className="kpi-label">% sobre Gastos</span><AlertTriangle size={14} className="kpi-icon" /></div>
          <div className="kpi-value">{cashPct.toFixed(1)}%</div>
          <div className="kpi-sub">{cashPct > 25 ? 'Alto — revisar hábito' : cashPct > 15 ? 'Moderado' : 'Nivel óptimo'}</div>
        </div>
        <div className={`kpi-card ${hasRisk ? 'red' : 'emerald'}`}>
          <div className="kpi-top"><span className="kpi-label">Alerta de Riesgo</span><AlertTriangle size={14} className="kpi-icon" /></div>
          <div className="kpi-value" style={{ fontSize: 18 }}>{hasRisk ? '⚠️ Detectada' : '✓ Sin riesgo'}</div>
          <div className="kpi-sub">{hasRisk ? 'Retiros sin destino o excesivos' : 'Uso responsable del efectivo'}</div>
        </div>
      </div>

      {/* Add form */}
      <div className="section-header" style={{ marginTop: 4 }}>
        <div className="section-label">REGISTRAR</div>
        <div className="section-title">Nuevo retiro de efectivo</div>
      </div>
      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div style={{ gridColumn: 'span 4' }}>
            <label className="field-label">Monto a Retirar (RD$)</label>
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
          <div style={{ gridColumn: 'span 4' }}>
            <label className="field-label">Motivo del Retiro</label>
            <select
              className="field-select"
              value={form.reason}
              onChange={e => setForm(p => ({ ...p, reason: e.target.value as CashReason }))}
            >
              {Object.entries(REASON_MAP).map(([k, v]) => (
                <option key={k} value={k}>{v.emoji} {v.label}</option>
              ))}
            </select>
          </div>
          <div style={{ gridColumn: 'span 4' }}>
            <label className="field-label">Fecha del Retiro</label>
            <input
              type="date"
              className="field-input"
              value={form.date}
              onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
              required
            />
          </div>
          <div style={{ gridColumn: 'span 12' }}>
            <label className="field-label">Nota o Ubicación (Opcional)</label>
            <input
              className="field-input"
              placeholder="Ej: Cajero Banreservas Plaza Central, pago directo plomero..."
              value={form.note}
              onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
            />
          </div>
        </div>

        {/* Live Advisor Advice Card */}
        {advice && (
          <div className={`alert-pill ${advice.level === 'danger' ? 'danger' : ''}`} style={{
            marginTop: 4,
            marginBottom: 14,
            background: advice.level === 'danger' ? 'rgba(248,113,113,0.1)' : advice.level === 'warning' ? 'rgba(251,191,36,0.1)' : 'rgba(52,211,153,0.1)',
            borderColor: advice.level === 'danger' ? 'rgba(248,113,113,0.3)' : advice.level === 'warning' ? 'rgba(251,191,36,0.3)' : 'rgba(52,211,153,0.3)',
            borderRadius: 10,
            padding: '12px 14px'
          }}>
            <span className="alert-icon" style={{ fontSize: 16 }}>
              {advice.level === 'danger' ? '🚨' : advice.level === 'warning' ? '⚠️' : '💡'}
            </span>
            <div className="alert-text">
              <strong style={{ color: advice.level === 'danger' ? '#F87171' : advice.level === 'warning' ? '#FBBF24' : '#34D399' }}>
                {advice.title}
              </strong>
              <p style={{ margin: '3px 0', fontSize: 11, color: '#D0D0DC' }}>{advice.message}</p>
              <p style={{ fontSize: 11, color: '#888898' }}>{advice.recommendation}</p>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="btn-primary btn-cash">
            <Plus size={16} />
            <span>Registrar Retiro</span>
          </button>
        </div>
      </form>

      {/* List */}
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div className="section-label">HISTORIAL</div>
          <div className="section-title">
            {showAllPeriods ? 'Todos los retiros registrados' : `Retiros de ${currentPeriod}`} ({displayedCash.length})
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            onClick={() => setShowAllPeriods(false)}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              background: !showAllPeriods ? 'rgba(243, 202, 101, 0.18)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${!showAllPeriods ? '#F3CA65' : 'rgba(255, 255, 255, 0.1)'}`,
              color: !showAllPeriods ? '#F3CA65' : '#9CA3AF',
            }}
          >
            {currentPeriod} ({pCash.length})
          </button>
          <button
            type="button"
            onClick={() => setShowAllPeriods(true)}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              background: showAllPeriods ? 'rgba(243, 202, 101, 0.18)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${showAllPeriods ? '#F3CA65' : 'rgba(255, 255, 255, 0.1)'}`,
              color: showAllPeriods ? '#F3CA65' : '#9CA3AF',
            }}
          >
            Ver Todo el Historial ({withdrawals.length})
          </button>
        </div>
      </div>

      <div className="tx-list">
        <div className="tx-header">
          <span className="tx-title">Retiros en Efectivo</span>
          <span className="tx-count">{displayedCash.length} registro{displayedCash.length !== 1 ? 's' : ''}</span>
        </div>
        {displayedCash.length === 0 ? (
          <div className="empty-state">
            <p className="empty-text">Sin retiros registrados para este período</p>
            {withdrawals.length > 0 && !showAllPeriods && (
              <button
                type="button"
                onClick={() => setShowAllPeriods(true)}
                className="btn btn-secondary"
                style={{ marginTop: 10, fontSize: 11.5, color: '#F3CA65' }}
              >
                Ver {withdrawals.length} retiro{withdrawals.length !== 1 ? 's' : ''} de otros meses
              </button>
            )}
          </div>
        ) : displayedCash.map(c => {
          const r = REASON_MAP[c.reason]

          if (editingId === c.id) {
            return (
              <div key={c.id} className="tx-edit-row">
                <input type="number" className="edit-input" style={{ maxWidth: 130 }} value={editAmount}
                  onChange={e => setEditAmount(e.target.value)} />
                <select className="edit-select" value={editReason}
                  onChange={e => setEditReason(e.target.value as CashReason)}>
                  {Object.entries(REASON_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <input className="edit-input" placeholder="Nota…" value={editNote}
                  onChange={e => setEditNote(e.target.value)} />
                <div className="edit-actions">
                  <button className="edit-save-btn" onClick={() => saveEdit(c)}>✓ Guardar</button>
                  <button className="edit-cancel-btn" onClick={() => setEditingId(null)}>Cancelar</button>
                </div>
              </div>
            )
          }

          return (
            <div key={c.id} className="tx-row">
              <div className="tx-icon" style={{ background: 'rgba(251,191,36,0.1)', fontSize: 18 }}>{r.emoji}</div>
              <div className="tx-body">
                <div className="tx-name">{c.note || r.label}</div>
                <div className="tx-meta">
                  <span className={`tx-badge ${r.badge}`}>{r.label}</span>
                  {c.reason === 'unassigned' && (
                    <span className="tx-badge" style={{ background: 'rgba(248,113,113,0.15)', color: '#F87171' }}>⚠ Riesgo</span>
                  )}
                  <span className="tx-date">{c.date}</span>
                  {showAllPeriods && (
                    <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: 4, color: '#F3CA65', fontFamily: 'Space Mono' }}>
                      {c.period}
                    </span>
                  )}
                </div>
              </div>
              <div className="tx-right">
                <div className="tx-amount amount-amber">-{formatCurrency(c.amount)}</div>
                <div className="tx-method">Efectivo</div>
              </div>
              <div className="tx-actions">
                <button className="tx-action-btn" onClick={() => startEdit(c)} title="Editar"><Pencil size={11} /></button>
                <button className="tx-action-btn danger" onClick={() => onDeleteWithdrawal(c.id)} title="Eliminar"><Trash2 size={11} /></button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
