/**
 * usePlan — Lee el plan de suscripción del usuario desde Supabase (tabla profiles)
 * Planes: 'free' | 'personal' | 'pro'
 * Si el plan expiró, se trata como 'free' automáticamente.
 */

import { useState, useEffect, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export type PlanType = 'free' | 'personal' | 'pro'

export interface PlanState {
  plan: PlanType
  planExpiresAt: Date | null
  isLoading: boolean
  isPro: boolean
  isPersonal: boolean   // true si es 'personal' o 'pro'
  isFree: boolean
  refreshPlan: () => Promise<void>
}

export function usePlan(user: User | null, isDemoMode?: boolean): PlanState {
  const [plan, setPlan] = useState<PlanType>('free')
  const [planExpiresAt, setPlanExpiresAt] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const refreshPlan = useCallback(async () => {
    // En modo demo siempre se trata como 'pro' para que el usuario vea todo
    if (isDemoMode) {
      setPlan('pro')
      setPlanExpiresAt(null)
      return
    }

    if (!user || !supabase || !isSupabaseConfigured) {
      setPlan('free')
      setPlanExpiresAt(null)
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('plan, plan_expires_at')
        .eq('id', user.id)
        .single()

      if (error || !data) {
        setPlan('free')
        setPlanExpiresAt(null)
        return
      }

      const expiry = data.plan_expires_at ? new Date(data.plan_expires_at) : null

      // Si el plan tiene fecha de vencimiento y ya venció → free
      if (expiry && expiry < new Date()) {
        setPlan('free')
        setPlanExpiresAt(expiry)
      } else {
        setPlan((data.plan as PlanType) || 'free')
        setPlanExpiresAt(expiry)
      }
    } catch {
      setPlan('free')
      setPlanExpiresAt(null)
    } finally {
      setIsLoading(false)
    }
  }, [user, isDemoMode])

  useEffect(() => {
    refreshPlan()
  }, [refreshPlan])

  return {
    plan,
    planExpiresAt,
    isLoading,
    isPro: isDemoMode ? true : plan === 'pro',
    isPersonal: isDemoMode ? true : plan === 'personal' || plan === 'pro',
    isFree: !isDemoMode && plan === 'free',
    refreshPlan,
  }
}
