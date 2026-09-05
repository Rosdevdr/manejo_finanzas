// src/utils/exportReports.ts
import type {
  Income,
  Expense,
  CashWithdrawal,
  CreditCardTransaction,
  CreditCard,
  SavingsGoal,
  CategoryBudget,
} from '../types/finance'
import { formatCurrency } from './formatters'
import { formatPeriodLabel } from './calendar'
import { evaluate503020Rule } from './budgetAdvisor'

export interface ReportData {
  period: string
  incomes: Income[]
  expenses: Expense[]
  cashWithdrawals: CashWithdrawal[]
  creditTransactions: CreditCardTransaction[]
  creditCards: CreditCard[]
  categoryBudgets: CategoryBudget[]
  savingsGoals: SavingsGoal[]
  userName?: string
  userEmail?: string
}

const CATEGORY_NAMES: Record<string, string> = {
  housing:       'Vivienda & Renta',
  food:          'Alimentación & Súper',
  transport:     'Transporte & Gasolina',
  utilities:     'Servicios Básicos',
  health:        'Salud & Medicina',
  entertainment: 'Ocio & Salidas',
  education:     'Educación & Cursos',
  debt:          'Pago de Deudas',
  other:         'Otros Gastos',
}

const PAYMENT_METHODS: Record<string, string> = {
  bank_transfer: 'Transferencia Bancaria',
  debit_card:    'Tarjeta de Débito',
  credit_card:   'Tarjeta de Crédito',
  cash:          'Efectivo',
}

/**
 * Escapa comillas y caracteres especiales para formato CSV estándar.
 */
function escapeCsv(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '""'
  const str = String(val).replace(/"/g, '""')
  return `"${str}"`
}

/**
 * Genera y descarga un archivo CSV compatible con Excel y Google Sheets.
 */
export function generateCSVContent(data: ReportData): string {
  const periodIncomes = data.incomes.filter(i => i.period === data.period)
  const periodExpenses = data.expenses.filter(e => e.period === data.period)
  const periodCash = data.cashWithdrawals.filter(c => c.period === data.period)
  const periodCredit = data.creditTransactions.filter(t => t.period === data.period)

  const rows: string[] = []

  // Encabezado
  rows.push(['Fecha', 'Tipo de Registro', 'Categoría / Razón', 'Descripción', 'Método de Pago', 'Monto'].map(escapeCsv).join(','))

  // 1. Ingresos
  for (const inc of periodIncomes) {
    rows.push([
      inc.date,
      'Ingreso',
      inc.type.toUpperCase(),
      inc.description,
      'Transferencia / Depósito',
      inc.amount.toFixed(2),
    ].map(escapeCsv).join(','))
  }

  // 2. Gastos
  for (const exp of periodExpenses) {
    rows.push([
      exp.date,
      exp.type === 'fixed' ? 'Gasto Fijo' : 'Gasto Variable',
      CATEGORY_NAMES[exp.category] || exp.category,
      exp.description,
      PAYMENT_METHODS[exp.paymentMethod] || exp.paymentMethod,
      (-exp.amount).toFixed(2),
    ].map(escapeCsv).join(','))
  }

  // 3. Retiros en Efectivo
  for (const c of periodCash) {
    rows.push([
      c.date,
      'Retiro en Efectivo',
      c.reason,
      c.note ? `Retiro: ${c.note}` : 'Retiro en Cajero / Ventanilla',
      'Efectivo',
      (-c.amount).toFixed(2),
    ].map(escapeCsv).join(','))
  }

  // 4. Consumos en Tarjetas de Crédito
  for (const ctx of periodCredit) {
    rows.push([
      ctx.date,
      'Consumo Tarjeta Crédito',
      CATEGORY_NAMES[ctx.category] || ctx.category,
      `${ctx.description} (Cuota ${ctx.currentInstallment}/${ctx.installments})`,
      'Tarjeta de Crédito',
      (-ctx.amount).toFixed(2),
    ].map(escapeCsv).join(','))
  }

  return '\uFEFF' + rows.join('\r\n')
}

/**
 * Dispara la descarga del archivo CSV en el navegador.
 */
export function exportTransactionsToCSV(data: ReportData): void {
  const csvContent = generateCSVContent(data)
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `aureus_estado_financiero_${data.period}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Genera una vista imprimible de alta fidelidad para guardar como PDF o imprimir.
 */
export function printExecutiveFinancialReport(data: ReportData): void {
  const periodLabel = formatPeriodLabel(data.period)
  const periodIncomes = data.incomes.filter(i => i.period === data.period)
  const periodExpenses = data.expenses.filter(e => e.period === data.period)
  const totalIncome = periodIncomes.reduce((s, i) => s + i.amount, 0)
  const totalExpense = periodExpenses.reduce((s, e) => s + e.amount, 0)
  const netBalance = totalIncome - totalExpense
  const savingsRate = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0

  const rule503020 = evaluate503020Rule(data.incomes, data.expenses, netBalance, data.period)

  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>AUREUS · Estado Financiero ${periodLabel}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Inter', system-ui, sans-serif;
          color: #111827;
          background: #FFFFFF;
          padding: 40px;
          line-height: 1.5;
          font-size: 13px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #E5E7EB;
          padding-bottom: 20px;
          margin-bottom: 24px;
        }
        .logo-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: #0F172A;
          letter-spacing: -0.02em;
        }
        .logo-sub {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 10px;
          font-weight: 700;
          color: #C9A84C;
          letter-spacing: 0.15em;
        }
        .report-meta {
          text-align: right;
          font-family: 'Space Grotesk', sans-serif;
        }
        .report-period {
          font-size: 16px;
          font-weight: 700;
          color: #0F172A;
        }
        .report-date {
          font-size: 11px;
          color: #6B7280;
        }
        .kpi-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
        .kpi-box {
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          padding: 12px 14px;
          background: #F9FAFB;
        }
        .kpi-label {
          font-size: 11px;
          font-weight: 600;
          color: #6B7280;
          text-transform: uppercase;
        }
        .kpi-value {
          font-family: 'Space Mono', monospace;
          font-size: 18px;
          font-weight: 700;
          margin-top: 4px;
        }
        .green { color: #059669; }
        .red { color: #DC2626; }
        .gold { color: #B45309; }
        .section-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #0F172A;
          margin: 20px 0 10px;
          border-bottom: 1px solid #E5E7EB;
          padding-bottom: 6px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th {
          background: #F3F4F6;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 11px;
          font-weight: 700;
          text-align: left;
          padding: 8px 10px;
          color: #4B5563;
          border-bottom: 1px solid #E5E7EB;
        }
        td {
          padding: 8px 10px;
          border-bottom: 1px solid #F3F4F6;
          font-size: 12px;
        }
        .amount-col {
          text-align: right;
          font-family: 'Space Mono', monospace;
          font-weight: 600;
        }
        .rule-box {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 14px;
          margin-bottom: 24px;
        }
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #E5E7EB;
          font-size: 10.5px;
          color: #9CA3AF;
          display: flex;
          justify-content: space-between;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo-title">AUREUS</div>
          <div class="logo-sub">WEALTH ADVISOR · ESTADO FINANCIERO EJECUTIVO</div>
          <div style="font-size: 11.5px; color: #4B5563; margin-top: 4px;">
            Usuario: <strong>${data.userName || data.userEmail || 'Titular de la Cuenta'}</strong>
          </div>
        </div>
        <div class="report-meta">
          <div class="report-period">${periodLabel}</div>
          <div class="report-date">Generado el: ${new Date().toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
      </div>

      <!-- Resumen KPI -->
      <div class="kpi-row">
        <div class="kpi-box">
          <div class="kpi-label">Ingresos Totales</div>
          <div class="kpi-value green">${formatCurrency(totalIncome)}</div>
        </div>
        <div class="kpi-box">
          <div class="kpi-label">Gastos Totales</div>
          <div class="kpi-value red">${formatCurrency(totalExpense)}</div>
        </div>
        <div class="kpi-box">
          <div class="kpi-label">Balance Neto</div>
          <div class="kpi-value ${netBalance >= 0 ? 'green' : 'red'}">${formatCurrency(netBalance)}</div>
        </div>
        <div class="kpi-box">
          <div class="kpi-label">Tasa de Ahorro</div>
          <div class="kpi-value gold">${savingsRate.toFixed(1)}%</div>
        </div>
      </div>

      <!-- Regla 50/30/20 -->
      <div class="section-title">Diagnóstico de la Regla Financiera 50 / 30 / 20</div>
      <div class="rule-box">
        <div>
          <strong>Necesidades (50%):</strong><br>
          Gastado: ${formatCurrency(rule503020.needsSpent)} (${rule503020.needsPercent}%)<br>
          <span style="color: #6B7280; font-size: 11px;">Ideal: ${formatCurrency(rule503020.needsTarget)}</span>
        </div>
        <div>
          <strong>Deseos y Ocio (30%):</strong><br>
          Gastado: ${formatCurrency(rule503020.wantsSpent)} (${rule503020.wantsPercent}%)<br>
          <span style="color: #6B7280; font-size: 11px;">Ideal: ${formatCurrency(rule503020.wantsTarget)}</span>
        </div>
        <div>
          <strong>Ahorro y Deuda (20%):</strong><br>
          Retenido: ${formatCurrency(rule503020.savingsSpent)} (${rule503020.savingsPercent}%)<br>
          <span style="color: #6B7280; font-size: 11px;">Ideal: ${formatCurrency(rule503020.savingsTarget)}</span>
        </div>
      </div>

      <!-- Detalle de Ingresos -->
      <div class="section-title">Desglose de Ingresos (${periodIncomes.length})</div>
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Descripción</th>
            <th>Tipo</th>
            <th style="text-align: right;">Monto</th>
          </tr>
        </thead>
        <tbody>
          ${periodIncomes.map(i => `
            <tr>
              <td>${i.date}</td>
              <td><strong>${i.description}</strong></td>
              <td>${i.type.toUpperCase()}</td>
              <td class="amount-col green">+${formatCurrency(i.amount)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Detalle de Gastos Principales -->
      <div class="section-title">Desglose de Egresos (${periodExpenses.length})</div>
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Descripción</th>
            <th>Categoría</th>
            <th>Método</th>
            <th style="text-align: right;">Monto</th>
          </tr>
        </thead>
        <tbody>
          ${periodExpenses.map(e => `
            <tr>
              <td>${e.date}</td>
              <td><strong>${e.description}</strong></td>
              <td>${CATEGORY_NAMES[e.category] || e.category}</td>
              <td>${PAYMENT_METHODS[e.paymentMethod] || e.paymentMethod}</td>
              <td class="amount-col red">-${formatCurrency(e.amount)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        <div>AUREUS Wealth Advisor · Plataforma Fintech de Control Financiero y Gestión Patrimonial</div>
        <div>Documento de validez orientativa y control personal</div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
}
