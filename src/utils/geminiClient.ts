import type { FinancialSnapshot } from './aiAdvisorEngine'
import { formatCurrency } from './formatters'
import { calculateCumulativeBalance } from './calendar'
import { evaluate503020Rule } from './budgetAdvisor'
import { evaluateCardHealth } from './creditAdvisor'

const GEMINI_API_KEY_STORAGE = 'aureus_gemini_api_key'
const GEMINI_MODEL_STORAGE = 'aureus_gemini_model'

export function getStoredGeminiApiKey(): string {
  if (typeof window === 'undefined') return ''
  const stored = localStorage.getItem(GEMINI_API_KEY_STORAGE) || import.meta.env.VITE_GEMINI_API_KEY || ''
  return stored.trim().replace(/^["']|["']$/g, '')
}

export function setStoredGeminiApiKey(key: string): void {
  if (typeof window === 'undefined') return
  const clean = key.trim().replace(/^["']|["']$/g, '')
  if (clean) {
    localStorage.setItem(GEMINI_API_KEY_STORAGE, clean)
  } else {
    localStorage.removeItem(GEMINI_API_KEY_STORAGE)
  }
}

export function getStoredGeminiModel(): string {
  if (typeof window === 'undefined') return 'gemini-1.5-flash'
  return localStorage.getItem(GEMINI_MODEL_STORAGE) || 'gemini-1.5-flash'
}

export function setStoredGeminiModel(model: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(GEMINI_MODEL_STORAGE, model)
}

/**
 * Construye el prompt de sistema con todos los datos financieros en tiempo real
 */
function buildSystemPrompt(snapshot: FinancialSnapshot): string {
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

  const rule503020 = evaluate503020Rule(incomes, expenses, netBalance, currentPeriod)

  const cardSummaries = creditCards.map(c => {
    const health = evaluateCardHealth(c, creditTransactions)
    return `- ${c.name} (${c.bank}, últimos 4: ${c.lastFourDigits}): Límite ${formatCurrency(c.creditLimit)}, Deuda acumulada: ${formatCurrency(health.totalDebt)}, Uso: ${health.utilizationRate}%, Día de corte: ${c.cutoffDay}, Límite de pago: ${c.paymentDueDay}`
  }).join('\n')

  const budgetSummaries = categoryBudgets.map(b => {
    const spent = pExpenses.filter(e => e.category === b.category).reduce((s, e) => s + e.amount, 0)
    return `- ${b.category}: Límite ${formatCurrency(b.limitAmount)}, Gastado este mes: ${formatCurrency(spent)}`
  }).join('\n')

  const goalsSummaries = savingsGoals.map(g => {
    return `- ${g.name}: Ahorrado ${formatCurrency(g.currentAmount)} de objetivo ${formatCurrency(g.targetAmount)} (${Math.round((g.currentAmount / (g.targetAmount || 1)) * 100)}%)`
  }).join('\n')

  return `Eres AUREUS AI, un Asesor Financiero Personal y Mentor Financiero para usuarios y emprendedores de élite.
Tu objetivo es dar respuestas concisas, empáticas, prácticas y estructuradas en Markdown (con bullets claros, números formateados en moneda dominicana DOP/RD$ y consejos accionables de 1 a 3 pasos).

ESTADO FINANCIERO EN VIVO DEL USUARIO:
- Período de consulta activo: ${currentPeriod}
- Saldo Inicial Arrastrado de Meses Anteriores: ${formatCurrency(cumulative.carriedOverBalance)}
- Total Disponible Acumulado Real: ${formatCurrency(cumulative.totalCumulativeBalance)}
- Ingresos de este mes (${currentPeriod}): ${formatCurrency(totalIncome)} (${pIncomes.length} registros)
- Gastos de este mes (${currentPeriod}): ${formatCurrency(totalExpense)} (${pExpenses.length} registros)
- Flujo Neto del Mes: ${formatCurrency(netBalance)}
- Retiros en Efectivo del Mes: ${formatCurrency(totalCash)} (${pCash.length} retiros)
- Consumos en Tarjetas del Mes: ${pTx.length} transacciones

DIAGNÓSTICO 50/30/20:
- Necesidades (Gastos fijos/básicos): ${rule503020.needsPercent}% (Gastado: ${formatCurrency(rule503020.needsSpent)} vs Ideal: ${formatCurrency(rule503020.needsTarget)})
- Deseos y Ocio: ${rule503020.wantsPercent}% (Gastado: ${formatCurrency(rule503020.wantsSpent)} vs Ideal: ${formatCurrency(rule503020.wantsTarget)})
- Ahorro y Deuda: ${rule503020.savingsPercent}% (Retenido: ${formatCurrency(rule503020.savingsSpent)} vs Ideal: ${formatCurrency(rule503020.savingsTarget)})

TARJETAS DE CRÉDITO ACTIVAS:
${cardSummaries || 'Sin tarjetas registradas.'}

PRESUPUESTOS POR CATEGORÍA:
${budgetSummaries || 'Sin límites específicos asignados.'}

METAS DE AHORRO ACTIVAS:
${goalsSummaries || 'Sin metas activas.'}

REGLAS DE RESPUESTA:
1. Responde en español dominicano/latino neutral, cálido y profesional.
2. Si el usuario pregunta cuánto puede gastar o sobre una decisión de compra (ej: una tarjeta gráfica, un electrodoméstico o salidas), analiza el desembolso neto, compáralo con su Total Disponible Acumulado Real (${formatCurrency(cumulative.totalCumulativeBalance)}) y su Saldo Arrastrado del mes anterior (${formatCurrency(cumulative.carriedOverBalance)}).
3. Distingue claramente entre "tarjeta gráfica / hardware" y "tarjeta de crédito bancaria".
4. Adapta tu respuesta tanto para finanzas del hogar como para visión emprendedor según el contexto de la pregunta.
5. Usa formato Markdown con negritas y viñetas para que la lectura sea muy cómoda y agradable.`
}

/**
 * Consulta la API oficial de Google Gemini
 */
export async function queryGeminiFinancialAdvisor(
  prompt: string,
  snapshot: FinancialSnapshot,
  chatHistory: { sender: 'user' | 'assistant'; text: string }[] = []
): Promise<string> {
  const apiKey = getStoredGeminiApiKey()
  if (!apiKey) {
    throw new Error('No se ha configurado una clave API de Google Gemini. Haz clic en "Conectar Gemini API" en el chat.')
  }

  const model = getStoredGeminiModel()
  const systemInstruction = buildSystemPrompt(snapshot)

  // Filtrar y estructurar historial reciente
  const recentValidHistory = chatHistory
    .filter(m => m.text && !m.text.startsWith('*('))
    .slice(-4)
    .map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }))

  const contents = [
    ...recentValidHistory,
    {
      role: 'user',
      parts: [{ text: prompt }],
    },
  ]

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`

  let response: Response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }],
        },
        contents,
        generationConfig: {
          temperature: 0.5,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
    })
  } catch (netErr: any) {
    throw new Error(`Error de conexión al servidor de Google AI (${netErr.message || 'Verifica tu conexión a internet o adblocker'})`)
  }

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}))
    const msg = errJson?.error?.message || `Error ${response.status} (${response.statusText}): Clave de API de Google no válida o sin permisos de Generative Language.`
    throw new Error(msg)
  }

  const data = await response.json()
  const candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!candidate) {
    throw new Error('Google Gemini no generó texto en su respuesta.')
  }

  return candidate
}
