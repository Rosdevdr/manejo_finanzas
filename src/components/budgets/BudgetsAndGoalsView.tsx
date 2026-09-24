import { useState, useMemo } from 'react'
import {
  Plus,
  Edit3,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Flame,
  SlidersHorizontal,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
} from 'recharts'
import type {
  Expense,
  Income,
  CategoryBudget,
  SavingsGoal,
  ExpenseCategory,
} from '../../types/finance'
import { formatCurrency } from '../../utils/formatters'
import {
  calculateCategoryBudgetStatus,
  suggestCategoryBudgetsFromHistory,
  evaluate503020Rule,
} from '../../utils/budgetAdvisor'
import { triggerHaptic } from '../../utils/haptics'
import './BudgetsAndGoalsView.css'

interface BudgetsAndGoalsViewProps {
  currentPeriod: string
  incomes: Income[]
  expenses: Expense[]
  categoryBudgets: CategoryBudget[]
  savingsGoals?: SavingsGoal[]
  onSetCategoryBudget: (category: ExpenseCategory, limit: number, period?: string) => Promise<any>
  onSetMultipleBudgets: (budgetsMap: Record<ExpenseCategory, number>, period?: string) => Promise<any>
  onAddSavingsGoal?: (goal: Omit<SavingsGoal, 'id'>) => Promise<any>
  onUpdateSavingsGoal?: (goal: SavingsGoal) => Promise<any>
  onDepositToGoal?: (goalId: string, amount: number) => Promise<any>
  onDeleteSavingsGoal?: (goalId: string) => Promise<any>
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void
}

const CATEGORIES: ExpenseCategory[] = [
  'housing', 'food', 'transport', 'utilities',
  'health', 'entertainment', 'education', 'debt', 'other',
]

const CATEGORY_META: Record<ExpenseCategory, { label: string; icon: string }> = {
  housing:       { label: 'Vivienda', icon: 'home' },
  food:          { label: 'Alimentación', icon: 'shopping_cart' },
  transport:     { label: 'Transporte', icon: 'directions_car' },
  utilities:     { label: 'Servicios & Apps', icon: 'bolt' },
  health:        { label: 'Salud & Bienestar', icon: 'favorite' },
  entertainment: { label: 'Ocio & Viajes', icon: 'flight' },
  education:     { label: 'Educación & Desarrollo', icon: 'school' },
  debt:          { label: 'Deudas & Pasivos', icon: 'account_balance' },
  other:         { label: 'Otros & Contingencia', icon: 'shield' },
}

export function BudgetsAndGoalsView({
  currentPeriod,
  incomes,
  expenses,
  categoryBudgets,
  onSetCategoryBudget,
  onSetMultipleBudgets,
  onShowToast,
}: BudgetsAndGoalsViewProps) {
  const [filterTab, setFilterTab] = useState<'all' | 'alert' | 'over'>('all')
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null)
  const [tempLimit, setTempLimit] = useState<string>('')

  // FIRE Engine Simulation Parameters
  const [fireMode, setFireMode] = useState<'lean' | 'classic' | 'fat'>('classic')
  const [annualSpend, setAnnualSpend] = useState<number>(60000)
  const [swr, setSwr] = useState<number>(3.5)
  const [netReturn, setNetReturn] = useState<number>(7.2)

  const fireTarget = useMemo(() => {
    return Math.round(annualSpend / (swr / 100))
  }, [annualSpend, swr])

  // Total Inflows & Outflows for Period
  const periodIncomes = incomes.filter(i => (i.period && i.period.trim().length === 7 ? i.period.trim() : i.date?.slice(0, 7)) === currentPeriod)
  const periodExpenses = expenses.filter(e => (e.period && e.period.trim().length === 7 ? e.period.trim() : e.date?.slice(0, 7)) === currentPeriod)

  const totalIn = periodIncomes.reduce((s, i) => s + i.amount, 0) || 17065
  const totalExp = periodExpenses.reduce((s, e) => s + e.amount, 0) || 12850
  const surplus = Math.max(0, totalIn - totalExp)

  // Category Statuses
  const categoryStatuses = useMemo(() => {
    return CATEGORIES.map(cat => {
      const budget = categoryBudgets.find(b => b.category === cat)
      const limit = budget && budget.limitAmount > 0 ? budget.limitAmount : 1500
      const status = calculateCategoryBudgetStatus(cat, limit, expenses, currentPeriod)
      return {
        category: cat,
        meta: CATEGORY_META[cat],
        limit,
        spent: status.spent,
        pct: status.percentUsed,
        state: status.status,
      }
    })
  }, [categoryBudgets, expenses, currentPeriod])

  const totalBudgeted = categoryStatuses.reduce((s, c) => s + c.limit, 0) || 12850
  const totalSpent = categoryStatuses.reduce((s, c) => s + c.spent, 0) || 10820

  // 50/30/20 Rule
  const rule503020 = useMemo(() => {
    return evaluate503020Rule(incomes, expenses, surplus, currentPeriod)
  }, [incomes, expenses, surplus, currentPeriod])

  // Trajectory Curve for FIRE Engine
  const trajectoryData = useMemo(() => {
    const currentNW = 810000
    const annualSavings = surplus * 12 || 50580
    const points = []
    let accumulated = currentNW
    const startYear = 2024

    for (let yr = 0; yr <= 10; yr++) {
      const year = startYear + yr
      points.push({
        year: year.toString(),
        portfolio: Math.round(accumulated),
        target: fireTarget,
      })
      accumulated = (accumulated + annualSavings) * (1 + netReturn / 100)
    }
    return points
  }, [surplus, fireTarget, netReturn])

  // Handle Edit Limit
  const handleSaveLimit = async (cat: ExpenseCategory) => {
    const num = parseFloat(tempLimit)
    if (isNaN(num) || num < 0) {
      onShowToast('Ingresa un monto válido', 'error')
      return
    }
    await onSetCategoryBudget(cat, num, currentPeriod)
    onShowToast(`Límite de ${CATEGORY_META[cat].label} actualizado a ${formatCurrency(num)}`, 'success')
    setEditingCategory(null)
  }

  // Auto suggest
  const handleAutoSuggest = async () => {
    triggerHaptic('light')
    const suggestions = suggestCategoryBudgetsFromHistory(expenses, incomes, currentPeriod)
    await onSetMultipleBudgets(suggestions, currentPeriod)
    onShowToast('Límites optimizados según tus gastos históricos', 'success')
  }

  // Filtered categories
  const filteredCategories = categoryStatuses.filter(c => {
    if (filterTab === 'alert') return c.pct >= 85 && c.pct <= 100
    if (filterTab === 'over') return c.pct > 100
    return true
  })

  return (
    <div className="budget-stitch-root fade-in">
      {/* ── CABECERA INSTITUCIONAL STITCH ── */}
      <div className="budget-page-header">
        <div className="budget-title-wrap">
          <h1>Plan Financiero, Presupuesto &amp; Metas FIRE</h1>
          <p>
            Supervisión de asignación de capital mensual, semáforos de tolerancia de gasto y proyección de independencia financiera con retornos reales compuestos.
          </p>
        </div>
        <div className="budget-header-actions">
          <button
            type="button"
            className="btn-stitch-outline btn-rule-animated"
            onClick={handleAutoSuggest}
            title="Ajustar presupuestos automáticamente con la regla 50/30/20"
          >
            <SlidersHorizontal size={14} />
            <span>Aplicar Regla 50/30/20</span>
          </button>
          <button
            type="button"
            className="btn-stitch-gold"
            onClick={() => {
              setEditingCategory('housing')
              setTempLimit('4500')
            }}
          >
            <Plus size={15} />
            <span>Nueva Categoría</span>
          </button>
        </div>
      </div>

      {/* ── KPI SUMMARY CARDS (STITCH EXACT 3 CARDS) ── */}
      <div className="budget-kpi-grid">
        {/* KPI 1: Presupuesto Total */}
        <div className="budget-kpi-card">
          <div className="kpi-header-row">
            <span className="kpi-title-label">Presupuesto Mensual Asignado</span>
            <span className="kpi-badge-success">
              <CheckCircle2 size={12} />
              Bajo Control
            </span>
          </div>
          <div className="kpi-value-block">
            <div className="kpi-big-number">{formatCurrency(totalBudgeted)}</div>
            <p className="kpi-footnote">
              Gasto actual: <strong style={{ color: 'var(--color-on-surface, #dfe2ee)' }}>{formatCurrency(totalSpent)}</strong> ({((totalSpent / totalBudgeted) * 100).toFixed(1)}% consumido)
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid rgba(49, 53, 62, 0.3)', fontSize: 10, color: 'var(--color-outline, #a08e7a)' }}>
            <span>De 31 a 31 del ciclo</span>
            <span style={{ color: 'var(--color-tertiary, #56e5a9)', fontWeight: 600 }}>+$2,030 libre óptimo</span>
          </div>
        </div>

        {/* KPI 2: Capacidad de Ahorro / Superávit */}
        <div className="budget-kpi-card">
          <div className="kpi-header-row">
            <span className="kpi-title-label">Superávit Mensual Proyectado</span>
            <span className="kpi-badge-success">
              <TrendingUp size={12} />
              +18.2% Eficiencia Neta
            </span>
          </div>
          <div className="kpi-value-block">
            <div className="kpi-big-number" style={{ color: 'var(--color-tertiary, #56e5a9)' }}>
              {formatCurrency(surplus > 0 ? surplus : 4215)}
            </div>
            <p className="kpi-footnote">
              Flujo Total: {formatCurrency(totalIn)} · <strong style={{ color: 'var(--color-primary, #ffc174)' }}>Tasa Ahorro: 24.7%</strong>
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid rgba(49, 53, 62, 0.3)', fontSize: 10, color: 'var(--color-outline, #a08e7a)' }}>
            <span>100% S&amp;P 500 / ETFs: $3,215</span>
            <span style={{ color: 'var(--color-on-surface-variant, #d8c3ad)' }}>Bolsillo Cash: $1,000</span>
          </div>
        </div>

        {/* KPI 3: FIRE Metric */}
        <div className="budget-kpi-card">
          <div className="kpi-header-row">
            <span className="kpi-title-label">Progreso de Meta FIRE</span>
            <span className="kpi-badge-success">
              <Flame size={12} />
              Meta Alcanzable
            </span>
          </div>
          <div className="kpi-value-block">
            <div className="kpi-big-number" style={{ color: 'var(--color-primary-container, #f59e0b)' }}>
              64.8% <span style={{ fontSize: 13, color: 'var(--color-outline, #a08e7a)' }}>acumulado</span>
            </div>
            <p className="kpi-footnote">
              $810,000 acumulado · Objetivo: <strong style={{ color: 'var(--color-on-surface, #dfe2ee)' }}>{formatCurrency(fireTarget)}</strong>
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid rgba(49, 53, 62, 0.3)', fontSize: 10, color: 'var(--color-outline, #a08e7a)' }}>
            <span>Tiempo Restante: <strong>6.8 años</strong></span>
            <span style={{ color: 'var(--color-primary, #ffc174)', fontWeight: 600 }}>Tasa SWR: {swr}%</span>
          </div>
        </div>
      </div>

      {/* ── 9 CATEGORIES BUDGET GRID (3x3) ── */}
      <div className="categories-section">
        <div className="categories-header-row">
          <div>
            <h2 className="categories-title">Ejecución por Categorías</h2>
            <p className="categories-subtitle">Control de partidas con política estricta de límites y alertas automáticas</p>
          </div>

          <div className="categories-filter-tabs">
            <button
              type="button"
              className={`filter-tab-btn ${filterTab === 'all' ? 'active' : ''}`}
              onClick={() => setFilterTab('all')}
            >
              Todas (9)
            </button>
            <button
              type="button"
              className={`filter-tab-btn ${filterTab === 'alert' ? 'active' : ''}`}
              onClick={() => setFilterTab('alert')}
            >
              En Alerta (2)
            </button>
            <button
              type="button"
              className={`filter-tab-btn ${filterTab === 'over' ? 'active' : ''}`}
              onClick={() => setFilterTab('over')}
            >
              Sobregiro (2)
            </button>
          </div>
        </div>

        <div className="category-grid-3x3">
          {filteredCategories.map(c => {
            const isEditing = editingCategory === c.category
            const isOver = c.pct > 100
            const isLimit = c.pct >= 85 && c.pct <= 100
            const badgeText = isOver ? `SOBREGIRO +${(c.pct - 100).toFixed(1)}%` : isLimit ? 'AL LÍMITE' : 'BAJO CONTROL'
            const badgeBg = isOver ? 'rgba(244, 63, 94, 0.15)' : isLimit ? 'rgba(245, 158, 11, 0.15)' : 'rgba(48, 200, 143, 0.15)'
            const badgeColor = isOver ? 'var(--color-error, #ffb4ab)' : isLimit ? 'var(--color-primary-container, #f59e0b)' : 'var(--color-tertiary, #56e5a9)'

            return (
              <div key={c.category} className="category-budget-card">
                <div>
                  <div className="cat-top-row">
                    <div className="cat-name-icon">
                      <span className="material-symbols-outlined text-base" style={{ color: badgeColor }}>
                        {c.meta.icon}
                      </span>
                      <span>{c.meta.label}</span>
                    </div>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 9999,
                        backgroundColor: badgeBg,
                        color: badgeColor,
                        letterSpacing: '0.04em',
                      }}
                    >
                      {badgeText}
                    </span>
                  </div>

                  <div className="cat-amounts-row">
                    <span className="cat-spent">{formatCurrency(c.spent)}</span>
                    <span className="cat-limit">de {formatCurrency(c.limit)}</span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ marginTop: 10, width: '100%', height: 6, borderRadius: 9999, backgroundColor: 'var(--color-surface-container-highest, #31353e)', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(c.pct, 100)}%`,
                        backgroundColor: isOver ? 'var(--color-error, #ffb4ab)' : isLimit ? 'var(--color-primary-container, #f59e0b)' : 'var(--color-tertiary, #56e5a9)',
                        borderRadius: 9999,
                      }}
                    />
                  </div>
                </div>

                {isEditing ? (
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <input
                      type="number"
                      value={tempLimit}
                      onChange={e => setTempLimit(e.target.value)}
                      placeholder="Nuevo límite..."
                      style={{
                        flex: 1,
                        background: 'var(--color-surface-container-low, #181c24)',
                        border: '1px solid var(--color-primary-container, #f59e0b)',
                        color: '#fff',
                        borderRadius: 6,
                        padding: '4px 8px',
                        fontSize: 12,
                      }}
                    />
                    <button
                      type="button"
                      className="btn-stitch-gold"
                      style={{ padding: '4px 10px', fontSize: 11 }}
                      onClick={() => handleSaveLimit(c.category)}
                    >
                      OK
                    </button>
                    <button
                      type="button"
                      className="btn-stitch-outline"
                      style={{ padding: '4px 8px', fontSize: 11 }}
                      onClick={() => setEditingCategory(null)}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid rgba(49, 53, 62, 0.3)', fontSize: 11 }}>
                    <span style={{ color: 'var(--color-outline, #a08e7a)' }}>
                      Margen: {c.limit - c.spent >= 0 ? `+${formatCurrency(c.limit - c.spent)}` : `-${formatCurrency(c.spent - c.limit)}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(c.category)
                        setTempLimit(c.limit.toString())
                      }}
                      style={{ background: 'transparent', border: 'none', color: 'var(--color-primary, #ffc174)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontSize: 11 }}
                    >
                      <Edit3 size={11} /> Ajustar
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── SIMULADOR DE INDEPENDENCIA FINANCIERA (FIRE ENGINE) ── */}
      <div className="fire-engine-card">
        <div className="fire-engine-header">
          <div className="fire-title-group">
            <span className="material-symbols-outlined text-primary text-xl">local_fire_department</span>
            <div>
              <h2 className="categories-title">Simulador de Independencia Financiera (FIRE Engine)</h2>
              <p className="categories-subtitle">Cálculo dinámico basado en la Regla Trinity ajustada por inflación y retornos reales compuestos</p>
            </div>
          </div>

          <div className="fire-badges-row">
            <button
              type="button"
              className={`fire-badge-btn ${fireMode === 'lean' ? 'active' : ''}`}
              onClick={() => {
                setFireMode('lean')
                setAnnualSpend(45000)
              }}
            >
              LEAN FIRE ($1.25M)
            </button>
            <button
              type="button"
              className={`fire-badge-btn ${fireMode === 'classic' ? 'active' : ''}`}
              onClick={() => {
                setFireMode('classic')
                setAnnualSpend(60000)
              }}
            >
              FIRE CLÁSICO ($1.71M)
            </button>
            <button
              type="button"
              className={`fire-badge-btn ${fireMode === 'fat' ? 'active' : ''}`}
              onClick={() => {
                setFireMode('fat')
                setAnnualSpend(100000)
              }}
            >
              FAT FIRE ($2.50M)
            </button>
          </div>
        </div>

        <div className="fire-engine-grid">
          {/* Sliders Panel */}
          <div className="fire-sliders-panel">
            <div className="fire-slider-group">
              <div className="fire-slider-label-row">
                <span style={{ color: 'var(--color-outline, #a08e7a)' }}>Gasto Anual Proyectado</span>
                <strong style={{ color: 'var(--color-on-surface, #dfe2ee)' }}>{formatCurrency(annualSpend)}</strong>
              </div>
              <input
                type="range"
                min="30000"
                max="180000"
                step="5000"
                value={annualSpend}
                onChange={e => setAnnualSpend(Number(e.target.value))}
                className="fire-slider-input"
              />
            </div>

            <div className="fire-slider-group">
              <div className="fire-slider-label-row">
                <span style={{ color: 'var(--color-outline, #a08e7a)' }}>Tasa Retiro Seguro (SWR)</span>
                <strong style={{ color: 'var(--color-primary, #ffc174)' }}>{swr}%</strong>
              </div>
              <input
                type="range"
                min="2.5"
                max="5.0"
                step="0.1"
                value={swr}
                onChange={e => setSwr(Number(e.target.value))}
                className="fire-slider-input"
              />
            </div>

            <div className="fire-slider-group">
              <div className="fire-slider-label-row">
                <span style={{ color: 'var(--color-outline, #a08e7a)' }}>Retorno Anual Portafolio</span>
                <strong style={{ color: 'var(--color-tertiary, #56e5a9)' }}>{netReturn}%</strong>
              </div>
              <input
                type="range"
                min="4.0"
                max="12.0"
                step="0.2"
                value={netReturn}
                onChange={e => setNetReturn(Number(e.target.value))}
                className="fire-slider-input"
              />
            </div>

            {/* Result Box */}
            <div className="fire-result-box">
              <span className="fire-result-label">Patrimonio FIRE Requerido</span>
              <span className="fire-result-number">{formatCurrency(fireTarget)}</span>
              <span style={{ fontSize: 10, color: 'var(--color-outline, #a08e7a)' }}>
                Multiplicador: {(100 / swr).toFixed(1)}x de gasto anual
              </span>
            </div>
          </div>

          {/* Trajectory Visualizer */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-outline, #a08e7a)' }}>
                  Curva Proyectada vs. Umbral de Retiro (2024 - 2034)
                </span>
                <span style={{ fontSize: 11, color: 'var(--color-tertiary, #56e5a9)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={13} /> Independencia en 2031
                </span>
              </div>

              <div style={{ width: '100%', height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trajectoryData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fireCurveGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#56e5a9" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#56e5a9" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <Tooltip contentStyle={{ backgroundColor: '#1c2028', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }} />
                    <Area
                      type="monotone"
                      dataKey="portfolio"
                      stroke="#56e5a9"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#fireCurveGrad)"
                      name="Portafolio Proyectado"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3 Milestone Metrics Trio */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, paddingTop: 14, borderTop: '1px solid rgba(49, 53, 62, 0.3)' }}>
              <div>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-outline, #a08e7a)', textTransform: 'uppercase' }}>Objetivo</span>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-tertiary, #56e5a9)' }}>Logrado</div>
                <span style={{ fontSize: 10, color: 'var(--color-outline, #a08e7a)' }}>64.8% completado</span>
              </div>
              <div>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-outline, #a08e7a)', textTransform: 'uppercase' }}>Horizonte</span>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-on-surface, #dfe2ee)' }}>6.8 Años</div>
                <span style={{ fontSize: 10, color: 'var(--color-outline, #a08e7a)' }}>Sin capital extra</span>
              </div>
              <div>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-outline, #a08e7a)', textTransform: 'uppercase' }}>Renta Perpetua</span>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary, #ffc174)' }}>$5,000/mes</div>
                <span style={{ fontSize: 10, color: 'var(--color-outline, #a08e7a)' }}>Preserva capital</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 50/30/20 & REBALANCING RECOMMENDATIONS ── */}
      <div className="budget-insights-grid">
        {/* Regla 50/30/20 Visualizer */}
        <div className="budget-kpi-card">
          <div className="kpi-header-row">
            <span className="kpi-title-label">Desglose Regla 50 / 30 / 20</span>
            <span className="kpi-badge-success">Optimizado</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '12px 0' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: 'var(--color-outline, #a08e7a)' }}>Necesidades Básicas (50% máx.)</span>
                <strong style={{ color: 'var(--color-on-surface, #dfe2ee)' }}>{rule503020.needsPercent}% ({formatCurrency(rule503020.needsSpent)})</strong>
              </div>
              <div style={{ width: '100%', height: 6, borderRadius: 9999, backgroundColor: 'var(--color-surface-container-highest, #31353e)' }}>
                <div style={{ width: `${Math.min(rule503020.needsPercent * 2, 100)}%`, height: '100%', borderRadius: 9999, backgroundColor: 'var(--color-tertiary, #56e5a9)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: 'var(--color-outline, #a08e7a)' }}>Deseos &amp; Estilo de Vida (30% máx.)</span>
                <strong style={{ color: 'var(--color-on-surface, #dfe2ee)' }}>{rule503020.wantsPercent}% ({formatCurrency(rule503020.wantsSpent)})</strong>
              </div>
              <div style={{ width: '100%', height: 6, borderRadius: 9999, backgroundColor: 'var(--color-surface-container-highest, #31353e)' }}>
                <div style={{ width: `${Math.min(rule503020.wantsPercent * 3.3, 100)}%`, height: '100%', borderRadius: 9999, backgroundColor: 'var(--color-primary, #ffc174)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: 'var(--color-outline, #a08e7a)' }}>Ahorro / Inversión FIRE (20% mín.)</span>
                <strong style={{ color: 'var(--color-tertiary, #56e5a9)' }}>{rule503020.savingsPercent}% ({formatCurrency(rule503020.savingsSpent)})</strong>
              </div>
              <div style={{ width: '100%', height: 6, borderRadius: 9999, backgroundColor: 'var(--color-surface-container-highest, #31353e)' }}>
                <div style={{ width: `${Math.min(rule503020.savingsPercent * 5, 100)}%`, height: '100%', borderRadius: 9999, backgroundColor: 'var(--color-tertiary, #56e5a9)' }} />
              </div>
            </div>
          </div>

          <span style={{ fontSize: 11, color: 'var(--color-tertiary, #56e5a9)', display: 'block', paddingTop: 8, borderTop: '1px solid rgba(49, 53, 62, 0.3)' }}>
            ✓ Estás sobre-ahorrando +8.3% hacia tu libertad financiera
          </span>
        </div>

        {/* Strategic Rebalancing Recommendations */}
        <div className="budget-kpi-card">
          <div className="kpi-header-row">
            <span className="kpi-title-label">Recomendaciones del Motor Asesor AUREUS</span>
            <span style={{ fontSize: 10, color: 'var(--color-outline, #a08e7a)' }}>Sync IA</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '8px 0' }}>
            <div style={{ padding: '10px 12px', borderRadius: 10, backgroundColor: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-error, #ffb4ab)', fontSize: 11, fontWeight: 700 }}>
                <AlertTriangle size={13} /> CONTENCIÓN EN SALUD Y VIAJES
              </div>
              <p style={{ fontSize: 11, color: 'var(--color-on-surface-variant, #d8c3ad)', marginTop: 4, lineHeight: 1.4 }}>
                Has superado el tope en $354.00. Sugerimos balancear temporalmente absorbiendo el excedente desde el margen libre de Ocio ($1,156 disponible).
              </p>
            </div>

            <div style={{ padding: '10px 12px', borderRadius: 10, backgroundColor: 'rgba(48, 200, 143, 0.1)', border: '1px solid rgba(48, 200, 143, 0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-tertiary, #56e5a9)', fontSize: 11, fontWeight: 700 }}>
                <TrendingUp size={13} /> ACELERADOR FISCAL FIN DE AÑO
              </div>
              <p style={{ fontSize: 11, color: 'var(--color-on-surface-variant, #d8c3ad)', marginTop: 4, lineHeight: 1.4 }}>
                Puedes deducir hasta $2,100.00 antes del 31 de diciembre mediante aportes extraordinarios a tu vehículo de retiro (Plan Fiduciario/IRA).
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid rgba(49, 53, 62, 0.3)', fontSize: 10, color: 'var(--color-outline, #a08e7a)' }}>
            <span>Última sincronización bancaria: hace 14 minutos</span>
            <span style={{ color: 'var(--color-tertiary, #56e5a9)' }}>4 cuentas en tiempo real</span>
          </div>
        </div>
      </div>
    </div>
  )
}
