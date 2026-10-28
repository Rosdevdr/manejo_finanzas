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
import { SplashScreenLoader } from './components/common/SplashScreenLoader'
import { InstallAppModal } from './components/ui/InstallAppModal'

export function App() {
  const [activeTab, setActiveTab]               = useState<TabType>('dashboard')
  const [currentPeriod, setCurrentPeriod]       = useState<string>(() => getCurrentSystemPeriod())
  const [theme, setTheme]                       = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('aureus_theme') as 'light' | 'dark') || 'dark'
  })
  const [isModuleLoading, setIsModuleLoading]   = useState(true)
  const [isExitingSplash, setIsExitingSplash]   = useState(false)
  const [splashText, setSplashText]             = useState({
    message: 'Cargando AUREUS',
    subtext: 'Inicializando módulos financieros...',
  })
  const [showLicenseModal, setShowLicenseModal] = useState(false)
  const [showTermsModal, setShowTermsModal]     = useState(false)
  const [isSecurityOpen, setIsSecurityOpen]     = useState(false)
  const [showExportModal, setShowExportModal]   = useState(false)
  const [showFireModal, setShowFireModal]       = useState(false)
  const [showScenarioModal, setShowScenarioModal] = useState(false)
  const [showGuideModal, setShowGuideModal] = useState(false)
  const [guideInitialModule, setGuideInitialModule] = useState('dashboard')
  const [isSidebarOpen, setIsSidebarOpen]       = useState(false)
  const [showInstallModal, setShowInstallModal] = useState(false)

  // Cerrar sidebar al presionar tecla Escape
  useEffect(() => {
    if (!isSidebarOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSidebarOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSidebarOpen])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('aureus_theme', theme)
  }, [theme])

  const toggleTheme = () => {
    document.documentElement.classList.add('theme-transitioning')
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning')
    }, 320)
  }

  const { toasts, show: showToast, dismiss } = useToast()
  const { isInstallable, installApp } = usePwaInstall()

  const {
    user,
    loading: authLoading,
    isDemoMode,
    isSupabaseConfigured,
    isPasswordRecovery,
    needsMfa,
    mfaFactorId,
    clearPasswordRecovery,
    signIn,
    signUp,
    signOut,
    verifyMfa,
    cancelMfa,
    sendPasswordReset,
    updateUserPassword,
    enterDemoMode,
  } = useAuth()

  const {
    incomes, expenses, cash, creditCards, creditTransactions, categoryBudgets, savingsGoals,
    dashboardSummary, fetchDashboardSummary,
    addIncome, updateIncome, deleteIncome,
    addExpense, updateExpense, deleteExpense,
    addWithdrawal, deleteWithdrawal,
    addCreditCard, updateCreditCard, deleteCreditCard,
    addCreditTransaction, updateCreditTransaction, deleteCreditTransaction, toggleTransactionPaid,
    setCategoryBudget, setMultipleCategoryBudgets,
    addSavingsGoal, updateSavingsGoal, depositToGoal, deleteSavingsGoal,
    purgeAllUserData,
  } = useFinanceStorage(user)

  // Actualizar resumen del Dashboard al cambiar de período o mutar datos
  useEffect(() => {
    void fetchDashboardSummary(currentPeriod)
  }, [currentPeriod, fetchDashboardSummary])

  // Derecho al Olvido (Ley No. 172-13 RD / Art. 17 GDPR)
  const handleDeleteAccount = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await purgeAllUserData()
      if (!res.success) {
        return res
      }
      // Limpiar claves locales de sesión, IA y finanzas
      try {
        const keysToRemove = Object.keys(localStorage).filter(
          k => k.startsWith('aureus_chat_') || k.startsWith('aureus_user_') || k.startsWith('aureus_demo') || k.startsWith('aureus_')
        )
        keysToRemove.forEach(k => localStorage.removeItem(k))
        sessionStorage.clear()
      } catch {}

      await signOut()
      setIsSecurityOpen(false)
      showToast('Tu cuenta y todos tus datos han sido destruidos permanentemente conforme a la Ley 172-13.', 'success')
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al procesar la eliminación' }
    }
  }

  const cumulativeSummary = useMemo(
    () => calculateCumulativeBalance(incomes, expenses, currentPeriod),
    [incomes, expenses, currentPeriod]
  )

  const periodExpenses = expenses.filter(e => e.period === currentPeriod)
  const totalExpense   = periodExpenses.reduce((s, e) => s + e.amount, 0)
  const available      = cumulativeSummary.totalCumulativeBalance

  // Navegación matemática dinámica e ilimitada de meses sin notificación redundante
  const prevPeriod = () => {
    setCurrentPeriod(prev => getPreviousPeriod(prev))
  }

  const nextPeriod = () => {
    setCurrentPeriod(prev => getNextPeriod(prev))
  }

  const periodLabel = useMemo(() => formatPeriodLabel(currentPeriod), [currentPeriod])
  const contentRef  = useRef<HTMLDivElement>(null)
  const splashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const splashExitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearSplashTimers = () => {
    if (splashTimerRef.current) {
      clearTimeout(splashTimerRef.current)
      splashTimerRef.current = null
    }
    if (splashExitTimerRef.current) {
      clearTimeout(splashExitTimerRef.current)
      splashExitTimerRef.current = null
    }
  }

  // Orquestador unificado de pantallas de carga sincronizado con requestAnimationFrame
  const triggerSplashLoader = (message: string, subtext: string, durationMs = 1100) => {
    clearSplashTimers()
    setSplashText({ message, subtext })
    setIsExitingSplash(false)
    setIsModuleLoading(true)

    const scheduleTimers = () => {
      splashTimerRef.current = setTimeout(() => {
        setIsExitingSplash(true)
        splashExitTimerRef.current = setTimeout(() => {
          setIsModuleLoading(false)
          setIsExitingSplash(false)
        }, 380)
      }, durationMs)
    }

    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(scheduleTimers)
      })
    } else {
      scheduleTimers()
    }
  }

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0
    }
  }, [activeTab])

  // Splash inicial estilo Stripe al montar la plataforma (garantizado en todos los navegadores)
  useEffect(() => {
    triggerSplashLoader('Cargando AUREUS', 'Inicializando módulos financieros...', 1250)
    return () => clearSplashTimers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Carga de módulos con micro-transición institucional
  const handleTabChange = (tab: TabType) => {
    if (tab === activeTab) return
    const titles: Record<TabType, string> = {
      dashboard: 'Dashboard General',
      incomes: 'Control de Ingresos',
      expenses: 'Gestión de Egresos',
      credit: 'Tarjetas de Crédito',
      cash: 'Flujo de Efectivo',
      budgets: 'Presupuestos y Metas',
      advisor: 'Análisis Inteligente',
      'chat-advisor': 'Asistente IA AUREUS',
    }

    setActiveTab(tab)
    triggerSplashLoader(
      titles[tab] || 'Cargando AUREUS',
      'Sincronizando registros y balance...',
      1100
    )
  }

  // Transición fluida con pantalla de carga al entrar en Modo Demo
  const handleEnterDemoMode = () => {
    enterDemoMode()
    triggerSplashLoader('Iniciando AUREUS', 'Preparando entorno financiero...', 1100)
  }

  // Transición fluida con pantalla de carga al iniciar sesión
  const handleSignIn = async (email: string, pass: string) => {
    const res = await signIn(email, pass)
    if (!res.error && !res.needsMfa) {
      triggerSplashLoader('Bienvenido a AUREUS', 'Sincronizando cuentas y balances...', 1100)
    }
    return res
  }

  // Mostrar pantalla de Login si no hay usuario ni modo demo (o si está en flujo de recuperación de contraseña o reto MFA)
  if ((!authLoading && (!user || needsMfa) && !isDemoMode) || isPasswordRecovery) {
    return (
      <>
        <LoginView
          onSignIn={handleSignIn}
          onSignUp={signUp}
          onSendPasswordReset={sendPasswordReset}
          onUpdateUserPassword={updateUserPassword}
          onEnterDemoMode={handleEnterDemoMode}
          isSupabaseConfigured={isSupabaseConfigured}
          isPasswordRecovery={isPasswordRecovery}
          onClearPasswordRecovery={clearPasswordRecovery}
          needsMfa={needsMfa}
          mfaFactorId={mfaFactorId}
          onVerifyMfa={verifyMfa}
          onCancelMfa={cancelMfa}
          onOpenTerms={() => setShowTermsModal(true)}
        />
        <TermsAndConditionsModal
          isOpen={showTermsModal}
          onClose={() => setShowTermsModal(false)}
          onOpenSecurity={() => setIsSecurityOpen(true)}
        />
        {isModuleLoading && (
          <SplashScreenLoader
            message={splashText.message}
            subtext={splashText.subtext}
            isExiting={isExitingSplash}
            theme={theme}
          />
        )}
        <ToastContainer toasts={toasts} onDismiss={dismiss} />
        <Analytics />
      </>
    )
  }

  return (
    <div className="app-shell">
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        userEmail={user?.email}
        isDemoMode={isDemoMode}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
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
        onInstallApp={() => setShowInstallModal(true)}
      />

      <div className={`main ${isSidebarOpen ? 'module-defocused' : ''}`}>
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
          onSelectPeriod={setCurrentPeriod}
          creditCards={creditCards}
          creditTransactions={creditTransactions}
          onSignOut={signOut}
          onOpenSecurity={() => setIsSecurityOpen(true)}
          onOpenLicense={() => setShowLicenseModal(true)}
          isInstallable={isInstallable}
          onInstallApp={() => setShowInstallModal(true)}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
          onOpenMenu={() => setIsSidebarOpen(prev => !prev)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <div ref={contentRef} className={`content ${activeTab === 'chat-advisor' ? 'content-chat-mode' : ''}`}>
          {activeTab === 'dashboard' && (
            <DashboardView
              currentPeriod={currentPeriod}
              incomes={incomes}
              expenses={expenses}
              cashWithdrawals={cash}
              creditCards={creditCards}
              creditTransactions={creditTransactions}
              categoryBudgets={categoryBudgets}
              userEmail={user?.email}
              dashboardSummary={dashboardSummary}
              onNavigateTab={handleTabChange}
              onOpenTerms={() => setShowTermsModal(true)}
              onOpenFireCalculator={() => setShowFireModal(true)}
              onOpenSecurity={() => setIsSecurityOpen(true)}
              onOpenExport={() => setShowExportModal(true)}
              onOpenScenarioSimulator={() => setShowScenarioModal(true)}
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
              key={user?.email || (isDemoMode ? 'demo' : 'guest')}
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
        isDemoMode={isDemoMode}
        onUpdatePassword={updateUserPassword}
        onDeleteAccount={handleDeleteAccount}
      />

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <MitLicenseModal isOpen={showLicenseModal} onClose={() => setShowLicenseModal(false)} />
      <TermsAndConditionsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onOpenSecurity={() => setIsSecurityOpen(true)}
      />
      <ModuleUsageGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        initialModule={guideInitialModule}
      />
      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        isInstallable={isInstallable}
        onInstallPwa={installApp}
      />
      {isModuleLoading && (
        <SplashScreenLoader
          message={splashText.message}
          subtext={splashText.subtext}
          isExiting={isExitingSplash}
          theme={theme}
        />
      )}
      <Analytics />
    </div>
  )
}

export default App
