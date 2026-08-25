import { useState, useMemo } from 'react'
import type { TabType } from './types/navigation'
import { Sidebar }           from './components/layout/Sidebar'
import { AppHeader }         from './components/layout/AppHeader'
import { DashboardView }     from './components/dashboard/DashboardView'
import { IncomesView }       from './components/incomes/IncomesView'
import { ExpensesView }      from './components/expenses/ExpensesView'
import { CreditCardsView }   from './components/credit/CreditCardsView'
import { CashView }          from './components/cash/CashView'
import { BudgetsAndGoalsView } from './components/budgets/BudgetsAndGoalsView'
import { SmartAnalysisPanel } from './components/analysis/SmartAnalysisPanel'
import { ToastContainer }    from './components/ui/ToastContainer'
import { LoginView }         from './components/auth/LoginView'
import { SecurityModal }     from './components/security/SecurityModal'
import { MitLicenseModal }   from './components/ui/MitLicenseModal'
import { ReportExportModal } from './components/reports/ReportExportModal'
import { Analytics }         from '@vercel/analytics/react'
import { useFinanceStorage } from './hooks/useFinanceStorage'
import { useAuth }           from './hooks/useAuth'
import { useToast }          from './hooks/useToast'
import { usePwaInstall }     from './hooks/usePwaInstall'
import { formatCurrency }    from './utils/formatters'
import {
  getPreviousPeriod,
  getNextPeriod,
  formatPeriodLabel,
  getCurrentSystemPeriod,
} from './utils/calendar'

export function App() {
  const [activeTab, setActiveTab]               = useState<TabType>('dashboard')
  const [currentPeriod, setCurrentPeriod]       = useState<string>(() => getCurrentSystemPeriod())
  const [showLicenseModal, setShowLicenseModal] = useState(false)
  const [isSecurityOpen, setIsSecurityOpen]     = useState(false)
  const [showExportModal, setShowExportModal]   = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const { toasts, show: showToast, dismiss } = useToast()
  const { isInstallable, installApp } = usePwaInstall()

  const {
    user,
    loading: authLoading,
    isDemoMode,
    isSupabaseConfigured,
    isPasswordRecovery,
    clearPasswordRecovery,
    signIn,
    signUp,
    signOut,
    sendPasswordReset,
    updateUserPassword,
    enterDemoMode,
  } = useAuth()

  const {
    incomes, expenses, cash, creditCards, creditTransactions, categoryBudgets, savingsGoals,
    addIncome, updateIncome, deleteIncome,
    addExpense, updateExpense, deleteExpense,
    addWithdrawal, deleteWithdrawal,
    addCreditCard, updateCreditCard, deleteCreditCard,
    addCreditTransaction, updateCreditTransaction, deleteCreditTransaction, toggleTransactionPaid,
    setCategoryBudget, setMultipleCategoryBudgets,
    addSavingsGoal, updateSavingsGoal, depositToGoal, deleteSavingsGoal,
  } = useFinanceStorage(user)

  const periodIncomes  = incomes.filter(i => i.period === currentPeriod)
  const periodExpenses = expenses.filter(e => e.period === currentPeriod)
  const totalIncome    = periodIncomes.reduce((s, i) => s + i.amount, 0)
  const totalExpense   = periodExpenses.reduce((s, e) => s + e.amount, 0)
  const available      = totalIncome - totalExpense

  // Navegación matemática dinámica e ilimitada de meses (sin pérdida de datos)
  const prevPeriod  = () => setCurrentPeriod(prev => getPreviousPeriod(prev))
  const nextPeriod  = () => setCurrentPeriod(prev => getNextPeriod(prev))
  const periodLabel = useMemo(() => formatPeriodLabel(currentPeriod), [currentPeriod])

  // Mostrar pantalla de Login si no hay usuario ni modo demo (o si está en flujo de recuperación de contraseña)
  if ((!authLoading && !user && !isDemoMode) || isPasswordRecovery) {
    return (
      <>
        <LoginView
          onSignIn={signIn}
          onSignUp={signUp}
          onSendPasswordReset={sendPasswordReset}
          onUpdateUserPassword={updateUserPassword}
          onEnterDemoMode={enterDemoMode}
          isSupabaseConfigured={isSupabaseConfigured}
          isPasswordRecovery={isPasswordRecovery}
          onClearPasswordRecovery={clearPasswordRecovery}
        />
        <ToastContainer toasts={toasts} onDismiss={dismiss} />
        <Analytics />
      </>
    )
  }

  return (
    <div className="app-shell">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userEmail={user?.email}
        isDemoMode={isDemoMode}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onSignOut={signOut}
        onOpenSecurity={() => setIsSecurityOpen(true)}
        onOpenExport={() => setShowExportModal(true)}
        onOpenLicense={() => setShowLicenseModal(true)}
        isInstallable={isInstallable}
        onInstallApp={installApp}
      />

      <div className="main">
        <AppHeader
          periodLabel={periodLabel}
          onPrev={prevPeriod}
          onNext={nextPeriod}
          balanceLabel={formatCurrency(available)}
          balancePositive={available >= 0}
          isDemoMode={isDemoMode}
          userEmail={user?.email}
          onSignOut={signOut}
          onOpenSecurity={() => setIsSecurityOpen(true)}
          onOpenLicense={() => setShowLicenseModal(true)}
          onOpenExport={() => setShowExportModal(true)}
          isInstallable={isInstallable}
          onInstallApp={installApp}
          onOpenMenu={() => setIsMobileMenuOpen(true)}
        />

        <div className="content">
          {activeTab === 'dashboard' && (
            <DashboardView
              currentPeriod={currentPeriod}
              incomes={incomes}
              expenses={expenses}
              creditCards={creditCards}
              creditTransactions={creditTransactions}
              onNavigateTab={setActiveTab}
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
          {activeTab === 'credit' && (
            <CreditCardsView
              currentPeriod={currentPeriod}
              creditCards={creditCards}
              creditTransactions={creditTransactions}
              onAddCard={c => { addCreditCard(c); showToast('Tarjeta de crédito agregada', 'success') }}
              onUpdateCard={c => { updateCreditCard(c); showToast('Tarjeta actualizada', 'info') }}
              onDeleteCard={id => { deleteCreditCard(id); showToast('Tarjeta eliminada', 'error') }}
              onAddTransaction={t => { addCreditTransaction(t); showToast('Consumo en tarjeta registrado', 'success') }}
              onUpdateTransaction={t => { updateCreditTransaction(t); showToast('Consumo actualizado', 'info') }}
              onDeleteTransaction={id => { deleteCreditTransaction(id); showToast('Consumo eliminado', 'error') }}
              onTogglePaid={id => { toggleTransactionPaid(id); showToast('Estado de pago actualizado', 'info') }}
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
          {activeTab === 'budgets' && (
            <BudgetsAndGoalsView
              currentPeriod={currentPeriod}
              incomes={incomes}
              expenses={expenses}
              categoryBudgets={categoryBudgets}
              savingsGoals={savingsGoals}
              onSetCategoryBudget={setCategoryBudget}
              onSetMultipleBudgets={setMultipleCategoryBudgets}
              onAddSavingsGoal={addSavingsGoal}
              onUpdateSavingsGoal={updateSavingsGoal}
              onDepositToGoal={depositToGoal}
              onDeleteSavingsGoal={deleteSavingsGoal}
              onShowToast={showToast}
            />
          )}
          {activeTab === 'advisor' && (
            <SmartAnalysisPanel
              currentPeriod={currentPeriod}
              incomes={incomes}
              expenses={expenses}
              cashWithdrawals={cash}
              creditCards={creditCards}
              creditTransactions={creditTransactions}
            />
          )}
        </div>
      </div>

      <ReportExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        currentPeriod={currentPeriod}
        incomes={incomes}
        expenses={expenses}
        cashWithdrawals={cash}
        creditTransactions={creditTransactions}
        creditCards={creditCards}
        categoryBudgets={categoryBudgets}
        savingsGoals={savingsGoals}
        userEmail={user?.email}
        onShowToast={showToast}
      />

      <SecurityModal
        isOpen={isSecurityOpen}
        onClose={() => setIsSecurityOpen(false)}
        userEmail={user?.email}
        onUpdatePassword={updateUserPassword}
      />

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <MitLicenseModal isOpen={showLicenseModal} onClose={() => setShowLicenseModal(false)} />
      <Analytics />
    </div>
  )
}

export default App
