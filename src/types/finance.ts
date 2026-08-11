// src/types/finance.ts

// ==========================================
// 1. TIPOS Y CATEGORÍAS
// ==========================================

// Tipos de ingreso: para sueldo fijo, proyectos freelance o entradas extraordinarias
export type IncomeType = 'salary' | 'freelance' | 'investment' | 'extra';

// Categorías de gastos esenciales y no esenciales
export type ExpenseCategory = 
  | 'housing'        // Vivienda / Renta / Hipoteca
  | 'food'           // Alimentación / Supermercado
  | 'transport'      // Transporte / Gasolina / Uber
  | 'utilities'      // Servicios (Luz, Agua, Internet, Teléfono)
  | 'health'         // Salud / Seguros / Medicinas
  | 'entertainment'  // Ocio / Salidas / Restaurantes
  | 'education'      // Cursos / Libros / Universidad
  | 'debt'           // Pago de deudas / Tarjetas de crédito
  | 'other';         // Otros imprevistos

// Tipo de compromiso de gasto: Fijo (innegociable) vs Variable (controlable)
export type ExpenseType = 'fixed' | 'variable';

// Método de pago utilizado
export type PaymentMethod = 'bank_transfer' | 'debit_card' | 'credit_card' | 'cash';

// Motivos de retiro en efectivo (Clave para las recomendaciones del Asesor)
export type CashReason = 
  | 'pocket_money'      // Dinero de bolsillo / Gastos menores
  | 'specific_service'  // Pago de servicio específico (sin factura/tarjeta)
  | 'leisure_nightout'  // Ocio / Salida nocturna / Fiesta
  | 'emergency'         // Emergencia médica o imprevisto
  | 'unassigned';       // Retiro sin destino claro (Dispara alerta de riesgo)

// ==========================================
// 2. ENTIDADES PRINCIPALES
// ==========================================

export interface Income {
  id: string;              // Identificador único (ej: UUID generado o timestamp)
  period: string;          // Formato "YYYY-MM" (ej: "2026-08")
  description: string;     // Ej: "Sueldo Empresa X", "Proyecto Web Freelance"
  amount: number;          // Monto monetario (siempre positivo)
  type: IncomeType;        // Clasificación del ingreso
  date: string;            // Fecha exacta "YYYY-MM-DD"
}

export interface Expense {
  id: string;
  period: string;
  description: string;     // Ej: "Alquiler de apartamento", "Cena fin de semana"
  amount: number;
  category: ExpenseCategory;
  type: ExpenseType;       // 'fixed' o 'variable'
  paymentMethod: PaymentMethod;
  date: string;
}

export interface CashWithdrawal {
  id: string;
  period: string;
  amount: number;          // Cuánto dinero en efectivo se sacó del banco/cajero
  reason: CashReason;      // Por qué se retiró
  note?: string;           // Detalle opcional adicional
  date: string;
}

// ==========================================
// 3. MODELOS DE RESUMEN Y CÁLCULO
// ==========================================

export interface FinancialSummary {
  totalSalary: number;             // Sueldo base total
  totalExtraIncome: number;        // Ingresos freelance y extras
  totalIncome: number;             // Ingreso bruto del mes
  totalFixedExpenses: number;      // Gastos fijos obligatorios
  totalVariableExpenses: number;   // Gastos variables controlables
  totalExpenses: number;           // Gastos totales (Fijos + Variables)
  totalCashWithdrawn: number;      // Total retirado en efectivo
  availableBalance: number;        // Dinero libre (Total Ingresos - Total Gastos)
  netSavings: number;              // Ahorro neto estimado
  savingsRate: number;             // Porcentaje de ahorro (ej: 25.5%)
}

// Estructura completa de un mes para la persistencia
export interface MonthData {
  period: string;
  incomes: Income[];
  expenses: Expense[];
  cashWithdrawals: CashWithdrawal[];
}
