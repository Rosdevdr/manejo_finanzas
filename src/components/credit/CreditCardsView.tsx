import { useState, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  CreditCard as CardIcon,
  Plus,
  Trash2,
  Pencil,
  Sparkles,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  ArrowDownCircle,
  X,
  ShieldCheck,
  Home,
  Utensils,
  Car,
  HeartPulse,
  Gamepad2,
  GraduationCap,
  Package,
} from 'lucide-react'
import type {
  CreditCard,
  CreditCardTransaction,
  ExpenseCategory,
  CardThemeColor,
} from '../../types/finance'
import { formatCurrency } from '../../utils/formatters'
import { formatPeriodLabel } from '../../utils/calendar'
import { evaluateCardHealth, getConsolidatedCreditSummary } from '../../utils/creditAdvisor'
import { sanitizeCardLastFour } from '../../utils/security'
import { CustomIconSelect, type CustomSelectOption } from '../ui/CustomIconSelect'
import './CreditCardsView.css'

interface CreditCardsViewProps {
  currentPeriod: string
  creditCards: CreditCard[]
  creditTransactions: CreditCardTransaction[]
  availableBalance?: number
  userEmail?: string | null
  onAddCard: (card: Omit<CreditCard, 'id'>) => void
  onUpdateCard: (card: CreditCard) => void
  onDeleteCard: (id: string) => void
  onAddTransaction: (tx: Omit<CreditCardTransaction, 'id'>) => void
  onUpdateTransaction: (tx: CreditCardTransaction) => void
  onDeleteTransaction: (id: string) => void
  onTogglePaid: (id: string) => void
  onPayCardDebt?: (amount: number, cardName: string) => void
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void
}

const CATEGORY_MAP: Record<ExpenseCategory, { label: string; subtitle: string; badge: string; icon: ReactNode; color: string }> = {
  housing:       { label: 'Vivienda',     subtitle: 'Renta, mantenimiento', badge: 'badge-vivienda',     icon: <Home size={14} />,          color: '#60A5FA' },
  food:          { label: 'Alimentación', subtitle: 'Supermercado, despensa', badge: 'badge-alimentacion', icon: <Utensils size={14} />,    color: '#34D399' },
  transport:     { label: 'Transporte',   subtitle: 'Combustible, movilidad', badge: 'badge-transporte',   icon: <Car size={14} />,         color: '#FBBF24' },
  utilities:     { label: 'Servicios',    subtitle: 'Luz, internet, móvil', badge: 'badge-servicios',    icon: <Zap size={14} />,           color: '#38BDF8' },
  health:        { label: 'Salud',        subtitle: 'Farmacia, consultas', badge: 'badge-salud',        icon: <HeartPulse size={14} />,    color: '#F87171' },
  entertainment: { label: 'Ocio',         subtitle: 'Restaurantes, salidas', badge: 'badge-ocio',         icon: <Gamepad2 size={14} />,      color: '#A78BFA' },
  education:     { label: 'Educación',    subtitle: 'Cursos, formación',   badge: 'badge-inversion',    icon: <GraduationCap size={14} />, color: '#C9A84C' },
  debt:          { label: 'Deudas',       subtitle: 'Cuotas y abonos',     badge: 'badge-fijo',         icon: <CardIcon size={14} />,      color: '#FB7185' },
  other:         { label: 'Otros',        subtitle: 'Misceláneos',         badge: 'badge-fijo',         icon: <Package size={14} />,       color: '#94A3B8' },
}

const CREDIT_CATEGORY_OPTIONS: CustomSelectOption<ExpenseCategory>[] = (
  Object.entries(CATEGORY_MAP) as [ExpenseCategory, (typeof CATEGORY_MAP)[ExpenseCategory]][]
).map(([value, meta]) => ({
  value,
  label: meta.label,
  subtitle: meta.subtitle,
  icon: meta.icon,
  accentColor: meta.color,
}))

export function CreditCardsView({
  currentPeriod,
  creditCards,
  creditTransactions,
  availableBalance,
  userEmail,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onTogglePaid,
  onPayCardDebt,
  onShowToast,
}: CreditCardsViewProps) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(creditCards[0]?.id || null)
  const [showCardModal, setShowCardModal] = useState(false)
  const [showTxModal, setShowTxModal] = useState(false)
  const [showAbonoModal, setShowAbonoModal] = useState(false)
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null)

  // Abono a deuda
  const [customAbonoAmount, setCustomAbonoAmount] = useState<string | null>(null)
  const [abonoConfirmed, setAbonoConfirmed] = useState(false)
  const [abonoError, setAbonoError] = useState<string | null>(null)

  const holderName = userEmail
    ? userEmail.split('@')[0].replace(/[._-]/g, ' ').toUpperCase()
    : 'TITULAR AUREUS'

  const safeAvailable = availableBalance !== undefined ? Math.max(0, availableBalance) : undefined

  // Cerrar cualquier modal al presionar la tecla Escape
  useEffect(() => {
    if (!showCardModal && !showTxModal && !showAbonoModal) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowCardModal(false)
        setShowTxModal(false)
        setShowAbonoModal(false)
        setAbonoError(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showCardModal, showTxModal, showAbonoModal])

  // Card Form
  const [cardForm, setCardForm] = useState<{
    name: string
    bank: string
    lastFourDigits: string
    creditLimit: string
    cutoffDay: number
    paymentDueDay: number
    interestRate: string
    color: CardThemeColor
  }>({
    name: '',
    bank: '',
    lastFourDigits: '',
    creditLimit: '',
    cutoffDay: 15,
    paymentDueDay: 5,
    interestRate: '4.5',
    color: 'gold',
  })

  // Transaction Form
  const [txForm, setTxForm] = useState<{
    cardId: string
    description: string
    amount: string
    category: ExpenseCategory
    date: string
    installments: number
  }>({
    cardId: creditCards[0]?.id || '',
    description: '',
    amount: '',
    category: 'food',
    date: new Date().toISOString().slice(0, 10),
    installments: 1,
  })

  const [editingTxId, setEditingTxId] = useState<string | null>(null)
  const [editTxForm, setEditTxForm] = useState<{
    description: string
    amount: string
    category: ExpenseCategory
    date: string
    installments: number
  }>({
    description: '',
    amount: '',
    category: 'food',
    date: '',
    installments: 1,
  })

  // Summary Metrics
  const summary = getConsolidatedCreditSummary(creditCards, creditTransactions)
  const activeCard = creditCards.find(c => c.id === selectedCardId) || creditCards[0]
  const cardHealth = activeCard ? evaluateCardHealth(activeCard, creditTransactions) : null

  const defaultAbono = cardHealth && cardHealth.totalDebt > 0 ? cardHealth.totalDebt.toFixed(2) : ''
  const abonoAmount = customAbonoAmount ?? defaultAbono
  const setAbonoAmount = (val: string) => {
    setAbonoError(null)
    setCustomAbonoAmount(val)
  }

  const getPeriod = (t: { period?: string; date?: string }) =>
    t.period && t.period.trim().length === 7 ? t.period.trim() : (t.date ? t.date.slice(0, 7) : currentPeriod)

  const activePeriodTxs = creditTransactions.filter(t => getPeriod(t) === currentPeriod)

  // Cashback & Puntos calculados dinámicamente (1.5% sobre el volumen de consumos del ciclo)
  const totalCycleSpend = activePeriodTxs.reduce((s, t) => s + t.amount, 0)
  const estimatedCashbackDop = Number((totalCycleSpend * 0.015).toFixed(2))
  const estimatedPoints = Math.round(totalCycleSpend * 0.35)

  const [showAllCards, setShowAllCards] = useState(false)
  const [showAllPeriods, setShowAllPeriods] = useState(false)

  // Auto-switch to full history when Supabase loads data asynchronously
  useEffect(() => {
    if (activePeriodTxs.length === 0 && creditTransactions.length > 0) {
      setShowAllPeriods(true)
    } else if (activePeriodTxs.length > 0) {
      setShowAllPeriods(false)
    }
  }, [creditTransactions.length, currentPeriod, activePeriodTxs.length])

  const displayedTransactions = creditTransactions
    .filter(t => {
      const matchCard = showAllCards || !selectedCardId || t.cardId === selectedCardId
      const matchPeriod = showAllPeriods || (activePeriodTxs.length === 0 && creditTransactions.length > 0) || getPeriod(t) === currentPeriod
      return matchCard && matchPeriod
    })
    .sort((a, b) => b.date.localeCompare(a.date))

  function handleOpenAddCard() {
    setEditingCard(null)
    setCardForm({
      name: '',
      bank: '',
      lastFourDigits: '',
      creditLimit: '',
      cutoffDay: 15,
      paymentDueDay: 5,
      interestRate: '4.5',
      color: 'gold',
    })
    setShowCardModal(true)
  }

  function handleOpenEditCard(c: CreditCard) {
    setEditingCard(c)
    setCardForm({
      name: c.name,
      bank: c.bank,
      lastFourDigits: c.lastFourDigits,
      creditLimit: String(c.creditLimit),
      cutoffDay: c.cutoffDay,
      paymentDueDay: c.paymentDueDay,
      interestRate: c.interestRate ? String(c.interestRate) : '',
      color: c.color,
    })
    setShowCardModal(true)
  }

  function handleSaveCard(e: React.FormEvent) {
    e.preventDefault()
    if (!cardForm.name || !cardForm.creditLimit) return

    const cleanLastFour = sanitizeCardLastFour(cardForm.lastFourDigits)
    if (editingCard) {
      onUpdateCard({
        ...editingCard,
        name: cardForm.name,
        bank: cardForm.bank || 'Banco',
        lastFourDigits: cleanLastFour,
        creditLimit: parseFloat(cardForm.creditLimit),
        cutoffDay: Number(cardForm.cutoffDay),
        paymentDueDay: Number(cardForm.paymentDueDay),
        interestRate: cardForm.interestRate ? parseFloat(cardForm.interestRate) : undefined,
        color: cardForm.color,
      })
    } else {
      onAddCard({
        name: cardForm.name,
        bank: cardForm.bank || 'Banco',
        lastFourDigits: cleanLastFour,
        creditLimit: parseFloat(cardForm.creditLimit),
        cutoffDay: Number(cardForm.cutoffDay),
        paymentDueDay: Number(cardForm.paymentDueDay),
        interestRate: cardForm.interestRate ? parseFloat(cardForm.interestRate) : undefined,
        color: cardForm.color,
      })
    }
    setShowCardModal(false)
  }

  function handleAddTx(e: React.FormEvent) {
    e.preventDefault()
    if (!txForm.description || !txForm.amount || !txForm.cardId) return

    const parsedAmount = parseFloat(txForm.amount)
    const targetCard = creditCards.find(c => c.id === txForm.cardId)
    if (targetCard) {
      const targetHealth = evaluateCardHealth(targetCard, creditTransactions)
      if (parsedAmount > targetHealth.availableCredit) {
        onShowToast?.(
          `Límite de crédito insuficiente en ${targetCard.name}: disponible ${formatCurrency(targetHealth.availableCredit)}.`,
          'error'
        )
        return
      }
    }

    const computedPeriod = txForm.date ? txForm.date.slice(0, 7) : currentPeriod
    onAddTransaction({
      cardId: txForm.cardId,
      period: computedPeriod,
      description: txForm.description,
      amount: parsedAmount,
      category: txForm.category,
      date: txForm.date,
      installments: Number(txForm.installments) || 1,
      currentInstallment: 1,
      isPaid: false,
    })

    setTxForm(p => ({
      ...p,
      description: '',
      amount: '',
      category: 'food',
      date: new Date().toISOString().slice(0, 10),
      installments: 1,
    }))
    setShowTxModal(false)
  }

  function startEditTx(t: CreditCardTransaction) {
    setEditingTxId(t.id)
    setEditTxForm({
      description: t.description,
      amount: String(t.amount),
      category: t.category,
      date: t.date,
      installments: t.installments,
    })
  }

  function saveEditTx(t: CreditCardTransaction) {
    const computedPeriod = editTxForm.date ? editTxForm.date.slice(0, 7) : t.period
    onUpdateTransaction({
      ...t,
      description: editTxForm.description,
      amount: parseFloat(editTxForm.amount),
      category: editTxForm.category,
      date: editTxForm.date,
      period: computedPeriod,
      installments: Number(editTxForm.installments),
    })
    setEditingTxId(null)
  }

  function handleApplyAbono(e: React.FormEvent) {
    e.preventDefault()
    const abono = parseFloat(abonoAmount)
    if (!abono || abono <= 0 || !activeCard || !cardHealth) return

    if (safeAvailable !== undefined && abono > safeAvailable) {
      const msg = `Saldo líquido insuficiente: dispones de ${formatCurrency(safeAvailable)} y no puedes abonar ${formatCurrency(abono)}.`
      setAbonoError(msg)
      onShowToast?.(msg, 'error')
      return
    }

    const effectiveAbono = Math.min(abono, cardHealth.totalDebt)
    if (effectiveAbono <= 0) return

    // Ordenar cargos pendientes por antigüedad para saldar primero los más antiguos (o parciales)
    const pending = creditTransactions
      .filter(t => t.cardId === activeCard.id && !t.isPaid)
      .sort((a, b) => a.date.localeCompare(b.date) || b.amount - a.amount)

    let remaining = effectiveAbono
    for (const tx of pending) {
      if (remaining <= 0) break
      if (tx.amount <= remaining + 0.005) {
        remaining = Number(Math.max(0, remaining - tx.amount).toFixed(2))
        onTogglePaid(tx.id)
      } else {
        // Abono parcial: reduce el saldo pendiente de esta transacción
        const newPendingAmount = Number((tx.amount - remaining).toFixed(2))
        remaining = 0
        onUpdateTransaction({
          ...tx,
          amount: newPendingAmount,
        })
      }
    }

    // Registrar salida de caja real en Egresos (pago de deuda de tarjeta)
    onPayCardDebt?.(effectiveAbono, `${activeCard.name} (${activeCard.bank})`)

    setAbonoError(null)
    setAbonoAmount('')
    setAbonoConfirmed(true)
    setTimeout(() => {
      setAbonoConfirmed(false)
      setShowAbonoModal(false)
    }, 1500)
  }

  return (
    <div className="credit-view-stitch-root">
      {/* ── CABECERA INSTITUCIONAL STITCH ── */}
      <div className="credit-page-header">
        <div className="credit-title-wrap">
          <h1>Tarjetas, Pasivos &amp; Conciliación de Consumos</h1>
          <p>
            Control centralizado de plásticos corporativos y personales, fechas de corte, límites crediticios y auditoría de consumos con conciliación automatizada.
          </p>
        </div>
        <div className="credit-header-actions">
          {activeCard && cardHealth && cardHealth.totalDebt > 0 && (
            <button
              type="button"
              className="btn-stitch-outline"
              onClick={() => {
                setAbonoError(null)
                setShowAbonoModal(true)
              }}
            >
              <ArrowDownCircle size={15} />
              <span>Regla de Pago / Abono</span>
            </button>
          )}
          <button
            type="button"
            className="btn-stitch-outline"
            onClick={() => {
              setTxForm(p => ({ ...p, cardId: selectedCardId || creditCards[0]?.id || '' }))
              setShowTxModal(true)
            }}
            disabled={creditCards.length === 0}
          >
            <Plus size={15} />
            <span>Registrar Cargo</span>
          </button>
          <button
            type="button"
            className="btn-stitch-gold"
            onClick={handleOpenAddCard}
          >
            <Plus size={15} />
            <span>Vincular Nueva Tarjeta</span>
          </button>
        </div>
      </div>

      {/* ── GLOBAL METRICS STRIP (STITCH EXACT 3 BENTO CARDS) ── */}
      <div className="credit-kpi-grid">
        {/* Metric 1: Línea de Crédito Total */}
        <div className="credit-kpi-card">
          <div className="kpi-header-row">
            <span className="kpi-title-label">Línea de Crédito Total</span>
            <span className="kpi-badge-success">
              <CheckCircle2 size={12} />
              {summary.utilizationRate.toFixed(1)}% Utilizado ({summary.utilizationRate <= 30 ? 'Óptimo' : 'Atención'})
            </span>
          </div>
          <div className="kpi-value-block">
            <div className="kpi-big-number">
              {formatCurrency(summary.totalLimit)}
            </div>
            <p className="kpi-footnote">
              Disponible consolidado: <strong style={{ color: 'var(--color-tertiary, #56e5a9)' }}>{formatCurrency(summary.availableCredit)}</strong>
            </p>
          </div>
          {/* Health Progress Bar */}
          <div>
            <div style={{ width: '100%', height: 6, borderRadius: 9999, backgroundColor: 'var(--color-surface-container-highest, #31353e)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(summary.utilizationRate, 100)}%`,
                  backgroundColor: summary.utilizationRate > 50 ? 'var(--color-error, #ffb4ab)' : 'var(--color-tertiary, #56e5a9)',
                  borderRadius: 9999,
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--color-outline, #a08e7a)', marginTop: 4 }}>
              <span>Límites de crédito ({creditCards.length} plásticos)</span>
              <span>Umbral sano: &lt; 30%</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Próximo Vencimiento Más Cercano */}
        <div className="credit-kpi-card">
          <div className="kpi-header-row">
            <span className="kpi-title-label">Próximo Vencimiento Más Cercano</span>
            <span className="kpi-badge-warning">
              <Clock size={12} />
              En corte ({activeCard ? `${cardHealth?.daysToCutoff ?? 15} días` : 'Sin plásticos'})
            </span>
          </div>
          <div className="kpi-value-block">
            <div className="kpi-big-number" style={{ color: 'var(--color-primary, #ffc174)' }}>
              {formatCurrency(summary.totalDebt)}
            </div>
            <p className="kpi-footnote">
              {activeCard ? `${activeCard.name} (${activeCard.bank})` : 'Sin tarjeta activa'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid rgba(49, 53, 62, 0.3)' }}>
            <span style={{ fontSize: 10, color: 'var(--color-outline, #a08e7a)' }}>Pago sugerido sin intereses.</span>
            {summary.totalDebt > 0 && (
              <button
                type="button"
                className="btn-stitch-gold"
                style={{ padding: '4px 12px', fontSize: 12 }}
                onClick={() => {
                  setAbonoError(null)
                  setShowAbonoModal(true)
                }}
              >
                Pagar Deuda
              </button>
            )}
          </div>
        </div>

        {/* Metric 3: Cashback & Recompensas del Ciclo */}
        <div className="credit-kpi-card">
          <div className="kpi-header-row">
            <span className="kpi-title-label">Cashback &amp; Recompensas del Ciclo</span>
            <span className="kpi-badge-success">
              <Sparkles size={12} />
              1.5% Retorno Estimado
            </span>
          </div>
          <div className="kpi-value-block">
            <div className="kpi-big-number" style={{ color: 'var(--color-tertiary, #56e5a9)' }}>
              +{formatCurrency(estimatedCashbackDop)}
            </div>
            <p className="kpi-footnote">
              Puntos del período: <strong style={{ color: 'var(--color-on-surface, #dfe2ee)' }}>{estimatedPoints.toLocaleString('es-DO')} pts</strong> (convertibles a saldo)
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid rgba(49, 53, 62, 0.3)', fontSize: 10, color: 'var(--color-outline, #a08e7a)' }}>
            <span>Volumen facturado: {formatCurrency(totalCycleSpend)}</span>
            <span style={{ color: 'var(--color-tertiary, #56e5a9)', fontWeight: 600 }}>100% Bonificado</span>
          </div>
        </div>
      </div>

      {/* ── BILLETERA DE PLÁSTICOS VINCULADOS (CARRUSEL STITCH) ── */}
      <div className="cards-showcase-section">
        <div className="cards-showcase-header">
          <h2 className="cards-showcase-title">Billetera de Plásticos Vinculados</h2>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-outline, #a08e7a)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {creditCards.length} Plásticos Activos
          </span>
        </div>

        <div className="cards-grid-3">
          {creditCards.map(card => {
            const isSelected = (selectedCardId === card.id) || (!selectedCardId && creditCards[0]?.id === card.id)
            const health = evaluateCardHealth(card, creditTransactions)
            const plasticClass = card.color === 'gold' ? 'plastic-gold' : card.color === 'blue' ? 'plastic-blue' : card.color === 'silver' ? 'plastic-silver' : 'plastic-black'

            return (
              <div
                key={card.id}
                className={`stitch-credit-card-wrap ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedCardId(card.id)}
              >
                {/* Physical Card Body */}
                <div className={`physical-card-body ${plasticClass}`}>
                  <div className="card-top-row">
                    <div>
                      <span className="card-bank-name">{card.bank}</span>
                      <div className="card-product-name">{card.name}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-primary, #ffc174)' }}>
                      <span className="material-symbols-outlined text-lg">contactless</span>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>∞</span>
                    </div>
                  </div>

                  <div className="card-middle-row">
                    <div className="emv-chip">
                      <div className="emv-chip-line" />
                      <div className="emv-chip-line" />
                      <div className="emv-chip-line" />
                    </div>
                    <span className="card-masked-number">•••• {card.lastFourDigits}</span>
                  </div>

                  <div className="card-bottom-row">
                    <div className="card-holder-info">
                      <span className="card-holder-label">Titular Autorizado</span>
                      <span className="card-holder-name">{holderName}</span>
                    </div>
                    <div className="card-expiry-info">
                      <span className="card-holder-label">Corte / Pago</span>
                      <span className="card-expiry-val">D{card.cutoffDay} / D{card.paymentDueDay}</span>
                    </div>
                  </div>
                </div>

                {/* Details Panel */}
                <div className="card-details-panel">
                  <div className="card-balance-metric">
                    <div>
                      <span className="card-metric-label">Deuda Actual / Límite</span>
                      <div className="card-debt-display">{formatCurrency(health.totalDebt)}</div>
                      <span className="card-limit-display">Límite: {formatCurrency(card.creditLimit)}</span>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 9999,
                        backgroundColor: health.totalDebt > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(48, 200, 143, 0.15)',
                        color: health.totalDebt > 0 ? 'var(--color-primary-container, #f59e0b)' : 'var(--color-tertiary, #56e5a9)',
                      }}
                    >
                      {health.totalDebt > 0 ? 'PAGO PRÓXIMO' : 'ACTIVA'}
                    </span>
                  </div>

                  <div className="card-dates-row">
                    <span>Corte: Día {card.cutoffDay}</span>
                    <span>Pago: Día {card.paymentDueDay}</span>
                  </div>

                  <div className="card-actions-strip">
                    <button
                      type="button"
                      className="btn-stitch-outline"
                      style={{ padding: '4px 8px', fontSize: 11 }}
                      onClick={e => {
                        e.stopPropagation()
                        handleOpenEditCard(card)
                      }}
                    >
                      <Pencil size={12} /> Editar
                    </button>
                    <button
                      type="button"
                      className="btn-stitch-outline"
                      style={{ padding: '4px 8px', fontSize: 11, color: 'var(--color-error, #ffb4ab)' }}
                      onClick={e => {
                        e.stopPropagation()
                        onDeleteCard(card.id)
                      }}
                    >
                      <Trash2 size={12} /> Eliminar
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── ASESOR DE CICLO RÁPIDO ── */}
      {activeCard && cardHealth && (
        <div className="sandbox-panel" style={{ padding: '12px 18px', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Sparkles size={16} className="text-gold" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                Asesor de Ciclo: {activeCard.name} ({activeCard.bank})
              </span>
              <span className={`sandbox-type-pill ${cardHealth.statusLevel === 'optimal' ? 'in' : 'out'}`}>
                {cardHealth.statusLabel}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={12} /> Corte en {cardHealth.daysToCutoff} días
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={12} /> Pago en {cardHealth.daysToPayment} días
              </span>
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: '#D4AF37', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={13} /> {cardHealth.goldenWindowText}
          </div>
        </div>
      )}

      {/* ── TABLA DE CONCILIACIÓN & HISTORIAL STITCH ── */}
      <div className="stitch-card transactions-table-panel" style={{ padding: 0, overflow: 'visible' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(49, 53, 62, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--color-on-surface, #dfe2ee)' }}>
              Conciliación &amp; Historial de Movimientos
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-outline, #a08e7a)', marginTop: 2 }}>
              Auditoría detallada con enriquecimiento de datos de comercios e imputación contable ({displayedTransactions.length} movimientos).
            </div>
          </div>

          <div className="sandbox-pills">
            <button
              type="button"
              className={`sandbox-pill-btn ${!showAllCards ? 'active' : ''}`}
              onClick={() => setShowAllCards(false)}
            >
              {activeCard ? activeCard.name : 'Tarjeta Activa'}
            </button>
            <button
              type="button"
              className={`sandbox-pill-btn ${showAllCards ? 'active' : ''}`}
              onClick={() => setShowAllCards(true)}
            >
              Todas las Tarjetas
            </button>
            <button
              type="button"
              className={`sandbox-pill-btn ${showAllPeriods ? 'active' : ''}`}
              onClick={() => setShowAllPeriods(p => !p)}
            >
              {showAllPeriods ? 'Todo el Histórico' : currentPeriod}
            </button>
          </div>
        </div>

        {displayedTransactions.length === 0 ? (
          <div className="sandbox-empty">
            <p style={{ margin: 0 }}>Sin cargos de tarjeta registrados con este filtro en {formatPeriodLabel(currentPeriod)}.</p>
            {creditTransactions.length > 0 && (!showAllCards || !showAllPeriods) && (
              <button
                type="button"
                className="sandbox-btn-outline"
                style={{ marginTop: 12 }}
                onClick={() => { setShowAllCards(true); setShowAllPeriods(true) }}
              >
                Ver los {creditTransactions.length} consumos de todas las tarjetas
              </button>
            )}
          </div>
        ) : (
          <div className="stitch-table-container" style={{ overflow: 'visible' }}>
            <table className="stitch-table">
              <thead>
                <tr>
                  <th>FECHA</th>
                  <th>CONCEPTO / COMERCIO</th>
                  <th>TARJETA</th>
                  <th>CATEGORÍA</th>
                  <th>ESTADO</th>
                  <th>MONTO</th>
                  <th style={{ textAlign: 'right' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {displayedTransactions.map(tx => {
                  const card = creditCards.find(c => c.id === tx.cardId)
                  const c = CATEGORY_MAP[tx.category] || CATEGORY_MAP.other

                  if (editingTxId === tx.id) {
                    return (
                      <tr key={tx.id} className="edit-active-row">
                        <td>
                          <input
                            type="date"
                            className="sandbox-edit-input"
                            style={{ minWidth: 120 }}
                            value={editTxForm.date}
                            onChange={e => setEditTxForm(p => ({ ...p, date: e.target.value }))}
                          />
                        </td>
                        <td>
                          <input
                            className="sandbox-edit-input"
                            style={{ minWidth: 160 }}
                            value={editTxForm.description}
                            onChange={e => setEditTxForm(p => ({ ...p, description: e.target.value }))}
                          />
                        </td>
                        <td style={{ fontSize: 11.5, color: 'var(--gold-primary)' }}>{card?.name}</td>
                        <td style={{ minWidth: 185 }}>
                          <CustomIconSelect
                            options={CREDIT_CATEGORY_OPTIONS}
                            value={editTxForm.category}
                            onChange={val => setEditTxForm(p => ({ ...p, category: val }))}
                            compact
                            ariaLabel="Categoría"
                          />
                        </td>
                        <td>—</td>
                        <td>
                          <input
                            type="number"
                            className="sandbox-edit-input"
                            style={{ width: 110 }}
                            value={editTxForm.amount}
                            onChange={e => setEditTxForm(p => ({ ...p, amount: e.target.value }))}
                          />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="sandbox-btn-save"
                            onClick={() => saveEditTx(tx)}
                          >
                            ✓
                          </button>
                          <button
                            type="button"
                            className="sandbox-btn-cancel"
                            onClick={() => setEditingTxId(null)}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    )
                  }

                  return (
                    <tr key={tx.id}>
                      <td className="cell-date">{tx.date}</td>
                      <td className="cell-item">
                        <div className="item-title">{tx.description}</div>
                        {tx.installments > 1 && (
                          <div style={{ fontSize: 10, color: 'var(--amber-warning)' }}>
                            Cuota diferida ({tx.installments} cuotas)
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: 11.5, color: 'var(--gold-primary)', fontWeight: 600 }}>
                        {card?.name || 'Tarjeta'} (•••• {card?.lastFourDigits})
                      </td>
                      <td>
                        <span className="sandbox-type-pill in" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          {c.icon} {c.label}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => onTogglePaid(tx.id)}
                          className={`sandbox-type-pill ${tx.isPaid ? 'in' : 'out'}`}
                          style={{ cursor: 'pointer' }}
                          title="Clic para alternar estado de pago"
                        >
                          {tx.isPaid ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                          <span>{tx.isPaid ? 'Saldado' : 'Pendiente'}</span>
                        </button>
                      </td>
                      <td className="cell-total text-rose">
                        -{formatCurrency(tx.amount)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 4 }}>
                          <button
                            type="button"
                            className="table-action-btn"
                            onClick={() => startEditTx(tx)}
                            title="Editar"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            className="table-action-btn danger"
                            onClick={() => onDeleteTransaction(tx.id)}
                            title="Eliminar"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL PARA REGISTRAR CARGO / CONSUMO (PORTAL EN DOCUMENT.BODY) ── */}
      {showTxModal && createPortal(
        <div className="aureus-modal-backdrop" onClick={() => setShowTxModal(false)}>
          <div className="aureus-modal-card" onClick={e => e.stopPropagation()}>
            <div className="aureus-modal-header">
              <h2 className="modal-title" style={{ margin: 0 }}>
                <Plus size={16} className="text-gold" />
                <span>Registrar Cargo en Tarjeta</span>
              </h2>
              <button
                type="button"
                className="aureus-modal-close"
                onClick={() => setShowTxModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddTx} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label className="aureus-field-label">Concepto / Comercio</label>
                <input
                  className="aureus-adaptive-input"
                  placeholder="Ej: Supermercado Nacional, Hotel, Vuelo..."
                  value={txForm.description}
                  onChange={e => setTxForm(p => ({ ...p, description: e.target.value }))}
                  autoFocus
                  required
                />
              </div>

              <div className="aureus-modal-grid-2">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label className="aureus-field-label">Monto (RD$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="aureus-adaptive-input"
                    placeholder="0.00"
                    value={txForm.amount}
                    onChange={e => setTxForm(p => ({ ...p, amount: e.target.value }))}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label className="aureus-field-label">Tarjeta</label>
                  <select
                    className="aureus-adaptive-input"
                    value={txForm.cardId}
                    onChange={e => setTxForm(p => ({ ...p, cardId: e.target.value }))}
                    required
                  >
                    {creditCards.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} (•••• {c.lastFourDigits})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="aureus-modal-grid-2">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label className="aureus-field-label">Categoría</label>
                  <CustomIconSelect
                    options={CREDIT_CATEGORY_OPTIONS}
                    value={txForm.category}
                    onChange={val => setTxForm(p => ({ ...p, category: val }))}
                    ariaLabel="Categoría"
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label className="aureus-field-label">Cuotas</label>
                  <select
                    className="aureus-adaptive-input"
                    value={txForm.installments}
                    onChange={e => setTxForm(p => ({ ...p, installments: parseInt(e.target.value, 10) }))}
                  >
                    <option value="1">1 Cuota (Directo)</option>
                    <option value="3">3 Cuotas</option>
                    <option value="6">6 Cuotas</option>
                    <option value="12">12 Cuotas</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label className="aureus-field-label">
                  <Calendar size={13} className="text-gold" style={{ marginRight: 4, verticalAlign: 'middle' }} />
                  <span>Fecha</span>
                </label>
                <input
                  type="date"
                  className="aureus-adaptive-input"
                  value={txForm.date}
                  onChange={e => setTxForm(p => ({ ...p, date: e.target.value }))}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  className="aureus-btn-secondary"
                  onClick={() => setShowTxModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="sandbox-btn-gold">
                  <Plus size={14} />
                  <span>Guardar Cargo</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL PARA ABONAR A DEUDA (PORTAL EN DOCUMENT.BODY) ── */}
      {showAbonoModal && activeCard && cardHealth && createPortal(
        <div className="aureus-modal-backdrop" onClick={() => setShowAbonoModal(false)}>
          <div className="aureus-modal-card" onClick={e => e.stopPropagation()}>
            <div className="aureus-modal-header">
              <h2 className="modal-title" style={{ margin: 0 }}>
                <ArrowDownCircle size={16} className="text-emerald" />
                <span>Abonar a Deuda: {activeCard.name}</span>
              </h2>
              <button
                type="button"
                className="aureus-modal-close"
                onClick={() => setShowAbonoModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleApplyAbono} style={{ padding: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                <div>
                  Deuda Total Pendiente: <strong className="text-rose">{formatCurrency(cardHealth.totalDebt)}</strong>
                </div>
                {safeAvailable !== undefined && (
                  <div>
                    Liquidez Disponible para Pago: <strong className="text-emerald">{formatCurrency(safeAvailable)}</strong>
                  </div>
                )}
              </div>

              <div className="modal-form-group">
                <label className="aureus-field-label">Monto a Abonar (RD$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={safeAvailable !== undefined ? Math.min(cardHealth.totalDebt, safeAvailable) : cardHealth.totalDebt}
                  className="aureus-adaptive-input"
                  value={abonoAmount}
                  onChange={e => setAbonoAmount(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setAbonoAmount(String(cardHealth.totalDebt.toFixed(2)))}
                  className="sandbox-pill-btn"
                >
                  Deuda Total (100%)
                </button>
                <button
                  type="button"
                  onClick={() => setAbonoAmount(String((cardHealth.totalDebt * 0.5).toFixed(2)))}
                  className="sandbox-pill-btn"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => setAbonoAmount(String(cardHealth.minPaymentEstimate.toFixed(2)))}
                  className="sandbox-pill-btn"
                >
                  Pago Mínimo
                </button>
              </div>

              {abonoError && (
                <div style={{ color: 'var(--color-error, #ffb4ab)', fontSize: 12, marginBottom: 10 }}>
                  {abonoError}
                </div>
              )}

              {abonoConfirmed && (
                <div style={{ color: 'var(--emerald-success)', fontSize: 12, marginBottom: 10 }}>
                  ✓ ¡Abono procesado, deuda reducida y salida de liquidez registrada!
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                <button
                  type="button"
                  className="aureus-btn-secondary"
                  onClick={() => setShowAbonoModal(false)}
                >
                  Cerrar
                </button>
                <button type="submit" className="sandbox-btn-gold">
                  <span>Aplicar Abono</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL PARA CREAR / EDITAR TARJETA (PORTAL EN DOCUMENT.BODY) ── */}
      {showCardModal && createPortal(
        <div className="aureus-modal-backdrop" onClick={() => setShowCardModal(false)}>
          <div className="aureus-modal-card" onClick={e => e.stopPropagation()}>
            <div className="aureus-modal-header">
              <h2 className="modal-title" style={{ margin: 0 }}>
                <CardIcon size={16} className="text-gold" />
                <span>{editingCard ? 'Editar Tarjeta' : 'Nueva Tarjeta'}</span>
              </h2>
              <button
                type="button"
                className="aureus-modal-close"
                onClick={() => setShowCardModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCard} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label className="aureus-field-label">Nombre de la Tarjeta</label>
                <input
                  className="aureus-adaptive-input"
                  placeholder="Ej: Visa Signature, Mastercard Platinum"
                  value={cardForm.name}
                  onChange={e => setCardForm(p => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>

              <div className="aureus-modal-grid-2">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label className="aureus-field-label">Banco</label>
                  <input
                    className="aureus-adaptive-input"
                    placeholder="Ej: Banco BHD"
                    value={cardForm.bank}
                    onChange={e => setCardForm(p => ({ ...p, bank: e.target.value }))}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label className="aureus-field-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>Últimos 4 Dígitos</span>
                    <span style={{ fontSize: 9.5, color: 'var(--gold-primary)', display: 'inline-flex', alignItems: 'center', gap: 2 }} title="Protección PCI-DSS: Nunca ingreses número completo ni CVV"><ShieldCheck size={11} /> Seguro</span>
                  </label>
                  <input
                    className="aureus-adaptive-input"
                    maxLength={4}
                    inputMode="numeric"
                    pattern="[0-9]{4}"
                    placeholder="4821"
                    value={cardForm.lastFourDigits}
                    onChange={e => setCardForm(p => ({ ...p, lastFourDigits: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                  />
                </div>
              </div>

              <div className="aureus-modal-grid-2">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label className="aureus-field-label">Límite (RD$)</label>
                  <input
                    type="number"
                    min="1"
                    className="aureus-adaptive-input"
                    placeholder="100000"
                    value={cardForm.creditLimit}
                    onChange={e => setCardForm(p => ({ ...p, creditLimit: e.target.value }))}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label className="aureus-field-label">Estilo / Color</label>
                  <select
                    className="aureus-adaptive-input"
                    value={cardForm.color}
                    onChange={e => setCardForm(p => ({ ...p, color: e.target.value as CardThemeColor }))}
                  >
                    <option value="gold">Oro Imperial (Aureus)</option>
                    <option value="emerald">Esmeralda</option>
                    <option value="blue">Zafiro Platinum</option>
                    <option value="silver">Titanio Silver</option>
                    <option value="purple">Púrpura Real</option>
                  </select>
                </div>
              </div>

              <div className="aureus-modal-grid-2">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label className="aureus-field-label">Día de Corte (1-31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    className="aureus-adaptive-input"
                    value={cardForm.cutoffDay}
                    onChange={e => setCardForm(p => ({ ...p, cutoffDay: parseInt(e.target.value, 10) || 1 }))}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label className="aureus-field-label">Día Límite Pago (1-31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    className="aureus-adaptive-input"
                    value={cardForm.paymentDueDay}
                    onChange={e => setCardForm(p => ({ ...p, paymentDueDay: parseInt(e.target.value, 10) || 1 }))}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  className="aureus-btn-secondary"
                  onClick={() => setShowCardModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="sandbox-btn-gold">
                  <span>{editingCard ? 'Guardar Cambios' : 'Registrar Tarjeta'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
