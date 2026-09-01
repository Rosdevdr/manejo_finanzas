import type {
  Income,
  Expense,
  CashWithdrawal,
  CreditCard,
  CreditCardTransaction,
  CategoryBudget,
  SavingsGoal,
  ExpenseCategory,
} from '../types/finance'
import { formatCurrency } from './formatters'
import { evaluate503020Rule, calculateCategoryBudgetStatus } from './budgetAdvisor'
import { evaluateCardHealth } from './creditAdvisor'
import { calculateCumulativeBalance } from './calendar'

export interface FinancialSnapshot {
  currentPeriod: string
  incomes: Income[]
  expenses: Expense[]
  cashWithdrawals: CashWithdrawal[]
  creditCards: CreditCard[]
  creditTransactions: CreditCardTransaction[]
  categoryBudgets: CategoryBudget[]
  savingsGoals: SavingsGoal[]
}

export interface ChatMessage {
  id: string
  sender: 'user' | 'assistant'
  text: string
  timestamp: string
  suggestedActions?: string[]
}

export function generateAiFinancialResponse(prompt: string, snapshot: FinancialSnapshot): string {
  const { currentPeriod, incomes, expenses, cashWithdrawals, creditCards, creditTransactions, categoryBudgets, savingsGoals } = snapshot

  const cumulative = calculateCumulativeBalance(incomes, expenses, currentPeriod)
  const pIncomes  = incomes.filter(i => i.period === currentPeriod)
  const pExpenses = expenses.filter(e => e.period === currentPeriod)
  const pCash     = cashWithdrawals.filter(c => c.period === currentPeriod)
  const pTx       = creditTransactions.filter(t => t.period === currentPeriod)

  const totalIncome  = pIncomes.reduce((s, i) => s + i.amount, 0)
  const totalExpense = pExpenses.reduce((s, e) => s + e.amount, 0)
  const totalCash    = pCash.reduce((s, c) => s + c.amount, 0)
  const netBalance   = totalIncome - totalExpense
  const totalAvailable = cumulative.totalCumulativeBalance

  const rule503020 = evaluate503020Rule(incomes, expenses, netBalance, currentPeriod)
  const categories: ExpenseCategory[] = ['housing', 'food', 'transport', 'utilities', 'health', 'entertainment', 'education', 'debt', 'other']
  const budgetStatuses = categories.map(cat => {
    const budgetObj = categoryBudgets.find(b => b.category === cat)
    const limit = budgetObj ? budgetObj.limitAmount : 0
    return calculateCategoryBudgetStatus(cat, limit, pExpenses, currentPeriod)
  })
  const exceededBudgets = budgetStatuses.filter(b => b.status === 'exceeded')

  const totalCreditDebt = creditCards.reduce((acc, card) => {
    const health = evaluateCardHealth(card, creditTransactions)
    return acc + health.totalDebt
  }, 0)

  const lowerPrompt = prompt
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

  // 1. ¿Cuánto dinero puedo gastar este mes?
  if (lowerPrompt.includes('cuanto') && (lowerPrompt.includes('gastar') || lowerPrompt.includes('puedo gastar') || lowerPrompt.includes('disponible'))) {
    if (totalIncome === 0 && cumulative.carriedOverBalance <= 0) {
      return `Actualmente no tienes ingresos registrados para el período **${currentPeriod}**. Te sugiero registrar primero tu sueldo o fuentes de ingresos para calcular con precisión tu margen de gasto seguro.`
    }

    const baseFunds = totalIncome > 0 ? totalIncome : cumulative.carriedOverBalance
    const maxRecommendedExpense = baseFunds * 0.80
    const remainingSpendCapacity = Math.max(0, totalAvailable - (baseFunds * 0.20))

    return `### 💡 Margen de Gasto Disponible (${currentPeriod})

Basándome en tus datos de este mes:

• **Ingresos del Mes:** \`${formatCurrency(totalIncome)}\`
${cumulative.carriedOverBalance !== 0 ? `• **Saldo Arrastrado del Mes Anterior:** \`${formatCurrency(cumulative.carriedOverBalance)}\`\n` : ''}• **Total Disponible Real:** **\`${formatCurrency(totalAvailable)}\`**
• **Gastos Acumulados:** \`${formatCurrency(totalExpense)}\`
• **Balance Neto del Mes:** \`${formatCurrency(netBalance)}\`

**🎯 Recomendación del Asesor IA:**
1. **Límite de Gasto Seguro (80% del disponible):** Tu techo de gasto recomendado es **\`${formatCurrency(maxRecommendedExpense)}\`**.
2. **Capacidad de Gasto Restante:** Aún puedes gastar hasta **\`${formatCurrency(remainingSpendCapacity)}\`** sin comprometer tu fondo de reserva de ahorro (20%).
3. ${totalAvailable <= 0 ? `⚠️ **Atención:** Actualmente tu saldo disponible se encuentra en cero o déficit. Te sugiero pausar compras no esenciales.` : `✅ Mantienes un saldo disponible positivo de \`${formatCurrency(totalAvailable)}\`.`}`
  }

  // 2. ¿Cuánto debería ahorrar?
  if (lowerPrompt.includes('ahorrar') || lowerPrompt.includes('ahorro') || lowerPrompt.includes('cuanto ahorro')) {
    const recommended20 = totalIncome * 0.20
    const totalGoalsSaved = savingsGoals.reduce((s, g) => s + g.currentAmount, 0)
    const totalGoalsTarget = savingsGoals.reduce((s, g) => s + g.targetAmount, 0)

    return `### 🛡️ Plan y Estrategia de Ahorro (${currentPeriod})

Siguiendo las mejores prácticas financieras internacionales (Regla 50/30/20):

• **Ahorro Mensual Recomendado (20%):** **\`${formatCurrency(recommended20)}\`** al mes.
• **Capacidad de Ahorro Real Actual:** \`${formatCurrency(Math.max(0, netBalance))}\`
• **Progreso en Metas:** Has acumulado \`${formatCurrency(totalGoalsSaved)}\` de \`${formatCurrency(totalGoalsTarget)}\` acumulados en tus metas activas.

**📌 Sugerencia de Distribución de tu Ahorro:**
1. **Fondo de Emergencia (3 a 6 meses de gastos):** Cubre hasta \`${formatCurrency(totalExpense * 3)}\`.
2. **Inversiones / Patrimonio:** Destina el excedente a activos que generen rendimiento.
3. **Metas Corto Plazo:** Automátiza depósitos mensuales a tus metas activas en la sección de Presupuestos.`
  }

  // 3. Evaluación de Decisión de Compra (Hardware, Ocio, Tecnología, Desembolsos)
  if (
    lowerPrompt.includes('comprar') ||
    lowerPrompt.includes('comprarme') ||
    lowerPrompt.includes('factible') ||
    lowerPrompt.includes('adquirir') ||
    lowerPrompt.includes('tarjeta grafica') ||
    lowerPrompt.includes('tarjeta de video') ||
    lowerPrompt.includes('diferencia') ||
    lowerPrompt.includes('audifonos')
  ) {
    const availableFunds = cumulative.totalCumulativeBalance
    const carriedOver = cumulative.carriedOverBalance

    // Extraer montos numéricos relevantes de la consulta
    const foundNumbers = prompt.match(/\b\d{1,3}(?:[.,]\d{3})*(?:\.\d+)?\b/g)
      ?.map(n => parseFloat(n.replace(/,/g, '')))
      ?.filter(n => !isNaN(n) && n >= 500) || []

    const targetAmount = foundNumbers.length > 0 ? foundNumbers[0] : 5000
    const secondAmount = foundNumbers.length > 1 ? foundNumbers[1] : undefined
    const totalOutlay = secondAmount ? targetAmount + secondAmount : targetAmount

    const remainingAfterPurchase = availableFunds - totalOutlay
    const isViable = remainingAfterPurchase >= 0
    const isTight = remainingAfterPurchase >= 0 && remainingAfterPurchase < (availableFunds * 0.35)

    return `### 🎯 Evaluación de Factibilidad de Compra (${currentPeriod})

Analizando la consulta con tus datos financieros reales:

• **Total Disponible Real Acumulado:** **\`${formatCurrency(availableFunds)}\`**
${carriedOver > 0 ? `• **Saldo Arrastrado del Mes Anterior:** \`${formatCurrency(carriedOver)}\` (Fondo de respaldo)\n` : ''}• **Desembolso Estimado:** **\`${formatCurrency(totalOutlay)}\`**${secondAmount ? ` (\`${formatCurrency(targetAmount)}\` + \`${formatCurrency(secondAmount)}\`)` : ''}
• **Margen Restante tras la compra:** **\`${formatCurrency(remainingAfterPurchase)}\`**

**💡 Veredicto y Recomendaciones del Asesor:**
1. ${!isViable
  ? `⚠️ **Precaución (Te dejaría en déficit):** Con un desembolso de \`${formatCurrency(totalOutlay)}\`, sobrepasas tu saldo disponible actual de \`${formatCurrency(availableFunds)}\` por **\`${formatCurrency(Math.abs(remainingAfterPurchase))}\`**. Te sugiero esperar a recibir tu próximo ingreso de nómina antes de realizar el gasto.`
  : isTight
  ? `🟡 **Factible pero Ajustado:** Puedes realizar el gasto de \`${formatCurrency(totalOutlay)}\`, pero tu saldo disponible se reducirá a **\`${formatCurrency(remainingAfterPurchase)}\`**. Te dejará con poco margen para imprevistos hasta tu próximo cobro.`
  : `✅ **Completamente Viable:** El desembolso de \`${formatCurrency(totalOutlay)}\` está bien cubierto y mantendrás un colchón disponible de **\`${formatCurrency(remainingAfterPurchase)}\`**.`}
2. **🛡️ Regla de Oro de Liquidez:** Si la compra depende de vender un artículo anterior, **asegura y cobra primero la venta** antes de pagar el nuevo artículo.
3. **📅 Plan de Acción:** Si decides comprarlo, asegúrate de mantener intactos los fondos para tus compromisos fijos esenciales.`
  }

  // 4. Deudas y Tarjetas de Crédito Bancarias
  const isCreditCardQuery = (
    lowerPrompt.includes('deuda') ||
    lowerPrompt.includes('tarjeta de credito') ||
    lowerPrompt.includes('tarjetas de credito') ||
    lowerPrompt.includes('credito') ||
    lowerPrompt.includes('banco')
  ) && !lowerPrompt.includes('tarjeta grafica') && !lowerPrompt.includes('tarjeta de video')

  if (isCreditCardQuery) {
    const totalCreditLimit = creditCards.reduce((s, c) => s + c.creditLimit, 0)
    const globalUsagePct   = totalCreditLimit > 0 ? Math.round((totalCreditDebt / totalCreditLimit) * 100) : 0

    return `### 💳 Diagnóstico y Plan de Deudas

• **Deuda Total Acumulada en Tarjetas:** **\`${formatCurrency(totalCreditDebt)}\`**
• **Límite Total de Crédito:** \`${formatCurrency(totalCreditLimit)}\`
• **Uso Global de Línea:** \`${globalUsagePct}%\` ${globalUsagePct > 30 ? '⚠️ (Por encima del 30% recomendado)' : '✅ (Nivel óptimo de utilización)'}
• **Consumos del Mes Actual:** \`${pTx.length}\` transacciones registradas por \`${formatCurrency(pTx.reduce((s, t) => s + t.amount, 0))}\`.

**⚡ Estrategia de Liquidación Recomendada (Método Avalancha):**
1. Ordena tus tarjetas de mayor a menor tasa de interés.
2. Realiza siempre el pago total del mes (no el pago mínimo) para evitar cargos por financiamiento.
3. Destina cualquier excedente de tu balance neto (\`${formatCurrency(Math.max(0, netBalance))}\`) a cancelar primero la tarjeta con mayor tasa de interés.`
  }

  // 4. Regla 50/30/20 y Presupuestos por Categoría
  if (lowerPrompt.includes('50/30/20') || lowerPrompt.includes('regla') || lowerPrompt.includes('presupuesto') || lowerPrompt.includes('categoria')) {
    return `### 📊 Diagnóstico de la Regla Financiera 50 / 30 / 20

• **🏠 Necesidades (Target 50%):** \`${rule503020.needsPercent}%\` (\`${formatCurrency(rule503020.needsSpent)}\`) ${rule503020.needsPercent <= 50 ? '✅ En rango' : '⚠️ Excedido'}
• **🍿 Deseos / Ocio (Target 30%):** \`${rule503020.wantsPercent}%\` (\`${formatCurrency(rule503020.wantsSpent)}\`) ${rule503020.wantsPercent <= 30 ? '✅ En rango' : '⚠️ Excedido'}
• **🎯 Ahorro & Deuda (Target 20%):** \`${rule503020.savingsPercent}%\` (\`${formatCurrency(rule503020.savingsSpent)}\`) ${rule503020.savingsPercent >= 20 ? '✅ Excelente' : '⚠️ Ajustar'}

${exceededBudgets.length > 0
  ? `🚨 **Categorías que han superado su límite:**\n` + exceededBudgets.map(b => `• **${b.category}:** gastado \`${formatCurrency(b.spent)}\` vs límite \`${formatCurrency(b.limit)}\``).join('\n')
  : '✅ Todas tus categorías de presupuesto se encuentran dentro de sus límites establecidos.'}`
  }

  // 5. Previsión y Pronóstico de Flujo de Caja (Cash Flow Forecasting)
  if (lowerPrompt.includes('flujo de caja') || lowerPrompt.includes('pronostico') || lowerPrompt.includes('forecasting') || lowerPrompt.includes('proyeccion') || lowerPrompt.includes('liquidez')) {
    const monthlyNetRate = netBalance
    const proj30Days = Math.max(0, monthlyNetRate)
    const proj60Days = Math.max(0, monthlyNetRate * 2)
    const proj90Days = Math.max(0, monthlyNetRate * 3)

    return `### 📈 Previsión y Pronóstico de Flujo de Caja (Cash Flow Forecasting)

Evaluando la velocidad de entrada y salida de fondos para los próximos 90 días:

• **Tasa Neta Mensual Actual:** **\`${formatCurrency(monthlyNetRate)}\`**
• **Proyección a 30 días:** \`${formatCurrency(proj30Days)}\` de súperavit acumulado estimado.
• **Proyección a 60 días:** \`${formatCurrency(proj60Days)}\`
• **Proyección a 90 días:** \`${formatCurrency(proj90Days)}\`

**🧠 Análisis de Competencia Técnica en Liquidez:**
1. **Runway Estimado:** Con tu ritmo de gasto actual de \`${formatCurrency(totalExpense)}\`/mes, mantienes una reserva operativa sólida.
2. **Control de Varianza:** Para mantener la previsión exacta, monitorea los cobros o ingresos variables a mitad de período.`
  }

  // 6. Métricas SaaS / Recurrentes (MRR, ARR, Churn, LTV, CAC)
  if (lowerPrompt.includes('mrr') || lowerPrompt.includes('arr') || lowerPrompt.includes('churn') || lowerPrompt.includes('suscripcion') || lowerPrompt.includes('ltv') || lowerPrompt.includes('cac') || lowerPrompt.includes('recurrente')) {
    const recurringIncome  = pIncomes.filter(i => i.type === 'salary').reduce((s, i) => s + i.amount, 0)
    const arrEstimate      = recurringIncome * 12
    const fixedSubExpenses = pExpenses.filter(e => e.type === 'fixed').reduce((s, e) => s + e.amount, 0)
    const subRatio         = totalIncome > 0 ? Math.round((fixedSubExpenses / totalIncome) * 100) : 0

    return `### 🚀 Métricas Financieras Recurrentes & SaaS (MRR / ARR / Churn)

Aplicando métricas avanzadas de economía recurrente a tu modelo financiero:

• **Ingreso Mensual Recurrente (MRR Equivalente):** **\`${formatCurrency(recurringIncome)}\`**
• **Ingreso Anualizado Proyectado (ARR Equivalente):** \`${formatCurrency(arrEstimate)}\`
• **Ratio de Gastos Fijos/Suscripciones:** \`${subRatio}%\` de tus ingresos.
• **Gasto Fijo Recurrente:** \`${formatCurrency(fixedSubExpenses)}\`

**🎯 Principios de Gestión de Retención & Costos:**
1. **Auditoría de Churn de Suscripciones:** Identifica servicios o licencias en la nube no utilizadas y realiza una cancelación inmediata para reducir el consumo fantasma.
2. **Reconocimiento de Ingresos:** Si recibes cobros o bonos anticipados, divídelos en el cálculo mensual para no inflar tu presupuesto mensual.`
  }

  // 7. Negociación de Contratos y Optimización de Costos
  if (lowerPrompt.includes('negociar') || lowerPrompt.includes('contrato') || lowerPrompt.includes('proveedor') || lowerPrompt.includes('costos') || lowerPrompt.includes('optimizacion')) {
    return `### 🤝 Estrategia de Negociación de Contratos & Optimización de Costos

Basado en habilidades estratégicas de compras y negociación de servicios:

• **Potencial de Optimización en Gastos Variables:** \`${formatCurrency(totalExpense * 0.15)}\` (15% estimado de reducción posible).

**📋 Pasos Tácticos para Negociar Mejor:**
1. **Benchmark de Mercado:** Solicita al menos 2 cotizaciones alternativas antes de renovar contratos anuales o servicios fijos.
2. **Descuento por Pago Anual vs. Mensual:** Negocia un descuento del 10% al 20% si pagas licencias o seguros de forma anual anticipada.
3. **Revisión de Términos:** Elimina cláusulas de renovación automática en servicios que no sean críticos.`
  }

  // 8. Análisis General de Salud Financiera
  if (lowerPrompt.includes('salud') || lowerPrompt.includes('general') || lowerPrompt.includes('analisis') || lowerPrompt.includes('resumen')) {
    const healthScore = totalIncome > 0
      ? Math.max(0, Math.min(100, Math.round(((netBalance / totalIncome) * 50) + ((1 - Math.min(1, totalCreditDebt / (totalIncome * 2))) * 50))))
      : 50

    return `### 📊 Análisis Integral de Salud Financiera (${currentPeriod})

• **Score de Salud Financiera:** **\`${healthScore} / 100\`** ${healthScore >= 75 ? '🟢 Excelente' : healthScore >= 50 ? '🟡 Aceptable' : '🔴 Requiere Atención'}
• **Ingresos Registrados:** \`${formatCurrency(totalIncome)}\`
• **Gastos Totales:** \`${formatCurrency(totalExpense)}\`
• **Margen Neto Libre:** \`${formatCurrency(netBalance)}\`
• **Retiros en Efectivo:** \`${formatCurrency(totalCash)}\` (${pCash.length} retiros)

**💡 Recomendación Ejecutiva:**
1. Manten un margen disponible positivo superior al 20% de tus ingresos.
2. Evita gastar en efectivo sin categorizar para mantener la trazabilidad de tus finanzas.
3. Revisa tus tarjetas de crédito y asegúrate de pagar la totalidad de la fecha de corte.`
  }

  // 9. Respuesta General Inteligente Adaptada a las Preguntas del Usuario
  return `Entiendo tu consulta sobre **"${prompt}"**. 

Analizando tu situación financiera para **${currentPeriod}**:
• Tienes un ingreso total de **\`${formatCurrency(totalIncome)}\`** y gastos de **\`${formatCurrency(totalExpense)}\`**.
• Tu balance neto libre actual es de **\`${formatCurrency(netBalance)}\`**.
• Mantienes **\`${savingsGoals.length}\`** metas de ahorro activas y **\`${creditCards.length}\`** tarjetas de crédito registradas.

Si deseas una recomendación específica, me puedes preguntar sobre:
1. *"¿Cuánto puedo gastar este mes?"*
2. *"¿Cuánto debería ahorrar?"*
3. *"Pronóstico de flujo de caja a 30 días"*
4. *"Análisis de suscripciones y métricas MRR"*
5. *"Estrategia para negociar contratos y costos"*`
}
