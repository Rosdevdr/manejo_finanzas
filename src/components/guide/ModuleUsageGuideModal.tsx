import { useState, useEffect } from 'react'
import './ModuleUsageGuideModal.css'
import {
  X,
  BookOpen,
  LayoutDashboard,
  TrendingDown,
  CreditCard,
  Wallet,
  Target,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react'

interface ModuleUsageGuideModalProps {
  isOpen: boolean
  onClose: () => void
  initialModule?: string
}

interface GuideSection {
  id: string
  title: string
  icon: React.ReactNode
  badge: string
  description: string
  bestPractices: string[]
  commonMistakes: string[]
  proTip: string
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'dashboard',
    title: 'Dashboard (Panorama Financiero)',
    icon: <LayoutDashboard size={18} style={{ color: 'var(--gold-hover)' }} />,
    badge: 'Módulo Principal',
    description: 'Es el centro de comando de tu salud financiera. Consolida tus ingresos, gastos, deuda de tarjetas y el ritmo de gasto diario según los días transcurridos del mes.',
    bestPractices: [
      'Revisa tu Margen Neto Disponible a mitad de mes para no llegar ajustado al cierre.',
      'Monitorea el indicador de Calendario Real para verificar si tu ritmo de gasto diario está dentro de lo proyectado.',
      'Verifica la Tasa de Ahorro: mantenerla por encima del 20% asegura un crecimiento patrimonial sano.',
    ],
    commonMistakes: [
      'No registrar los pequeños gastos diarios, lo que crea una falsa sensación de superávit.',
      'Confundir el saldo disponible en cuenta con dinero libre para gastar sin considerar gastos fijos pendientes.',
    ],
    proTip: 'Si tu balance es positivo pero tu saldo bancario es bajo, revisa si tienes compras en cuotas con tarjeta o retiros de efectivo sin categorizar.',
  },
  {
    id: 'incomes-expenses',
    title: 'Ingresos y Control de Gastos',
    icon: <TrendingDown size={18} style={{ color: 'var(--rose-danger)' }} />,
    badge: 'Registro Diario',
    description: 'Permite registrar y categorizar cada movimiento con su fecha exacta. El sistema sincroniza automáticamente cada registro con su mes correspondiente (AAAA-MM).',
    bestPractices: [
      'Diferencia claramente entre Gastos Fijos (alquiler, servicios, préstamos) y Variables (salidas, compras ocasionales).',
      'Ingresa la fecha real del movimiento: el sistema lo ubicará automáticamente en el período correspondiente.',
      'Usa descripciones claras (ej: "Súper Quincena", "Gasolina", "Mantenimiento AC") para facilitar la búsqueda.',
    ],
    commonMistakes: [
      'Marcar compras de ocio como gastos fijos, lo que distorsiona tu capacidad de ajuste presupuestario.',
      'Ingresar montos negativos o con símbolos: ingresa solo el valor numérico positivo.',
    ],
    proTip: 'Al recortar gastos, enfócate primero en los variables no esenciales; los fijos requieren renegociación contractual.',
  },
  {
    id: 'credit-cards',
    title: 'Tarjetas de Crédito',
    icon: <CreditCard size={18} style={{ color: '#60A5FA' }} />,
    badge: 'Gestión Crediticia',
    description: 'Control de tarjetas, cupos asignados, fechas de corte y límites de pago. Evalúa la tasa de utilización y alerta antes de los vencimientos.',
    bestPractices: [
      'Mantén el uso de tus tarjetas por debajo del 30% de tu límite de crédito para un score impecable.',
      'Paga siempre el Total a la Fecha de Corte antes del día de vencimiento para generar 0 intereses.',
      'Aprovecha el período de gracia comprando los primeros días después de tu fecha de corte.',
    ],
    commonMistakes: [
      'Pagar solo el "Pago Mínimo": esto activa altos intereses de financiamiento compuesto.',
      'Usar la tarjeta como una extensión de tu sueldo en lugar de un medio de pago programado.',
    ],
    proTip: 'Revisa la campana de notificaciones en la barra superior para ver alertas preventivas a menos de 3 días de tu fecha de corte o pago.',
  },
  {
    id: 'cash-wallet',
    title: 'Efectivo & Billetera',
    icon: <Wallet size={18} style={{ color: 'var(--emerald-success)' }} />,
    badge: 'Dinero en Mano',
    description: 'Lleva el control de los retiros de cajero automático y el dinero físico que manejas en el día a día sin duplicar tus egresos bancarios.',
    bestPractices: [
      'Registra cada retiro en el momento en que sacas dinero del cajero.',
      'Asigna un motivo o categoría a cada retiro para evitar que quede como gasto fantasma.',
      'Verifica periódicamente que tu saldo en mano coincida con el disponible calculado.',
    ],
    commonMistakes: [
      'Registrar el retiro en efectivo y luego volver a registrar el gasto individual como gasto bancario (duplicación).',
      'Dejar retiros como "Sin Asignar" de forma indefinida.',
    ],
    proTip: 'Si usas efectivo para transporte o compras menores, agrúpalos bajo la categoría correspondiente (Transporte, Alimentación).',
  },
  {
    id: 'budgets-goals',
    title: 'Presupuestos & Metas de Ahorro',
    icon: <Target size={18} style={{ color: 'var(--gold-hover)' }} />,
    badge: 'Planificación',
    description: 'Define techos máximos de gasto por categoría basados en el modelo 50/30/20 y gestiona tus metas de ahorro con depósitos progresivos.',
    bestPractices: [
      'Usa el botón "Cálculo automático de límites" para obtener sugerencias adaptadas a tus ingresos y gastos reales.',
      'Prioriza siempre tu Fondo de Emergencia (3 a 6 meses de gastos fijos) antes de metas de consumo.',
      'Revisa las alertas de "Al Límite" (90%+) antes de comprometer nuevos gastos.',
    ],
    commonMistakes: [
      'Fijar presupuestos excesivamente rígidos que no se ajusten a tus compromisos reales.',
      'Retirar dinero de las metas de ahorro para gastos cotidianos no urgentes.',
    ],
    proTip: 'Cuando recibas un ingreso extra o aumentes tu sueldo, pulsa "Actualizar Límites" para recalcular tus topes automáticamente.',
  },
  {
    id: 'ai-advisor',
    title: 'Asistente Financiero IA',
    icon: <Sparkles size={18} style={{ color: '#A78BFA' }} />,
    badge: 'Inteligencia Financiera',
    description: 'Motor inteligente de diagnóstico financiero. Responde consultas prácticas, evalúa tu capacidad de gasto y te ofrece estrategias en Finanzas Personales o Visión Emprendedor.',
    bestPractices: [
      'Alterna entre el modo "Finanzas Personales" y "Visión Emprendedor" según tu necesidad del momento.',
      'Pregunta directamente: "¿Cuánto puedo gastar?", "¿Cuánto debería ahorrar?" o "¿Cómo pagar mis deudas?".',
      'Aplica los consejos diarios variables presentados en la parte superior.',
    ],
    commonMistakes: [
      'Consultar al asistente antes de haber registrado al menos tus ingresos y gastos principales del mes.',
    ],
    proTip: 'Usa los chips de preguntas rápidas sugeridas para obtener análisis comparativos y proyecciones inmediatas.',
  },
  {
    id: 'tools',
    title: 'Herramientas (Calculadora FIRE & Simulador What-If)',
    icon: <Sliders size={18} style={{ color: 'var(--amber-warning)' }} />,
    badge: 'Simuladores Estratégicos',
    description: 'Proyecta tu número de independencia financiera (FIRE) y simula el impacto en tu ahorro a 6, 12 y 24 meses variando ingresos o recortando gastos.',
    bestPractices: [
      'Simula un aumento del 10% de ingresos para evaluar cuánto aceleraría tus metas de ahorro.',
      'Usa el recorte del 15% de gastos variables para identificar el colchón mensual que puedes liberar.',
      'Revisa tu edad estimada de retiro independiente en la Calculadora FIRE con rendimientos reales (7% - 8%).',
    ],
    commonMistakes: [
      'Asumir tasas de retorno irreales en inversiones (más del 12% anual sostenido).',
    ],
    proTip: 'Accede a ambas herramientas desde la sección HERRAMIENTAS en la barra lateral (Sidebar) en cualquier momento.',
  },
]

export function ModuleUsageGuideModal({ isOpen, onClose, initialModule = 'dashboard' }: ModuleUsageGuideModalProps) {
  const [selectedId, setSelectedId] = useState(initialModule)

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const activeSection = GUIDE_SECTIONS.find(s => s.id === selectedId) || GUIDE_SECTIONS[0]

  return (
    <div className="guide-modal-overlay" onClick={onClose}>
      <div
        className="guide-modal-card"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="guide-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="guide-header-icon-wrap">
              <BookOpen size={18} />
            </div>
            <div>
              <div className="guide-header-title">
                Normativas y Guía de Uso del Sistema AUREUS
              </div>
              <div className="guide-header-subtitle">
                Aprende cómo funciona cada módulo y sácale el máximo provecho a tus finanzas
              </div>
            </div>
          </div>

          <button
            type="button"
            className="guide-close-btn"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: Sidebar Selector + Content Pane */}
        <div className="guide-modal-body">
          {/* Module Nav Tabs (Left side) */}
          <div className="guide-modal-sidebar">
            <div className="guide-sidebar-label">
              Módulos del Sistema
            </div>
            {GUIDE_SECTIONS.map(sec => {
              const isSelected = sec.id === activeSection.id
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setSelectedId(sec.id)}
                  className={`guide-sidebar-btn ${isSelected ? 'active' : ''}`}
                >
                  <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{sec.icon}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sec.title.split(' (')[0]}</span>
                </button>
              )
            })}
          </div>

          {/* Module Detailed Content (Right side) */}
          <div className="guide-modal-content">
            {/* Header section badge & title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span className="guide-content-badge">
                {activeSection.badge}
              </span>
            </div>

            <h3 className="guide-content-title" style={{ margin: '0 0 10px 0' }}>
              {activeSection.title}
            </h3>

            <p className="guide-content-desc" style={{ margin: '0 0 18px 0' }}>
              {activeSection.description}
            </p>

            {/* Best practices */}
            <div className="guide-practices-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <CheckCircle2 size={16} style={{ color: 'var(--emerald-success)' }} />
                <span className="guide-practices-title">
                  Buenas Prácticas Recomendadas
                </span>
              </div>
              <ul className="guide-practices-list">
                {activeSection.bestPractices.map((bp, idx) => (
                  <li key={idx} style={{ marginBottom: 4 }}>{bp}</li>
                ))}
              </ul>
            </div>

            {/* Common mistakes */}
            <div className="guide-mistakes-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <AlertTriangle size={16} style={{ color: 'var(--rose-danger)' }} />
                <span className="guide-mistakes-title">
                  Errores Comunes a Evitar
                </span>
              </div>
              <ul className="guide-mistakes-list">
                {activeSection.commonMistakes.map((cm, idx) => (
                  <li key={idx} style={{ marginBottom: 4 }}>{cm}</li>
                ))}
              </ul>
            </div>

            {/* Pro Tip */}
            <div className="guide-tip-box">
              <Lightbulb size={18} style={{ color: 'var(--amber-warning)', flexShrink: 0 }} />
              <div className="guide-tip-text">
                <strong>Tip del Asesor AUREUS:</strong> {activeSection.proTip}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="guide-modal-footer">
          <button
            type="button"
            className="guide-btn-confirm"
            onClick={onClose}
          >
            Entendido, ¡gracias!
          </button>
        </div>
      </div>
    </div>
  )
}
