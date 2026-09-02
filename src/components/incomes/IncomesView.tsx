import { useState, useEffect } from 'react'
import { Wallet, Briefcase, TrendingUp, Plus, Trash2, Pencil } from 'lucide-react'
import type { Income, IncomeType } from '../../types/finance'
import { formatCurrency } from '../../utils/formatters'

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

  // Add form state
  const [form, setForm] = useState({
    description: '', amount: '', type: 'salary' as IncomeType,
    date: new Date().toISOString().slice(0, 10),
  })

  // Inline edit state
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

  const [showAllPeriods, setShowAllPeriods] = useState(false)

  // Auto-switch to full history when Supabase loads data asynchronously:
  // useState lazy initializer only runs on mount (before async data arrives),
  // so we need a useEffect that reacts when data actually loads.
  useEffect(() => {
    if (periodIncomes.length === 0 && incomes.length > 0) {
      setShowAllPeriods(true)
    } else if (periodIncomes.length > 0) {
      setShowAllPeriods(false)
    }
  }, [incomes.length, currentPeriod, periodIncomes.length])

  const displayedIncomes = (showAllPeriods || (periodIncomes.length === 0 && incomes.length > 0))
    ? [...incomes].sort((a, b) => b.date.localeCompare(a.date))
    : periodIncomes

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="breadcrumb">AUREUS · <span className="breadcrumb-accent">Ingresos</span></div>
        <h1 className="page-title">Gestión de Ingresos</h1>
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="kpi-card emerald">
          <div className="kpi-top"><span className="kpi-label">Total del Período</span><Wallet size={14} className="kpi-icon" /></div>
          <div className="kpi-value">{formatCurrency(totalIncome)}</div>
          <div className="kpi-sub">{periodIncomes.length} registro{periodIncomes.length !== 1 ? 's' : ''} en {currentPeriod}</div>
        </div>
        <div className="kpi-card gold">
          <div className="kpi-top"><span className="kpi-label">Ingresos Fijos</span><Briefcase size={14} className="kpi-icon" /></div>
          <div className="kpi-value">{formatCurrency(salary)}</div>
          <div className="kpi-sub">Salarios</div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-top"><span className="kpi-label">Ingresos Variables</span><TrendingUp size={14} className="kpi-icon" /></div>
          <div className="kpi-value">{formatCurrency(extra)}</div>
          <div className="kpi-sub">Freelance + Inversión</div>
        </div>
      </div>

      {/* Add form */}
      <div className="section-header" style={{ marginTop: 4 }}>
        <div className="section-label">REGISTRAR</div>
        <div className="section-title">Nueva entrada de capital</div>
      </div>
      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div style={{ gridColumn: 'span 8' }}>
            <label className="field-label">Descripción / Concepto</label>
            <input
              className="field-input"
              placeholder="Ej: Sueldo mensual, Proyecto Web..."
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
          <div style={{ gridColumn: 'span 6' }}>
            <label className="field-label">Tipo de Ingreso</label>
            <select
              className="field-select"
              value={form.type}
              onChange={e => setForm(p => ({ ...p, type: e.target.value as IncomeType }))}
            >
              <option value="salary">Sueldo / Salario Fijo</option>
              <option value="freelance">Freelance / Honorarios</option>
              <option value="investment">Inversiones / Dividendos</option>
              <option value="extra">Extra / Ocasional</option>
            </select>
          </div>
          <div style={{ gridColumn: 'span 6' }}>
            <label className="field-label">Fecha de Entrada</label>
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
          <button type="submit" className="btn-primary btn-income">
            <Plus size={16} />
            <span>Registrar Ingreso</span>
          </button>
        </div>
      </form>

      {/* List */}
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div className="section-label">HISTORIAL</div>
          <div className="section-title">
            {showAllPeriods ? 'Todos los ingresos registrados' : `Ingresos de ${currentPeriod}`} ({displayedIncomes.length})
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
            {currentPeriod} ({periodIncomes.length})
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
            Ver Todo el Historial ({incomes.length})
          </button>
        </div>
      </div>

      <div className="tx-list">
        <div className="tx-header">
          <span className="tx-title">Entradas de Capital</span>
          <span className="tx-count">{displayedIncomes.length} registro{displayedIncomes.length !== 1 ? 's' : ''}</span>
        </div>
        {displayedIncomes.length === 0 ? (
          <div className="empty-state">
            <p className="empty-text">Sin ingresos registrados para este período</p>
            {incomes.length > 0 && !showAllPeriods && (
              <button
                type="button"
                onClick={() => setShowAllPeriods(true)}
                className="btn btn-secondary"
                style={{ marginTop: 10, fontSize: 11.5, color: '#F3CA65' }}
              >
                Ver {incomes.length} ingreso{incomes.length !== 1 ? 's' : ''} de otros meses
              </button>
            )}
          </div>
        ) : displayedIncomes.map(inc => {
          const t = TYPE_MAP[inc.type]

          if (editingId === inc.id) {
            return (
              <div key={inc.id} className="tx-edit-row">
                <input className="edit-input" style={{ minWidth: 200 }} value={editForm.description}
                  onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
                <input type="number" className="edit-input" style={{ maxWidth: 130 }} value={editForm.amount}
                  onChange={e => setEditForm(p => ({ ...p, amount: e.target.value }))} />
                <select className="edit-select" value={editForm.type}
                  onChange={e => setEditForm(p => ({ ...p, type: e.target.value as IncomeType }))}>
                  <option value="salary">Salario</option>
                  <option value="freelance">Freelance</option>
                  <option value="investment">Inversión</option>
                  <option value="extra">Extra</option>
                </select>
                <input type="date" className="edit-input" style={{ maxWidth: 140 }} value={editForm.date}
                  onChange={e => setEditForm(p => ({ ...p, date: e.target.value }))} />
                <div className="edit-actions">
                  <button className="edit-save-btn" onClick={() => saveEdit(inc)}>✓ Guardar</button>
                  <button className="edit-cancel-btn" onClick={cancelEdit}>Cancelar</button>
                </div>
              </div>
            )
          }

          return (
            <div key={inc.id} className="tx-row">
              <div className="tx-icon" style={{ background: 'rgba(52,211,153,0.1)', fontSize: 18 }}>{t.emoji}</div>
              <div className="tx-body">
                <div className="tx-name">{inc.description}</div>
                <div className="tx-meta">
                  <span className={`tx-badge ${t.badge}`}>{t.label}</span>
                  <span className="tx-date">{inc.date}</span>
                  {showAllPeriods && (
                    <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: 4, color: '#F3CA65', fontFamily: 'Space Mono' }}>
                      {inc.period}
                    </span>
                  )}
                </div>
              </div>
              <div className="tx-right">
                <div className="tx-amount amount-green">+{formatCurrency(inc.amount)}</div>
              </div>
              <div className="tx-actions">
                <button className="tx-action-btn" onClick={() => startEdit(inc)} title="Editar"><Pencil size={11} /></button>
                <button className="tx-action-btn danger" onClick={() => onDeleteIncome(inc.id)} title="Eliminar"><Trash2 size={11} /></button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
