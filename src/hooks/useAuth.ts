import { useState, useEffect } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  isDemoMode: boolean
  isSupabaseConfigured: boolean
  isPasswordRecovery: boolean
  needsMfa: boolean
  mfaFactorId: string | null
  clearPasswordRecovery: () => void
  signIn: (email: string, password: string) => Promise<{ error: Error | null; needsMfa?: boolean }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  verifyMfa: (code: string) => Promise<{ error: Error | null }>
  cancelMfa: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<{ error: Error | null }>
  updateUserPassword: (newPassword: string) => Promise<{ error: Error | null }>
  enterDemoMode: () => void
  exitDemoMode: () => void
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [needsMfa, setNeedsMfa] = useState(false)
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(() => {
    return window.location.hash.includes('type=recovery')
  })
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    if (!isSupabaseConfigured) return true
    return localStorage.getItem('aureus_demo_mode') === 'true'
  })

  const evaluateMfaLevel = async (): Promise<{ needsMfa: boolean; factorId: string | null }> => {
    if (!supabase || !isSupabaseConfigured) {
      setNeedsMfa(false)
      setMfaFactorId(null)
      return { needsMfa: false, factorId: null }
    }
    try {
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (aalData && aalData.currentLevel === 'aal1' && aalData.nextLevel === 'aal2') {
        const { data: factorData } = await supabase.auth.mfa.listFactors()
        const verifiedTotp = factorData?.totp?.find(f => f.status === 'verified')
        if (verifiedTotp) {
          setNeedsMfa(true)
          setMfaFactorId(verifiedTotp.id)
          return { needsMfa: true, factorId: verifiedTotp.id }
        }
      }
      setNeedsMfa(false)
      setMfaFactorId(null)
      return { needsMfa: false, factorId: null }
    } catch {
      setNeedsMfa(false)
      setMfaFactorId(null)
      return { needsMfa: false, factorId: null }
    }
  }

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) {
      return
    }

    // Obtener sesión actual
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await evaluateMfaLevel()
      }
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true)
      }
      if (session?.user && event !== 'PASSWORD_RECOVERY') {
        const mfaRes = await evaluateMfaLevel()
        if (!mfaRes.needsMfa) {
          setIsDemoMode(false)
          localStorage.removeItem('aureus_demo_mode')
        }
      } else if (!session) {
        setNeedsMfa(false)
        setMfaFactorId(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!supabase || !isSupabaseConfigured) {
      return { error: new Error('Supabase no está configurado aún. Usa el Modo Demo o agrega tus variables de entorno.') }
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      return { error }
    }
    if (data.session) {
      const mfaRes = await evaluateMfaLevel()
      if (mfaRes.needsMfa) {
        return { error: null, needsMfa: true }
      }
      setIsDemoMode(false)
      localStorage.removeItem('aureus_demo_mode')
    }
    return { error: null }
  }

  const verifyMfa = async (code: string) => {
    if (!supabase || !isSupabaseConfigured) {
      return { error: new Error('Supabase no está configurado.') }
    }
    let targetFactorId = mfaFactorId
    if (!targetFactorId) {
      const { data: factorData, error: factorErr } = await supabase.auth.mfa.listFactors()
      if (factorErr) return { error: factorErr }
      const verifiedTotp = factorData?.totp?.find(f => f.status === 'verified')
      if (!verifiedTotp) {
        return { error: new Error('No se encontró un factor MFA configurado para esta cuenta.') }
      }
      targetFactorId = verifiedTotp.id
      setMfaFactorId(targetFactorId)
    }

    const cleanCode = code.replace(/\D/g, '')
    if (cleanCode.length !== 6) {
      return { error: new Error('El código debe tener exactamente 6 dígitos.') }
    }

    try {
      const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({
        factorId: targetFactorId,
      })
      if (challengeErr) {
        return { error: challengeErr }
      }

      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: targetFactorId,
        challengeId: challengeData.id,
        code: cleanCode,
      })
      if (verifyErr) {
        return { error: new Error('Código 2FA incorrecto o expirado. Intenta de nuevo.') }
      }

      setNeedsMfa(false)
      setIsDemoMode(false)
      localStorage.removeItem('aureus_demo_mode')
      return { error: null }
    } catch {
      return { error: new Error('Error de comunicación con el servicio de autenticación.') }
    }
  }

  const cancelMfa = async () => {
    if (supabase && isSupabaseConfigured) {
      await supabase.auth.signOut()
    }
    setUser(null)
    setSession(null)
    setNeedsMfa(false)
    setMfaFactorId(null)
  }

  const signUp = async (email: string, password: string) => {
    if (!supabase || !isSupabaseConfigured) {
      return { error: new Error('Supabase no está configurado aún. Usa el Modo Demo o agrega tus variables de entorno.') }
    }
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (!error && data.session) {
      setIsDemoMode(false)
      localStorage.removeItem('aureus_demo_mode')
    }
    return { error }
  }

  const sendPasswordReset = async (email: string) => {
    if (!supabase || !isSupabaseConfigured) {
      return { error: new Error('Supabase no está configurado aún.') }
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    })
    return { error }
  }

  const updateUserPassword = async (newPassword: string) => {
    if (!supabase || !isSupabaseConfigured) {
      return { error: new Error('Supabase no está configurado aún.') }
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (!error) {
      setIsPasswordRecovery(false)
      window.history.replaceState(null, '', window.location.pathname)
    }
    return { error }
  }

  const clearPasswordRecovery = () => {
    setIsPasswordRecovery(false)
    window.history.replaceState(null, '', window.location.pathname)
  }

  const signOut = async () => {
    if (supabase && isSupabaseConfigured) {
      await supabase.auth.signOut()
    }
    setUser(null)
    setSession(null)
    setNeedsMfa(false)
    setMfaFactorId(null)
    setIsDemoMode(false)
    setIsPasswordRecovery(false)
    localStorage.removeItem('aureus_demo_mode')
  }

  const enterDemoMode = () => {
    setIsDemoMode(true)
    localStorage.setItem('aureus_demo_mode', 'true')
  }

  const exitDemoMode = () => {
    setIsDemoMode(false)
    localStorage.removeItem('aureus_demo_mode')
  }

  return {
    user,
    session,
    loading,
    isDemoMode,
    isSupabaseConfigured,
    isPasswordRecovery,
    needsMfa,
    mfaFactorId,
    clearPasswordRecovery,
    signIn,
    signUp,
    signOut,
    verifyMfa,
    cancelMfa,
    sendPasswordReset,
    updateUserPassword,
    enterDemoMode,
    exitDemoMode,
  }
}
