// ==============================================================================
// 🛡️ AUREUS · SENTINEL EXECUTIVE DASHBOARD & BILL PROTECTION SYSTEM
// ==============================================================================

import { useState, useEffect, useMemo } from 'react'
import {
  Shield,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  Zap,
  CreditCard,
  Wifi,
  School,
  Droplets,
  Plus,
  Send,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  PiggyBank,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react'
import { apiClient } from '../../services/apiClient'
import './SentinelDashboardView.css'

interface CommitmentItem {
  id: string
  name: string
  category: 'electric' | 'telecom' | 'card' | 'education' | 'water' | 'other'
  dueDateStr: string
  dueDayOfMonth: number
  status: 'pending' | 'paid' | 'overdue'
  amountFormatted: string
  amountRaw: number
  lateFeeAvoided: string
  contractNumber?: string
  daysRemaining: number
}

interface TelegramFeedItem {
  id: string
  sender: 'Mamá' | 'Papá' | 'Centinela Bot'
  avatarType: 'mama' | 'papa' | 'bot'
  text: string
  timestamp: string
  aiConfidence?: number
  categoryTag?: string
}

const INITIAL_COMMITMENTS: CommitmentItem[] = [
  {
    id: 'c-edesur',
    name: 'Edesur Dominicana',
    category: 'electric',
    dueDateStr: '20 Oct 2026',
    dueDayOfMonth: 20,
    status: 'pending',
    amountFormatted: 'RD$ 2,450.00',
    amountRaw: 2450,
    lateFeeAvoided: 'RD$ 450.00',
    contractNumber: '#928192',
    daysRemaining: 2,
  },
  {
    id: 'c-claro',
    name: 'Claro Fibra 300Mbps',
    category: 'telecom',
    dueDateStr: '24 Oct 2026',
    dueDayOfMonth: 24,
    status: 'pending',
    amountFormatted: 'RD$ 2,190.00',
    amountRaw: 2190,
    lateFeeAvoided: 'RD$ 300.00',
    contractNumber: '#809-555-1234',
    daysRemaining: 6,
  },
  {
    id: 'c-banreservas',
    name: 'Banreservas Visa Oro',
    category: 'card',
    dueDateStr: '28 Oct 2026',
    dueDayOfMonth: 28,
    status: 'pending',
    amountFormatted: 'RD$ 14,800.00',
    amountRaw: 14800,
    lateFeeAvoided: 'RD$ 1,200.00',
    contractNumber: '•••• 4892',
    daysRemaining: 10,
  },
  {
    id: 'c-colegio',
    name: 'Colegio San Judas Tadeo',
    category: 'education',
    dueDateStr: '05 Nov 2026',
    dueDayOfMonth: 5,
    status: 'pending',
    amountFormatted: 'RD$ 12,500.00',
    amountRaw: 12500,
    lateFeeAvoided: 'RD$ 800.00',
    contractNumber: 'Matrícula #2026-A',
    daysRemaining: 18,
  },
  {
    id: 'c-caasd',
    name: 'CAASD (Agua Potable)',
    category: 'water',
    dueDateStr: '12 Oct 2026',
    dueDayOfMonth: 12,
    status: 'paid',
    amountFormatted: 'RD$ 680.00',
    amountRaw: 680,
    lateFeeAvoided: 'RD$ 150.00',
    contractNumber: 'Contrato #44910',
    daysRemaining: -6,
  },
]

const INITIAL_FEED: TelegramFeedItem[] = [
  {
    id: 'feed-1',
    sender: 'Mamá',
    avatarType: 'mama',
    text: '1,200 de gasolina en Texaco Churchill y 350 de colmado',
    timestamp: 'Hace 12 min',
    aiConfidence: 98,
    categoryTag: 'Combustible & Alimentos',
  },
  {
    id: 'feed-2',
    sender: 'Papá',
    avatarType: 'papa',
    text: 'Pagué 680 de agua CAASD en la sucursal',
    timestamp: 'Hace 2 horas',
    aiConfidence: 99,
    categoryTag: 'Servicios del Hogar',
  },
  {
    id: 'feed-3',
    sender: 'Centinela Bot',
    avatarType: 'bot',
    text: '🛡️ Factura de CAASD conciliada y marcada como pagada. ¡Ahorraste RD$ 150.00 en mora! 🎉',
    timestamp: 'Hace 2 horas',
  },
]

export function SentinelDashboardView() {
  const [commitments, setCommitments] = useState<CommitmentItem[]>(INITIAL_COMMITMENTS)
  const [feed, setFeed] = useState<TelegramFeedItem[]>(INITIAL_FEED)
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'urgent'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [simText, setSimText] = useState('')
  const [celebrationToast, setCelebrationToast] = useState<string | null>(null)

  // Formulario nuevo compromiso
  const [newBillName, setNewBillName] = useState('')
  const [newBillDay, setNewBillDay] = useState(15)
  const [newBillAmount, setNewBillAmount] = useState('2000')
  const [newBillLateFee, setNewBillLateFee] = useState('350')

  // Carga inicial del backend
  useEffect(() => {
    let isMounted = true
    apiClient.sentinel
      .getCommitments()
      .then(res => {
        if (!isMounted || !res?.data?.commitments?.length) return
        const mapped = res.data.commitments.map((c: any) => ({
          id: c.id,
          name: c.name,
          category: (c.name.toLowerCase().includes('luz')
            ? 'electric'
            : c.name.toLowerCase().includes('claro') || c.name.toLowerCase().includes('internet')
            ? 'telecom'
            : c.name.toLowerCase().includes('tarjeta')
            ? 'card'
            : 'other') as CommitmentItem['category'],
          dueDateStr: c.currentCycle.dueDate,
          dueDayOfMonth: c.dueDayOfMonth,
          status: c.currentCycle.status,
          amountFormatted: c.expectedAmount || 'RD$ 0.00',
          amountRaw: c.expectedAmountCents ? c.expectedAmountCents / 100 : 0,
          lateFeeAvoided: c.estimatedLateFee || 'RD$ 0.00',
          daysRemaining: Math.ceil(
            (new Date(c.currentCycle.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          ),
        }))
        setCommitments(mapped)
      })
      .catch(() => {
        // En caso de que el backend esté en arranque, mantiene los datos muestra
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Métricas calculadas
  const metrics = useMemo(() => {
    const totalSpent = 48250
    const totalIncome = 85000
    const runway = totalIncome - totalSpent
    const savedFeesTotal = commitments
      .filter(c => c.status === 'paid')
      .reduce((acc, c) => acc + (parseFloat(c.lateFeeAvoided.replace(/[^0-9.]/g, '')) || 0), 3450)

    const urgentBill = commitments.find(c => c.status === 'pending' && c.daysRemaining <= 2)

    return {
      totalSpent,
      totalIncome,
      runway,
      savedFeesTotal,
      urgentBill,
    }
  }, [commitments])

  // Filtrado de compromisos
  const filteredCommitments = useMemo(() => {
    return commitments.filter(c => {
      if (filter === 'pending') return c.status === 'pending'
      if (filter === 'paid') return c.status === 'paid'
      if (filter === 'urgent') return c.status === 'pending' && c.daysRemaining <= 2
      return true
    })
  }, [commitments, filter])

  // Acción rápida: Marcar pagado
  const handleMarkAsPaid = (id: string, name: string, lateFee: string) => {
    setCommitments(prev =>
      prev.map(c => (c.id === id ? { ...c, status: 'paid', daysRemaining: 0 } : c))
    )

    const toastMsg = `🛡️ ¡Factura de "${name}" marcada como pagada! Ahorraste ${lateFee} en moras.`
    setCelebrationToast(toastMsg)

    // Agrega evento al stream de Telegram
    setFeed(prev => [
      {
        id: `feed-${Date.now()}`,
        sender: 'Centinela Bot',
        avatarType: 'bot',
        text: toastMsg,
        timestamp: 'Justo ahora',
      },
      ...prev,
    ])

    setTimeout(() => setCelebrationToast(null), 5000)
  }

  // Simulador de mensaje Telegram
  const handleSimulateTelegram = (e: React.FormEvent) => {
    e.preventDefault()
    if (!simText.trim()) return

    const newFeedItem: TelegramFeedItem = {
      id: `sim-${Date.now()}`,
      sender: 'Mamá',
      avatarType: 'mama',
      text: simText,
      timestamp: 'Justo ahora',
      aiConfidence: 99,
      categoryTag: 'Captura Telegram Live',
    }

    setFeed(prev => [newFeedItem, ...prev])
    setSimText('')
  }

  // Crear nuevo compromiso
  const handleCreateCommitment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBillName.trim()) return

    const newItem: CommitmentItem = {
      id: `comm-${Date.now()}`,
      name: newBillName,
      category: 'other',
      dueDayOfMonth: Number(newBillDay),
      dueDateStr: `${newBillDay} Oct 2026`,
      status: 'pending',
      amountFormatted: `RD$ ${Number(newBillAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      amountRaw: Number(newBillAmount),
      lateFeeAvoided: `RD$ ${Number(newBillLateFee).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      daysRemaining: Number(newBillDay) - new Date().getDate(),
    }

    setCommitments(prev => [newItem, ...prev])
    setIsModalOpen(false)

    // Intenta persistir en el backend si está disponible
    try {
      await apiClient.sentinel.createCommitment({
        name: newBillName,
        dueDayOfMonth: Number(newBillDay),
        expectedAmount: newBillAmount,
        estimatedLateFee: newBillLateFee,
      })
    } catch {
      // Manejado optimistamente en UI
    }

    setNewBillName('')
  }

  return (
    <div className="sentinel-dashboard-container">
      {/* Toast de celebración */}
      {celebrationToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in backdrop-blur-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="font-semibold text-sm">{celebrationToast}</span>
          <button onClick={() => setCelebrationToast(null)} className="text-emerald-400 hover:text-white ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Header & Live Telemetry Bar */}
      <div className="sentinel-header-bar">
        <div className="sentinel-household-selector">
          <span className="text-amber-400">🏡</span>
          <span>Hogar Familia Pérez 🇩🇴 · DOP</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="sentinel-sync-badge">
            <span className="sentinel-pulse-dot" />
            <span>Telegram Bot Conectado</span>
            <span className="text-indigo-300 font-normal">· Latencia 2.5s</span>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:brightness-110 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nuevo Compromiso</span>
          </button>
        </div>
      </div>

      {/* 2. Hero Banner: Escudo Centinela Anti-Moras */}
      <div className="sentinel-hero-shield">
        <div className="sentinel-shield-top">
          <div className="sentinel-shield-title-group">
            <div className="sentinel-shield-icon-badge">
              <Shield className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="sentinel-shield-title">
                <span>Centinela Anti-Moras Activo</span>
                <span className="sentinel-pulse-dot" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Monitoreando servicios domésticos y tarjetas familiares 24/7 vía Telegram & Gemini Flash
              </p>
            </div>
          </div>

          <div className="sentinel-savings-pill">
            <PiggyBank className="w-4 h-4" />
            <span>RD$ {metrics.savedFeesTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} ahorrados en moras este mes</span>
          </div>
        </div>

        {/* Urgent Callout Box */}
        {metrics.urgentBill ? (
          <div className="sentinel-urgent-box">
            <div className="sentinel-urgent-left">
              <div className="sentinel-urgent-icon">
                <Zap className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-100 text-base">{metrics.urgentBill.name}</span>
                  <span className="sentinel-urgent-pill">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Vence en {metrics.urgentBill.daysRemaining} días ({metrics.urgentBill.dueDateStr})
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                  <span>Monto: <strong className="text-amber-400 font-bold text-sm">{metrics.urgentBill.amountFormatted}</strong></span>
                  <span>•</span>
                  <span className="text-red-400 font-medium">Mora evitada si pagas hoy: +{metrics.urgentBill.lateFeeAvoided}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleMarkAsPaid(metrics.urgentBill!.id, metrics.urgentBill!.name, metrics.urgentBill!.lateFeeAvoided)}
              className="sentinel-btn-pay"
            >
              <Check className="w-4 h-4" />
              <span>Marcar Pagado</span>
            </button>
          </div>
        ) : (
          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="text-emerald-300 text-sm font-semibold">
              ¡Sin vencimientos urgentes en las próximas 48 horas! Todas tus facturas bajo control.
            </span>
          </div>
        )}
      </div>

      {/* 3. Executive KPI Cards (4 Column Grid) */}
      <div className="sentinel-kpi-grid">
        {/* KPI 1 */}
        <div className="sentinel-kpi-card">
          <div className="sentinel-kpi-header">
            <span>Gastos del Mes</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="sentinel-kpi-value">
              RD$ 48,250<span className="text-sm font-normal text-slate-400">.00</span>
            </div>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full inline-block mt-1">
              56% presupuesto consumido
            </span>
          </div>
          <div className="sentinel-progress-track">
            <div className="sentinel-progress-fill gold" style={{ width: '56%' }} />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="sentinel-kpi-card">
          <div className="sentinel-kpi-header">
            <span>Ingresos Consolidados</span>
            <PiggyBank className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="sentinel-kpi-value emerald">
              RD$ 85,000<span className="text-sm font-normal text-slate-400">.00</span>
            </div>
            <span className="text-xs text-slate-400 block mt-1">
              Q1: RD$ 42,500 &amp; Q2: RD$ 42,500 OK
            </span>
          </div>
          <div className="sentinel-progress-track">
            <div className="sentinel-progress-fill emerald" style={{ width: '100%' }} />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="sentinel-kpi-card">
          <div className="sentinel-kpi-header">
            <span>Flujo Disponible (Runway)</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="sentinel-kpi-value emerald">
              RD$ 36,750<span className="text-sm font-normal text-slate-400">.00</span>
            </div>
            <span className="text-xs font-semibold text-emerald-400 block mt-1">
              Margen de liquidez saludable: 43.2%
            </span>
          </div>
          <div className="sentinel-progress-track">
            <div className="sentinel-progress-fill emerald" style={{ width: '74%' }} />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="sentinel-kpi-card">
          <div className="sentinel-kpi-header">
            <span>Moras Evitadas (YTD)</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="sentinel-kpi-value gold">
              RD$ 18,920<span className="text-sm font-normal text-slate-400">.00</span>
            </div>
            <span className="text-xs text-amber-300 block mt-1 font-semibold">
              +RD$ 3,450.00 este periodo
            </span>
          </div>
          <div className="sentinel-progress-track">
            <div className="sentinel-progress-fill gold" style={{ width: '88%' }} />
          </div>
        </div>
      </div>

      {/* 4. Main 2-Column Split */}
      <div className="sentinel-main-grid">
        {/* Left Column (60%): Tracker & Spending Distribution */}
        <div className="flex flex-col gap-6">
          {/* Commitments Tracker */}
          <div className="sentinel-card">
            <div className="sentinel-card-header">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  <span>Compromisos &amp; Facturas del Hogar</span>
                </h3>
                <p className="text-xs text-slate-400">Vencimientos bajo supervisión activa del Centinela</p>
              </div>

              <div className="sentinel-filter-pills">
                <button
                  onClick={() => setFilter('all')}
                  className={`sentinel-filter-pill ${filter === 'all' ? 'active' : ''}`}
                >
                  Todos ({commitments.length})
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`sentinel-filter-pill ${filter === 'pending' ? 'active' : ''}`}
                >
                  Pendientes ({commitments.filter(c => c.status === 'pending').length})
                </button>
                <button
                  onClick={() => setFilter('paid')}
                  className={`sentinel-filter-pill ${filter === 'paid' ? 'active' : ''}`}
                >
                  Pagados ({commitments.filter(c => c.status === 'paid').length})
                </button>
                <button
                  onClick={() => setFilter('urgent')}
                  className={`sentinel-filter-pill ${filter === 'urgent' ? 'active' : ''}`}
                >
                  Urgentes ({commitments.filter(c => c.status === 'pending' && c.daysRemaining <= 2).length})
                </button>
              </div>
            </div>

            <div className="sentinel-commitment-list">
              {filteredCommitments.map(c => {
                const isPaid = c.status === 'paid'
                const isUrgent = c.status === 'pending' && c.daysRemaining <= 2

                return (
                  <div key={c.id} className="sentinel-commitment-item">
                    <div className="sentinel-item-left">
                      <div className={`sentinel-item-icon ${c.category}`}>
                        {c.category === 'electric' && <Zap className="w-5 h-5" />}
                        {c.category === 'telecom' && <Wifi className="w-5 h-5" />}
                        {c.category === 'card' && <CreditCard className="w-5 h-5" />}
                        {c.category === 'education' && <School className="w-5 h-5" />}
                        {c.category === 'water' && <Droplets className="w-5 h-5" />}
                        {c.category === 'other' && <Calendar className="w-5 h-5" />}
                      </div>

                      <div>
                        <div className="sentinel-item-name">
                          <span>{c.name}</span>
                          {isPaid ? (
                            <span className="sentinel-badge paid">Pagado ✅</span>
                          ) : isUrgent ? (
                            <span className="sentinel-badge urgent">Vence en {c.daysRemaining} días</span>
                          ) : (
                            <span className="sentinel-badge pending">En {c.daysRemaining} días</span>
                          )}
                        </div>

                        <div className="sentinel-item-meta">
                          <span>Vence: {c.dueDateStr}</span>
                          <span>•</span>
                          <span className="sentinel-item-savings">Mora evitada: +{c.lateFeeAvoided}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={`sentinel-item-amount ${isPaid ? 'paid' : ''}`}>
                          {c.amountFormatted}
                        </div>
                        <span className="text-xs text-slate-500">{c.contractNumber || 'Servicio'}</span>
                      </div>

                      {!isPaid && (
                        <button
                          onClick={() => handleMarkAsPaid(c.id, c.name, c.lateFeeAvoided)}
                          className="bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-all border border-amber-500/30"
                        >
                          Pagar
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Category Spending Breakdown */}
          <div className="sentinel-card">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-100 text-base">Distribución de Gastos Familiares</h4>
              <span className="text-xs text-slate-400 uppercase tracking-wider">Octubre 2026</span>
            </div>

            <div className="sentinel-composite-bar">
              <div className="sentinel-composite-segment c1" style={{ width: '38%' }} title="Alimentación 38%" />
              <div className="sentinel-composite-segment c2" style={{ width: '25%' }} title="Servicios 25%" />
              <div className="sentinel-composite-segment c3" style={{ width: '26%' }} title="Educación 26%" />
              <div className="sentinel-composite-segment c4" style={{ width: '11%' }} title="Transporte 11%" />
            </div>

            <div className="sentinel-category-grid">
              <div className="sentinel-category-box">
                <span className="text-xs text-slate-400">Alimentación &amp; Super</span>
                <span className="font-bold text-amber-400 text-sm">RD$ 18,400.00 (38%)</span>
              </div>
              <div className="sentinel-category-box">
                <span className="text-xs text-slate-400">Servicios &amp; Facturas</span>
                <span className="font-bold text-indigo-400 text-sm">RD$ 12,230.00 (25%)</span>
              </div>
              <div className="sentinel-category-box">
                <span className="text-xs text-slate-400">Educación &amp; Salud</span>
                <span className="font-bold text-emerald-400 text-sm">RD$ 12,500.00 (26%)</span>
              </div>
              <div className="sentinel-category-box">
                <span className="text-xs text-slate-400">Combustible &amp; Peajes</span>
                <span className="font-bold text-red-400 text-sm">RD$ 5,120.00 (11%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (40%): Live Telegram Family Activity Stream */}
        <div className="sentinel-card">
          <div className="sentinel-stream-header">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-indigo-400" />
              <div>
                <h4 className="font-bold text-slate-100 text-base flex items-center gap-2">
                  Captura Zero-Fricción
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </h4>
                <p className="text-xs text-slate-400">Stream en vivo · Gemini AI Parser</p>
              </div>
            </div>
            <span className="text-xs text-indigo-300 bg-indigo-950/60 border border-indigo-500/30 px-2 py-0.5 rounded-full font-semibold">
              Telegram Bot
            </span>
          </div>

          <div className="sentinel-stream-container">
            {feed.map(item => (
              <div key={item.id} className="sentinel-chat-bubble">
                <div className="sentinel-chat-top">
                  <div className="sentinel-chat-sender">
                    <span className={`sentinel-avatar ${item.avatarType}`}>
                      {item.sender[0]}
                    </span>
                    <span>{item.sender}</span>
                  </div>
                  <span className="sentinel-chat-time">{item.timestamp}</span>
                </div>

                <p className="sentinel-chat-text">{item.text}</p>

                {item.aiConfidence && (
                  <div className="flex items-center gap-2">
                    <span className="sentinel-ai-tag">
                      <Sparkles className="w-3 h-3 text-indigo-300" />
                      <span>{item.aiConfidence}% confianza IA</span>
                    </span>
                    {item.categoryTag && (
                      <span className="text-xs text-slate-400">· {item.categoryTag}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Telegram message simulator */}
          <form onSubmit={handleSimulateTelegram} className="sentinel-sim-box">
            <input
              type="text"
              value={simText}
              onChange={e => setSimText(e.target.value)}
              placeholder="Simular mensaje ej: 1500 cena colmado..."
              className="sentinel-sim-input"
            />
            <button type="submit" className="sentinel-sim-btn">
              <Send className="w-3.5 h-3.5" />
              <span>Enviar</span>
            </button>
          </form>
        </div>
      </div>

      {/* Modal: + Nuevo Compromiso */}
      {isModalOpen && (
        <div className="sentinel-modal-overlay">
          <div className="sentinel-modal-card">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                <span>Nuevo Compromiso Recurrente</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCommitment} className="flex flex-col gap-4">
              <div className="sentinel-form-group">
                <label className="sentinel-form-label">Nombre del Servicio / Compromiso</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Luz Edesur, Internet Claro, Tarjeta..."
                  value={newBillName}
                  onChange={e => setNewBillName(e.target.value)}
                  className="sentinel-form-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="sentinel-form-group">
                  <label className="sentinel-form-label">Día del Mes (1 - 31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={newBillDay}
                    onChange={e => setNewBillDay(Number(e.target.value))}
                    className="sentinel-form-input"
                  />
                </div>

                <div className="sentinel-form-group">
                  <label className="sentinel-form-label">Monto Estimado (RD$)</label>
                  <input
                    type="number"
                    required
                    value={newBillAmount}
                    onChange={e => setNewBillAmount(e.target.value)}
                    className="sentinel-form-input"
                  />
                </div>
              </div>

              <div className="sentinel-form-group">
                <label className="sentinel-form-label">Mora o Penalidad Estimada si se Vence (RD$)</label>
                <input
                  type="number"
                  required
                  value={newBillLateFee}
                  onChange={e => setNewBillLateFee(e.target.value)}
                  className="sentinel-form-input"
                />
                <span className="text-xs text-slate-400">
                  El Centinela te avisará 5 días y 2 días antes para evitar este recargo.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 text-sm font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2 rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                >
                  Guardar Compromiso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
