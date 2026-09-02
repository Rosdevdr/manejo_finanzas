import { useState, useEffect } from 'react'
import {
  CreditCard as CardIcon,
  Plus,
  Trash2,
  Pencil,
  Sparkles,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Zap,
  ArrowDownCircle,
} from 'lucide-react'
import type {
  CreditCard,
  CreditCardTransaction,
  ExpenseCategory,
  CardThemeColor
} from '../../types/finance'
import { formatCurrency } from '../../utils/formatters'
import { evaluateCardHealth, getConsolidatedCreditSummary } from '../../utils/creditAdvisor'
import './CreditCardsView.css'

interface CreditCardsViewProps {
  currentPeriod: string
  creditCards: CreditCard[]
  creditTransactions: CreditCardTransaction[]
  onAddCard: (card: Omit<CreditCard, 'id'>) => void
  onUpdateCard: (card: CreditCard) => void
  onDeleteCard: (id: string) => void
  onAddTransaction: (tx: Omit<CreditCardTransaction, 'id'>) => void
  onUpdateTransaction: (tx: CreditCardTransaction) => void
  onDeleteTransaction: (id: string) => void
  onTogglePaid: (id: string) => void
}

const CATEGORY_MAP: Record<ExpenseCategory, { label: string; badge: string; emoji: string }> = {
  housing:       { label: 'Vivienda',     badge: 'badge-vivienda',     emoji: '🏠' },
  food:          { label: 'Alimentación', badge: 'badge-alimentacion', emoji: '🛒' },
  transport:     { label: 'Transporte',   badge: 'badge-transporte',   emoji: '🚗' },
  utilities:     { label: 'Servicios',    badge: 'badge-servicios',    emoji: '⚡' },
  health:        { label: 'Salud',        badge: 'badge-salud',        emoji: '💊' },
  entertainment: { label: 'Ocio',         badge: 'badge-ocio',         emoji: '🎭' },
  education:     { label: 'Educación',    badge: 'badge-inversion',    emoji: '📚' },
  debt:          { label: 'Deudas',       badge: 'badge-fijo',         emoji: '💳' },
  other:         { label: 'Otros',        badge: 'badge-fijo',         emoji: '📦' },
}

export function CreditCardsView({
  currentPeriod,
  creditCards,
  creditTransactions,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onTogglePaid,
}: CreditCardsViewProps) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(creditCards[0]?.id || null)
  const [showCardModal, setShowCardModal] = useState(false)
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null)

  // Abono a deuda — se pre-rellena automáticamente con la deuda total de la tarjeta activa
  const [customAbonoAmount, setCustomAbonoAmount] = useState<string | null>(null)
  const [abonoConfirmed, setAbonoConfirmed] = useState(false)

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

  // Campo de abono: usa el valor manual si el usuario lo modificó, o auto-rellena con la deuda total
  const defaultAbono = cardHealth && cardHealth.totalDebt > 0 ? cardHealth.totalDebt.toFixed(2) : ''
  const abonoAmount = customAbonoAmount ?? defaultAbono
  const setAbonoAmount = (val: string) => setCustomAbonoAmount(val)

  const getPeriod = (t: { period?: string; date?: string }) =>
    t.period && t.period.trim().length === 7 ? t.period.trim() : (t.date ? t.date.slice(0, 7) : currentPeriod)

  const activePeriodTxs = creditTransactions.filter(t => getPeriod(t) === currentPeriod)

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

    if (editingCard) {
      onUpdateCard({
        ...editingCard,
        name: cardForm.name,
        bank: cardForm.bank || 'Banco',
        lastFourDigits: cardForm.lastFourDigits || '0000',
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
        lastFourDigits: cardForm.lastFourDigits || '0000',
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

    const computedPeriod = txForm.date ? txForm.date.slice(0, 7) : currentPeriod

    onAddTransaction({
      cardId: txForm.cardId,
      period: computedPeriod,
      description: txForm.description,
      amount: parseFloat(txForm.amount),
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

  // Lógica de abono: marca transacciones pendientes como pagadas
  // hasta cubrir el monto abonado (de mayor monto a menor)
  function handleApplyAbono(e: React.FormEvent) {
    e.preventDefault()
    const abono = parseFloat(abonoAmount)
    if (!abono || abono <= 0 || !activeCard) return

    const pending = creditTransactions
      .filter(t => t.cardId === activeCard.id && !t.isPaid)
      .sort((a, b) => b.amount - a.amount) // mayor a menor para cubrir más rápido

    let remaining = abono
    for (const tx of pending) {
      if (remaining <= 0) break
      if (tx.amount <= remaining) {
        remaining -= tx.amount
        onTogglePaid(tx.id)
      }
    }

    setAbonoAmount('')
    setAbonoConfirmed(true)
    setTimeout(() => setAbonoConfirmed(false), 3000)
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="breadcrumb">AUREUS · <span className="breadcrumb-accent">Crédito</span></div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h1 className="page-title">Tarjetas de Crédito</h1>
          <button type="button" onClick={handleOpenAddCard} className="btn-primary">
            <Plus size={15} />
            <span>Nueva Tarjeta</span>
          </button>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="kpi-grid">
        <div className="kpi-card gold">
          <div className="kpi-top">
            <span className="kpi-label">Límite Global</span>
            <CardIcon size={14} className="kpi-icon" />
          </div>
          <div className="kpi-value">{formatCurrency(summary.totalLimit)}</div>
          <div className="kpi-sub">{summary.cardsCount} tarjeta{summary.cardsCount !== 1 ? 's' : ''} activa{summary.cardsCount !== 1 ? 's' : ''}</div>
        </div>

        <div className="kpi-card red">
          <div className="kpi-top">
            <span className="kpi-label">Deuda Consolidada</span>
            <DollarSign size={14} className="kpi-icon" />
          </div>
          <div className="kpi-value">{formatCurrency(summary.totalDebt)}</div>
          <div className="kpi-sub">{summary.pendingPaymentsCount} cargo{summary.pendingPaymentsCount !== 1 ? 's' : ''} pendiente{summary.pendingPaymentsCount !== 1 ? 's' : ''}</div>
        </div>

        <div className="kpi-card emerald">
          <div className="kpi-top">
            <span className="kpi-label">Cupo Disponible Total</span>
            <ShieldCheck size={14} className="kpi-icon" />
          </div>
          <div className="kpi-value">{formatCurrency(summary.availableCredit)}</div>
          <div className="kpi-sub">Línea libre combinada</div>
        </div>

        <div className={`kpi-card ${summary.utilizationRate > 50 ? 'red' : summary.utilizationRate > 30 ? 'amber' : 'emerald'}`}>
          <div className="kpi-top">
            <span className="kpi-label">Utilización de Crédito</span>
            <Zap size={14} className="kpi-icon" />
          </div>
          <div className="kpi-value">{summary.utilizationRate.toFixed(1)}%</div>
          <div className="kpi-sub">
            {summary.utilizationRate <= 30 ? 'Score Óptimo (<30%)' : summary.utilizationRate <= 50 ? 'Nivel Moderado' : 'Consumo Elevado'}
          </div>
        </div>
      </div>

      {/* Wallet Cards Section */}
      <div className="section-header">
        <div className="section-label">TU BILLETERA VIRTUAL</div>
        <div className="section-title">Tarjetas registradas (Selecciona para ver análisis)</div>
      </div>

      {creditCards.length === 0 ? (
        <div className="empty-state" style={{ marginBottom: 24 }}>
          <p className="empty-text">No tienes tarjetas de crédito registradas.</p>
          <button type="button" onClick={handleOpenAddCard} className="btn-primary" style={{ marginTop: 12 }}>
            <Plus size={14} />
            <span>Agregar mi primera tarjeta</span>
          </button>
        </div>
      ) : (
        <div className="credit-cards-grid">
          {creditCards.map(card => {
            const isActive = card.id === activeCard?.id
            const cardTx = creditTransactions.filter(t => t.cardId === card.id && !t.isPaid)
            const debt = cardTx.reduce((s, t) => s + t.amount, 0)

            return (
              <div
                key={card.id}
                className={`virtual-card theme-${card.color} ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCardId(card.id)
                  setTxForm(p => ({ ...p, cardId: card.id }))
                }}
              >
                <div>
                  <div className="card-top-row">
                    <span className="card-bank">{card.bank}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenEditCard(card)
                        }}
                        style={{
                          background: 'rgba(255,255,255,0.1)',
                          border: 'none',
                          color: '#FFF',
                          borderRadius: 6,
                          padding: '4px 6px',
                          cursor: 'pointer',
                        }}
                        title="Editar tarjeta"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm(`¿Eliminar la tarjeta "${card.name}" y sus registros?`)) {
                            onDeleteCard(card.id)
                          }
                        }}
                        style={{
                          background: 'rgba(248,113,113,0.2)',
                          border: 'none',
                          color: '#F87171',
                          borderRadius: 6,
                          padding: '4px 6px',
                          cursor: 'pointer',
                        }}
                        title="Eliminar tarjeta"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                    <div className="card-chip" />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#C9A84C', letterSpacing: '0.1em' }}>
                      {card.name.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="card-number">•••• •••• •••• {card.lastFourDigits}</div>

                <div className="card-bottom-row">
                  <div className="card-holder">
                    <span className="card-holder-label">Deuda Actual</span>
                    <span className="card-holder-name">{formatCurrency(debt)}</span>
                  </div>

                  <div className="card-dates">
                    <div className="card-date-badge">
                      <span className="card-date-label">Corte</span>
                      <span className="card-date-val">Día {card.cutoffDay}</span>
                    </div>
                    <div className="card-date-badge">
                      <span className="card-date-label">Límite Pago</span>
                      <span className="card-date-val">Día {card.paymentDueDay}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Selected Card Advisor Banner */}
      {activeCard && cardHealth && (
        <div className="credit-advisor-banner fade-in">
          <div className="credit-advisor-top">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(201,168,76,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#C9A84C'
              }}>
                <Sparkles size={16} />
              </div>
              <div>
                <strong style={{ color: '#FFFFFF', fontSize: 13 }}>
                  Asesor de Ciclo: {activeCard.name} ({activeCard.bank})
                </strong>
                <div style={{ fontSize: 11.5, color: '#888898', marginTop: 2 }}>
                  Límite: {formatCurrency(activeCard.creditLimit)} · Deuda: {formatCurrency(cardHealth.totalDebt)} · Disponible: {formatCurrency(cardHealth.availableCredit)}
                </div>
              </div>
            </div>

            <div className="credit-advisor-tags">
              <span className={`advisor-badge-pill ${cardHealth.statusLevel}`}>
                {cardHealth.statusLabel}
              </span>
              <span className="advisor-badge-pill" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid #2A2A38', color: '#D0D0DC' }}>
                <Clock size={12} /> Corte en {cardHealth.daysToCutoff} día{cardHealth.daysToCutoff !== 1 ? 's' : ''}
              </span>
              <span className="advisor-badge-pill" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid #2A2A38', color: '#D0D0DC' }}>
                <Calendar size={12} /> Pago en {cardHealth.daysToPayment} día{cardHealth.daysToPayment !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="golden-window-alert">
            <Zap size={16} style={{ flexShrink: 0, color: '#C9A84C' }} />
            <span>{cardHealth.goldenWindowText}</span>
          </div>

          {cardHealth.totalDebt > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: 'rgba(0,0,0,0.25)',
              borderRadius: 10,
              fontSize: 12,
              flexWrap: 'wrap',
              gap: 10
            }}>
              <div style={{ color: '#D0D0DC' }}>
                💰 Pago total sugerido para no generar intereses:{' '}
                <strong style={{ color: '#34D399' }}>{formatCurrency(cardHealth.totalDebt)}</strong>
              </div>
              <div style={{ color: '#888898', fontSize: 11.5 }}>
                Pago mínimo estimado (5%): <strong style={{ color: '#FBBF24' }}>{formatCurrency(cardHealth.minPaymentEstimate)}</strong>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PANEL DE ABONO A DEUDA ── */}
      {activeCard && cardHealth && cardHealth.totalDebt > 0 && (
        <>
          <div className="section-header">
            <div className="section-label">ABONAR A DEUDA</div>
            <div className="section-title">Pago voluntario contra la deuda de {activeCard.name} ({activeCard.bank})</div>
          </div>

          <form
            className="form-card"
            onSubmit={handleApplyAbono}
            style={{
              background: 'linear-gradient(135deg, rgba(52,211,153,0.05) 0%, rgba(20,20,28,0.85) 100%)',
              border: '1px solid rgba(52,211,153,0.2)',
            }}
          >
            {/* Deuda consolidada de la tarjeta activa */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
              padding: '10px 14px',
              borderRadius: 10,
              background: 'rgba(0,0,0,0.25)',
              marginBottom: 14,
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 11, color: '#888898', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Deuda Pendiente de {activeCard.name}</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#F87171' }}>{formatCurrency(cardHealth.totalDebt)}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'right' }}>
                <span style={{ fontSize: 11, color: '#888898' }}>Cupo disponible post-abono estimado</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#34D399' }}>
                  {formatCurrency(cardHealth.availableCredit + (parseFloat(abonoAmount) || 0))}
                </span>
              </div>
            </div>

            <div className="form-grid">
              <div style={{ gridColumn: 'span 8' }}>
                <label className="field-label">Monto a Abonar (RD$)</label>
                <input
                  type="number"
                  className="field-input"
                  placeholder={`Máx. ${formatCurrency(cardHealth.totalDebt)}`}
                  min={0.01}
                  max={cardHealth.totalDebt}
                  step="0.01"
                  value={abonoAmount}
                  onChange={e => setAbonoAmount(e.target.value)}
                  required
                />
              </div>

              <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label className="field-label">Accesos rápidos</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setAbonoAmount(String(cardHealth.totalDebt.toFixed(2)))}
                    style={{
                      padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                      background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)',
                      color: '#34D399', cursor: 'pointer',
                    }}
                  >
                    Deuda Total
                  </button>
                  <button
                    type="button"
                    onClick={() => setAbonoAmount(String((cardHealth.minPaymentEstimate).toFixed(2)))}
                    style={{
                      padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                      background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)',
                      color: '#FBBF24', cursor: 'pointer',
                    }}
                  >
                    Pago Mín.
                  </button>
                  <button
                    type="button"
                    onClick={() => setAbonoAmount(String((cardHealth.totalDebt * 0.5).toFixed(2)))}
                    style={{
                      padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                      background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.3)',
                      color: '#60A5FA', cursor: 'pointer',
                    }}
                  >
                    50%
                  </button>
                </div>
              </div>
            </div>

            <div className="form-actions">
              {abonoConfirmed && (
                <span style={{ fontSize: 12, color: '#34D399', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={14} /> ¡Abono aplicado correctamente!
                </span>
              )}
              <button
                type="submit"
                className="btn-primary"
                disabled={!abonoAmount || parseFloat(abonoAmount) <= 0}
                style={{ background: 'linear-gradient(135deg, #34D399, #059669)' }}
              >
                <ArrowDownCircle size={15} />
                <span>Aplicar Abono a la Deuda</span>
              </button>
            </div>
          </form>
        </>
      )}

      {/* Transaction Add Form */}
      <div className="section-header">
        <div className="section-label">REGISTRAR CARGO</div>
        <div className="section-title">Nuevo consumo con tarjeta de crédito</div>
      </div>

      <form className="form-card" onSubmit={handleAddTx}>
        <div className="form-grid">
          <div style={{ gridColumn: 'span 5' }}>
            <label className="field-label">Concepto / Comercio</label>
            <input
              className="field-input"
              placeholder="Ej: Supermercado Nacional, Hotel, Gasolina..."
              value={txForm.description}
              onChange={e => setTxForm(p => ({ ...p, description: e.target.value }))}
              required
            />
          </div>

          <div style={{ gridColumn: 'span 3' }}>
            <label className="field-label">Monto (RD$)</label>
            <input
              type="number"
              className="field-input"
              placeholder="0.00"
              min={0.01}
              step="0.01"
              value={txForm.amount}
              onChange={e => setTxForm(p => ({ ...p, amount: e.target.value }))}
              required
            />
          </div>

          <div style={{ gridColumn: 'span 4' }}>
            <label className="field-label">Tarjeta a Cargar</label>
            <select
              className="field-select"
              value={txForm.cardId}
              onChange={e => setTxForm(p => ({ ...p, cardId: e.target.value }))}
              required
            >
              {creditCards.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} (•••• {c.lastFourDigits}) - {c.bank}
                </option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: 'span 4' }}>
            <label className="field-label">Categoría</label>
            <select
              className="field-select"
              value={txForm.category}
              onChange={e => setTxForm(p => ({ ...p, category: e.target.value as ExpenseCategory }))}
            >
              {Object.entries(CATEGORY_MAP).map(([k, v]) => (
                <option key={k} value={k}>{v.emoji} {v.label}</option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: 'span 4' }}>
            <label className="field-label">Cuotas / Diferido</label>
            <select
              className="field-select"
              value={txForm.installments}
              onChange={e => setTxForm(p => ({ ...p, installments: parseInt(e.target.value, 10) }))}
            >
              <option value="1">1 Cuota (Pago directo al corte)</option>
              <option value="3">3 Cuotas</option>
              <option value="6">6 Cuotas</option>
              <option value="12">12 Cuotas</option>
              <option value="18">18 Cuotas</option>
              <option value="24">24 Cuotas</option>
            </select>
          </div>

          <div style={{ gridColumn: 'span 4' }}>
            <label className="field-label">Fecha de Compra</label>
            <input
              type="date"
              className="field-input"
              value={txForm.date}
              onChange={e => setTxForm(p => ({ ...p, date: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={creditCards.length === 0}>
            <Plus size={16} />
            <span>Registrar Cargo en Tarjeta</span>
          </button>
        </div>
      </form>

      {/* Transaction History */}
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div className="section-label">ESTADO DE CUENTA & MOVIMIENTOS</div>
          <div className="section-title">
            {showAllCards ? 'Todos los consumos' : (activeCard ? `Consumos de ${activeCard.name}` : 'Consumos registrados')} ({displayedTransactions.length})
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowAllCards(p => !p)}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              background: showAllCards ? 'rgba(52, 211, 153, 0.18)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${showAllCards ? '#34D399' : 'rgba(255, 255, 255, 0.1)'}`,
              color: showAllCards ? '#34D399' : '#9CA3AF',
            }}
          >
            {showAllCards ? '✓ Todas las Tarjetas' : `Solo ${activeCard?.name || 'activa'}`}
          </button>
          <button
            type="button"
            onClick={() => setShowAllPeriods(p => !p)}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              background: showAllPeriods ? 'rgba(243, 202, 101, 0.18)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${showAllPeriods ? '#F3CA65' : 'rgba(255, 255, 255, 0.1)'}`,
              color: showAllPeriods ? '#F3CA65' : '#9CA3AF',
            }}
          >
            {showAllPeriods ? '✓ Todos los Meses' : `Mes: ${currentPeriod}`}
          </button>
        </div>
      </div>

      <div className="tx-list">
        <div className="tx-header">
          <span className="tx-title">Cargos en Tarjeta</span>
          <span className="tx-count">{displayedTransactions.length} movimiento{displayedTransactions.length !== 1 ? 's' : ''}</span>
        </div>

        {displayedTransactions.length === 0 ? (
          <div className="empty-state">
            <p className="empty-text">Sin consumos de tarjeta registrados con este filtro</p>
            {creditTransactions.length > 0 && (!showAllCards || !showAllPeriods) && (
              <button
                type="button"
                onClick={() => { setShowAllCards(true); setShowAllPeriods(true) }}
                className="btn btn-secondary"
                style={{ marginTop: 10, fontSize: 11.5, color: '#F3CA65' }}
              >
                Ver los {creditTransactions.length} consumos históricos de todas las tarjetas
              </button>
            )}
          </div>
        ) : (
          displayedTransactions.map(tx => {
            const card = creditCards.find(c => c.id === tx.cardId)
            const c = CATEGORY_MAP[tx.category] || CATEGORY_MAP.other

            if (editingTxId === tx.id) {
              return (
                <div key={tx.id} className="tx-edit-row">
                  <input
                    className="edit-input"
                    style={{ minWidth: 180 }}
                    value={editTxForm.description}
                    onChange={e => setEditTxForm(p => ({ ...p, description: e.target.value }))}
                  />
                  <input
                    type="number"
                    className="edit-input"
                    style={{ maxWidth: 120 }}
                    value={editTxForm.amount}
                    onChange={e => setEditTxForm(p => ({ ...p, amount: e.target.value }))}
                  />
                  <select
                    className="edit-select"
                    value={editTxForm.category}
                    onChange={e => setEditTxForm(p => ({ ...p, category: e.target.value as ExpenseCategory }))}
                  >
                    {Object.entries(CATEGORY_MAP).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    className="edit-input"
                    style={{ maxWidth: 140 }}
                    value={editTxForm.date}
                    onChange={e => setEditTxForm(p => ({ ...p, date: e.target.value }))}
                  />
                  <div className="edit-actions">
                    <button className="edit-save-btn" onClick={() => saveEditTx(tx)}>✓ Guardar</button>
                    <button className="edit-cancel-btn" onClick={() => setEditingTxId(null)}>Cancelar</button>
                  </div>
                </div>
              )
            }

            return (
              <div key={tx.id} className="tx-row">
                <div className="tx-icon" style={{ background: 'rgba(201,168,76,0.1)', fontSize: 18 }}>
                  {c.emoji}
                </div>
                <div className="tx-body">
                  <div className="tx-name">{tx.description}</div>
                  <div className="tx-meta">
                    <span className={`tx-badge ${c.badge}`}>{c.label}</span>
                    <span className="tx-badge badge-fijo">
                      {card?.name || 'Tarjeta'} (•••• {card?.lastFourDigits})
                    </span>
                    {tx.installments > 1 && (
                      <span className="tx-badge badge-variable">
                        {tx.installments} cuotas
                      </span>
                    )}
                    <span className="tx-date">{tx.date}</span>
                  </div>
                </div>

                <div className="tx-right">
                  <div className="tx-amount amount-red">-{formatCurrency(tx.amount)}</div>
                  <button
                    type="button"
                    onClick={() => onTogglePaid(tx.id)}
                    className={`tx-paid-badge ${tx.isPaid ? 'paid' : 'pending'}`}
                    title="Clic para cambiar estado de pago"
                  >
                    {tx.isPaid ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                    <span>{tx.isPaid ? 'Saldado / Pagado' : 'Pendiente al corte'}</span>
                  </button>
                </div>

                <div className="tx-actions">
                  <button className="tx-action-btn" onClick={() => startEditTx(tx)} title="Editar">
                    <Pencil size={11} />
                  </button>
                  <button className="tx-action-btn danger" onClick={() => onDeleteTransaction(tx.id)} title="Eliminar">
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal Crear / Editar Tarjeta */}
      {showCardModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(5, 5, 8, 0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setShowCardModal(false)}
        >
          <div
            className="fade-in"
            style={{
              background: '#14141C',
              border: '1px solid #2A2A38',
              borderRadius: 16,
              maxWidth: 520,
              width: '100%',
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                {editingCard ? 'Editar Tarjeta de Crédito' : 'Registrar Nueva Tarjeta'}
              </h2>
              <button
                type="button"
                onClick={() => setShowCardModal(false)}
                style={{ background: 'none', border: 'none', color: '#888898', cursor: 'pointer', fontSize: 16 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCard} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="field-label">Nombre de la Tarjeta</label>
                  <input
                    className="field-input"
                    placeholder="Ej: Visa Infinite, Mastercard Black"
                    value={cardForm.name}
                    onChange={e => setCardForm(p => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label className="field-label">Banco Emisor</label>
                  <input
                    className="field-input"
                    placeholder="Ej: Banco BHD, Banreservas"
                    value={cardForm.bank}
                    onChange={e => setCardForm(p => ({ ...p, bank: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label className="field-label">Últimos 4 Dígitos</label>
                  <input
                    className="field-input"
                    maxLength={4}
                    placeholder="4821"
                    value={cardForm.lastFourDigits}
                    onChange={e => setCardForm(p => ({ ...p, lastFourDigits: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="field-label">Límite de Crédito (RD$)</label>
                  <input
                    type="number"
                    className="field-input"
                    placeholder="100000"
                    min={1}
                    value={cardForm.creditLimit}
                    onChange={e => setCardForm(p => ({ ...p, creditLimit: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label className="field-label">Tasa Interés Mensual (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="field-input"
                    placeholder="4.5"
                    value={cardForm.interestRate}
                    onChange={e => setCardForm(p => ({ ...p, interestRate: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="field-label">Día de Corte (1-31)</label>
                  <input
                    type="number"
                    className="field-input"
                    min={1}
                    max={31}
                    value={cardForm.cutoffDay}
                    onChange={e => setCardForm(p => ({ ...p, cutoffDay: parseInt(e.target.value, 10) || 1 }))}
                    required
                  />
                </div>

                <div>
                  <label className="field-label">Día Límite de Pago (1-31)</label>
                  <input
                    type="number"
                    className="field-input"
                    min={1}
                    max={31}
                    value={cardForm.paymentDueDay}
                    onChange={e => setCardForm(p => ({ ...p, paymentDueDay: parseInt(e.target.value, 10) || 1 }))}
                    required
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label className="field-label">Color / Estilo Visual</label>
                  <select
                    className="field-select"
                    value={cardForm.color}
                    onChange={e => setCardForm(p => ({ ...p, color: e.target.value as CardThemeColor }))}
                  >
                    <option value="gold">🥇 Dorado Real (Aureus Gold)</option>
                    <option value="emerald">💚 Esmeralda Financiero</option>
                    <option value="blue">💙 Azul Zafiro Platinum</option>
                    <option value="purple">💜 Púrpura Royal</option>
                    <option value="silver">🥈 Plata Titanio</option>
                    <option value="rose">🌹 Oro Rosa Elegance</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowCardModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    background: 'transparent',
                    border: '1px solid #2A2A38',
                    color: '#888898',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '8px 20px' }}>
                  {editingCard ? 'Guardar Cambios' : 'Registrar Tarjeta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
