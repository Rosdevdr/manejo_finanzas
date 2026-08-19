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
  clearPasswordRecovery: () => void
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<{ error: Error | null }>
  updateUserPassword: (newPassword: string) => Promise<{ error: Error | null }>
  enterDemoMode: () => void
  exitDemoMode: () => void
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(() => {
    return window.location.hash.includes('type=recovery')
  })
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    if (!isSupabaseConfigured) return true
    return localStorage.getItem('aureus_demo_mode') === 'true'
  })

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) {
      return
    }

    // Obtener sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true)
      }
      if (session?.user && event !== 'PASSWORD_RECOVERY') {
        setIsDemoMode(false)
        localStorage.removeItem('aureus_demo_mode')
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
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) {
      setIsDemoMode(false)
      localStorage.removeItem('aureus_demo_mode')
    }
    return { error }
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
    clearPasswordRecovery,
    signIn,
    signUp,
    signOut,
    sendPasswordReset,
    updateUserPassword,
    enterDemoMode,
    exitDemoMode,
  }
}
