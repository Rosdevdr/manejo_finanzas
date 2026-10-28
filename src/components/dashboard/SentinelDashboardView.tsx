// ==============================================================================
// AUREUS · SENTINEL EXECUTIVE DASHBOARD (REVOLUT ULTRA x STRIPE BENTO EDITION)
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
  TrendingDown,
  ArrowUpRight,
  PiggyBank,
  Check,
  X,
  AlertTriangle,
  Home,
  Activity,
  PieChart,
} from 'lucide-react'
import { apiClient } from '../../services/apiClient'
import './SentinelDashboardView.css'

interface CommitmentItem {
  id: string
  name: string
  monogram: string
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
  amountTag?: string
}

const INITIAL_COMMITMENTS: CommitmentItem[] = [
  {
    id: 'c-edesur',
    name: 'Edesur Dominicana',
    monogram: 'ED',
    category: 'electric',
    dueDateStr: '20 Oct 2026',
    dueDayOfMonth: 20,
    status: 'pending',
    amountFormatted: 'RD$ 2,450.00',
    amountRaw: 2450,
    lateFeeAvoided: 'RD$ 450.00',
    contractNumber: 'Suministro #49102-1',
    daysRemaining: 2,
  },
  {
    id: 'c-claro',
    name: 'Claro Telecomunicaciones',
    monogram: 'CL',
    category: 'telecom',
    dueDateStr: '24 Oct 2026',
    dueDayOfMonth: 24,
    status: 'pending',
    amountFormatted: 'RD$ 2,190.00',
    amountRaw: 2190,
    lateFeeAvoided: 'RD$ 300.00',
    contractNumber: 'Fibra Óptica 300 Mbps',
    daysRemaining: 6,
  },
  {
    id: 'c-banreservas',
    name: 'Banreservas Visa Oro',
    monogram: 'BR',
    category: 'card',
    dueDateStr: '28 Oct 2026',
    dueDayOfMonth: 28,
    status: 'pending',
    amountFormatted: 'RD$ 14,800.00',
    amountRaw: 14800,
    lateFeeAvoided: 'RD$ 1,200.00',
    contractNumber: 'Corte 0% Interés · *4892',
    daysRemaining: 10,
  },
  {
    id: 'c-colegio',
    name: 'Colegio San Judas Tadeo',
    monogram: 'SJ',
    category: 'education',
    dueDateStr: '05 Nov 2026',
    dueDayOfMonth: 5,
    status: 'pending',
    amountFormatted: 'RD$ 12,500.00',
    amountRaw: 12500,
    lateFeeAvoided: 'RD$ 800.00',
    contractNumber: 'Colegiatura Mensual #2026-A',
    daysRemaining: 18,
  },
  {
    id: 'c-caasd',
    name: 'CAASD (Agua Potable)',
    monogram: 'CA',
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
    text: 'OCR Factura Supermercado Nacional · NCF B0200481920 conciliado',
    timestamp: 'Hace 12 min',
    aiConfidence: 99,
    categoryTag: 'Alimentación & Despensa',
    amountTag: 'RD$ 6,840.00',
  },
  {
    id: 'feed-2',
    sender: 'Papá',
    avatarType: 'papa',
    text: 'Nota de Voz transcrita: Gasolina regular en Texaco Churchill con débito Banreservas',
    timestamp: 'Hace 1 hora',
    aiConfidence: 98,
    categoryTag: 'Combustible & Vehículo',
    amountTag: 'RD$ 1,500.00',
  },
  {
    id: 'feed-3',
    sender: 'Centinela Bot',
    avatarType: 'bot',
    text: 'Factura de CAASD conciliada y marcada como pagada. Ahorraste RD$ 150.00 en mora.',
    timestamp: 'Hace 2 horas',
    amountTag: 'RD$ 680.00',
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
        const mapped = res.data.commitments.map((c: any) => {
          const words = String(c.name || 'SV').trim().split(/\s+/)
          const monogram =
            words.length >= 2
              ? `${words[0][0]}${words[1][0]}`.toUpperCase()
              : String(c.name || 'SV').slice(0, 2).toUpperCase()
          return {
            id: c.id,
            name: c.name,
            monogram,
            category: (c.name.toLowerCase().includes('luz') || c.name.toLowerCase().includes('ede')
              ? 'electric'
              : c.name.toLowerCase().includes('claro') || c.name.toLowerCase().includes('internet')
              ? 'telecom'
              : c.name.toLowerCase().includes('tarjeta') || c.name.toLowerCase().includes('visa')
              ? 'card'
              : 'other') as CommitmentItem['category'],
            dueDateStr: c.currentCycle.dueDate,
            dueDayOfMonth: c.dueDayOfMonth,
            status: c.currentCycle.status,
            amountFormatted: c.expectedAmount || 'RD$ 0.00',
            amountRaw: c.expectedAmountCents ? c.expectedAmountCents / 100 : 0,
            lateFeeAvoided: c.estimatedLateFee || 'RD$ 0.00',
            daysRemaining: Math.ceil(
              (new Date(c.currentCycle.dueDate).getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24)
            ),
          }
        })
        setCommitments(mapped)
      })
      .catch(() => {
        // Si el backend no responde, conserva los datos demostrativos
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Métricas calculadas
  const metrics = useMemo(() => {
    const totalIncome = 170000
    const totalSpent = 78420
    const netFlow = totalIncome - totalSpent
    const savedFeesTotal = commitments
      .filter(c => c.status === 'paid')
      .reduce((acc, c) => acc + (parseFloat(c.lateFeeAvoided.replace(/[^0-9.]/g, '')) || 0), 3450)

    const urgentBill = commitments.find(c => c.status === 'pending' && c.daysRemaining <= 2)

    return {
      totalSpent,
      totalIncome,
      netFlow,
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

    const toastMsg = `Factura de "${name}" marcada como pagada. Ahorraste ${lateFee} en moras.`
    setCelebrationToast(toastMsg)

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

    const words = newBillName.trim().split(/\s+/)
    const monogram =
      words.length >= 2
        ? `${words[0][0]}${words[1][0]}`.toUpperCase()
        : newBillName.trim().slice(0, 2).toUpperCase()

    const newItem: CommitmentItem = {
      id: `comm-${Date.now()}`,
      name: newBillName,
      monogram,
      category: 'other',
      dueDayOfMonth: Number(newBillDay),
      dueDateStr: `${newBillDay} Oct 2026`,
      status: 'pending',
      amountFormatted: `RD$ ${Number(newBillAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      amountRaw: Number(newBillAmount),
      lateFeeAvoided: `RD$ ${Number(newBillLateFee).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      contractNumber: 'Servicio Recurrente',
      daysRemaining: Math.max(1, Number(newBillDay) - new Date().getDate()),
    }

    setCommitments(prev => [newItem, ...prev])
    setIsModalOpen(false)

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
          <button
            onClick={() => setCelebrationToast(null)}
            className="text-emerald-400 hover:text-white ml-2"
            aria-label="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Barra de Telemetría Soberana (Sin emojis, diseño Revolut / Stripe) */}
      <div className="sentinel-header-bar">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="sentinel-household-selector">
            <Home size={15} className="sentinel-gold-icon" />
            <span>Hogar Familia Pérez</span>
            <span className="sentinel-currency-chip">DOM · DOP</span>
          </div>

          <div className="sentinel-telemetry-pill">
            <span className="sentinel-pulse-dot" />
            <span>Consola Soberana // ACH Activo</span>
            <span className="sentinel-telemetry-divider">·</span>
            <span className="tabular-nums">Latencia 18ms</span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="sentinel-sync-badge">
            <span className="sentinel-pulse-dot" />
            <span>Telegram Bot Conectado</span>
            <span className="sentinel-sync-latency">· Sync 1.2s</span>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="sentinel-new-commitment-btn"
          >
            <span className="sentinel-new-commitment-icon">
              <Plus size={14} strokeWidth={2.5} />
            </span>
            <span>Nuevo Compromiso</span>
          </button>
        </div>
      </div>

      {/* 2. HERO BENTO CARD: ESTILO REVOLUT ULTRA + CURVA DE VELOCIDAD DE CAJA */}
      <div className="sentinel-hero-shield">
        <div className="sentinel-specular-top-line" />

        <div className="sentinel-revolut-hero-grid">
          {/* Columna Izquierda (7 cols): Liquidez Inmediata, Patrimonio y Alerta Activa */}
          <div className="sentinel-revolut-left">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="sentinel-tier-badge">Nivel Soberano Ultra</span>
                <span className="sentinel-health-score-badge">
                  <span className="sentinel-pulse-dot" />
                  <span>Salud Financiera: Óptima / Score A1</span>
                </span>
              </div>

              <div className="sentinel-savings-pill">
                <PiggyBank className="w-4 h-4" />
                <span className="tabular-nums">
                  RD$ {metrics.savedFeesTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} ahorrados en moras
                </span>
              </div>
            </div>

            <div className="sentinel-hero-balance-block">
              <span className="sentinel-hero-overline">Liquidez Inmediata Disponible</span>
              <div className="sentinel-hero-balance-row">
                <h1 className="sentinel-hero-amount tabular-nums">RD$ 413,950.00</h1>
                <span className="sentinel-hero-usd tabular-nums">~ US$ 6,882.00</span>
              </div>
            </div>

            {/* Sub-tarjetas gemelas de Patrimonio y Rendimiento */}
            <div className="sentinel-hero-subcards">
              <div className="sentinel-hero-subcard">
                <span className="sentinel-subcard-label">Patrimonio Neto Consolidado</span>
                <span className="sentinel-subcard-value tabular-nums">RD$ 1,280,500.00</span>
                <span className="sentinel-subcard-delta positive">
                  <ArrowUpRight size={14} />
                  <span>+14.2% YTD acumulado</span>
                </span>
              </div>

              <div className="sentinel-hero-subcard">
                <span className="sentinel-subcard-label">Reserva &amp; Bóveda de Liquidez</span>
                <span className="sentinel-subcard-value tabular-nums">RD$ 321,260.00</span>
                <span className="sentinel-subcard-meta">
                  TNA +10.45% · Colchón de 4.2 meses
                </span>
              </div>
            </div>

            {/* Urgent Callout Box integrado */}
            {metrics.urgentBill ? (
              <div className="sentinel-urgent-box">
                <div className="sentinel-urgent-left">
                  <div className="sentinel-urgent-icon">
                    <Zap className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold sentinel-title-text text-sm sm:text-base">
                        {metrics.urgentBill.name}
                      </span>
                      <span className="sentinel-urgent-pill">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Vence en {metrics.urgentBill.daysRemaining * 24}h ({metrics.urgentBill.dueDateStr})
                      </span>
                    </div>
                    <div className="text-xs sentinel-subtitle-text flex items-center gap-2 mt-1 flex-wrap">
                      <span>
                        Monto nominal:{' '}
                        <strong className="sentinel-gold-text font-bold tabular-nums">
                          {metrics.urgentBill.amountFormatted}
                        </strong>
                      </span>
                      <span>•</span>
                      <span className="sentinel-danger-text font-semibold tabular-nums">
                        Recargo evitado hoy: +{metrics.urgentBill.lateFeeAvoided}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleMarkAsPaid(
                      metrics.urgentBill!.id,
                      metrics.urgentBill!.name,
                      metrics.urgentBill!.lateFeeAvoided
                    )
                  }
                  className="sentinel-btn-pay"
                >
                  <Check className="w-4 h-4" />
                  <span>Pagar Ahora</span>
                </button>
              </div>
            ) : (
              <div className="sentinel-safe-zone-banner">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <span className="text-sm font-semibold">
                  Zona de Seguridad Sentinel Activa: Cero vencimientos urgentes en las próximas 48 horas.
                </span>
              </div>
            )}
          </div>

          {/* Columna Derecha (5 cols): Curva de Velocidad de Caja 30 Días (Stripe x Revolut Chart) */}
          <div className="sentinel-velocity-panel">
            <div className="sentinel-velocity-header">
              <div>
                <span className="sentinel-subcard-label">Velocidad de Caja · Runway</span>
                <h2 className="sentinel-velocity-title">Curva de Liquidez 30 Días</h2>
              </div>
              <span className="sentinel-inertia-badge">
                <Activity size={13} />
                <span>Inercia Positiva</span>
              </span>
            </div>

            <div className="sentinel-sparkline-canvas">
              <svg
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
                viewBox="0 0 420 155"
              >
                <defs>
                  <linearGradient id="aureusLiquidityGlow" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="#C8A962" stopOpacity="0.34" />
                    <stop offset="65%" stopColor="#C8A962" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#C8A962" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Guías horizontales sutiles */}
                <line
                  x1="0"
                  y1="35"
                  x2="420"
                  y2="35"
                  stroke="currentColor"
                  strokeOpacity="0.07"
                  strokeDasharray="3 3"
                />
                <line
                  x1="0"
                  y1="80"
                  x2="420"
                  y2="80"
                  stroke="currentColor"
                  strokeOpacity="0.07"
                  strokeDasharray="3 3"
                />
                {/* Piso de seguridad crítico */}
                <line
                  x1="0"
                  y1="132"
                  x2="420"
                  y2="132"
                  stroke="#EF4444"
                  strokeOpacity="0.45"
                  strokeDasharray="4 4"
                  strokeWidth="1.25"
                />
                {/* Área bajo la curva */}
                <path
                  d="M 0,108 Q 45,98 90,86 T 175,92 T 255,50 T 335,58 T 412,20 L 412,148 L 0,148 Z"
                  fill="url(#aureusLiquidityGlow)"
                />
                {/* Curva continua */}
                <path
                  d="M 0,108 Q 45,98 90,86 T 175,92 T 255,50 T 335,58 T 412,20"
                  fill="none"
                  stroke="#C8A962"
                  strokeLinecap="round"
                  strokeWidth="2.75"
                />
                {/* Puntos clave de quincena y corte */}
                <circle cx="90" cy="86" r="4" fill="#10B981" />
                <circle cx="255" cy="50" r="4.5" fill="#10B981" />
                <circle cx="335" cy="58" r="4" fill="#F59E0B" />
                <circle cx="412" cy="20" r="5" fill="#C8A962" />
              </svg>
            </div>

            <div className="sentinel-velocity-axis tabular-nums">
              <div className="sentinel-axis-point">
                <span className="sentinel-axis-date">01 OCT</span>
                <span className="sentinel-axis-val">RD$ 322K</span>
              </div>
              <div className="sentinel-axis-point">
                <span className="sentinel-axis-date">15 OCT (Q1)</span>
                <span className="sentinel-axis-val emerald">RD$ 380K</span>
              </div>
              <div className="sentinel-axis-point">
                <span className="sentinel-axis-date">HOY (Q2)</span>
                <span className="sentinel-axis-val gold">RD$ 413.9K</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CUATRO TARJETAS KPI INSTITUCIONALES DESACOPLADAS (1 RENGLÓN POR CIFRA) */}
      <div className="sentinel-kpi-grid">
        {/* KPI 1: Ingresos del Mes */}
        <div className="sentinel-kpi-card">
          <div className="sentinel-kpi-header">
            <span>Ingresos del Mes</span>
            <div className="sentinel-kpi-icon-box emerald">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="sentinel-kpi-value tabular-nums">
            RD$ 170,000<span className="sentinel-decimals">.00</span>
          </div>
          <div className="sentinel-kpi-footer">
            <div className="sentinel-kpi-meta-row">
              <span className="sentinel-kpi-badge">+8.4% vs mes ant.</span>
              <span className="sentinel-kpi-target tabular-nums">Meta: 100%</span>
            </div>
            <div className="sentinel-progress-track">
              <div className="sentinel-progress-fill emerald" style={{ width: '100%' }} />
            </div>
          </div>
        </div>

        {/* KPI 2: Gastos Totales */}
        <div className="sentinel-kpi-card">
          <div className="sentinel-kpi-header">
            <span>Gastos Totales</span>
            <div className="sentinel-kpi-icon-box neutral">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="sentinel-kpi-value tabular-nums">
            RD$ 78,420<span className="sentinel-decimals">.00</span>
          </div>
          <div className="sentinel-kpi-footer">
            <div className="sentinel-kpi-meta-row">
              <span className="sentinel-kpi-badge">-3.2% vs ppto</span>
              <span className="sentinel-kpi-target tabular-nums">Consumo: 46%</span>
            </div>
            <div className="sentinel-progress-track">
              <div className="sentinel-progress-fill gold" style={{ width: '46.1%' }} />
            </div>
          </div>
        </div>

        {/* KPI 3: Flujo Neto Operativo */}
        <div className="sentinel-kpi-card">
          <div className="sentinel-kpi-header">
            <span>Flujo Neto Operativo</span>
            <div className="sentinel-kpi-icon-box emerald">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="sentinel-kpi-value emerald tabular-nums">
            +RD$ 91,580<span className="sentinel-decimals">.00</span>
          </div>
          <div className="sentinel-kpi-footer">
            <div className="sentinel-kpi-meta-row">
              <span className="sentinel-kpi-badge">53.8% ahorro</span>
              <span className="sentinel-kpi-runway-text">Superávit</span>
            </div>
            <div className="sentinel-progress-track">
              <div className="sentinel-progress-fill emerald" style={{ width: '53.8%' }} />
            </div>
          </div>
        </div>

        {/* KPI 4: Nivel de Endeudamiento */}
        <div className="sentinel-kpi-card">
          <div className="sentinel-kpi-header">
            <span>Endeudamiento</span>
            <div className="sentinel-kpi-icon-box gold">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="sentinel-kpi-value gold tabular-nums">14.8%</div>
          <div className="sentinel-kpi-footer">
            <div className="sentinel-kpi-meta-row">
              <span className="sentinel-kpi-badge neutral">Riesgo Bajo (Lím. 35%)</span>
              <span className="sentinel-kpi-fee-text">Capacidad A+</span>
            </div>
            <div className="sentinel-progress-track">
              <div className="sentinel-progress-fill gold" style={{ width: '28%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* 4. BLOQUE ASIMÉTRICO PRINCIPAL: RADAR CENTINELA + DOCTRINAS PRESUPUESTARIAS + TELEGRAM LIVE */}
      <div className="sentinel-main-grid">
        {/* Columna Izquierda (60%): Radar Centinela Anti-Moras & Estructura Presupuestaria */}
        <div className="flex flex-col gap-6">
          {/* Radar Centinela Anti-Moras (Stripe-Style Ledger) */}
          <div className="sentinel-card">
            <div className="sentinel-card-header">
              <div className="flex items-center gap-3">
                <div className="sentinel-section-icon-box">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold sentinel-title-text">
                    Radar Centinela Anti-Moras
                  </h3>
                  <p className="text-xs sentinel-subtitle-text">
                    Obligaciones fijas auditadas: {commitments.length} activas en este ciclo de corte
                  </p>
                </div>
              </div>

              <div className="sentinel-filter-pills">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`sentinel-filter-pill ${filter === 'all' ? 'active' : ''}`}
                >
                  Todos ({commitments.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('pending')}
                  className={`sentinel-filter-pill ${filter === 'pending' ? 'active' : ''}`}
                >
                  Pendientes ({commitments.filter(c => c.status === 'pending').length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('paid')}
                  className={`sentinel-filter-pill ${filter === 'paid' ? 'active' : ''}`}
                >
                  Pagados ({commitments.filter(c => c.status === 'paid').length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('urgent')}
                  className={`sentinel-filter-pill ${filter === 'urgent' ? 'active' : ''}`}
                >
                  Urgentes ({commitments.filter(c => c.status === 'pending' && c.daysRemaining <= 2).length})
                </button>
              </div>
            </div>

            {/* Encabezado de columnas estilo Stripe */}
            <div className="sentinel-ledger-thead">
              <span>Emisor &amp; Concepto</span>
              <span>Plazo &amp; Cobertura</span>
              <span className="text-right">Monto Nominal &amp; Acción</span>
            </div>

            <div className="sentinel-commitment-list">
              {filteredCommitments.map(c => {
                const isPaid = c.status === 'paid'
                const isUrgent = c.status === 'pending' && c.daysRemaining <= 2

                return (
                  <div key={c.id} className="sentinel-commitment-item">
                    <div className="sentinel-item-left">
                      <div className={`sentinel-item-icon ${c.category}`}>
                        <span className="sentinel-item-monogram">{c.monogram}</span>
                        <span className="sentinel-item-subicon">
                          {c.category === 'electric' && <Zap className="w-3 h-3" />}
                          {c.category === 'telecom' && <Wifi className="w-3 h-3" />}
                          {c.category === 'card' && <CreditCard className="w-3 h-3" />}
                          {c.category === 'education' && <School className="w-3 h-3" />}
                          {c.category === 'water' && <Droplets className="w-3 h-3" />}
                          {c.category === 'other' && <Calendar className="w-3 h-3" />}
                        </span>
                      </div>

                      <div>
                        <div className="sentinel-item-name">
                          <span>{c.name}</span>
                          {isPaid ? (
                            <span className="sentinel-badge paid">
                              <Check size={11} style={{ marginRight: '4px', display: 'inline' }} />
                              Conciliado
                            </span>
                          ) : isUrgent ? (
                            <span className="sentinel-badge urgent">
                              Vence en {c.daysRemaining * 24}h
                            </span>
                          ) : (
                            <span className="sentinel-badge pending">
                              En {c.daysRemaining} días
                            </span>
                          )}
                        </div>

                        <div className="sentinel-item-meta">
                          <span>{c.contractNumber || 'Servicio Residencial'}</span>
                          <span>•</span>
                          <span>Corte: {c.dueDateStr}</span>
                          <span>•</span>
                          <span className="sentinel-item-savings tabular-nums">
                            Mora evitada: +{c.lateFeeAvoided}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="sentinel-item-right">
                      <div className="text-right">
                        <div className={`sentinel-item-amount tabular-nums ${isPaid ? 'paid' : ''}`}>
                          {c.amountFormatted}
                        </div>
                        <span className="text-xs sentinel-muted-text">
                          {isPaid ? 'Débito ejecutado' : isUrgent ? 'Urgente Pago' : 'Fondos Garantizados'}
                        </span>
                      </div>

                      {!isPaid ? (
                        <button
                          type="button"
                          onClick={() => handleMarkAsPaid(c.id, c.name, c.lateFeeAvoided)}
                          className={`sentinel-item-pay-btn ${isUrgent ? 'urgent' : ''}`}
                        >
                          Pagar
                        </button>
                      ) : (
                        <span className="sentinel-item-paid-pill">
                          <Check size={13} />
                          <span>Al día</span>
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Panel de Métodos Presupuestarios Soberanos (50/30/20 + Sobres Bento + ZBB + Kakebo) */}
          <div className="sentinel-card">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="sentinel-section-icon-box">
                  <PieChart className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold sentinel-title-text text-base">
                    Estructura de Asignación Presupuestaria
                  </h4>
                  <p className="text-xs sentinel-subtitle-text">
                    Validación cruzada institucional de 4 doctrinas de asignación
                  </p>
                </div>
              </div>
              <span className="sentinel-cycle-chip">CICLO 2026-10</span>
            </div>

            {/* 1. Barra Compuesta 50 / 30 / 20 */}
            <div className="sentinel-doctrine-block">
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="sentinel-title-text">Regla 50/30/20 Institucional</span>
                <span className="sentinel-kpi-runway-text font-mono">Balance Óptimo</span>
              </div>
              <div className="sentinel-composite-bar">
                <div
                  className="sentinel-composite-segment c1"
                  style={{ width: '48%' }}
                  title="Necesidades: 48% (RD$ 81.6K)"
                />
                <div
                  className="sentinel-composite-segment c2"
                  style={{ width: '24%' }}
                  title="Deseos: 24% (RD$ 40.8K)"
                />
                <div
                  className="sentinel-composite-segment c3"
                  style={{ width: '28%' }}
                  title="Ahorro / Inversión: 28% (RD$ 47.6K)"
                />
              </div>
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs sentinel-subtitle-text font-mono pt-1 tabular-nums">
                <span>Necesidades: 48% (RD$ 81.6K)</span>
                <span>Deseos: 24% (RD$ 40.8K)</span>
                <span className="sentinel-kpi-runway-text font-semibold">
                  Ahorro: 28% (RD$ 47.6K)
                </span>
              </div>
            </div>

            {/* 2. Sobres Digitales (4 Bento Envelopes) */}
            <div className="sentinel-category-grid">
              <div className="sentinel-category-box">
                <div className="flex items-center justify-between">
                  <span className="text-xs sentinel-subtitle-text">Vivienda &amp; Luz</span>
                  <span className="text-xs font-mono sentinel-category-val-1 font-bold">85%</span>
                </div>
                <span className="font-bold sentinel-title-text text-sm tabular-nums">
                  RD$ 18,400.00
                </span>
                <div className="sentinel-progress-track">
                  <div className="sentinel-progress-fill gold" style={{ width: '85%' }} />
                </div>
              </div>

              <div className="sentinel-category-box">
                <div className="flex items-center justify-between">
                  <span className="text-xs sentinel-subtitle-text">Alimentación</span>
                  <span className="text-xs font-mono sentinel-category-val-3 font-bold">62%</span>
                </div>
                <span className="font-bold sentinel-title-text text-sm tabular-nums">
                  RD$ 14,230.00
                </span>
                <div className="sentinel-progress-track">
                  <div className="sentinel-progress-fill emerald" style={{ width: '62%' }} />
                </div>
              </div>

              <div className="sentinel-category-box">
                <div className="flex items-center justify-between">
                  <span className="text-xs sentinel-subtitle-text">Educación &amp; Salud</span>
                  <span className="text-xs font-mono sentinel-category-val-3 font-bold">100%</span>
                </div>
                <span className="font-bold sentinel-title-text text-sm tabular-nums">
                  RD$ 12,500.00
                </span>
                <div className="sentinel-progress-track">
                  <div className="sentinel-progress-fill emerald" style={{ width: '100%' }} />
                </div>
              </div>

              <div className="sentinel-category-box">
                <div className="flex items-center justify-between">
                  <span className="text-xs sentinel-subtitle-text">Ocio &amp; Movilidad</span>
                  <span className="text-xs font-mono sentinel-category-val-2 font-bold">40%</span>
                </div>
                <span className="font-bold sentinel-title-text text-sm tabular-nums">
                  RD$ 5,120.00
                </span>
                <div className="sentinel-progress-track">
                  <div className="sentinel-progress-fill indigo" style={{ width: '40%' }} />
                </div>
              </div>
            </div>

            {/* 3 & 4. Base Cero (ZBB) & Kakebo */}
            <div className="sentinel-methods-duo">
              <div className="sentinel-method-mini-card">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs sentinel-title-text">
                    Presupuesto Base Cero (ZBB)
                  </span>
                  <span className="sentinel-kpi-badge">100% Asignado</span>
                </div>
                <p className="text-xs sentinel-subtitle-text leading-relaxed">
                  Cada peso ingresado tiene destino planificado. Cero fuga no identificada.
                </p>
              </div>

              <div className="sentinel-method-mini-card">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs sentinel-title-text">
                    Disciplina Kakebo Reflexivo
                  </span>
                  <span className="sentinel-kpi-badge gold">+RD$ 9,300 evitados</span>
                </div>
                <p className="text-xs sentinel-subtitle-text leading-relaxed">
                  Gasto hormiga e impulsivo neutralizado por alertas preventivas este mes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha (40%): Captura Zero-Fricción (Telegram Bot + OCR Multimodal) */}
        <div className="sentinel-card">
          <div className="sentinel-stream-header">
            <div className="flex items-center gap-2.5">
              <div className="sentinel-section-icon-box indigo">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold sentinel-title-text text-base flex items-center gap-2">
                  <span>Captura Zero-Fricción</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </h4>
                <p className="text-xs sentinel-subtitle-text">
                  Pipeline multimodal · Gemini Flash OCR &amp; Voz
                </p>
              </div>
            </div>
            <span className="sentinel-telegram-tag">
              <Send size={12} className="sentinel-telegram-tag-icon" />
              <span>Telegram Bot</span>
            </span>
          </div>

          {/* Barra de estado del Bot */}
          <div className="sentinel-bot-status-bar">
            <div className="flex items-center gap-2.5">
              <span className="sentinel-pulse-dot" />
              <span className="text-xs font-bold sentinel-title-text">
                @Aureus_OS_Bot · 24/7 ONLINE
              </span>
            </div>
            <span className="text-xs font-mono sentinel-subtitle-text tabular-nums">
              Sync: &lt;1.2s
            </span>
          </div>

          <div className="sentinel-stream-container">
            {feed.map(item => (
              <div key={item.id} className="sentinel-chat-bubble">
                <div className="sentinel-chat-top">
                  <div className="sentinel-chat-sender">
                    <span className={`sentinel-avatar ${item.avatarType}`}>{item.sender[0]}</span>
                    <span>{item.sender}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.amountTag && (
                      <span className="sentinel-chat-amount tabular-nums">{item.amountTag}</span>
                    )}
                    <span className="sentinel-chat-time">{item.timestamp}</span>
                  </div>
                </div>

                <p className="sentinel-chat-text">{item.text}</p>

                {item.aiConfidence && (
                  <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                    <span className="sentinel-ai-tag">
                      <Sparkles className="w-3 h-3" />
                      <span>{item.aiConfidence}% confianza IA</span>
                    </span>
                    {item.categoryTag && (
                      <span className="text-xs sentinel-muted-text font-medium">
                        {item.categoryTag}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Simulador interactivo de captura por Telegram */}
          <form onSubmit={handleSimulateTelegram} className="sentinel-sim-box">
            <input
              type="text"
              value={simText}
              onChange={e => setSimText(e.target.value)}
              placeholder="Simular ingesta ej: 1500 cena o factura luz..."
              className="sentinel-sim-input"
            />
            <button type="submit" className="sentinel-sim-btn">
              <Send className="w-3.5 h-3.5" />
              <span>Enviar</span>
            </button>
          </form>
        </div>
      </div>

      {/* Modal: Nuevo Compromiso Recurrente */}
      {isModalOpen && (
        <div className="sentinel-modal-overlay">
          <div className="sentinel-modal-card">
            <div className="flex items-center justify-between pb-2 sentinel-modal-header">
              <h3 className="font-bold sentinel-title-text text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-500" />
                <span>Nuevo Compromiso Recurrente</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="sentinel-modal-close-btn"
                title="Cerrar modal"
                aria-label="Cerrar modal"
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
                  <label className="sentinel-form-label">Día de Corte (1 - 31)</label>
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
                  <label className="sentinel-form-label">Monto Nominal (RD$)</label>
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
                <label className="sentinel-form-label">
                  Mora o Penalidad Estimada si se Vence (RD$)
                </label>
                <input
                  type="number"
                  required
                  value={newBillLateFee}
                  onChange={e => setNewBillLateFee(e.target.value)}
                  className="sentinel-form-input"
                />
                <span className="text-xs sentinel-subtitle-text">
                  El Centinela te avisará 5 días y 48 horas antes para evitar este recargo.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="sentinel-modal-cancel-btn"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]"
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
