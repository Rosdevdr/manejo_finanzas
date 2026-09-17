import type { TenantConfig } from '../theme/tenantThemeSchema'
import type { ReportData } from './exportReports'
import { formatCurrency } from './formatters'
import { formatPeriodLabel } from './calendar'

/**
 * Genera el documento HTML completo para renderizado de PDF en servidor Node.js (con Puppeteer) o navegador.
 */
export function generateTenantStatementHtml(
  reportData: ReportData,
  tenant: TenantConfig,
  verificationHash: string
): string {
  const periodLabel = formatPeriodLabel(reportData.period)
  const primaryColor = tenant.theme.colors.brandPrimary || '#C9A84C'
  const accentColor = tenant.theme.colors.brandAccent || '#F3CA65'

  const totalIncome = reportData.incomes.filter(i => i.period === reportData.period).reduce((s, i) => s + i.amount, 0)
  const totalExpense = reportData.expenses.filter(e => e.period === reportData.period).reduce((s, e) => s + e.amount, 0)
  const netBalance = totalIncome - totalExpense

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${tenant.name} · Estado de Cuenta ${periodLabel}</title>
  <style>
    :root {
      --primary: ${primaryColor};
      --accent: ${accentColor};
      --text: #0F172A;
      --muted: #64748B;
      --border: #E2E8F0;
      --bg-alt: #F8FAFC;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: var(--text);
      background: #FFFFFF;
      padding: 40px;
      font-size: 12.5px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid var(--primary);
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 800;
      color: var(--primary);
      letter-spacing: -0.02em;
    }
    .brand-legal {
      font-size: 11px;
      color: var(--muted);
      margin-top: 2px;
    }
    .statement-badge {
      text-align: right;
    }
    .statement-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--text);
    }
    .statement-period {
      font-size: 11.5px;
      color: var(--muted);
      margin-top: 2px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    .kpi-card {
      background: var(--bg-alt);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px;
    }
    .kpi-card-label {
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--muted);
      letter-spacing: 0.05em;
    }
    .kpi-card-val {
      font-size: 18px;
      font-weight: 800;
      margin-top: 4px;
      font-family: 'Courier New', monospace;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    th {
      background: #F1F5F9;
      text-align: left;
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--muted);
      padding: 9px 10px;
      border-bottom: 1px solid var(--border);
    }
    td {
      padding: 9px 10px;
      border-bottom: 1px solid var(--border);
      font-size: 12px;
    }
    .amount {
      text-align: right;
      font-family: 'Courier New', monospace;
      font-weight: 700;
    }
    .footer {
      margin-top: 36px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
      font-size: 10px;
      color: var(--muted);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .hash-badge {
      font-family: 'Courier New', monospace;
      font-size: 9.5px;
      background: #F1F5F9;
      padding: 3px 8px;
      border-radius: 4px;
      border: 1px solid var(--border);
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand-title">${tenant.name}</div>
      <div class="brand-legal">${tenant.legalName}</div>
    </div>
    <div class="statement-badge">
      <div class="statement-title">ESTADO DE CUENTA CERTIFICADO</div>
      <div class="statement-period">Período: ${periodLabel}</div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-card-label">Ingresos Totales</div>
      <div class="kpi-card-val" style="color: #059669;">+${formatCurrency(totalIncome)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-card-label">Gastos Totales</div>
      <div class="kpi-card-val" style="color: #DC2626;">-${formatCurrency(totalExpense)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-card-label">Superávit / Balance Neto</div>
      <div class="kpi-card-val" style="color: var(--primary);">${formatCurrency(netBalance)}</div>
    </div>
  </div>

  <div style="font-size: 13px; font-weight: 700; margin-bottom: 8px;">Detalle de Transacciones Consolidadas</div>
  <table>
    <thead>
      <tr>
        <th>Fecha</th>
        <th>Concepto / Item</th>
        <th>Tipo</th>
        <th style="text-align: right;">Monto</th>
      </tr>
    </thead>
    <tbody>
      ${reportData.incomes.filter(i => i.period === reportData.period).map(i => `
        <tr>
          <td>${i.date}</td>
          <td><strong>${i.description}</strong></td>
          <td>Ingreso</td>
          <td class="amount" style="color: #059669;">+${formatCurrency(i.amount)}</td>
        </tr>
      `).join('')}
      ${reportData.expenses.filter(e => e.period === reportData.period).map(e => `
        <tr>
          <td>${e.date}</td>
          <td><strong>${e.description}</strong></td>
          <td>Gasto</td>
          <td class="amount" style="color: #DC2626;">-${formatCurrency(e.amount)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <div>
      <strong>${tenant.name}</strong> · ${tenant.complianceNotice}
    </div>
    <div class="hash-badge">
      SHA-256: ${verificationHash.slice(0, 16)}...
    </div>
  </div>
</body>
</html>`
}
