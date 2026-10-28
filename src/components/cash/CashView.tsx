import { useState, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  Banknote,
  AlertTriangle,
  Plus,
  Trash2,
  Pencil,
  X,
  Calendar,
  Search,
  Wallet,
  Wrench,
  Sparkles,
  ShieldAlert,
  HelpCircle,
  ShieldCheck,
  Check,
} from 'lucide-react'
import type { CashWithdrawal, CashReason, Expense } from '../../types/finance'
import { formatCurrency } from '../../utils/formatters'
import { formatPeriodLabel } from '../../utils/calendar'
import { evaluateCashWithdrawal } from '../../utils/cashAdvisor'
import { CustomIconSelect, type CustomSelectOption } from '../ui/CustomIconSelect'
import './CashView.css'

interface CashViewProps {
  currentPeriod:       string
  withdrawals:         CashWithdrawal[]
  expenses:            Expense[]
  availableBalance:    number
  onAddWithdrawal:     (d: Omit<CashWithdrawal, 'id'>) => void
  onDeleteWithdrawal:  (id: string) => void
}

const REASON_MAP: Record<CashReason, { label: string; subtitle: string; icon: ReactNode; color: string; badge: string }> = {
  pocket_money:     { label: 'Bolsillo / Menudeo',  subtitle: 'Gastos menores diarios',        icon: <Wallet size={15} />,      color: '#C9A84C', badge: 'badge-bolsillo' },
  specific_service: { label: 'Servicio Específico', subtitle: 'Pago técnico o servicio puntual', icon: <Wrench size={15} />,    color: '#38BDF8', badge: 'badge-servicios' },
  leisure_nightout: { label: 'Ocio / Salida',       subtitle: 'Recreación, eventos y salidas', icon: <Sparkles size={15} />,    color: '#A78BFA', badge: 'badge-ocio' },
  emergency:        { label: 'Emergencia',          subtitle: 'Imprevisto urgente',            icon: <ShieldAlert size={15} />, color: '#F87171', badge: 'badge-salud' },
  unassigned:       { label: 'Sin Destino Claro',   subtitle: 'Retiro pendiente de clasificar', icon: <HelpCircle size={15} />, color: '#94A3B8', badge: 'badge-fijo' },
}

const CASH_REASON_OPTIONS: CustomSelectOption<CashReason>[] = (
  Object.entries(REASON_MAP) as [CashReason, (typeof REASON_MAP)[CashReason]][]
).map(([value, meta]) => ({
  value,
  label: meta.label,
  subtitle: meta.subtitle,
  icon: meta.icon,
  accentColor: meta.color,
}))

export function CashView({
  currentPeriod,
  withdrawals,
  expenses,
  availableBalance,
  onAddWithdrawal,
  onDeleteWithdrawal,
}: CashViewProps) {
  const getPeriod = (c: { period?: string; date?: string }) =>
    c.period && c.period.trim().length === 7 ? c.period.trim() : (c.date ? c.date.slice(0, 7) : currentPeriod)

  const pCash     = withdrawals.filter(c => getPeriod(c) === currentPeriod)
  const totalCash = pCash.reduce((s, c) => s + c.amount, 0)
  const pExp      = expenses.filter(e => getPeriod(e) === currentPeriod)
  const totalExp  = pExp.reduce((s, e) => s + e.amount, 0)
  const cashPct   = totalExp > 0 ? (totalCash / totalExp) * 100 : 0
  const hasRisk   = pCash.some(c => c.reason === 'unassigned') || cashPct > 25

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [balanceError, setBalanceError] = useState<string | null>(null)
  const [form, setForm] = useState({
    amount: '',
    reason: 'pocket_money' as CashReason,
    note: '',
    date: new Date().toISOString().slice(0, 10),
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
  const safeAvailable = Math.max(0, availableBalance)
  const isOverdraftDraft = parsedAmount > 0 && parsedAmount > safeAvailable
  const advice = parsedAmount > 0 ? evaluateCashWithdrawal(parsedAmount, form.reason, availableBalance) : null

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNote, setEditNote] = useState('')
  const [editReason, setEditReason] = useState<CashReason>('pocket_money')
  const [editAmount, setEditAmount] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBalanceError(null)
    if (!form.amount || parsedAmount <= 0) return

    if (parsedAmount > safeAvailable) {
      setBalanceError(
        `Saldo insuficiente: dispones de ${formatCurrency(safeAvailable)} y no puedes retirar ${formatCurrency(parsedAmount)} porque llevaría tu saldo a negativo.`
      )
      return
    }

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
    const nextAmt = parseFloat(editAmount)
    if (!nextAmt || nextAmt <= 0) return
    const maxForEdit = Math.max(0, availableBalance + c.amount)
    if (nextAmt > maxForEdit) return
    onDeleteWithdrawal(c.id)
    onAddWithdrawal({ amount: nextAmt, reason: editReason, note: editNote, date: c.date, period: c.period })
    setEditingId(null)
  }

  return (
    <div className="cash-obsidian-root">
      {/* ── CABECERA INSTITUCIONAL ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--gold-primary)', fontWeight: 700, letterSpacing: '0.15em', marginBottom: 4 }}>LIQUIDEZ EN EFECTIVO</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>Control de Efectivo</h1>
        </div>
        <div>
          <button
            type="button"
            onClick={() => {
              setBalanceError(null)
              setIsModalOpen(true)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--gold-primary)',
              color: '#08080C',
              padding: '10px 20px',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 13,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: 'var(--shadow-gold)',
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
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{pCash.length} retiros en {currentPeriod}</div>
        </div>

        <div className="cash-obsidian-kpi-card">
          <div className="cash-obsidian-kpi-header">
            <span className="cash-obsidian-kpi-label">Intensidad Efectivo</span>
            <span style={{
              background: cashPct > 25 ? 'rgba(248, 113, 113, 0.1)' : 'rgba(52, 211, 153, 0.1)',
              color: cashPct > 25 ? '#F87171' : '#34D399',
              padding: '2px 8px',
              borderRadius: 12,
              fontSize: 10,
              fontWeight: 700,
            }}>
              {cashPct.toFixed(1)}% / EGRESOS
            </span>
          </div>
          <div className="cash-obsidian-kpi-val" style={{ color: cashPct > 25 ? '#F87171' : '#F3CA65' }}>{cashPct.toFixed(1)}%</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
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
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {hasRisk ? 'Se detectaron retiros sin destino' : 'Trazabilidad impecable'}
          </div>
        </div>
      </div>

      {/* ── HIGH DENSITY DATA GRID ── */}
      <div className="obsidian-data-grid-container" style={{ overflow: 'visible' }}>
        <div className="obsidian-data-grid-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div className="obsidian-data-grid-title">
            {showAllPeriods ? 'Registro Histórico de Efectivo' : `Movimientos de ${formatPeriodLabel(currentPeriod)}`}
          </div>
          <div className="obsidian-period-filter-switch">
            <button
              type="button"
              className={`obsidian-period-filter-btn ${!showAllPeriods ? 'active' : ''}`}
              onClick={() => setShowAllPeriods(false)}
            >
              Mes Actual
            </button>
            <button
              type="button"
              className={`obsidian-period-filter-btn ${showAllPeriods ? 'active' : ''}`}
              onClick={() => setShowAllPeriods(true)}
            >
              Historial
            </button>
          </div>
        </div>

        {displayedCash.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Search size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
            <div style={{ fontSize: 14, fontWeight: 500 }}>No hay movimientos en este período</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Registra un retiro usando el botón superior dorado.</div>
          </div>
        ) : (
          <div className="obsidian-table-wrapper" style={{ overflow: 'visible' }}>
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
                      <tr key={c.id} style={{ background: 'rgba(201,168,76,0.06)' }}>
                        <td className="cell-date">{c.date}</td>
                        <td style={{ minWidth: 210 }}>
                          <CustomIconSelect
                            options={CASH_REASON_OPTIONS}
                            value={editReason}
                            onChange={val => setEditReason(val)}
                            compact
                            ariaLabel="Destino del retiro"
                          />
                        </td>
                        <td>
                          <input
                            className="aureus-adaptive-input compact"
                            style={{ width: '100%' }}
                            value={editNote}
                            onChange={e => setEditNote(e.target.value)}
                          />
                        </td>
                        <td className="cell-date" style={{ color: 'var(--gold-primary)' }}>{c.period}</td>
                        <td style={{ textAlign: 'right' }}>
                          <input
                            type="number"
                            className="aureus-adaptive-input compact"
                            style={{ width: 105, textAlign: 'right' }}
                            value={editAmount}
                            onChange={e => setEditAmount(e.target.value)}
                          />
                        </td>
                        <td className="action-cell">
                          <button className="obsidian-icon-btn" style={{ color: 'var(--emerald-success)' }} onClick={() => saveEdit(c)} title="Guardar">
                            <Check size={15} />
                          </button>
                          <button className="obsidian-icon-btn" onClick={() => setEditingId(null)} title="Cancelar">
                            <X size={15} />
                          </button>
                        </td>
                      </tr>
                    )
                  }

                  return (
                    <tr key={c.id}>
                      <td className="cell-date">{c.date}</td>
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
                              background: `${r.color}18`,
                              border: `1px solid ${r.color}35`,
                              color: r.color,
                              flexShrink: 0,
                            }}
                          >
                            {r.icon}
                          </span>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{r.label}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ color: c.note ? 'var(--text-secondary)' : 'var(--text-muted)', fontStyle: c.note ? 'normal' : 'italic' }}>
                          {c.note || 'Sin nota'}
                        </span>
                      </td>
                      <td className="cell-date" style={{ color: 'var(--gold-primary)' }}>{c.period}</td>
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

      {/* ── MODAL PARA REGISTRAR RETIRO (PORTAL EN DOCUMENT.BODY) ── */}
      {isModalOpen && createPortal(
        <div
          className="aureus-modal-backdrop"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="aureus-modal-card"
            onClick={e => e.stopPropagation()}
          >
            <div className="aureus-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                <Banknote size={18} color="#C9A84C" /> Registrar Retiro de Efectivo
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="aureus-modal-close"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className={`aureus-balance-guard-banner ${isOverdraftDraft || safeAvailable <= 0 ? 'danger' : 'safe'}`}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700 }}>
                    {isOverdraftDraft || safeAvailable <= 0 ? <AlertTriangle size={14} /> : <ShieldCheck size={14} />}
                    Saldo Disponible para Retiro:
                  </span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 13 }}>
                    {formatCurrency(safeAvailable)}
                  </span>
                </div>
                {parsedAmount > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, marginTop: 4, opacity: 0.9 }}>
                    <span>Saldo restante tras el retiro:</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
                      {isOverdraftDraft
                        ? 'Excede tu liquidez disponible'
                        : formatCurrency(Math.max(0, safeAvailable - parsedAmount))}
                    </span>
                  </div>
                )}
              </div>

              {(balanceError || isOverdraftDraft) && (
                <div className="aureus-overdraft-alert">
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <span>
                    {balanceError ||
                      `No puedes retirar ${formatCurrency(parsedAmount)} porque supera tu saldo disponible (${formatCurrency(safeAvailable)}) y llevaría tu cuenta a negativo.`}
                  </span>
                </div>
              )}

              <div className="aureus-modal-grid-2">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label className="aureus-field-label">Monto (RD$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={safeAvailable > 0 ? safeAvailable : undefined}
                    className="aureus-adaptive-input"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={e => {
                      setBalanceError(null)
                      setForm(p => ({ ...p, amount: e.target.value }))
                    }}
                    autoFocus
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label className="aureus-field-label">Destino del Retiro</label>
                  <CustomIconSelect
                    options={CASH_REASON_OPTIONS}
                    value={form.reason}
                    onChange={val => setForm(p => ({ ...p, reason: val }))}
                    ariaLabel="Destino del Retiro"
                  />
                </div>
              </div>

              {advice && !isOverdraftDraft && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: 10,
                  fontSize: 12,
                  background: advice.level === 'danger' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                  border: `1px solid ${advice.level === 'danger' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
                  color: advice.level === 'danger' ? '#F87171' : '#FBBF24',
                }}>
                  {advice.message}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label className="aureus-field-label">Nota u origen (Opcional)</label>
                <input
                  className="aureus-adaptive-input"
                  placeholder="Ej: Cajero Plaza Central, Gastos menores..."
                  value={form.note}
                  onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                />
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
                  disabled={isOverdraftDraft || safeAvailable <= 0}
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
                  <Plus size={16} /> Guardar Retiro
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
