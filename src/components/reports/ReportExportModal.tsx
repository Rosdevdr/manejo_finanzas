import { useState } from 'react'
import {
  FileText,
  FileSpreadsheet,
  Download,
  Printer,
  X,
} from 'lucide-react'
import type {
  Income,
  Expense,
  CashWithdrawal,
  CreditCardTransaction,
  CreditCard,
  SavingsGoal,
  CategoryBudget,
} from '../../types/finance'
import { formatCurrency } from '../../utils/formatters'
import { formatPeriodLabel } from '../../utils/calendar'
import { exportTransactionsToCSV, printExecutiveFinancialReport, type ReportData } from '../../utils/exportReports'
import './ReportExportModal.css'

interface ReportExportModalProps {
  isOpen: boolean
  onClose: () => void
  currentPeriod: string
  incomes: Income[]
  expenses: Expense[]
  cashWithdrawals: CashWithdrawal[]
  creditTransactions: CreditCardTransaction[]
  creditCards: CreditCard[]
  categoryBudgets: CategoryBudget[]
  savingsGoals: SavingsGoal[]
  userEmail?: string | null
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void
}

export function ReportExportModal({
  isOpen,
  onClose,
  currentPeriod,
  incomes,
  expenses,
  cashWithdrawals,
  creditTransactions,
  creditCards,
  categoryBudgets,
  savingsGoals,
  userEmail,
  onShowToast,
}: ReportExportModalProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>(currentPeriod)

  if (!isOpen) return null

  // Calcular períodos disponibles basados en ingresos y gastos registrados
  const availablePeriods = Array.from(
    new Set([
      currentPeriod,
      ...incomes.map(i => i.period),
      ...expenses.map(e => e.period),
    ])
  ).sort().reverse()

  const reportData: ReportData = {
    period: selectedPeriod,
    incomes,
    expenses,
    cashWithdrawals,
    creditTransactions,
    creditCards,
    categoryBudgets,
    savingsGoals,
    userName: userEmail ? userEmail.split('@')[0] : 'Titular AUREUS',
    userEmail: userEmail || undefined,
  }

  const periodIncomes = incomes.filter(i => i.period === selectedPeriod)
  const periodExpenses = expenses.filter(e => e.period === selectedPeriod)
  const totalIncome = periodIncomes.reduce((s, i) => s + i.amount, 0)
  const totalExpense = periodExpenses.reduce((s, e) => s + e.amount, 0)
  const netBalance = totalIncome - totalExpense
  const savingsRate = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0

  const handleExportPDF = () => {
    printExecutiveFinancialReport(reportData)
    onShowToast('📄 Vista de impresión / PDF generada', 'success')
  }

  const handleExportCSV = () => {
    exportTransactionsToCSV(reportData)
    onShowToast('📊 Archivo CSV descargado con éxito', 'success')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card export-modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} style={{ color: '#F3CA65' }} />
            <h2 className="modal-title">Exportar Reportes Financieros</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar modal">
            <X size={16} />
          </button>
        </div>

        <div style={{ fontSize: 12.5, color: '#888898', margin: '4px 0 14px' }}>
          Selecciona el período y el formato en el que deseas generar tu informe financiero:
        </div>

        {/* Period Selector */}
        <div className="modal-form-group" style={{ marginBottom: 12 }}>
          <label className="modal-label">Período del Reporte</label>
          <select
            className="modal-select"
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
          >
            {availablePeriods.map(p => (
              <option key={p} value={p}>{formatPeriodLabel(p)} ({p})</option>
            ))}
          </select>
        </div>

        {/* Summary Preview Box */}
        <div className="export-summary-box">
          <div className="export-summary-item">
            <span className="export-summary-label">Ingresos</span>
            <span className="export-summary-val" style={{ color: '#34D399' }}>{formatCurrency(totalIncome)}</span>
          </div>
          <div className="export-summary-item">
            <span className="export-summary-label">Gastos</span>
            <span className="export-summary-val" style={{ color: '#FB7185' }}>{formatCurrency(totalExpense)}</span>
          </div>
          <div className="export-summary-item">
            <span className="export-summary-label">Balance</span>
            <span className="export-summary-val" style={{ color: netBalance >= 0 ? '#34D399' : '#FB7185' }}>
              {formatCurrency(netBalance)}
            </span>
          </div>
          <div className="export-summary-item">
            <span className="export-summary-label">Ahorro</span>
            <span className="export-summary-val" style={{ color: '#F3CA65' }}>{savingsRate.toFixed(1)}%</span>
          </div>
        </div>

        {/* Action Cards */}
        <div className="export-modal-grid">
          {/* PDF Report */}
          <div className="export-action-card" onClick={handleExportPDF}>
            <div>
              <div className="export-card-icon" style={{ background: 'rgba(243, 202, 101, 0.12)', color: '#F3CA65' }}>
                <Printer size={20} />
              </div>
              <div className="export-card-title" style={{ marginTop: 10 }}>Estado Financiero (PDF)</div>
              <div className="export-card-desc">
                Documento ejecutivo con tablas, balances y diagnóstico 50/30/20 listo para imprimir o guardar como PDF.
              </div>
            </div>

            <button className="btn btn-primary" style={{ width: '100%', fontSize: 12, marginTop: 6 }} onClick={handleExportPDF}>
              <Printer size={14} /> Imprimir / Guardar PDF
            </button>
          </div>

          {/* Excel / CSV */}
          <div className="export-action-card" onClick={handleExportCSV}>
            <div>
              <div className="export-card-icon" style={{ background: 'rgba(52, 211, 153, 0.12)', color: '#34D399' }}>
                <FileSpreadsheet size={20} />
              </div>
              <div className="export-card-title" style={{ marginTop: 10 }}>Exportar Excel (CSV)</div>
              <div className="export-card-desc">
                Archivo estructurado con todas las transacciones, categorías y métodos de pago compatible con Excel.
              </div>
            </div>

            <button className="btn-primary btn-income" style={{ width: '100%', fontSize: 12.5, marginTop: 6 }} onClick={handleExportCSV}>
              <Download size={15} /> <span>Descargar .CSV (Excel)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
