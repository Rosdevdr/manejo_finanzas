/**
 * AUREUS CountUp interpolation mathematics
 */

export function easeOutCubic(t: number): number {
  const clamped = Math.max(0, Math.min(1, t))
  return 1 - Math.pow(1 - clamped, 3)
}

export function interpolateCount(start: number, end: number, progress: number): number {
  if (start === end) return end
  const eased = easeOutCubic(progress)
  const current = start + (end - start) * eased
  return Math.round(current * 100) / 100
}
