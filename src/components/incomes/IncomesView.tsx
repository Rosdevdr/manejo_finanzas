import { useState, type FormEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  Briefcase,
  Zap,
  Calendar,
  X,
  Laptop,
  Check,
} from 'lucide-react'
import type { Income, IncomeType } from '../../types/finance'
import { formatCurrency } from '../../utils/formatters'
import { sanitizeAmount, sanitizeText } from '../../utils/security'
import { CustomIconSelect, type CustomSelectOption } from '../ui/CustomIconSelect'
import './IncomesView.css'

const TYPE_MAP: Record<IncomeType, { label: string; subtitle: string; icon: ReactNode; color: string }> = {
  salary:     { label: 'Sueldo / Fijo',     subtitle: 'Nómina recurrente',     icon: <Briefcase size={15} />,  color: '#34D399' },
  freelance:  { label: 'Freelance',         subtitle: 'Servicios & proyectos', icon: <Laptop size={15} />,     color: '#38BDF8' },
  investment: { label: 'Inversión',         subtitle: 'Dividendos & rentas',   icon: <TrendingUp size={15} />, color: '#C9A84C' },
  extra:      { label: 'Extra / Ocasional', subtitle: 'Bonos & reembolsos',    icon: <Zap size={15} />,        color: '#A78BFA' },
}

const INCOME_TYPE_OPTIONS: CustomSelectOption<IncomeType>[] = [
  { value: 'salary',     label: 'Sueldo / Fijo',     subtitle: 'Nómina recurrente',     icon: <Briefcase size={15} />,  accentColor: '#34D399' },
  { value: 'freelance',  label: 'Freelance',         subtitle: 'Servicios & proyectos', icon: <Laptop size={15} />,     accentColor: '#38BDF8' },
  { value: 'investment', label: 'Inversión',         subtitle: 'Dividendos & rentas',   icon: <TrendingUp size={15} />, accentColor: '#C9A84C' },
  { value: 'extra',      label: 'Extra / Ocasional', subtitle: 'Bonos & reembolsos',    icon: <Zap size={15} />,        accentColor: '#A78BFA' },
]

interface IncomesViewProps {
  incomes: Income[]
  currentPeriod: string
  onAddIncome: (data: Omit<Income, 'id'>) => void
  onUpdateIncome: (income: Income) => void
  onDeleteIncome: (id: string) => void
  onFilterByType?: (type: IncomeType | null) => void
  activeFilter?: IncomeType | null
}

export function IncomesView({
  incomes,
  currentPeriod,
  onAddIncome,
  onUpdateIncome,
  onDeleteIncome,
  activeFilter,
}: IncomesViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [periodMode, setPeriodMode] = useState<'current' | 'all'>('current')
  const [form, setForm] = useState({
    description: '',
    amount: '',
    type: 'salary' as IncomeType,
    date: new Date().toISOString().slice(0, 10),
  })

  // Inline Edit State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDesc, setEditDesc] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editType, setEditType] = useState<IncomeType>('salary')
  const [editDate, setEditDate] = useState('')

  const startEdit = (inc: Income) => {
    setEditingId(inc.id)
    setEditDesc(inc.description)
    setEditAmount(String(inc.amount))
    setEditType(inc.type)
    setEditDate(inc.date)
  }

  const cancelEdit = () => setEditingId(null)

  const saveEdit = (inc: Income) => {
    const cleanAmount = sanitizeAmount(editAmount)
    const cleanDesc = sanitizeText(editDesc, 100)
    if (!cleanDesc || cleanAmount <= 0) return

    const derivedPeriod = editDate && editDate.length >= 7 ? editDate.slice(0, 7) : inc.period
    onUpdateIncome({
      ...inc,
      description: cleanDesc,
      amount: cleanAmount,
      type: editType,
      date: editDate,
      period: derivedPeriod,
    })
    setEditingId(null)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const parsed = sanitizeAmount(form.amount)
    const cleanDesc = sanitizeText(form.description, 100)
    if (!cleanDesc || parsed <= 0) return

    const derivedPeriod = form.date && form.date.length >= 7 ? form.date.slice(0, 7) : currentPeriod
    onAddIncome({
      description: cleanDesc,
      amount: parsed,
      type: form.type,
      date: form.date,
      period: derivedPeriod,
    })
    setForm({ description: '', amount: '', type: 'salary', date: new Date().toISOString().slice(0, 10) })
    setIsModalOpen(false)
  }

  // Filtrado por período (Mes Actual vs Todo el Historial)
  const periodScopedIncomes = periodMode === 'current'
    ? incomes.filter(i => (i.period || i.date?.slice(0, 7)) === currentPeriod)
    : incomes

  // KPIs calculados sobre el alcance seleccionado
  const totalIncomes = periodScopedIncomes.reduce((s, i) => s + i.amount, 0)
  const salaryTotal = periodScopedIncomes.filter(i => i.type === 'salary').reduce((s, i) => s + i.amount, 0)
  const extraTotal = totalIncomes - salaryTotal

  const filtered = activeFilter
    ? periodScopedIncomes.filter(i => i.type === activeFilter)
    : periodScopedIncomes

  return (
    <div className="incomes-obsidian-root">

      {/* ── KPIs SUPERIORES (3 TARJETAS BENTO) ── */}
      <div className="incomes-obsidian-kpi-row">

        {/* Total Ingresos */}
        <div className="incomes-obsidian-kpi-card">
          <div className="incomes-obsidian-kpi-header">
            <span className="incomes-obsidian-kpi-label">Flujo de Entrada Total</span>
            <TrendingUp size={16} color="#34D399" />
          </div>
          <div className="incomes-obsidian-kpi-val" style={{ color: '#34D399' }}>
            {formatCurrency(totalIncomes)}
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {incomes.length} transacciones registradas
          </span>
        </div>

        {/* Ingresos Fijos / Sueldo */}
        <div className="incomes-obsidian-kpi-card">
          <div className="incomes-obsidian-kpi-header">
            <span className="incomes-obsidian-kpi-label">Ingresos Recurrentes (Sueldo)</span>
            <Briefcase size={16} color="#C9A84C" />
          </div>
          <div className="incomes-obsidian-kpi-val">
            {formatCurrency(salaryTotal)}
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {totalIncomes > 0 ? Math.round((salaryTotal / totalIncomes) * 100) : 0}% de tus entradas
          </span>
        </div>

        {/* Ingresos Variables / Extras */}
        <div className="incomes-obsidian-kpi-card">
          <div className="incomes-obsidian-kpi-header">
            <span className="incomes-obsidian-kpi-label">Variables (Freelance / Inv.)</span>
            <Zap size={16} color="#38BDF8" />
          </div>
          <div className="incomes-obsidian-kpi-val">
            {formatCurrency(extraTotal)}
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {totalIncomes > 0 ? Math.round((extraTotal / totalIncomes) * 100) : 0}% de tus entradas
          </span>
        </div>

      </div>

      {/* ── TABLA DE ALTA DENSIDAD (ESTILO STRIPE/LINEAR) ── */}
      <div className="obsidian-data-grid-container" style={{ overflow: 'visible' }}>
        <div className="obsidian-data-grid-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div className="obsidian-data-grid-title">Registro de Ingresos</div>

            {/* Selector Mes Actual vs Todo el Historial */}
            <div className="obsidian-period-filter-switch">
              <button
                type="button"
                onClick={() => setPeriodMode('current')}
                className={`obsidian-period-filter-btn ${periodMode === 'current' ? 'active' : ''}`}
              >
                Mes Actual ({currentPeriod})
              </button>
              <button
                type="button"
                onClick={() => setPeriodMode('all')}
                className={`obsidian-period-filter-btn ${periodMode === 'all' ? 'active' : ''}`}
              >
                Todo el Historial ({incomes.length})
              </button>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              background: '#34D399',
              color: '#042F2E',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(52,211,153,0.2)',
            }}
          >
            <Plus size={16} /> Añadir Ingreso
          </button>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            No hay ingresos registrados en este período. Haz clic en "+ Añadir Ingreso" para comenzar.
          </div>
        ) : (
          <div className="obsidian-table-wrapper" style={{ overflow: 'visible' }}>
            <table className="obsidian-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Fuente / Concepto</th>
                  <th>Categoría</th>
                  <th style={{ textAlign: 'right' }}>Monto</th>
                  <th style={{ width: '90px', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inc => {
                  const t = TYPE_MAP[inc.type] || TYPE_MAP.salary

                  if (editingId === inc.id) {
                    return (
                      <tr key={inc.id} style={{ background: 'rgba(52,211,153,0.06)' }}>
                        <td>
                          <input
                            type="date"
                            className="aureus-adaptive-input compact"
                            value={editDate}
                            onChange={e => setEditDate(e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="aureus-adaptive-input compact"
                            style={{ width: '100%' }}
                            value={editDesc}
                            onChange={e => setEditDesc(e.target.value)}
                          />
                        </td>
                        <td style={{ minWidth: 190 }}>
                          <CustomIconSelect
                            options={INCOME_TYPE_OPTIONS}
                            value={editType}
                            onChange={val => setEditType(val)}
                            compact
                            ariaLabel="Tipo de Ingreso"
                          />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <input
                            type="number"
                            className="aureus-adaptive-input compact"
                            style={{ width: 110, textAlign: 'right' }}
                            value={editAmount}
                            onChange={e => setEditAmount(e.target.value)}
                          />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 4 }}>
                            <button className="obsidian-icon-btn" style={{ color: '#34D399' }} onClick={() => saveEdit(inc)} title="Guardar">
                              <Check size={15} />
                            </button>
                            <button className="obsidian-icon-btn" onClick={cancelEdit} title="Cancelar">
                              <X size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  }

                  return (
                    <tr key={inc.id}>
                      <td className="cell-date">{inc.date}</td>
                      <td>
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                          {inc.description}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 7,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: `${t.color}18`,
                              border: `1px solid ${t.color}35`,
                              color: t.color,
                            }}
                          >
                            {t.icon}
                          </span>
                          <span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>{t.label}</span>
                        </div>
                      </td>
                      <td className="cell-amount positive">
                        +{formatCurrency(inc.amount)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 4, justifyContent: 'flex-end' }}>
                          <button className="obsidian-icon-btn" onClick={() => startEdit(inc)} title="Editar"><Pencil size={14} /></button>
                          <button className="obsidian-icon-btn danger" onClick={() => onDeleteIncome(inc.id)} title="Eliminar"><Trash2 size={14} /></button>
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

      {/* ── MODAL PARA REGISTRAR INGRESO (PORTAL EN DOCUMENT.BODY) ── */}
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
                <Plus size={18} color="#34D399" /> Registrar Nuevo Ingreso
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="aureus-modal-close"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label className="aureus-field-label">Fuente / Descripción</label>
                <input
                  className="aureus-adaptive-input"
                  placeholder="Ej: Sueldo Quincenal, Proyecto Web..."
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  autoFocus
                  required
                />
              </div>

              <div className="aureus-modal-grid-2">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label className="aureus-field-label">Monto (RD$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="aureus-adaptive-input"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label className="aureus-field-label">Categoría de Ingreso</label>
                  <CustomIconSelect
                    options={INCOME_TYPE_OPTIONS}
                    value={form.type}
                    onChange={val => setForm(p => ({ ...p, type: val }))}
                    ariaLabel="Categoría de Ingreso"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label className="aureus-field-label">
                  <Calendar size={12} style={{ marginRight: 4, display: 'inline-block', verticalAlign: 'middle' }} color="#34D399" />
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
                <button type="submit" style={{ background: '#34D399', border: 'none', color: '#042F2E', padding: '10px 20px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={16} /> Guardar Ingreso
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
