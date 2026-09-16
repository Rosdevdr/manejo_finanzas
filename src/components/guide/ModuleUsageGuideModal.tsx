import { useState, useEffect } from 'react'
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
    icon: <LayoutDashboard size={18} style={{ color: '#F3CA65' }} />,
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
    icon: <TrendingDown size={18} style={{ color: '#F87171' }} />,
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
    proTip: 'Revisa la campana de notificaciones 🔔 en la barra superior para ver alertas preventivas a menos de 3 días de tu fecha de corte o pago.',
  },
  {
    id: 'cash-wallet',
    title: 'Efectivo & Billetera',
    icon: <Wallet size={18} style={{ color: '#34D399' }} />,
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
    icon: <Target size={18} style={{ color: '#F3CA65' }} />,
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
    icon: <Sliders size={18} style={{ color: '#F59E0B' }} />,
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
    <div className="modal-overlay fade-in" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 820,
          width: '94%',
          height: 'min(620px, 90vh)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: 18,
          background: '#0E0E14',
          border: '1px solid rgba(243, 202, 101, 0.25)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)',
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '16px 22px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(201, 168, 76, 0.12) 0%, rgba(14, 14, 20, 0.95) 100%)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(243, 202, 101, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F3CA65',
            }}>
              <BookOpen size={18} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', fontFamily: 'Space Grotesk' }}>
                Normativas y Guía de Uso del Sistema AUREUS
              </div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                Aprende cómo funciona cada módulo y sácale el máximo provecho a tus finanzas
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 8,
              padding: 6,
              color: '#9CA3AF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: Sidebar Selector + Content Pane */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          {/* Module Nav Tabs (Left side) */}
          <div style={{
            width: 240,
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(10, 10, 15, 0.7)',
            padding: '12px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            overflowY: 'auto',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#717182', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '6px 10px' }}>
              Módulos del Sistema
            </div>
            {GUIDE_SECTIONS.map(sec => {
              const isSelected = sec.id === activeSection.id
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setSelectedId(sec.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 12px',
                    borderRadius: 10,
                    border: 'none',
                    background: isSelected
                      ? 'linear-gradient(90deg, rgba(243, 202, 101, 0.16) 0%, rgba(201, 168, 76, 0.06) 100%)'
                      : 'transparent',
                    color: isSelected ? '#F3CA65' : '#9CA3AF',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    fontFamily: 'Space Grotesk',
                    fontSize: 12,
                    fontWeight: isSelected ? 700 : 500,
                    transition: 'all 0.15s ease',
                    borderLeft: isSelected ? '3px solid #F3CA65' : '3px solid transparent',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{sec.icon}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sec.title.split(' (')[0]}</span>
                </button>
              )
            })}
          </div>

          {/* Module Detailed Content (Right side) */}
          <div style={{
            flex: 1,
            padding: '20px 24px',
            overflowY: 'auto',
            background: 'rgba(14, 14, 20, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}>
            {/* Header section badge & title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{
                fontSize: 10.5,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                padding: '3px 8px',
                borderRadius: 6,
                background: 'rgba(243, 202, 101, 0.15)',
                color: '#F3CA65',
                border: '1px solid rgba(243, 202, 101, 0.3)',
              }}>
                {activeSection.badge}
              </span>
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', margin: '0 0 10px 0', fontFamily: 'Space Grotesk' }}>
              {activeSection.title}
            </h3>

            <p style={{ fontSize: 13, color: '#A0A0B2', lineHeight: 1.55, margin: '0 0 18px 0' }}>
              {activeSection.description}
            </p>

            {/* Best practices */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 12,
              padding: '14px 16px',
              marginBottom: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <CheckCircle2 size={16} style={{ color: '#34D399' }} />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#34D399', fontFamily: 'Space Grotesk' }}>
                  Buenas Prácticas Recomendadas
                </span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#E5E7EB', lineHeight: 1.6 }}>
                {activeSection.bestPractices.map((bp, idx) => (
                  <li key={idx} style={{ marginBottom: 4 }}>{bp}</li>
                ))}
              </ul>
            </div>

            {/* Common mistakes */}
            <div style={{
              background: 'rgba(248, 113, 113, 0.04)',
              border: '1px solid rgba(248, 113, 113, 0.15)',
              borderRadius: 12,
              padding: '14px 16px',
              marginBottom: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <AlertTriangle size={16} style={{ color: '#F87171' }} />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#F87171', fontFamily: 'Space Grotesk' }}>
                  Errores Comunes a Evitar
                </span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#E5E7EB', lineHeight: 1.6 }}>
                {activeSection.commonMistakes.map((cm, idx) => (
                  <li key={idx} style={{ marginBottom: 4 }}>{cm}</li>
                ))}
              </ul>
            </div>

            {/* Pro Tip */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(201, 168, 76, 0.12) 0%, rgba(20, 20, 28, 0.8) 100%)',
              border: '1px solid rgba(201, 168, 76, 0.3)',
              borderRadius: 12,
              padding: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <Lightbulb size={18} style={{ color: '#F59E0B', flexShrink: 0 }} />
              <div style={{ fontSize: 11.5, color: '#F3CA65', lineHeight: 1.45 }}>
                <strong>Tip del Asesor AUREUS:</strong> {activeSection.proTip}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '14px 22px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          background: '#0B0B10',
          flexShrink: 0,
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'linear-gradient(135deg, #F3CA65 0%, #C9A84C 100%)',
              color: '#0B0B0F',
              border: 'none',
              borderRadius: 10,
              padding: '9px 24px',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'Space Grotesk',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(243, 202, 101, 0.25)',
              transition: 'all 0.15s ease',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            Entendido, ¡gracias!
          </button>
        </div>
      </div>
    </div>
  )
}
