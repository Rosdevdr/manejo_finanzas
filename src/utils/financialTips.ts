export interface FinancialTip {
  id: string
  category: 'ahorro' | 'inversion' | 'presupuesto' | 'deudas' | 'emprendimiento' | 'habitos'
  title: string
  content: string
}

export const FINANCIAL_TIPS_BANK: FinancialTip[] = [
  {
    id: 'tip-1',
    category: 'ahorro',
    title: 'La Regla del Ahorro Automático Primero (Pay Yourself First)',
    content: 'En lugar de ahorrar lo que sobra al final del mes, separa mínimo el 20% de tus ingresos tan pronto recibas tu nómina o cobro de proyectos y vive con el 80% restante.',
  },
  {
    id: 'tip-2',
    category: 'deudas',
    title: 'Estrategia Avalancha para Eliminar Deudas de Tarjetas',
    content: 'Paga siempre el monto total a la fecha de corte de tus tarjetas para generar 0% intereses. Si tienes varias deudas, abona el excedente a la que tenga mayor tasa de interés.',
  },
  {
    id: 'tip-3',
    category: 'emprendimiento',
    title: 'Separación Estricta de Cuentas Personales y de Negocio',
    content: 'Si eres emprendedor o realizas trabajos freelance, asígnate un "sueldo fijo" mensual. Nunca pagues gastos personales directamente con el dinero de tus ventas o proyectos.',
  },
  {
    id: 'tip-4',
    category: 'inversion',
    title: 'Construcción del Fondo de Paz Mental (Fondo de Emergencia)',
    content: 'Antes de invertir en opciones de riesgo, acumula un fondo equivalente a 3 a 6 meses de tus gastos fijos indispensables en una cuenta segura y líquida.',
  },
  {
    id: 'tip-5',
    category: 'presupuesto',
    title: 'Control de Compromisos Innegociables (Regla 50/30/20)',
    content: 'Asegúrate de que tus gastos fijos (vivienda, luz, telecomunicaciones, préstamos) no superen el 50% de tus ingresos netos para mantener margen de maniobra.',
  },
  {
    id: 'tip-6',
    category: 'emprendimiento',
    title: 'Reserva Fiscal y Operativa del 20%',
    content: 'De cada pago o factura que cobres por servicios o ventas, aparta de inmediato entre un 15% y 20% en una subcuenta para impuestos y gastos imprevistos.',
  },
  {
    id: 'tip-7',
    category: 'habitos',
    title: 'La Regla de las 72 Horas para Gastos por Impulso',
    content: 'Antes de realizar una compra no planificada superior a RD$2,000, espera 3 días. En más del 70% de las ocasiones la urgencia emocional desaparece.',
  },
]

export function getRandomDailyTip(periodString: string): FinancialTip {
  const dayOfYear = Math.floor(Date.now() / (1000 * 60 * 60 * 24))
  const index = Math.abs(dayOfYear + periodString.length) % FINANCIAL_TIPS_BANK.length
  return FINANCIAL_TIPS_BANK[index]
}
