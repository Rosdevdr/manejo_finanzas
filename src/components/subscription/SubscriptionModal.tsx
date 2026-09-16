/**
 * SubscriptionModal — UI de planes de suscripción de AUREUS
 * Permite al usuario ver su plan actual, comparar planes y suscribirse vía Stripe.
 */

import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Sparkles,
  ShieldCheck,
  Zap,
  Check,
  Crown,
  Star,
  AlertCircle,
  ExternalLink,
  Loader2,
  Lock,
} from 'lucide-react'
import type { PlanType } from '../../hooks/usePlan'
import './SubscriptionModal.css'

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  currentPlan: PlanType
  userId: string | null
  userEmail?: string | null
  isDemoMode?: boolean
  onRefreshPlan: () => Promise<void>
}

const PLANS = [
  {
    key: 'free' as PlanType,
    name: 'Free',
    price: '$0',
    period: 'siempre gratis',
    icon: Star,
    iconClass: 'plan-icon-free',
    description: 'Para explorar AUREUS y conocer tus finanzas.',
    color: 'plan-card-free',
    features: [
      { label: 'Dashboard General', included: true },
      { label: 'Ingresos y Gastos', included: true },
      { label: 'Historial de 3 meses', included: true },
      { label: '2 Tarjetas de crédito', included: true },
      { label: '2 Metas de ahorro', included: true },
      { label: '10 Consultas/mes al Asesor IA', included: true },
      { label: 'Exportación CSV/PDF', included: false },
      { label: 'Calculadora FIRE', included: false },
      { label: 'Simulador de Escenarios', included: false },
      { label: 'Historial ilimitado', included: false },
      { label: 'Tarjetas y Metas ilimitadas', included: false },
    ],
  },
  {
    key: 'personal' as PlanType,
    name: 'Personal',
    price: '$4.99',
    period: 'por mes',
    icon: Sparkles,
    iconClass: 'plan-icon-personal',
    description: 'Control financiero completo para uso personal.',
    color: 'plan-card-personal',
    badge: 'Popular',
    features: [
      { label: 'Todo lo del plan Free', included: true },
      { label: 'Historial ilimitado', included: true },
      { label: 'Tarjetas y Metas ilimitadas', included: true },
      { label: '100 consultas/mes al Asesor IA', included: true },
      { label: 'Exportación CSV/PDF', included: true },
      { label: 'Calculadora FIRE', included: true },
      { label: 'Simulador de Escenarios', included: true },
      { label: 'Informes PDF inteligentes', included: false },
      { label: 'Soporte prioritario', included: false },
    ],
  },
  {
    key: 'pro' as PlanType,
    name: 'Pro',
    price: '$9.99',
    period: 'por mes',
    icon: Crown,
    iconClass: 'plan-icon-pro',
    description: 'La experiencia AUREUS sin límites.',
    color: 'plan-card-pro',
    features: [
      { label: 'Todo lo del plan Personal', included: true },
      { label: 'Consultas al Asesor IA ilimitadas', included: true },
      { label: 'Informes PDF inteligentes avanzados', included: true },
      { label: 'Soporte prioritario por chat', included: true },
      { label: 'Acceso anticipado a nuevas funciones', included: true },
    ],
  },
]

export function SubscriptionModal({
  isOpen,
  onClose,
  currentPlan,
  userId,
  userEmail,
  isDemoMode,
  onRefreshPlan: _onRefreshPlan,
}: SubscriptionModalProps) {
  const [loadingPlan, setLoadingPlan] = useState<PlanType | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubscribe = async (plan: PlanType) => {
    if (plan === 'free') return

    if (isDemoMode || !userId) {
      setCheckoutError('Crea una cuenta real para suscribirte. El Modo Demo no admite pagos.')
      return
    }

    setCheckoutError(null)
    setLoadingPlan(plan)

    try {
      const response = await fetch('/api/stripe-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, userId, userEmail }),
      })

      const data = await response.json()

      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Error al iniciar el proceso de pago')
      }

      // Redirigir a Stripe Checkout
      window.location.href = data.url
    } catch (err: any) {
      setCheckoutError(err.message || 'Error de conexión con el servicio de pago')
      setLoadingPlan(null)
    }
  }

  const modalContent = (
    <div className="sub-modal-overlay" onClick={onClose}>
      <div className="sub-modal-card" onClick={e => e.stopPropagation()}>

        {/* ── HEADER ── */}
        <div className="sub-modal-header">
          <div className="sub-header-left">
            <div className="sub-icon-ring">
              <Zap size={20} className="text-gold" />
            </div>
            <div>
              <div className="sub-tag-pill">PLANES DE SUSCRIPCIÓN</div>
              <h2 className="sub-title">Elige tu plan AUREUS</h2>
              <p className="sub-subtitle">Sin comisiones ocultas · Cancela cuando quieras · Ley 358-05</p>
            </div>
          </div>
          <button type="button" className="sub-close-btn" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        {/* ── PLAN ACTUAL BADGE ── */}
        <div className="sub-current-plan-bar">
          <ShieldCheck size={14} className="text-emerald" />
          <span>
            Tu plan actual: <strong className={`plan-badge-${currentPlan}`}>
              {currentPlan === 'free' ? 'Free' : currentPlan === 'personal' ? 'Personal' : 'Pro'}
            </strong>
            {isDemoMode && <span className="demo-badge"> · Modo Demo (Pro completo)</span>}
          </span>
        </div>

        {/* ── ERROR ── */}
        {checkoutError && (
          <div className="sub-error-alert">
            <AlertCircle size={15} />
            <span>{checkoutError}</span>
          </div>
        )}

        {/* ── PLANES GRID ── */}
        <div className="sub-plans-grid">
          {PLANS.map(plan => {
            const Icon = plan.icon
            const isCurrentPlan = currentPlan === plan.key
            const isUpgrade = plan.key === 'pro' && (currentPlan === 'free' || currentPlan === 'personal')
              || plan.key === 'personal' && currentPlan === 'free'

            return (
              <div
                key={plan.key}
                className={`sub-plan-card ${plan.color} ${isCurrentPlan ? 'current-plan' : ''}`}
              >
                {plan.badge && (
                  <div className="sub-plan-badge">{plan.badge}</div>
                )}
                <div className="sub-plan-top-row">
                  <div className={`sub-plan-icon ${plan.iconClass}`}>
                    <Icon size={22} />
                  </div>
                  {isCurrentPlan && (
                    <div className="sub-plan-active-badge">
                      <Check size={12} /> Tu plan actual
                    </div>
                  )}
                </div>

                <h3 className="sub-plan-name">{plan.name}</h3>
                <div className="sub-plan-price">
                  <span className="sub-price-amount">{plan.price}</span>
                  <span className="sub-price-period">/{plan.period}</span>
                </div>
                <p className="sub-plan-desc">{plan.description}</p>

                <ul className="sub-features-list">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className={feat.included ? 'feat-yes' : 'feat-no'}>
                      {feat.included
                        ? <Check size={13} className="feat-check" />
                        : <Lock size={12} className="feat-lock" />
                      }
                      <span>{feat.label}</span>
                    </li>
                  ))}
                </ul>

                <div className="sub-plan-action">
                  {plan.key === 'free' ? (
                    <button type="button" className="sub-btn-free" disabled>
                      <Check size={14} /> Siempre disponible
                    </button>
                  ) : isCurrentPlan ? (
                    <button type="button" className="sub-btn-current" disabled>
                      <ShieldCheck size={14} /> Plan activo
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`sub-btn-subscribe ${isUpgrade ? 'sub-btn-upgrade' : ''}`}
                      onClick={() => handleSubscribe(plan.key)}
                      disabled={!!loadingPlan}
                    >
                      {loadingPlan === plan.key ? (
                        <><Loader2 size={14} className="spin" /> Conectando con Stripe...</>
                      ) : (
                        <><ExternalLink size={13} /> Suscribirse ahora</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── FOOTER LEGAL ── */}
        <div className="sub-modal-footer">
          <div className="sub-footer-security">
            <ShieldCheck size={13} className="text-emerald" />
            <span>Pagos seguros procesados por Stripe · TLS 1.3 · Sin almacenamiento de tarjetas</span>
          </div>
          <p className="sub-footer-legal">
            Al suscribirte aceptas los Términos y Condiciones de AUREUS y la política de facturación de Stripe.
            Puedes cancelar en cualquier momento conforme a la Ley No. 358-05 (Pro Consumidor, República Dominicana).
          </p>
        </div>

      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
