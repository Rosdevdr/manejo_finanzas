export interface FinancialTip {
  id: string
  category: 'ahorro' | 'inversion' | 'presupuesto' | 'deudas' | 'saas_negocios' | 'habitos'
  title: string
  content: string
}

export const FINANCIAL_TIPS_BANK: FinancialTip[] = [
  {
    id: 'tip-1',
    category: 'ahorro',
    title: 'La Regla del Ahorro Automático Primero (Pay Yourself First)',
    content: 'En lugar de ahorrar lo que te queda después de gastar, separa mínimo el 20% de tus ingresos tan pronto recibas tu cobro y vive con el 80% restante.',
  },
  {
    id: 'tip-2',
    category: 'deudas',
    title: 'Estrategia Avalancha para Eliminar Deudas',
    content: 'Paga siempre el mínimo de todas tus tarjetas y destina todo tu excedente a amortizar primero la tarjeta con la tasa de interés más alta. Ahorrarás miles en financiamiento.',
  },
  {
    id: 'tip-3',
    category: 'saas_negocios',
    title: 'Auditoría de Suscripciones Inactivas (SaaS Churn Personal)',
    content: 'Revisa tus resúmenes de tarjeta cada trimestre para identificar servicios en la nube o licencias que no has usado en los últimos 30 días y cancélalos de inmediato.',
  },
  {
    id: 'tip-4',
    category: 'inversion',
    title: 'Construcción del Fondo de Reserva de Liquidez',
    content: 'Antes de invertir en instrumentos de renta variable, consolida un fondo de emergencia equivalente a 3-6 meses de tus gastos fijos en instrumentos líquidos de bajo riesgo.',
  },
  {
    id: 'tip-5',
    category: 'presupuesto',
    title: 'Categorización Prudente de Gastos Fijos vs. Variables',
    content: 'Asegúrate de que tus compromisos innegociables (vivienda, luz, alimentos básicos) no superen el 50% de tus ingresos netos para no asfixiar tu liquidez.',
  },
  {
    id: 'tip-6',
    category: 'saas_negocios',
    title: 'Negociación Estratégica de Proveedores y Contratos',
    content: 'Antes de renovar cualquier contrato anual o servicio recurrente, solicita una cotización comparativa o pide un descuento por pago único anticipado (anual vs mensual).',
  },
  {
    id: 'tip-7',
    category: 'habitos',
    title: 'La Regla de las 72 Horas para Compras Ocionales',
    content: 'Cuando desees realizar una compra no planificada superior a RD$3,000, espera 72 horas antes de pagar. En el 70% de los casos la emoción de impulso desaparece.',
  },
]

export function getRandomDailyTip(periodString: string): FinancialTip {
  // Generar un índice determinista basado en el día actual para que el consejo cambie diariamente
  const dayOfYear = Math.floor(Date.now() / (1000 * 60 * 60 * 24))
  const index = Math.abs(dayOfYear + periodString.length) % FINANCIAL_TIPS_BANK.length
  return FINANCIAL_TIPS_BANK[index]
}
