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

export type CardThemeColor = 'gold' | 'emerald' | 'blue' | 'purple' | 'silver' | 'rose';

// ==========================================
// 2. ENTIDADES PRINCIPALES
// ==========================================

export interface Income {
  id: string;              // Identificador único (UUID generado o timestamp)
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

export interface CreditCard {
  id: string;
  name: string;            // Ej: "Visa Infinite BHD", "Mastercard Black Reservas"
  bank: string;            // Ej: "Banco BHD", "Banreservas", "Banco Popular"
  lastFourDigits: string;  // Ej: "4821"
  creditLimit: number;     // Límite total de crédito (ej: 150,000)
  cutoffDay: number;       // Día del mes de corte (1-31, ej: 15)
  paymentDueDay: number;   // Día del mes límite de pago (1-31, ej: 5)
  interestRate?: number;   // Tasa de interés mensual % (opcional, ej: 4.5)
  color: CardThemeColor;   // Color y estilo visual
}

export interface CreditCardTransaction {
  id: string;
  cardId: string;          // ID de la tarjeta asociada
  period: string;          // Formato "YYYY-MM"
  description: string;     // Concepto de la compra / cargo
  amount: number;          // Monto total
  category: ExpenseCategory;
  date: string;            // Fecha "YYYY-MM-DD"
  installments: number;    // Cuotas diferidas (1 = cargo directo, 3, 6, 12, etc.)
  currentInstallment: number; // Cuota actual
  isPaid: boolean;         // Si ya fue saldada
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
  totalCreditDebt: number;         // Deuda total en tarjetas de crédito
  availableBalance: number;        // Dinero libre (Total Ingresos - Total Gastos)
  netSavings: number;              // Ahorro neto estimado
  savingsRate: number;             // Porcentaje de ahorro (ej: 25.5%)
}

export interface CreditCardSummary {
  totalLimit: number;              // Límite consolidado de todas las tarjetas
  totalDebt: number;               // Deuda acumulada en el periodo
  availableCredit: number;         // Cupo disponible global
  utilizationRate: number;         // Porcentaje de utilización global
  cardsCount: number;              // Cantidad de tarjetas registradas
  pendingPaymentsCount: number;    // Cantidad de compras pendientes
}

// Estructura completa de un mes para la persistencia
export interface MonthData {
  period: string;
  incomes: Income[];
  expenses: Expense[];
  cashWithdrawals: CashWithdrawal[];
  creditTransactions?: CreditCardTransaction[];
}

