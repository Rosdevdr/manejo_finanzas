import { useState, useRef, useEffect } from 'react'
import { Bell, CreditCard as CardIcon, AlertTriangle, Calendar } from 'lucide-react'
import type { CreditCard, CreditCardTransaction } from '../../types/finance'
import { evaluateCardHealth } from '../../utils/creditAdvisor'
import { formatCurrency } from '../../utils/formatters'

interface CardAlertsPopoverProps {
  creditCards: CreditCard[]
  creditTransactions: CreditCardTransaction[]
}

export function CardAlertsPopover({ creditCards, creditTransactions }: CardAlertsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const popoverRef          = useRef<HTMLDivElement>(null)

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Evaluar alertas de tarjetas
  const alerts = creditCards.flatMap(card => {
    const health = evaluateCardHealth(card, creditTransactions)
    const cardAlerts: Array<{ id: string; cardName: string; type: string; message: string; severity: 'warning' | 'danger' }> = []

    if (health.isCutoffSoon) {
      cardAlerts.push({
        id: `cutoff-${card.id}`,
        cardName: card.name,
        type: 'cutoff',
        message: `Próximo corte en ${health.daysToCutoff} días (${health.goldenWindowText})`,
        severity: 'warning' as const,
      })
    }

    if (health.isPaymentSoon && health.totalDebt > 0) {
      cardAlerts.push({
        id: `payment-${card.id}`,
        cardName: card.name,
        type: 'payment',
        message: `Fecha límite de pago en ${health.daysToPayment} días. Pago sugerido: ${formatCurrency(health.totalDebt)}`,
        severity: 'danger' as const,
      })
    }

    if (health.utilizationRate > 80) {
      cardAlerts.push({
        id: `utilization-${card.id}`,
        cardName: card.name,
        type: 'utilization',
        message: `Uso elevado del ${health.utilizationRate}% de la línea de crédito.`,
        severity: 'warning' as const,
      })
    }

    return cardAlerts
  })

  const alertCount = alerts.length

  return (
    <div ref={popoverRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        className="header-export-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Alertas de Tarjetas de Crédito"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          justifyContent: 'center',
          fontSize: 11.5,
          fontWeight: 700,
          fontFamily: 'Space Grotesk',
          color: alertCount > 0 ? '#EF4444' : '#9CA3AF',
          background: alertCount > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${alertCount > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
          padding: '7px 9px',
          borderRadius: 10,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          position: 'relative',
        }}
      >
        <Bell size={15} />
        {alertCount > 0 && (
          <span style={{
            position: 'absolute',
            top: -4,
            right: -4,
            background: '#EF4444',
            color: '#FFF',
            fontSize: 9,
            fontWeight: 800,
            borderRadius: 10,
            padding: '1px 5px',
            lineHeight: 1,
            boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
          }}>
            {alertCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: 320,
          background: '#12121A',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 14,
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
          padding: 14,
          zIndex: 100,
          animation: 'fadeIn 0.15s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#F3CA65', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Bell size={14} /> Centro de Alertas de Tarjeta
            </span>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>{alertCount} pendientes</span>
          </div>

          {alerts.length === 0 ? (
            <div style={{ padding: '16px 8px', textAlign: 'center', fontSize: 12, color: '#9CA3AF' }}>
              ✅ No tienes cortes o vencimientos próximos de tarjeta.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
              {alerts.map(a => (
                <div key={a.id} style={{
                  background: a.severity === 'danger' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                  border: `1px solid ${a.severity === 'danger' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                  borderRadius: 10,
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                }}>
                  {a.severity === 'danger' ? (
                    <AlertTriangle size={14} style={{ color: '#EF4444', marginTop: 2, flexShrink: 0 }} />
                  ) : (
                    <Calendar size={14} style={{ color: '#F59E0B', marginTop: 2, flexShrink: 0 }} />
                  )}
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#E5E7EB', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CardIcon size={11} style={{ color: '#9CA3AF' }} /> {a.cardName}
                    </div>
                    <div style={{ fontSize: 11, color: '#D1D5DB', marginTop: 2, lineHeight: 1.3 }}>
                      {a.message}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
