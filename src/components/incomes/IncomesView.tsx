import { useState, useEffect } from 'react'
import { Wallet, Briefcase, TrendingUp, Plus, Trash2, Pencil, X, Calendar, Search } from 'lucide-react'
import type { Income, IncomeType } from '../../types/finance'
import { formatCurrency } from '../../utils/formatters'
import { formatPeriodLabel } from '../../utils/calendar'
import './IncomesView.css'
// IncomesView reuses the data-grid styles from ExpensesView for consistency
import '../expenses/ExpensesView.css'

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
  const getPeriod = (inc: Income) => inc.period ?? inc.date?.slice(0, 7) ?? currentPeriod

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

  // Escuchar tecla Escape para cerrar modal
  useEffect(() => {
    if (!isModalOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen])

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
    <div className="incomes-obsidian-root fade-in">
      {/* ── CABECERA INSTITUCIONAL ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 11, color: '#34D399', fontWeight: 700, letterSpacing: '0.15em', marginBottom: 4 }}>GESTIÓN DE CAPITAL</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em', margin: 0 }}>Entradas & Salarios</h1>
        </div>
        <div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#34D399', color: '#042F2E',
              padding: '10px 20px', borderRadius: 10,
              fontWeight: 600, fontSize: 13, border: 'none',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <Plus size={16} />
            <span>Registrar Ingreso</span>
          </button>
        </div>
      </div>

      {/* ── METRIC STRIP ── */}
      <div className="incomes-obsidian-kpi-row">
        <div className="incomes-obsidian-kpi-card" style={{ borderTop: '2px solid #34D399' }}>
          <div className="incomes-obsidian-kpi-header">
            <span className="incomes-obsidian-kpi-label">Total del Período</span>
            <Wallet size={16} color="#34D399" />
          </div>
          <div className="incomes-obsidian-kpi-val" style={{ color: '#34D399' }}>{formatCurrency(totalIncome)}</div>
          <div style={{ fontSize: 12, color: '#717182' }}>{periodIncomes.length} ingresos en {currentPeriod}</div>
        </div>

        <div className="incomes-obsidian-kpi-card">
          <div className="incomes-obsidian-kpi-header">
            <span className="incomes-obsidian-kpi-label">Ingresos Fijos</span>
            <Briefcase size={16} color="#C9A84C" />
          </div>
          <div className="incomes-obsidian-kpi-val">{formatCurrency(salary)}</div>
          <div style={{ fontSize: 12, color: '#717182' }}>Salario principal y nómina</div>
        </div>

        <div className="incomes-obsidian-kpi-card">
          <div className="incomes-obsidian-kpi-header">
            <span className="incomes-obsidian-kpi-label">Ingresos Variables</span>
            <TrendingUp size={16} color="#60A5FA" />
          </div>
          <div className="incomes-obsidian-kpi-val">{formatCurrency(extra)}</div>
          <div style={{ fontSize: 12, color: '#717182' }}>Honorarios, Freelance & Extra</div>
        </div>
      </div>

      {/* ── HIGH DENSITY DATA GRID ── */}
      <div className="obsidian-data-grid-container">
        <div className="obsidian-data-grid-header">
          <div className="obsidian-data-grid-title">
            {showAllPeriods ? 'Registro Histórico Completo' : `Entradas de ${formatPeriodLabel(currentPeriod)}`}
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

        {displayedIncomes.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#717182' }}>
            <Search size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
            <div style={{ fontSize: 14, fontWeight: 500 }}>No hay ingresos en este período</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Registra un ingreso usando el botón verde superior.</div>
          </div>
        ) : (
          <div className="obsidian-table-wrapper">
            <table className="obsidian-table">
              <thead>
                <tr>
                  <th>FECHA</th>
                  <th>TIPO</th>
                  <th>CONCEPTO</th>
                  <th>PERÍODO</th>
                  <th style={{ textAlign: 'right' }}>MONTO</th>
                  <th style={{ textAlign: 'right', width: 100 }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {displayedIncomes.map(inc => {
                  const t = TYPE_MAP[inc.type]

                  if (editingId === inc.id) {
                    return (
                      <tr key={inc.id}>
                        <td className="cell-date">{inc.date}</td>
                        <td>
                          <select
                            style={{ background: '#121420', color: '#fff', border: '1px solid #333', padding: '6px 12px', borderRadius: 6, fontSize: 12 }}
                            value={editForm.type}
                            onChange={e => setEditForm(p => ({ ...p, type: e.target.value as IncomeType }))}
                          >
                            <option value="salary">Salario</option>
                            <option value="freelance">Freelance</option>
                            <option value="investment">Inversión</option>
                            <option value="extra">Extra</option>
                          </select>
                        </td>
                        <td>
                          <input
                            style={{ background: '#121420', color: '#fff', border: '1px solid #333', padding: '6px 12px', borderRadius: 6, fontSize: 12, width: '100%' }}
                            value={editForm.description}
                            onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                          />
                        </td>
                        <td className="cell-date" style={{ color: '#34D399' }}>{inc.period}</td>
                        <td style={{ textAlign: 'right' }}>
                          <input
                            type="number"
                            style={{ background: '#121420', color: '#fff', border: '1px solid #333', padding: '6px 12px', borderRadius: 6, fontSize: 12, width: 90, textAlign: 'right' }}
                            value={editForm.amount}
                            onChange={e => setEditForm(p => ({ ...p, amount: e.target.value }))}
                          />
                        </td>
                        <td className="action-cell">
                          <button className="obsidian-icon-btn" style={{ color: '#34D399' }} onClick={() => saveEdit(inc)}>✓</button>
                          <button className="obsidian-icon-btn" onClick={cancelEdit}>✕</button>
                        </td>
                      </tr>
                    )
                  }

                  return (
                    <tr key={inc.id}>
                      <td className="cell-date">{inc.date}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 14 }}>{t.emoji}</span>
                          <span style={{ fontWeight: 500, color: '#E2E2EB' }}>{t.label}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ color: '#C0C0D0', fontWeight: 500 }}>
                          {inc.description}
                        </span>
                      </td>
                      <td className="cell-date" style={{ color: '#34D399' }}>{inc.period}</td>
                      <td className="cell-amount positive">
                        +{formatCurrency(inc.amount)}
                      </td>
                      <td className="action-cell">
                        <button className="obsidian-icon-btn" onClick={() => startEdit(inc)} title="Editar"><Pencil size={14} /></button>
                        <button className="obsidian-icon-btn danger" onClick={() => onDeleteIncome(inc.id)} title="Eliminar"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL PARA REGISTRAR INGRESO ── */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#121420', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, width: '100%', maxWidth: 480, overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 600, color: '#E2E2EB' }}>
                <Plus size={18} color="#34D399" /> Registrar Entrada de Capital
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#717182', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, color: '#888899', fontWeight: 600 }}>Descripción / Concepto</label>
                <input
                  style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', color: '#fff', fontSize: 14 }}
                  placeholder="Ej: Salario mensual, Dividendo..."
                  value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  autoFocus required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, color: '#888899', fontWeight: 600 }}>Monto (RD$)</label>
                  <input
                    type="number" step="0.01" min="0.01"
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', color: '#fff', fontSize: 14 }}
                    value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, color: '#888899', fontWeight: 600 }}>Tipo de Ingreso</label>
                  <select
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', color: '#fff', fontSize: 14 }}
                    value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as IncomeType }))}
                  >
                    <option value="salary">Sueldo / Fijo</option>
                    <option value="freelance">Freelance</option>
                    <option value="investment">Inversión</option>
                    <option value="extra">Extra / Ocasional</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, color: '#888899', fontWeight: 600 }}>
                  <Calendar size={12} style={{ marginRight: 4, display: 'inline-block', verticalAlign: 'middle' }} color="#34D399" />
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
                <button type="submit" style={{ background: '#34D399', border: 'none', color: '#042F2E', padding: '10px 20px', borderRadius: 10, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
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
