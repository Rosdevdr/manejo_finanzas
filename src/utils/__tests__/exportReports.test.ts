import { describe, it, expect } from 'vitest'
import { generateCSVContent, type ReportData } from '../exportReports'

describe('exportReports Utility', () => {
  const mockReportData: ReportData = {
    period: '2026-08',
    incomes: [
      {
        id: 'i1',
        period: '2026-08',
        description: 'Sueldo "Senior Dev"',
        amount: 85000,
        type: 'salary',
        date: '2026-08-01',
      },
    ],
    expenses: [
      {
        id: 'e1',
        period: '2026-08',
        description: 'Alquiler, mantenimiento y agua',
        amount: 28000,
        category: 'housing',
        type: 'fixed',
        paymentMethod: 'bank_transfer',
        date: '2026-08-02',
      },
    ],
    cashWithdrawals: [
      {
        id: 'c1',
        period: '2026-08',
        amount: 5000,
        reason: 'pocket_money',
        note: 'Cajero Banreservas',
        date: '2026-08-03',
      },
    ],
    creditTransactions: [
      {
        id: 'ctx1',
        cardId: 'card-1',
        period: '2026-08',
        description: 'Vuelos fin de año',
        amount: 15000,
        category: 'entertainment',
        date: '2026-08-04',
        installments: 3,
        currentInstallment: 1,
        isPaid: false,
      },
    ],
    creditCards: [],
    categoryBudgets: [],
    savingsGoals: [],
    userName: 'Jesús Zapata',
    userEmail: 'jesus@aureus.fin',
  }

  it('generates properly formatted CSV with UTF-8 BOM and headers', () => {
    const csv = generateCSVContent(mockReportData)

    // Verify BOM
    expect(csv.startsWith('\uFEFF')).toBe(true)

    // Verify Header columns
    expect(csv).toContain('"Fecha","Tipo de Registro","Categoría / Razón","Descripción","Método de Pago","Monto"')

    // Verify income row
    expect(csv).toContain('"2026-08-01","Ingreso","SALARY","Sueldo ""Senior Dev""","Transferencia / Depósito","85000.00"')

    // Verify expense row with escaped comma
    expect(csv).toContain('"2026-08-02","Gasto Fijo","Vivienda & Renta","Alquiler, mantenimiento y agua","Transferencia Bancaria","-28000.00"')

    // Verify cash withdrawal row
    expect(csv).toContain('"2026-08-03","Retiro en Efectivo","pocket_money","Retiro: Cajero Banreservas","Efectivo","-5000.00"')

    // Verify credit transaction row
    expect(csv).toContain('"2026-08-04","Consumo Tarjeta Crédito","Ocio & Salidas","Vuelos fin de año (Cuota 1/3)","Tarjeta de Crédito","-15000.00"')
  })
})
