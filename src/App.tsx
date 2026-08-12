import { useState } from 'react'
import type { TabType } from './types/navigation'
import { Sidebar }           from './components/layout/Sidebar'
import { BottomNav }          from './components/layout/BottomNav'
import { AppHeader }         from './components/layout/AppHeader'
import { DashboardView }     from './components/dashboard/DashboardView'
import { IncomesView }       from './components/incomes/IncomesView'
import { ExpensesView }      from './components/expenses/ExpensesView'
import { CashView }          from './components/cash/CashView'
import { SmartAnalysisPanel } from './components/analysis/SmartAnalysisPanel'
import { ToastContainer }    from './components/ui/ToastContainer'
import { useFinanceStorage } from './hooks/useFinanceStorage'
import { useToast }          from './hooks/useToast'
import { formatCurrency }    from './utils/formatters'

const PERIODS = [
  { value: '2026-09', label: 'Septiembre 2026' },
  { value: '2026-08', label: 'Agosto 2026' },
  { value: '2026-07', label: 'Julio 2026' },
  { value: '2026-06', label: 'Junio 2026' },
  { value: '2026-05', label: 'Mayo 2026' },
]

export function App() {
  const [activeTab, setActiveTab]         = useState<TabType>('dashboard')
  const [currentPeriod, setCurrentPeriod] = useState('2026-08')

  const { toasts, show: showToast, dismiss } = useToast()

  const {
    incomes, expenses, cash,
    addIncome, updateIncome, deleteIncome,
    addExpense, updateExpense, deleteExpense,
    addWithdrawal, deleteWithdrawal,
  } = useFinanceStorage()

  const periodIncomes  = incomes.filter(i => i.period === currentPeriod)
  const periodExpenses = expenses.filter(e => e.period === currentPeriod)
  const totalIncome    = periodIncomes.reduce((s, i) => s + i.amount, 0)
  const totalExpense   = periodExpenses.reduce((s, e) => s + e.amount, 0)
  const available      = totalIncome - totalExpense

  const idx = PERIODS.findIndex(p => p.value === currentPeriod)
  const prevPeriod  = () => { if (idx < PERIODS.length - 1) setCurrentPeriod(PERIODS[idx + 1].value) }
  const nextPeriod  = () => { if (idx > 0) setCurrentPeriod(PERIODS[idx - 1].value) }
  const periodLabel = PERIODS[idx]?.label ?? currentPeriod

  return (
    <div className="app-shell">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="main">
        <AppHeader
          periodLabel={periodLabel}
          onPrev={prevPeriod}
          onNext={nextPeriod}
          prevDisabled={idx >= PERIODS.length - 1}
          nextDisabled={idx <= 0}
          balanceLabel={formatCurrency(available)}
          balancePositive={available >= 0}
        />

        <div className="content">
          {activeTab === 'dashboard' && (
            <DashboardView
              currentPeriod={currentPeriod}
              incomes={incomes}
              expenses={expenses}
            />
          )}
          {activeTab === 'incomes' && (
            <IncomesView
              currentPeriod={currentPeriod}
              incomes={incomes}
              onAddIncome={d    => { addIncome(d);    showToast('Ingreso registrado correctamente', 'success') }}
              onUpdateIncome={u => { updateIncome(u); showToast('Ingreso actualizado',              'info')    }}
              onDeleteIncome={id => { deleteIncome(id); showToast('Ingreso eliminado',              'error')   }}
            />
          )}
          {activeTab === 'expenses' && (
            <ExpensesView
              currentPeriod={currentPeriod}
              expenses={expenses}
              onAddExpense={d    => { addExpense(d);    showToast('Gasto registrado correctamente', 'success') }}
              onUpdateExpense={u => { updateExpense(u); showToast('Gasto actualizado',              'info')    }}
              onDeleteExpense={id => { deleteExpense(id); showToast('Gasto eliminado',              'error')   }}
            />
          )}
          {activeTab === 'cash' && (
            <CashView
              currentPeriod={currentPeriod}
              withdrawals={cash}
              expenses={expenses}
              availableBalance={available}
              onAddWithdrawal={d    => { addWithdrawal(d);    showToast('Retiro registrado correctamente', 'success') }}
              onDeleteWithdrawal={id => { deleteWithdrawal(id); showToast('Retiro eliminado',              'error')   }}
            />
          )}
          {activeTab === 'advisor' && (
            <SmartAnalysisPanel
              currentPeriod={currentPeriod}
              incomes={incomes}
              expenses={expenses}
              cashWithdrawals={cash}
            />
          )}
        </div>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}

export default App
