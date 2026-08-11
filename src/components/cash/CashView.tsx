import { useState } from 'react'
import { Banknote, AlertTriangle, Plus, Trash2, Pencil } from 'lucide-react'
import type { CashWithdrawal, CashReason, Expense } from '../../types/finance'
import { formatCurrency } from '../../utils/formatters'

interface CashViewProps {
  currentPeriod:    string
  withdrawals:      CashWithdrawal[]
  expenses:         Expense[]
  availableBalance: number
  onAddWithdrawal:    (d: Omit<CashWithdrawal, 'id'>) => void
  onDeleteWithdrawal: (id: string) => void
}

const REASON_MAP: Record<CashReason, { label: string; emoji: string; badge: string }> = {
  pocket_money:     { label: 'Bolsillo',       emoji: '👛', badge: 'badge-bolsillo' },
  specific_service: { label: 'Servicio',        emoji: '🔧', badge: 'badge-servicios' },
  leisure_nightout: { label: 'Ocio / Salida',   emoji: '🎉', badge: 'badge-ocio'     },
  emergency:        { label: 'Emergencia',       emoji: '🚨', badge: 'badge-salud'    },
  unassigned:       { label: 'Sin destino',      emoji: '❓', badge: 'badge-fijo'     },
}

export function CashView({ currentPeriod, withdrawals, expenses, onAddWithdrawal, onDeleteWithdrawal }: CashViewProps) {
  const pCash    = withdrawals.filter(c => c.period === currentPeriod)
  const totalCash = pCash.reduce((s, c) => s + c.amount, 0)
  const pExp     = expenses.filter(e => e.period === currentPeriod)
  const totalExp = pExp.reduce((s, e) => s + e.amount, 0)
  const cashPct  = totalExp > 0 ? (totalCash / totalExp) * 100 : 0
  const hasRisk  = pCash.some(c => c.reason === 'unassigned') || cashPct > 25

  const [form, setForm] = useState({
    amount: '', reason: 'pocket_money' as CashReason,
    note: '', date: new Date().toISOString().slice(0, 10),
  })

  // No inline edit for cash (note + reason is sufficient via delete/re-add)
  // but add pencil icon for note edit
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNote,  setEditNote]  = useState('')
  const [editReason, setEditReason] = useState<CashReason>('pocket_money')
  const [editAmount, setEditAmount] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.amount) return
    onAddWithdrawal({ ...form, amount: parseFloat(form.amount), period: currentPeriod })
    setForm({ amount: '', reason: 'pocket_money', note: '', date: new Date().toISOString().slice(0, 10) })
  }

  function startEdit(c: CashWithdrawal) {
    setEditingId(c.id)
    setEditNote(c.note ?? '')
    setEditReason(c.reason)
    setEditAmount(String(c.amount))
  }

  // Cash edit: delete old + add new (since no updateWithdrawal in props, simulate via delete+add)
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
        <div className="form-row">
          <div className="form-field" style={{ maxWidth: 180 }}>
            <label className="field-label">Monto (RD$)</label>
            <input type="number" className="field-input" placeholder="0.00" min={0} step="0.01" value={form.amount}
              onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
          </div>
          <div className="form-field">
            <label className="field-label">Motivo</label>
            <select className="field-select" value={form.reason}
              onChange={e => setForm(p => ({ ...p, reason: e.target.value as CashReason }))}>
              {Object.entries(REASON_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="field-label">Fecha</label>
            <input type="date" className="field-input" value={form.date}
              onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
          </div>
        </div>
        <div className="form-row" style={{ alignItems: 'flex-end' }}>
          <div className="form-field">
            <label className="field-label">Nota (opcional)</label>
            <input className="field-input" placeholder="Ej: Cajero Plaza Central…" value={form.note}
              onChange={e => setForm(p => ({ ...p, note: e.target.value }))} />
          </div>
          <div className="form-field" style={{ flexShrink: 0, flexGrow: 0 }}>
            <button type="submit" className="btn-primary"><Plus size={14} /> Registrar</button>
          </div>
        </div>
      </form>

      {/* List */}
      <div className="section-header">
        <div className="section-label">HISTORIAL</div>
        <div className="section-title">Retiros del período</div>
      </div>
      <div className="tx-list">
        <div className="tx-header">
          <span className="tx-title">Retiros en Efectivo</span>
          <span className="tx-count">{pCash.length} registro{pCash.length !== 1 ? 's' : ''}</span>
        </div>
        {pCash.length === 0 ? (
          <div className="empty-state"><p className="empty-text">Sin retiros registrados para este período</p></div>
        ) : pCash.map(c => {
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
