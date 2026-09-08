import { useState, useEffect, useRef } from 'react'
import { interpolateCount } from '../utils/countUp'

export function useCountUp(targetValue: number, durationMs = 500): number {
  const [displayValue, setDisplayValue] = useState(targetValue)
  const prevValueRef = useRef(targetValue)
  const animFrameRef = useRef<number | null>(null)

  useEffect(() => {
    const startValue = prevValueRef.current
    if (startValue === targetValue) {
      setDisplayValue(targetValue)
      return
    }

    const startTime = performance.now()

    const updateValue = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(1, elapsed / durationMs)
      const current = interpolateCount(startValue, targetValue, progress)

      setDisplayValue(current)

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(updateValue)
      } else {
        setDisplayValue(targetValue)
        prevValueRef.current = targetValue
      }
    }

    animFrameRef.current = requestAnimationFrame(updateValue)

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [targetValue, durationMs])

  return displayValue
}
