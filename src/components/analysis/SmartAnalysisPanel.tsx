import { useState, type ReactNode } from 'react'
import {
  Wallet,
  PiggyBank,
  PieChart,
  ShieldCheck,
  AlertTriangle,
  Calculator,
  Calendar,
  Home,
  Utensils,
  Car,
  Zap,
  HeartPulse,
  Gamepad2,
  GraduationCap,
  CreditCard,
  Package,
  Lock,
  SlidersHorizontal,
} from 'lucide-react'
import type {
  Income,
  Expense,
  CreditCard as CreditCardType,
  CreditCardTransaction,
  CashWithdrawal,
  ExpenseCategory,
} from '../../types/finance'
import { formatCurrency } from '../../utils/formatters'
import { sanitizeAmount } from '../../utils/security'
import './SmartAnalysisPanel.css'

interface SmartAnalysisPanelProps {
  incomes: Income[]
  expenses: Expense[]
  creditCards?: CreditCardType[]
  creditTransactions?: CreditCardTransaction[]
  cashWithdrawals?: CashWithdrawal[]
  currentPeriod: string
  availableBalance?: number
}

interface CategoryRule {
  category: ExpenseCategory
  label: string
  recommendedShare: number // % of total income
  bucket: 'needs' | 'wants'
  icon: ReactNode
  color: string
}

const RECOMMENDED_CATEGORY_RULES: CategoryRule[] = [
  { category: 'housing',       label: 'Vivienda / Alquiler', recommendedShare: 0.25, bucket: 'needs', icon: <Home size={15} />,          color: '#60A5FA' },
  { category: 'food',          label: 'Alimentación',        recommendedShare: 0.15, bucket: 'needs', icon: <Utensils size={15} />,      color: '#34D399' },
  { category: 'utilities',     label: 'Servicios Básicos',   recommendedShare: 0.05, bucket: 'needs', icon: <Zap size={15} />,           color: '#38BDF8' },
  { category: 'health',        label: 'Salud & Prevención',  recommendedShare: 0.05, bucket: 'needs', icon: <HeartPulse size={15} />,    color: '#F87171' },
  { category: 'transport',     label: 'Transporte',          recommendedShare: 0.10, bucket: 'wants', icon: <Car size={15} />,           color: '#FBBF24' },
  { category: 'entertainment', label: 'Entretenimiento',     recommendedShare: 0.07, bucket: 'wants', icon: <Gamepad2 size={15} />,      color: '#A78BFA' },
  { category: 'education',     label: 'Educación',           recommendedShare: 0.05, bucket: 'wants', icon: <GraduationCap size={15} />, color: '#C9A84C' },
  { category: 'debt',          label: 'Deudas / Cuotas',     recommendedShare: 0.05, bucket: 'wants', icon: <CreditCard size={15} />,    color: '#FB7185' },
  { category: 'other',         label: 'Otros / Imprevistos', recommendedShare: 0.03, bucket: 'wants', icon: <Package size={15} />,       color: '#94A3B8' },
]

export function SmartAnalysisPanel({
  incomes,
  expenses,
  cashWithdrawals = [],
  currentPeriod,
  availableBalance: propAvailableBalance,
}: SmartAnalysisPanelProps) {
  const [simulatedExpense, setSimulatedExpense] = useState('')

  // Datos del período activo
  const totalIncomes = incomes.reduce((s, i) => s + i.amount, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const totalCash = cashWithdrawals.reduce((s, c) => s + c.amount, 0)
  const totalOutflow = totalExpenses + totalCash

  const fixedExpenses = expenses.filter(e => e.type === 'fixed').reduce((s, e) => s + e.amount, 0)
  const variableExpenses = expenses.filter(e => e.type === 'variable').reduce((s, e) => s + e.amount, 0) + totalCash

  // Liquidez disponible real (nunca menor que 0 para capacidad de gasto)
  const rawBalance = propAvailableBalance !== undefined ? propAvailableBalance : (totalIncomes - totalOutflow)
  const safeAvailableBalance = Math.max(0, rawBalance)

  // Días restantes del mes para calcular cuánto gastar por día
  const now = new Date()
  const [yearNum, monthNum] = currentPeriod.split('-').map(Number)
  const daysInMonth = new Date(yearNum || now.getFullYear(), monthNum || now.getMonth() + 1, 0).getDate()
  const isCurrentRealMonth =
    now.getFullYear() === yearNum && now.getMonth() + 1 === monthNum
  const currentDay = isCurrentRealMonth ? now.getDate() : 15
  const remainingDays = Math.max(1, daysInMonth - currentDay + 1)

  // 1. EVALUACIÓN: CUÁNTO GASTAR
  // Presupuesto máximo de gasto saludable = 80% de ingresos del mes (reservando 20% de ahorro)
  const recommendedMaxSpend = totalIncomes * 0.80
  const remainingBudgetSpend = Math.max(0, recommendedMaxSpend - totalOutflow)
  // El usuario nunca puede gastar más de su saldo disponible real
  const safeSpendableAfterSavings = Math.min(safeAvailableBalance, remainingBudgetSpend > 0 ? remainingBudgetSpend : safeAvailableBalance)
  const safeDailyAllowance = safeSpendableAfterSavings / remainingDays
  const maxDailyHardCap = safeAvailableBalance / remainingDays

  // Evaluador rápido de un gasto puntual
  const parsedSimulated = sanitizeAmount(simulatedExpense)
  const exceedsAvailable = parsedSimulated > safeAvailableBalance
  const compromisesSavings = !exceedsAvailable && parsedSimulated > safeSpendableAfterSavings

  // 2. EVALUACIÓN: CUÁNTO AHORRAR
  const recommendedSavingsOptimal = totalIncomes * 0.20 // 20% regla 50/30/20
  const recommendedSavingsMinimum = totalIncomes * 0.10 // 10% piso prudencial
  const currentPeriodSurplus = Math.max(0, totalIncomes - totalOutflow)
  const savingsRatePct = totalIncomes > 0 ? Math.max(0, (currentPeriodSurplus / totalIncomes) * 100) : 0

  // 3. EVALUACIÓN: PRESUPUESTO RECOMENDADO (50 / 30 / 20 + CATEGORÍAS)
  const needsBudget50 = totalIncomes * 0.50
  const wantsBudget30 = totalIncomes * 0.30
  const savingsBudget20 = recommendedSavingsOptimal

  const categoryTotals: Record<string, number> = {}
  for (const exp of expenses) {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount
  }

  return (
    <div className="analysis-container">
      {/* Encabezado limpio enfocado únicamente en Gasto, Ahorro y Presupuesto */}
      <div className="analysis-header">
        <div>
          <h2 className="view-title" style={{ margin: 0, fontSize: 22 }}>
            Evaluador IA de Gasto, Ahorro y Presupuesto
          </h2>
          <p className="view-subtitle" style={{ margin: '4px 0 0' }}>
            Cálculo algorítmico para el período <strong>{currentPeriod}</strong> basado en tu saldo disponible e ingresos reales
          </p>
        </div>
      </div>

      {/* ── SECCIÓN 1 Y 2: CUÁNTO GASTAR & CUÁNTO AHORRAR ── */}
      <div className="analysis-pillars-grid">
        {/* PILAR 1: CUÁNTO GASTAR */}
        <section className="analysis-advisor-card">
          <div className="analysis-card-header">
            <span className="analysis-pillar-badge gold">
              <Wallet size={17} />
            </span>
            <div>
              <h3 className="analysis-card-title">1. ¿Cuánto Puedes Gastar?</h3>
              <span className="analysis-card-subtitle">
                Límite operativo para no llevar tu saldo a negativo
              </span>
            </div>
          </div>

          <div className="analysis-kpi-highlight-row">
            <div className="analysis-kpi-highlight-box">
              <span className="analysis-kpi-label">Tope Máximo Disponible</span>
              <span className="analysis-kpi-value" style={{ color: safeAvailableBalance > 0 ? '#34D399' : '#F87171' }}>
                {formatCurrency(safeAvailableBalance)}
              </span>
              <span className="analysis-kpi-caption">
                Liquidez real (bloqueo activo contra saldo negativo)
              </span>
            </div>

            <div className="analysis-kpi-highlight-box">
              <span className="analysis-kpi-label">GastoRecomendado (Protegiendo Ahorro)</span>
              <span className="analysis-kpi-value" style={{ color: 'var(--gold-primary, #C9A84C)' }}>
                {formatCurrency(safeSpendableAfterSavings)}
              </span>
              <span className="analysis-kpi-caption">
                Margen libre dentro del 80% de tus ingresos
              </span>
            </div>
          </div>

          <div className="analysis-daily-allowance-strip">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={15} color="#38BDF8" />
              <span>
                Presupuesto diario sugerido ({remainingDays} días restantes):
              </span>
            </div>
            <strong className="analysis-mono-val">
              {formatCurrency(safeDailyAllowance)} / día
            </strong>
          </div>

          {/* Simulador rápido para evaluar un gasto antes de registrarlo */}
          <div className="analysis-spend-evaluator">
            <label htmlFor="ai-eval-spend-input" className="analysis-evaluator-label">
              <Calculator size={13} /> Evaluar si puedes realizar un gasto específico (RD$):
            </label>
            <input
              id="ai-eval-spend-input"
              type="number"
              min="0"
              step="100"
              className="aureus-adaptive-input compact"
              placeholder="Ingresa un monto a evaluar, ej: 15000"
              value={simulatedExpense}
              onChange={e => setSimulatedExpense(e.target.value)}
            />

            {parsedSimulated > 0 && (
              <div
                className={`analysis-eval-result ${
                  exceedsAvailable ? 'blocked' : compromisesSavings ? 'warning' : 'approved'
                }`}
              >
                {exceedsAvailable ? (
                  <>
                    <AlertTriangle size={15} />
                    <span>
                      <strong>No viable (Excede tu saldo):</strong> Gastar {formatCurrency(parsedSimulated)} supera tu saldo disponible de {formatCurrency(safeAvailableBalance)}. El sistema bloqueará este registro para evitar saldo negativo.
                    </span>
                  </>
                ) : compromisesSavings ? (
                  <>
                    <AlertTriangle size={15} />
                    <span>
                      <strong>Viable con precaución:</strong> Tienes saldo suficiente (quedarían {formatCurrency(safeAvailableBalance - parsedSimulated)}), pero superarías tu presupuesto ideal de gasto mensual ({formatCurrency(safeSpendableAfterSavings)}).
                    </span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={15} />
                    <span>
                      <strong>Gasto 100% Saludable:</strong> Puedes gastar {formatCurrency(parsedSimulated)} sin afectar tu meta de ahorro. Te quedarán {formatCurrency(safeAvailableBalance - parsedSimulated)} disponibles ({formatCurrency(Math.max(0, maxDailyHardCap - parsedSimulated / remainingDays))}/día).
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </section>

        {/* PILAR 2: CUÁNTO AHORRAR */}
        <section className="analysis-advisor-card">
          <div className="analysis-card-header">
            <span className="analysis-pillar-badge emerald">
              <PiggyBank size={17} />
            </span>
            <div>
              <h3 className="analysis-card-title">2. ¿Cuánto Deberías Ahorrar?</h3>
              <span className="analysis-card-subtitle">
                Metas de retención patrimonial según tus ingresos ({formatCurrency(totalIncomes)})
              </span>
            </div>
          </div>

          <div className="analysis-kpi-highlight-row">
            <div className="analysis-kpi-highlight-box">
              <span className="analysis-kpi-label">Ahorro Óptimo Recomendado (20%)</span>
              <span className="analysis-kpi-value" style={{ color: '#34D399' }}>
                {formatCurrency(recommendedSavingsOptimal)}
              </span>
              <span className="analysis-kpi-caption">
                Estándar patrimonial 50 / 30 / 20
              </span>
            </div>

            <div className="analysis-kpi-highlight-box">
              <span className="analysis-kpi-label">Ahorro Mínimo Prudencial (10%)</span>
              <span className="analysis-kpi-value" style={{ color: '#38BDF8' }}>
                {formatCurrency(recommendedSavingsMinimum)}
              </span>
              <span className="analysis-kpi-caption">
                Piso de reserva ante imprevistos
              </span>
            </div>
          </div>

          <div className="analysis-savings-status-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Excedente / Ahorro Actual del Mes ({savingsRatePct.toFixed(1)}%)
              </span>
              <span className="analysis-mono-val" style={{ color: currentPeriodSurplus >= recommendedSavingsOptimal ? '#34D399' : '#FBBF24' }}>
                {formatCurrency(currentPeriodSurplus)}
              </span>
            </div>

            <div className="analysis-progress-track">
              <div
                className="analysis-progress-fill"
                style={{
                  width: `${Math.min(100, recommendedSavingsOptimal > 0 ? (currentPeriodSurplus / recommendedSavingsOptimal) * 100 : 0)}%`,
                  background: currentPeriodSurplus >= recommendedSavingsOptimal ? '#34D399' : '#FBBF24',
                }}
              />
            </div>

            <p className="analysis-advice-box" style={{ marginTop: 12, marginBottom: 0 }}>
              {totalIncomes === 0 ? (
                'Registra tus ingresos del período para calcular automáticamente tu cuota de ahorro mensual.'
              ) : currentPeriodSurplus >= recommendedSavingsOptimal ? (
                `Excelente disciplina: tu flujo neto actual (${formatCurrency(currentPeriodSurplus)}) cubre el 20% de ahorro recomendado (${formatCurrency(recommendedSavingsOptimal)}) y mantiene un margen adicional de ${formatCurrency(currentPeriodSurplus - recommendedSavingsOptimal)}.`
              ) : currentPeriodSurplus >= recommendedSavingsMinimum ? (
                `Cumples el ahorro mínimo del 10% (${formatCurrency(recommendedSavingsMinimum)}). Para alcanzar la meta óptima del 20% (${formatCurrency(recommendedSavingsOptimal)}), evita gastar los próximos ${formatCurrency(recommendedSavingsOptimal - currentPeriodSurplus)}.`
              ) : (
                `Atención: tu margen actual (${formatCurrency(currentPeriodSurplus)}) está por debajo del 10% recomendado (${formatCurrency(recommendedSavingsMinimum)}). Limita nuevos gastos variables este mes.`
              )}
            </p>
          </div>
        </section>
      </div>

      {/* ── SECCIÓN 3: PRESUPUESTO RECOMENDADO (ESTRUCTURAL Y POR CATEGORÍAS) ── */}
      <section className="analysis-advisor-card" style={{ marginTop: 20 }}>
        <div className="analysis-card-header" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="analysis-pillar-badge blue">
              <PieChart size={17} />
            </span>
            <div>
              <h3 className="analysis-card-title">3. Presupuesto Mensual Recomendado</h3>
              <span className="analysis-card-subtitle">
                Distribución óptima 50% Necesidades Fijas · 30% Gastos Variables · 20% Ahorro y límites por categoría
              </span>
            </div>
          </div>
        </div>

        {/* 3 Bloques de la Regla 50 / 30 / 20 */}
        <div className="analysis-comparative-grid" style={{ marginBottom: 22 }}>
          <div className="analysis-metric-box">
            <div className="analysis-metric-top">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                <Lock size={13} color="#60A5FA" /> 50% Necesidades Fijas
              </span>
              <span style={{ color: fixedExpenses <= needsBudget50 ? '#34D399' : '#F87171', fontWeight: 700 }}>
                {fixedExpenses <= needsBudget50 ? 'En Rango' : 'Excedido'}
              </span>
            </div>
            <div className="analysis-metric-val">
              Sugerido: {formatCurrency(needsBudget50)}
            </div>
            <div className="analysis-metric-sub">
              Gastado actual: <strong>{formatCurrency(fixedExpenses)}</strong> (Disp: {formatCurrency(Math.max(0, needsBudget50 - fixedExpenses))})
            </div>
          </div>

          <div className="analysis-metric-box">
            <div className="analysis-metric-top">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                <SlidersHorizontal size={13} color="#FBBF24" /> 30% Gastos Variables
              </span>
              <span style={{ color: variableExpenses <= wantsBudget30 ? '#34D399' : '#F87171', fontWeight: 700 }}>
                {variableExpenses <= wantsBudget30 ? 'En Rango' : 'Excedido'}
              </span>
            </div>
            <div className="analysis-metric-val">
              Sugerido: {formatCurrency(wantsBudget30)}
            </div>
            <div className="analysis-metric-sub">
              Gastado actual: <strong>{formatCurrency(variableExpenses)}</strong> (Disp: {formatCurrency(Math.max(0, wantsBudget30 - variableExpenses))})
            </div>
          </div>

          <div className="analysis-metric-box">
            <div className="analysis-metric-top">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                <PiggyBank size={13} color="#34D399" /> 20% Ahorro Patrimonial
              </span>
              <span style={{ color: currentPeriodSurplus >= savingsBudget20 ? '#34D399' : '#FBBF24', fontWeight: 700 }}>
                {currentPeriodSurplus >= savingsBudget20 ? 'Meta Lograda' : 'En Progreso'}
              </span>
            </div>
            <div className="analysis-metric-val">
              Meta: {formatCurrency(savingsBudget20)}
            </div>
            <div className="analysis-metric-sub">
              Retenido actual: <strong>{formatCurrency(currentPeriodSurplus)}</strong>
            </div>
          </div>
        </div>

        {/* Tabla / Grid de Presupuesto Recomendado por Categoría con Iconos Lucide */}
        <div className="analysis-category-budget-grid">
          {RECOMMENDED_CATEGORY_RULES.map(rule => {
            const recommendedAmount = totalIncomes * rule.recommendedShare
            const actualSpent = categoryTotals[rule.category] || 0
            const remainingCat = Math.max(0, recommendedAmount - actualSpent)
            const usagePct = recommendedAmount > 0 ? (actualSpent / recommendedAmount) * 100 : (actualSpent > 0 ? 100 : 0)
            const isExceeded = actualSpent > recommendedAmount && recommendedAmount > 0

            return (
              <div key={rule.category} className="analysis-category-budget-row">
                <div className="analysis-cat-info">
                  <span
                    className="analysis-cat-icon"
                    style={{
                      color: rule.color,
                      background: `${rule.color}18`,
                      borderColor: `${rule.color}35`,
                    }}
                  >
                    {rule.icon}
                  </span>
                  <div>
                    <div className="analysis-cat-name">
                      {rule.label}
                      <span className="analysis-cat-share">({Math.round(rule.recommendedShare * 100)}%)</span>
                    </div>
                    <div className="analysis-cat-sub">
                      Gastado: <strong>{formatCurrency(actualSpent)}</strong> · Restante sugerido: <strong>{formatCurrency(remainingCat)}</strong>
                    </div>
                  </div>
                </div>

                <div className="analysis-cat-Right">
                  <div className="analysis-cat-amounts">
                    <span className="analysis-cat-target">
                      Tope sugerido: {formatCurrency(recommendedAmount)}
                    </span>
                    <span
                      className="analysis-cat-status"
                      style={{ color: isExceeded ? '#F87171' : usagePct > 85 ? '#FBBF24' : '#34D399' }}
                    >
                      {Math.round(usagePct)}%
                    </span>
                  </div>
                  <div className="analysis-progress-track">
                    <div
                      className="analysis-progress-fill"
                      style={{
                        width: `${Math.min(100, usagePct)}%`,
                        background: isExceeded ? '#F87171' : usagePct > 85 ? '#FBBF24' : rule.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
