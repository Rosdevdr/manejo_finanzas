import { useCountUp } from '../../hooks/useCountUp'
import { formatCurrency } from '../../utils/formatters'

interface AnimatedCurrencyProps {
  value: number
  className?: string
  durationMs?: number
}

export function AnimatedCurrency({
  value,
  className = '',
  durationMs = 500,
}: AnimatedCurrencyProps) {
  const animatedValue = useCountUp(value, durationMs)
  return <span className={className}>{formatCurrency(animatedValue)}</span>
}
