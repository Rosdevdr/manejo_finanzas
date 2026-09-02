import { useState, useMemo, useRef, useEffect } from 'react'
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
import { AiChatAssistantView } from './components/chat/AiChatAssistantView'
import { FireCalculatorModal } from './components/budgets/FireCalculatorModal'
import { ScenarioSimulatorModal } from './components/scenarios/ScenarioSimulatorModal'
import { ToastContainer }    from './components/ui/ToastContainer'
import { LoginView }         from './components/auth/LoginView'
import { SecurityModal }     from './components/security/SecurityModal'
import { MitLicenseModal }   from './components/ui/MitLicenseModal'
import { ReportExportModal } from './components/reports/ReportExportModal'
import { ModuleUsageGuideModal } from './components/guide/ModuleUsageGuideModal'
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
  calculateCumulativeBalance,
} from './utils/calendar'

import { TermsAndConditionsModal } from './components/legal/TermsAndConditionsModal'

export function App() {
  const [activeTab, setActiveTab]               = useState<TabType>('dashboard')
  const [currentPeriod, setCurrentPeriod]       = useState<string>(() => getCurrentSystemPeriod())
  const [showLicenseModal, setShowLicenseModal] = useState(false)
  const [showTermsModal, setShowTermsModal]     = useState(false)
  const [isSecurityOpen, setIsSecurityOpen]     = useState(false)
  const [showExportModal, setShowExportModal]   = useState(false)
  const [showFireModal, setShowFireModal]       = useState(false)
  const [showScenarioModal, setShowScenarioModal] = useState(false)
  const [showGuideModal, setShowGuideModal] = useState(false)
  const [guideInitialModule, setGuideInitialModule] = useState('dashboard')
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

  const cumulativeSummary = useMemo(
    () => calculateCumulativeBalance(incomes, expenses, currentPeriod),
    [incomes, expenses, currentPeriod]
  )

  const periodExpenses = expenses.filter(e => e.period === currentPeriod)
  const totalExpense   = periodExpenses.reduce((s, e) => s + e.amount, 0)
  const available      = cumulativeSummary.totalCumulativeBalance

  // Navegación matemática dinámica e ilimitada de meses (sin pérdida de datos)
  const prevPeriod  = () => setCurrentPeriod(prev => getPreviousPeriod(prev))
  const nextPeriod  = () => setCurrentPeriod(prev => getNextPeriod(prev))
  const periodLabel = useMemo(() => formatPeriodLabel(currentPeriod), [currentPeriod])
  const contentRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0
    }
  }, [activeTab])

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
        onOpenFireCalculator={() => setShowFireModal(true)}
        onOpenScenarioSimulator={() => setShowScenarioModal(true)}
        onOpenLicense={() => setShowLicenseModal(true)}
        onOpenTerms={() => setShowTermsModal(true)}
        onOpenGuide={() => {
          setGuideInitialModule('dashboard')
          setShowGuideModal(true)
        }}
        isInstallable={isInstallable}
        onInstallApp={installApp}
      />

      <div className="main">
        <AppHeader
          periodLabel={periodLabel}
          onPrev={prevPeriod}
          onNext={nextPeriod}
          balanceLabel={formatCurrency(cumulativeSummary.totalCumulativeBalance)}
          balancePositive={cumulativeSummary.totalCumulativeBalance >= 0}
          carriedOverBalance={cumulativeSummary.carriedOverBalance}
          monthNetFlow={cumulativeSummary.periodNet}
          isDemoMode={isDemoMode}
          userEmail={user?.email}
          currentPeriod={currentPeriod}
          creditCards={creditCards}
          creditTransactions={creditTransactions}
          onSignOut={signOut}
          onOpenSecurity={() => setIsSecurityOpen(true)}
          onOpenLicense={() => setShowLicenseModal(true)}
          isInstallable={isInstallable}
          onInstallApp={installApp}
          onOpenMenu={() => setIsMobileMenuOpen(true)}
        />

        <div ref={contentRef} className="content">
          {activeTab === 'dashboard' && (
            <DashboardView
              currentPeriod={currentPeriod}
              incomes={incomes}
              expenses={expenses}
              creditCards={creditCards}
              creditTransactions={creditTransactions}
              userEmail={user?.email}
              onNavigateTab={setActiveTab}
              onOpenTerms={() => setShowTermsModal(true)}
            />
          )}
          {activeTab === 'incomes' && (
            <IncomesView
              currentPeriod={currentPeriod}
              incomes={incomes}
              onAddIncome={async d => {
                const res = await addIncome(d)
                if (!res.success) {
                  showToast(res.error || 'Error al registrar ingreso', 'error')
                } else if (res.targetPeriod && res.targetPeriod !== currentPeriod) {
                  showToast(`Ingreso guardado en el período ${res.targetPeriod}`, 'info')
                } else {
                  showToast('Ingreso registrado correctamente', 'success')
                }
              }}
              onUpdateIncome={async u => {
                const res = await updateIncome(u)
                if (!res.success) showToast(res.error || 'Error al actualizar', 'error')
                else showToast('Ingreso actualizado', 'info')
              }}
              onDeleteIncome={id => { deleteIncome(id); showToast('Ingreso eliminado', 'error') }}
            />
          )}
          {activeTab === 'expenses' && (
            <ExpensesView
              currentPeriod={currentPeriod}
              expenses={expenses}
              onAddExpense={async d => {
                const res = await addExpense(d)
                if (!res.success) {
                  showToast(res.error || 'Error al registrar gasto', 'error')
                } else if (res.targetPeriod && res.targetPeriod !== currentPeriod) {
                  showToast(`Gasto guardado en el período ${res.targetPeriod}`, 'info')
                } else {
                  showToast('Gasto registrado correctamente', 'success')
                }
              }}
              onUpdateExpense={async u => {
                const res = await updateExpense(u)
                if (!res.success) showToast(res.error || 'Error al actualizar', 'error')
                else showToast('Gasto actualizado', 'info')
              }}
              onDeleteExpense={id => { deleteExpense(id); showToast('Gasto eliminado', 'error') }}
            />
          )}
          {activeTab === 'credit' && (
            <CreditCardsView
              currentPeriod={currentPeriod}
              creditCards={creditCards}
              creditTransactions={creditTransactions}
              onAddCard={async c => {
                const res = await addCreditCard(c)
                if (!res.success) showToast(res.error || 'Error al agregar tarjeta', 'error')
                else showToast('Tarjeta de crédito agregada', 'success')
              }}
              onUpdateCard={async c => {
                const res = await updateCreditCard(c)
                if (!res.success) showToast(res.error || 'Error al actualizar tarjeta', 'error')
                else showToast('Tarjeta actualizada', 'info')
              }}
              onDeleteCard={id => { deleteCreditCard(id); showToast('Tarjeta eliminada', 'error') }}
              onAddTransaction={async t => {
                const res = await addCreditTransaction(t)
                if (!res.success) {
                  showToast(res.error || 'Error al registrar consumo', 'error')
                } else if (res.targetPeriod && res.targetPeriod !== currentPeriod) {
                  showToast(`Consumo guardado en el período ${res.targetPeriod}`, 'info')
                } else {
                  showToast('Consumo en tarjeta registrado', 'success')
                }
              }}
              onUpdateTransaction={async t => {
                const res = await updateCreditTransaction(t)
                if (!res.success) showToast(res.error || 'Error al actualizar consumo', 'error')
                else showToast('Consumo actualizado', 'info')
              }}
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
              onAddWithdrawal={async d => {
                const res = await addWithdrawal(d)
                if (!res.success) {
                  showToast(res.error || 'Error al registrar retiro', 'error')
                } else if (res.targetPeriod && res.targetPeriod !== currentPeriod) {
                  showToast(`Retiro guardado en el período ${res.targetPeriod}`, 'info')
                } else {
                  showToast('Retiro registrado correctamente', 'success')
                }
              }}
              onDeleteWithdrawal={id => { deleteWithdrawal(id); showToast('Retiro eliminado', 'error') }}
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
          {activeTab === 'chat-advisor' && (
            <AiChatAssistantView
              currentPeriod={currentPeriod}
              incomes={incomes}
              expenses={expenses}
              cashWithdrawals={cash}
              creditCards={creditCards}
              creditTransactions={creditTransactions}
              categoryBudgets={categoryBudgets}
              savingsGoals={savingsGoals}
              userEmail={user?.email}
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

      <FireCalculatorModal
        isOpen={showFireModal}
        onClose={() => setShowFireModal(false)}
        currentMonthlyExpense={totalExpense}
        currentSavings={available}
      />

      <ScenarioSimulatorModal
        isOpen={showScenarioModal}
        onClose={() => setShowScenarioModal(false)}
        currentPeriod={currentPeriod}
        incomes={incomes}
        expenses={expenses}
      />

      <SecurityModal
        isOpen={isSecurityOpen}
        onClose={() => setIsSecurityOpen(false)}
        userEmail={user?.email}
        onUpdatePassword={updateUserPassword}
      />

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <MitLicenseModal isOpen={showLicenseModal} onClose={() => setShowLicenseModal(false)} />
      <TermsAndConditionsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
      <ModuleUsageGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        initialModule={guideInitialModule}
      />
      <Analytics />
    </div>
  )
}

export default App
