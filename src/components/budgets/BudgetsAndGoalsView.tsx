import { useState, useEffect } from 'react'
import {
  Target,
  PiggyBank,
  Sparkles,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  Calendar,
  Compass,
  X,
  Filter,
} from 'lucide-react'
import type {
  Expense,
  Income,
  CategoryBudget,
  SavingsGoal,
  ExpenseCategory,
  GoalCategory,
} from '../../types/finance'
import { formatCurrency } from '../../utils/formatters'
import {
  calculateCategoryBudgetStatus,
  suggestCategoryBudgetsFromHistory,
  evaluate503020Rule,
  calculateSavingsGoalProjection,
} from '../../utils/budgetAdvisor'
import './BudgetsAndGoalsView.css'

interface BudgetsAndGoalsViewProps {
  currentPeriod: string
  incomes: Income[]
  expenses: Expense[]
  categoryBudgets: CategoryBudget[]
  savingsGoals: SavingsGoal[]
  onSetCategoryBudget: (category: ExpenseCategory, limit: number, period?: string) => Promise<any>
  onSetMultipleBudgets: (budgetsMap: Record<ExpenseCategory, number>, period?: string) => Promise<any>
  onAddSavingsGoal: (goal: Omit<SavingsGoal, 'id'>) => Promise<any>
  onUpdateSavingsGoal: (goal: SavingsGoal) => Promise<any>
  onDepositToGoal: (goalId: string, amount: number) => Promise<any>
  onDeleteSavingsGoal: (goalId: string) => Promise<any>
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void
}

const CATEGORIES: ExpenseCategory[] = [
  'housing', 'food', 'transport', 'utilities',
  'health', 'entertainment', 'education', 'debt', 'other'
]

const CATEGORY_META: Record<ExpenseCategory, { label: string; icon: string }> = {
  housing: { label: 'Vivienda & Renta', icon: '🏠' },
  food: { label: 'Alimentación & Súper', icon: '🛒' },
  transport: { label: 'Transporte & Gasolina', icon: '🚗' },
  utilities: { label: 'Servicios Básicos', icon: '💡' },
  health: { label: 'Salud & Medicina', icon: '🩺' },
  entertainment: { label: 'Ocio & Salidas', icon: '🍿' },
  education: { label: 'Educación & Cursos', icon: '📚' },
  debt: { label: 'Pago de Deudas', icon: '💳' },
  other: { label: 'Otros Gastos', icon: '📦' },
}

const GOAL_META: Record<GoalCategory, { label: string; icon: string }> = {
  emergency: { label: 'Fondo de Emergencia', icon: '🛡️' },
  vacation: { label: 'Vacaciones & Viajes', icon: '✈️' },
  car: { label: 'Vehículo', icon: '🚘' },
  home: { label: 'Vivienda / Hogar', icon: '🏡' },
  investment: { label: 'Inversión / Negocio', icon: '📈' },
  education: { label: 'Educación', icon: '🎓' },
  tech: { label: 'Tecnología & Equipos', icon: '💻' },
  other: { label: 'Meta Personal', icon: '🎯' },
}

export function BudgetsAndGoalsView({
  currentPeriod,
  incomes,
  expenses,
  categoryBudgets,
  savingsGoals,
  onSetCategoryBudget,
  onSetMultipleBudgets,
  onAddSavingsGoal,
  onUpdateSavingsGoal,
  onDepositToGoal,
  onDeleteSavingsGoal,
  onShowToast,
}: BudgetsAndGoalsViewProps) {
  const [activeSubtab, setActiveSubtab] = useState<'budgets' | 'goals'>('budgets')
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null)
  const [tempLimit, setTempLimit] = useState<string>('')
  const [showAllCategories, setShowAllCategories] = useState(false)

  // Carga automática de límites inteligentes si no existen o están en 0
  useEffect(() => {
    const hasCustomLimits = categoryBudgets.some(b => b.limitAmount > 0)
    if (!hasCustomLimits && (expenses.length > 0 || incomes.length > 0)) {
      const suggestions = suggestCategoryBudgetsFromHistory(expenses, incomes, currentPeriod)
      void onSetMultipleBudgets(suggestions, currentPeriod)
    }
  }, [currentPeriod, expenses, incomes, categoryBudgets, onSetMultipleBudgets])

  // Modal para Crear / Editar Meta
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
  const [goalEditing, setGoalEditing] = useState<SavingsGoal | null>(null)
  const [goalName, setGoalName] = useState('')
  const [goalTarget, setGoalTarget] = useState('')
  const [goalCurrent, setGoalCurrent] = useState('')
  const [goalMonthly, setGoalMonthly] = useState('')
  const [goalCategory, setGoalCategory] = useState<GoalCategory>('emergency')
  const [goalColor, setGoalColor] = useState('#34D399')

  // Modal para Depósito Personalizado
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null)
  const [depositAmount, setDepositAmount] = useState('')

  // Cálculos globales
  const periodIncomes = incomes.filter(i => i.period === currentPeriod)
  const periodExpenses = expenses.filter(e => e.period === currentPeriod)
  const totalIncome = periodIncomes.reduce((s, i) => s + i.amount, 0)
  const totalExpense = periodExpenses.reduce((s, e) => s + e.amount, 0)
  const netBalance = totalIncome - totalExpense

  // Evaluación Regla 50/30/20
  const rule503020 = evaluate503020Rule(incomes, expenses, netBalance, currentPeriod)

  // Estados de Presupuestos por Categoría
  const budgetStatuses = CATEGORIES.map(cat => {
    const found = categoryBudgets.find(b => b.category === cat && (b.period === currentPeriod || b.period === 'default'))
    const limit = found ? found.limitAmount : 0
    return calculateCategoryBudgetStatus(cat, limit, expenses, currentPeriod)
  })

  const totalBudgeted = budgetStatuses.reduce((s, b) => s + b.limit, 0)
  const totalBudgetSpent = budgetStatuses.reduce((s, b) => s + b.spent, 0)
  const globalRemaining = Math.max(0, totalBudgeted - totalBudgetSpent)

  // Metas de ahorro métricas
  const totalSavedInGoals = savingsGoals.reduce((s, g) => s + g.currentAmount, 0)
  const totalTargetInGoals = savingsGoals.reduce((s, g) => s + g.targetAmount, 0)
  const completedGoalsCount = savingsGoals.filter(g => g.isCompleted).length

  // Handlers Presupuesto
  const handleStartEditBudget = (cat: ExpenseCategory, currentLimit: number) => {
    setEditingCategory(cat)
    setTempLimit(currentLimit > 0 ? currentLimit.toString() : '')
  }

  const handleSaveBudget = async () => {
    if (!editingCategory) return
    const num = parseFloat(tempLimit) || 0
    await onSetCategoryBudget(editingCategory, num, currentPeriod)
    onShowToast(`Límite para ${CATEGORY_META[editingCategory].label} actualizado a ${formatCurrency(num)}`, 'success')
    setEditingCategory(null)
  }

  const handleAutoSuggestBudgets = async () => {
    const suggestions = suggestCategoryBudgetsFromHistory(expenses, incomes, currentPeriod)
    await onSetMultipleBudgets(suggestions, currentPeriod)
    onShowToast('✨ Presupuestos inteligentes calculados basados en tu historial real', 'success')
  }

  // Handlers Metas
  const handleOpenGoalModal = (goalToEdit?: SavingsGoal) => {
    if (goalToEdit) {
      setGoalEditing(goalToEdit)
      setGoalName(goalToEdit.name)
      setGoalTarget(goalToEdit.targetAmount.toString())
      setGoalCurrent(goalToEdit.currentAmount.toString())
      setGoalMonthly(goalToEdit.monthlyContribution?.toString() || '')
      setGoalCategory(goalToEdit.category)
      setGoalColor(goalToEdit.color || '#34D399')
    } else {
      setGoalEditing(null)
      setGoalName('')
      setGoalTarget('')
      setGoalCurrent('0')
      setGoalMonthly('')
      setGoalCategory('emergency')
      setGoalColor('#34D399')
    }
    setIsGoalModalOpen(true)
  }

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    const target = parseFloat(goalTarget)
    if (!goalName.trim() || isNaN(target) || target <= 0) {
      onShowToast('Ingresa un nombre válido y un monto objetivo mayor a 0', 'error')
      return
    }

    const current = parseFloat(goalCurrent) || 0
    const monthly = parseFloat(goalMonthly) || undefined

    if (goalEditing) {
      await onUpdateSavingsGoal({
        ...goalEditing,
        name: goalName.trim(),
        targetAmount: target,
        currentAmount: current,
        monthlyContribution: monthly,
        category: goalCategory,
        color: goalColor,
        isCompleted: current >= target,
      })
      onShowToast('Meta de ahorro actualizada', 'success')
    } else {
      await onAddSavingsGoal({
        name: goalName.trim(),
        targetAmount: target,
        currentAmount: current,
        monthlyContribution: monthly,
        category: goalCategory,
        color: goalColor,
      })
      onShowToast('Nueva meta de ahorro creada', 'success')
    }

    setIsGoalModalOpen(false)
  }

  const handleQuickDeposit = async (goalId: string, amount: number) => {
    await onDepositToGoal(goalId, amount)
    onShowToast(`+${formatCurrency(amount)} abonados a la meta`, 'success')
  }

  const handleCustomDeposit = async () => {
    if (!depositGoalId) return
    const num = parseFloat(depositAmount)
    if (isNaN(num) || num <= 0) {
      onShowToast('Ingresa un monto válido para abonar', 'error')
      return
    }
    await onDepositToGoal(depositGoalId, num)
    onShowToast(`+${formatCurrency(num)} abonados con éxito`, 'success')
    setDepositGoalId(null)
    setDepositAmount('')
  }

  return (
    <div className="budgets-container">
      {/* Header & Subtabs */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="breadcrumb">AUREUS · <span className="breadcrumb-accent">Presupuestos & Metas</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <h1 className="page-title">Control Presupuestario y Metas</h1>

          <div className="subtabs-nav">
            <button
              className={`subtab-btn ${activeSubtab === 'budgets' ? 'active' : ''}`}
              onClick={() => setActiveSubtab('budgets')}
            >
              <Target size={15} /> Presupuestos por Categoría
            </button>
            <button
              className={`subtab-btn ${activeSubtab === 'goals' ? 'active' : ''}`}
              onClick={() => setActiveSubtab('goals')}
            >
              <PiggyBank size={15} /> Metas de Ahorro ({savingsGoals.length})
            </button>
          </div>
        </div>
      </div>

      {activeSubtab === 'budgets' ? (
        <>
          {/* Top KPI Metrics */}
          <div className="kpi-grid">
            <div className="kpi-card gold">
              <div className="kpi-top">
                <span className="kpi-label">Presupuesto Asignado</span>
                <span className="kpi-icon">🎯</span>
              </div>
              <div className="kpi-value gold">{formatCurrency(totalBudgeted)}</div>
              <div className="kpi-sub">Límites activos este período</div>
            </div>

            <div className="kpi-card red">
              <div className="kpi-top">
                <span className="kpi-label">Gasto Ejecutado</span>
                <span className="kpi-icon">💸</span>
              </div>
              <div className="kpi-value red">{formatCurrency(totalBudgetSpent)}</div>
              <div className="kpi-sub">
                {totalBudgeted > 0 ? `${Math.round((totalBudgetSpent / totalBudgeted) * 100)}% consumido` : 'Sin límites asignados'}
              </div>
            </div>

            <div className="kpi-card emerald">
              <div className="kpi-top">
                <span className="kpi-label">Margen Disponible</span>
                <span className="kpi-icon">🛡️</span>
              </div>
              <div className="kpi-value emerald">{formatCurrency(globalRemaining)}</div>
              <div className="kpi-sub">Capacidad restante de gasto</div>
            </div>
          </div>

          {/* 50/30/20 Rule Analysis Widget */}
          <div className="rule-card">
            <div className="rule-header">
              <div className="rule-title">
                <Compass size={17} style={{ color: '#F3CA65' }} />
                Diagnóstico de la Regla Financiera 50 / 30 / 20
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAutoSuggestBudgets}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '7px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'linear-gradient(135deg, rgba(243, 202, 101, 0.15) 0%, rgba(201, 168, 76, 0.25) 100%)',
                  border: '1px solid rgba(243, 202, 101, 0.35)',
                  color: '#F3CA65',
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Sparkles size={14} />
                <span>Cálculo automático de límites inteligentes</span>
              </button>
            </div>

            <div className="rule-grid">
              {/* Needs 50% */}
              <div className="rule-pillar">
                <div className="pillar-header">
                  <span className="pillar-name">🏠 Necesidades (Target: 50%)</span>
                  <span className="pillar-pct" style={{ color: rule503020.needsPercent <= 50 ? '#34D399' : '#F87171' }}>
                    {rule503020.needsPercent}%
                  </span>
                </div>
                <div className="pillar-bar-bg">
                  <div
                    className="pillar-bar-fill"
                    style={{
                      width: `${Math.min(100, (rule503020.needsPercent / 50) * 100)}%`,
                      background: rule503020.needsPercent <= 50 ? '#34D399' : '#F87171'
                    }}
                  />
                </div>
                <div className="pillar-target">
                  <span>Gastado: {formatCurrency(rule503020.needsSpent)}</span>
                  <span>Ideal: {formatCurrency(rule503020.needsTarget)}</span>
                </div>
              </div>

              {/* Wants 30% */}
              <div className="rule-pillar">
                <div className="pillar-header">
                  <span className="pillar-name">🍿 Deseos & Ocio (Target: 30%)</span>
                  <span className="pillar-pct" style={{ color: rule503020.wantsPercent <= 30 ? '#34D399' : '#FBBF24' }}>
                    {rule503020.wantsPercent}%
                  </span>
                </div>
                <div className="pillar-bar-bg">
                  <div
                    className="pillar-bar-fill"
                    style={{
                      width: `${Math.min(100, (rule503020.wantsPercent / 30) * 100)}%`,
                      background: rule503020.wantsPercent <= 30 ? '#34D399' : '#FBBF24'
                    }}
                  />
                </div>
                <div className="pillar-target">
                  <span>Gastado: {formatCurrency(rule503020.wantsSpent)}</span>
                  <span>Ideal: {formatCurrency(rule503020.wantsTarget)}</span>
                </div>
              </div>

              {/* Savings & Debt 20% */}
              <div className="rule-pillar">
                <div className="pillar-header">
                  <span className="pillar-name">💎 Ahorro & Deuda (Target: 20%)</span>
                  <span className="pillar-pct" style={{ color: rule503020.savingsPercent >= 20 ? '#34D399' : '#FBBF24' }}>
                    {rule503020.savingsPercent}%
                  </span>
                </div>
                <div className="pillar-bar-bg">
                  <div
                    className="pillar-bar-fill"
                    style={{
                      width: `${Math.min(100, (rule503020.savingsPercent / 20) * 100)}%`,
                      background: rule503020.savingsPercent >= 20 ? '#34D399' : '#C9A84C'
                    }}
                  />
                </div>
                <div className="pillar-target">
                  <span>Retenido: {formatCurrency(rule503020.savingsSpent)}</span>
                  <span>Ideal: {formatCurrency(rule503020.savingsTarget)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Smart Limits Automatic Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(201, 168, 76, 0.1) 0%, rgba(20, 20, 28, 0.85) 100%)',
            border: '1px solid rgba(201, 168, 76, 0.25)',
            borderRadius: 14,
            padding: '12px 18px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Sparkles size={18} style={{ color: '#F3CA65' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>
                  Límites Sugeridos Calculados Automáticamente
                </div>
                <div style={{ fontSize: 11.5, color: '#9CA3AF' }}>
                  Determinados por tus ingresos y gastos reales. Las categorías sin gastos se descartan para mayor claridad.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowAllCategories(prev => !prev)}
                style={{
                  fontSize: 11.5,
                  padding: '6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#D1D5DB',
                }}
              >
                <Filter size={13} />
                <span>{showAllCategories ? 'Ocultar categorías sin gastos' : 'Ver todas las categorías'}</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAutoSuggestBudgets}
                style={{
                  fontSize: 11.5,
                  padding: '6px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'linear-gradient(135deg, rgba(243, 202, 101, 0.2) 0%, rgba(201, 168, 76, 0.25) 100%)',
                  border: '1px solid rgba(243, 202, 101, 0.4)',
                  color: '#F3CA65',
                  fontWeight: 700,
                }}
              >
                <Sparkles size={13} />
                <span>Actualizar Límites</span>
              </button>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="budgets-grid">
            {(showAllCategories ? budgetStatuses : budgetStatuses.filter(b => b.limit > 0 || b.spent > 0)).map(status => {
              const meta = CATEGORY_META[status.category]
              return (
                <div key={status.category} className={`budget-card ${status.status}`}>
                  <div className="budget-top">
                    <div className="budget-cat-info">
                      <div className="budget-cat-icon">{meta.icon}</div>
                      <div>
                        <div className="budget-cat-title">{meta.label}</div>
                        <div className="budget-amounts">
                          <span className="budget-spent">{formatCurrency(status.spent)}</span>
                          <span className="budget-limit">/ {status.limit > 0 ? formatCurrency(status.limit) : 'Sin límite'}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      className="tx-action-btn"
                      title="Editar límite mensual"
                      onClick={() => handleStartEditBudget(status.category, status.limit)}
                    >
                      <Edit3 size={14} />
                    </button>
                  </div>

                  <div className="budget-bar-bg">
                    <div
                      className={`budget-bar-fill ${status.status}`}
                      style={{ width: `${Math.min(100, status.percentUsed)}%` }}
                    />
                  </div>

                  <div className="budget-footer">
                    <span className={`budget-status-tag status-tag-${status.status}`}>
                      {status.status === 'exceeded'
                        ? 'Sobregiro'
                        : status.status === 'danger'
                          ? 'Al Límite (90%+)'
                          : status.status === 'warning'
                            ? 'Atención (70%+)'
                            : 'Bajo Control'}
                    </span>
                    <span style={{ fontFamily: 'Space Mono', color: '#717182' }}>
                      {status.limit > 0 ? `${status.percentUsed}% (${formatCurrency(status.remaining)} libre)` : '0%'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <>
          {/* Top KPI Metrics for Goals */}
          <div className="kpi-grid">
            <div className="kpi-card emerald">
              <div className="kpi-top">
                <span className="kpi-label">Total Ahorrado</span>
                <span className="kpi-icon">💰</span>
              </div>
              <div className="kpi-value emerald">{formatCurrency(totalSavedInGoals)}</div>
              <div className="kpi-sub">Acumulado en todas las metas</div>
            </div>

            <div className="kpi-card gold">
              <div className="kpi-top">
                <span className="kpi-label">Objetivo Global</span>
                <span className="kpi-icon">🏆</span>
              </div>
              <div className="kpi-value gold">{formatCurrency(totalTargetInGoals)}</div>
              <div className="kpi-sub">
                {totalTargetInGoals > 0 ? `${Math.round((totalSavedInGoals / totalTargetInGoals) * 100)}% alcanzado` : '0%'}
              </div>
            </div>

            <div className="kpi-card amber">
              <div className="kpi-top">
                <span className="kpi-label">Metas Cumplidas</span>
                <span className="kpi-icon">✅</span>
              </div>
              <div className="kpi-value amber">{completedGoalsCount} / {savingsGoals.length}</div>
              <div className="kpi-sub">Objetivos alcanzados con éxito</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <h2 className="section-title" style={{ margin: 0 }}>Tus Metas y Fondos Activos</h2>
            <button className="btn btn-primary" onClick={() => handleOpenGoalModal()}>
              <Plus size={15} /> Nueva Meta de Ahorro
            </button>
          </div>

          {/* Goals Grid */}
          <div className="goals-grid">
            {savingsGoals.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                <p className="empty-title">Sin metas de ahorro creadas</p>
                <p className="empty-text">Crea tu primera meta para proyectar el crecimiento de tu patrimonio.</p>
                <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => handleOpenGoalModal()}>
                  <Plus size={14} /> Crear Meta Ahora
                </button>
              </div>
            ) : (
              savingsGoals.map(goal => {
                const meta = GOAL_META[goal.category] || GOAL_META.other
                const projection = calculateSavingsGoalProjection(goal, Math.max(0, netBalance))
                return (
                  <div key={goal.id} className="goal-card" style={{ borderLeftColor: goal.color || '#34D399' }}>
                    <div className="goal-header">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 18 }}>{meta.icon}</span>
                          <span className="goal-title">{goal.name}</span>
                        </div>
                        <span className="goal-category-badge">{meta.label}</span>
                      </div>

                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="tx-action-btn" onClick={() => handleOpenGoalModal(goal)} title="Editar">
                          <Edit3 size={14} />
                        </button>
                        <button className="tx-action-btn" onClick={() => onDeleteSavingsGoal(goal.id)} title="Eliminar">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="goal-amounts-row">
                        <span className="goal-current-val" style={{ color: goal.color || '#34D399' }}>
                          {formatCurrency(goal.currentAmount)}
                        </span>
                        <span className="goal-target-val">
                          de {formatCurrency(goal.targetAmount)} ({projection.percentCompleted}%)
                        </span>
                      </div>

                      <div className="budget-bar-bg" style={{ marginTop: 6 }}>
                        <div
                          className="budget-bar-fill"
                          style={{
                            width: `${projection.percentCompleted}%`,
                            background: `linear-gradient(90deg, ${goal.color || '#34D399'} 0%, #059669 100%)`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="goal-eta-badge">
                      {goal.isCompleted ? (
                        <>
                          <CheckCircle2 size={15} style={{ color: '#34D399' }} />
                          <span style={{ color: '#34D399' }}>¡Meta 100% completada!</span>
                        </>
                      ) : (
                        <>
                          <Calendar size={14} />
                          <span>ETA Estimada: <strong>{projection.projectedCompletionDate}</strong></span>
                        </>
                      )}
                    </div>

                    {/* Quick Deposit Actions */}
                    {!goal.isCompleted && (
                      <div className="goal-quick-deposit">
                        <button className="deposit-btn" onClick={() => handleQuickDeposit(goal.id, 1000)}>
                          +1k
                        </button>
                        <button className="deposit-btn" onClick={() => handleQuickDeposit(goal.id, 5000)}>
                          +5k
                        </button>
                        <button className="deposit-btn" onClick={() => handleQuickDeposit(goal.id, 10000)}>
                          +10k
                        </button>
                        <button
                          className="deposit-btn"
                          style={{ color: '#F3CA65', borderColor: 'rgba(243, 202, 101, 0.3)' }}
                          onClick={() => { setDepositGoalId(goal.id); setDepositAmount('') }}
                        >
                          + Otro
                        </button>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </>
      )}

      {/* Modal: Editar Límite de Presupuesto */}
      {editingCategory && (
        <div className="modal-overlay" onClick={() => setEditingCategory(null)}>
          <div className="modal-card" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Fijar Límite Mensual</h2>
              <button type="button" className="modal-close" onClick={() => setEditingCategory(null)} aria-label="Cerrar modal">
                <X size={16} />
              </button>
            </div>
            <div style={{ fontSize: 12.5, color: '#888898', marginBottom: 16 }}>
              Categoría: <strong style={{ color: '#FFFFFF' }}>{CATEGORY_META[editingCategory].label}</strong>
            </div>

            <div className="modal-form-group">
              <label className="modal-label">Monto Máximo Mensual</label>
              <input
                type="number"
                className="modal-input"
                placeholder="Ej: 15000"
                value={tempLimit}
                onChange={e => setTempLimit(e.target.value)}
                autoFocus
              />
            </div>

            <div className="modal-footer" style={{ marginTop: 20 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setEditingCategory(null)}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSaveBudget}>
                Guardar Límite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Crear / Editar Meta de Ahorro */}
      {isGoalModalOpen && (
        <div className="modal-overlay" onClick={() => setIsGoalModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{goalEditing ? 'Editar Meta' : 'Nueva Meta de Ahorro'}</h2>
              <button type="button" className="modal-close" onClick={() => setIsGoalModalOpen(false)} aria-label="Cerrar modal">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveGoal}>
              <div className="modal-form-group">
                <label className="modal-label">Nombre de la Meta</label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="Ej: Fondo de Emergencia, Vacaciones Europa..."
                  value={goalName}
                  onChange={e => setGoalName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="modal-form-group">
                  <label className="modal-label">Monto Objetivo ($)</label>
                  <input
                    type="number"
                    className="modal-input"
                    placeholder="100000"
                    value={goalTarget}
                    onChange={e => setGoalTarget(e.target.value)}
                    required
                  />
                </div>

                <div className="modal-form-group">
                  <label className="modal-label">Ahorro Actual ($)</label>
                  <input
                    type="number"
                    className="modal-input"
                    placeholder="0"
                    value={goalCurrent}
                    onChange={e => setGoalCurrent(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="modal-form-group">
                  <label className="modal-label">Aporte Mensual Planeado ($)</label>
                  <input
                    type="number"
                    className="modal-input"
                    placeholder="Ej: 10000"
                    value={goalMonthly}
                    onChange={e => setGoalMonthly(e.target.value)}
                  />
                </div>

                <div className="modal-form-group">
                  <label className="modal-label">Categoría</label>
                  <select
                    className="modal-select"
                    value={goalCategory}
                    onChange={e => setGoalCategory(e.target.value as GoalCategory)}
                  >
                    {Object.entries(GOAL_META).map(([key, item]) => (
                      <option key={key} value={key}>{item.icon} {item.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsGoalModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {goalEditing ? 'Actualizar Meta' : 'Crear Meta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Depósito Personalizado */}
      {depositGoalId && (
        <div className="modal-overlay" onClick={() => setDepositGoalId(null)}>
          <div className="modal-card" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Abonar a la Meta</h2>
              <button type="button" className="modal-close" onClick={() => setDepositGoalId(null)} aria-label="Cerrar modal">
                <X size={16} />
              </button>
            </div>

            <div className="modal-form-group">
              <label className="modal-label">Monto a Depositar ($)</label>
              <input
                type="number"
                className="modal-input"
                placeholder="Ej: 7500"
                value={depositAmount}
                onChange={e => setDepositAmount(e.target.value)}
                autoFocus
              />
            </div>

            <div className="modal-footer" style={{ marginTop: 18 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setDepositGoalId(null)}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primary" onClick={handleCustomDeposit}>
                Confirmar Abono
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
