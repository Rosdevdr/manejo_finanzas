import { useState } from 'react'
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
  const periodIncomes = incomes.filter(i => i.period === currentPeriod)
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
    onAddIncome({ ...form, amount: parseFloat(form.amount), period: currentPeriod })
    setForm({ description: '', amount: '', type: 'salary', date: new Date().toISOString().slice(0, 10) })
  }

  function startEdit(inc: Income) {
    setEditingId(inc.id)
    setEditForm({ description: inc.description, amount: String(inc.amount), type: inc.type, date: inc.date })
  }

  function cancelEdit() { setEditingId(null) }

  function saveEdit(inc: Income) {
    onUpdateIncome({ ...inc, description: editForm.description, amount: parseFloat(editForm.amount), type: editForm.type, date: editForm.date })
    setEditingId(null)
  }

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
          <div className="kpi-sub">{periodIncomes.length} registro{periodIncomes.length !== 1 ? 's' : ''}</div>
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
        <div className="form-row">
          <div className="form-field">
            <label className="field-label">Descripción</label>
            <input className="field-input" placeholder="Ej: Sueldo principal…" value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="form-field" style={{ maxWidth: 160 }}>
            <label className="field-label">Monto (RD$)</label>
            <input type="number" className="field-input" placeholder="0.00" min={0} step="0.01" value={form.amount}
              onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-field">
            <label className="field-label">Tipo</label>
            <select className="field-select" value={form.type}
              onChange={e => setForm(p => ({ ...p, type: e.target.value as IncomeType }))}>
              <option value="salary">Salario</option>
              <option value="freelance">Freelance</option>
              <option value="investment">Inversión</option>
              <option value="extra">Extra</option>
            </select>
          </div>
          <div className="form-field">
            <label className="field-label">Fecha</label>
            <input type="date" className="field-input" value={form.date}
              onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
          </div>
          <div className="form-field" style={{ flexShrink: 0, flexGrow: 0, justifyContent: 'flex-end', alignSelf: 'flex-end' }}>
            <button type="submit" className="btn-primary"><Plus size={14} /> Registrar</button>
          </div>
        </div>
      </form>

      {/* List */}
      <div className="section-header">
        <div className="section-label">HISTORIAL</div>
        <div className="section-title">Ingresos registrados</div>
      </div>
      <div className="tx-list">
        <div className="tx-header">
          <span className="tx-title">Entradas de Capital</span>
          <span className="tx-count">{periodIncomes.length} registro{periodIncomes.length !== 1 ? 's' : ''}</span>
        </div>
        {periodIncomes.length === 0 ? (
          <div className="empty-state"><p className="empty-text">Sin ingresos registrados para este período</p></div>
        ) : periodIncomes.map(inc => {
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
