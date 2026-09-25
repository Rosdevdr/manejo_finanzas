import { supabase } from '../lib/supabase'
import type {
  Income,
  Expense,
  CashWithdrawal,
  CreditCard,
  CreditCardTransaction,
  CategoryBudget,
  SavingsGoal,
} from '../types/finance'

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')

export interface DashboardSummaryData {
  period: string
  totalIncome: number
  totalExpenses: number
  fixedExpenses: number
  variableExpenses: number
  cashWithdrawals: number
  netCashFlow: number
  carryOver: number
  availableBalance: number
  committedDebts: number
  unencumberedLiquidity: number
  savingsRatePercentage: number
  fixedCostRatioPercentage: number
  creditLimitTotal: number
  creditOutstanding: number
  creditUtilizationPercentage: number
  debtCoverageRatio: number
  categoryBreakdown: {
    category: string
    spent: number
    percentageOfExpenses: number
    budgetLimit: number
    budgetUsedPercentage: number
    status: 'OK' | 'WARNING' | 'EXCEEDED'
  }[]
  goalsProgress: {
    totalTarget: number
    totalSaved: number
    completionPercentage: number
    activeGoalsCount: number
    completedGoalsCount: number
  }
  healthScore: 'EXCELLENT' | 'STABLE' | 'WARNING' | 'CRITICAL'
  advisorAdvice: string[]
}

class ApiClient {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`
        }
      } catch (err) {
        // Fallback silencioso si no hay sesión
      }
    }

    return headers
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${path}`
    const authHeaders = await this.getAuthHeaders()

    const mergedOptions: RequestInit = {
      ...options,
      headers: {
        ...authHeaders,
        ...options.headers,
      },
    }

    const response = await fetch(url, mergedOptions)
    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}`
      try {
        const errJson = await response.json()
        errorMessage = errJson.error || errorMessage
      } catch {}
      throw new Error(errorMessage)
    }

    const json = await response.json()
    return json.data !== undefined ? json.data : json
  }

  // --- Health Check ---
  public health = {
    check: () => this.request<{ status: string }>('/api/health'),
  }

  // --- Incomes ---
  public incomes = {
    list: (period?: string) =>
      this.request<Income[]>(`/api/incomes${period ? `?period=${period}` : ''}`),
    create: (data: Partial<Income>) =>
      this.request<Income>('/api/incomes', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Income>) =>
      this.request<Income>(`/api/incomes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<{ message: string }>(`/api/incomes/${id}`, {
        method: 'DELETE',
      }),
  }

  // --- Expenses ---
  public expenses = {
    list: (period?: string) =>
      this.request<Expense[]>(`/api/expenses${period ? `?period=${period}` : ''}`),
    create: (data: Partial<Expense>) =>
      this.request<Expense>('/api/expenses', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Expense>) =>
      this.request<Expense>(`/api/expenses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<{ message: string }>(`/api/expenses/${id}`, {
        method: 'DELETE',
      }),
  }

  // --- Cash Withdrawals ---
  public cash = {
    list: (period?: string) =>
      this.request<CashWithdrawal[]>(`/api/cash${period ? `?period=${period}` : ''}`),
    create: (data: Partial<CashWithdrawal>) =>
      this.request<CashWithdrawal>('/api/cash', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<{ message: string }>(`/api/cash/${id}`, {
        method: 'DELETE',
      }),
  }

  // --- Credit Cards & Transactions ---
  public credit = {
    listCards: () =>
      this.request<any[]>('/api/credit/cards'),
    createCard: (data: Partial<CreditCard>) =>
      this.request<any>('/api/credit/cards', {
        method: 'POST',
        body: JSON.stringify({
          id: data.id,
          name: data.name,
          bank: data.bank,
          lastFourDigits: data.lastFourDigits,
          creditLimit: data.creditLimit,
          cutoffDay: data.cutoffDay,
          paymentDueDay: data.paymentDueDay,
          interestRate: data.interestRate,
          color: data.color,
        }),
      }),
    updateCard: (id: string, data: Partial<CreditCard>) =>
      this.request<any>(`/api/credit/cards/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteCard: (id: string) =>
      this.request<{ message: string }>(`/api/credit/cards/${id}`, {
        method: 'DELETE',
      }),
    listTransactions: (period?: string, cardId?: string) => {
      const params = new URLSearchParams()
      if (period) params.append('period', period)
      if (cardId) params.append('cardId', cardId)
      const q = params.toString() ? `?${params.toString()}` : ''
      return this.request<any[]>(`/api/credit/transactions${q}`)
    },
    createTransaction: (data: Partial<CreditCardTransaction>) =>
      this.request<any>('/api/credit/transactions', {
        method: 'POST',
        body: JSON.stringify({
          id: data.id,
          cardId: data.cardId,
          description: data.description,
          amount: data.amount,
          category: data.category,
          date: data.date,
          period: data.period,
          installments: data.installments,
          currentInstallment: data.currentInstallment,
          isPaid: data.isPaid,
        }),
      }),
    updateTransaction: (id: string, data: Partial<CreditCardTransaction>) =>
      this.request<any>(`/api/credit/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteTransaction: (id: string) =>
      this.request<{ message: string }>(`/api/credit/transactions/${id}`, {
        method: 'DELETE',
      }),
    togglePaid: (id: string) =>
      this.request<any>(`/api/credit/transactions/${id}/toggle-paid`, {
        method: 'PATCH',
      }),
  }

  // --- Category Budgets ---
  public budgets = {
    list: (period: string) =>
      this.request<any[]>(`/api/budgets?period=${period}`),
    set: (data: Partial<CategoryBudget>) =>
      this.request<any>('/api/budgets', {
        method: 'POST',
        body: JSON.stringify({
          id: data.id,
          period: data.period,
          category: data.category,
          limitAmount: data.limitAmount,
        }),
      }),
    setBulk: (period: string, budgets: { category: string; limitAmount: number }[]) =>
      this.request<any[]>('/api/budgets/bulk', {
        method: 'POST',
        body: JSON.stringify({ period, budgets }),
      }),
    getSuggested: (period: string) =>
      this.request<any>(`/api/budgets/suggested?period=${period}`),
  }

  // --- Savings Goals ---
  public goals = {
    list: () =>
      this.request<any[]>('/api/goals'),
    create: (data: Partial<SavingsGoal>) =>
      this.request<any>('/api/goals', {
        method: 'POST',
        body: JSON.stringify({
          id: data.id,
          name: data.name,
          targetAmount: data.targetAmount,
          currentAmount: data.currentAmount,
          monthlyContribution: data.monthlyContribution,
          targetDate: data.targetDate,
          category: data.category,
          color: data.color,
        }),
      }),
    update: (id: string, data: Partial<SavingsGoal>) =>
      this.request<any>(`/api/goals/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      this.request<{ message: string }>(`/api/goals/${id}`, {
        method: 'DELETE',
      }),
    deposit: (id: string, amount: number) =>
      this.request<any>(`/api/goals/${id}/deposit`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
      }),
  }

  // --- Dashboard Summary Engine ---
  public dashboard = {
    getSummary: (period: string) =>
      this.request<DashboardSummaryData>(`/api/dashboard/summary?period=${period}`),
  }
}

export const apiClient = new ApiClient()
