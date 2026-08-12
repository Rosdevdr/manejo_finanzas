import { useState, useEffect } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  isDemoMode: boolean
  isSupabaseConfigured: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  enterDemoMode: () => void
  exitDemoMode: () => void
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
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
    const { error } = await supabase.auth.signUp({ email, password })
    return { error }
  }

  const signOut = async () => {
    if (supabase && isSupabaseConfigured) {
      await supabase.auth.signOut()
    }
    setUser(null)
    setSession(null)
    setIsDemoMode(false)
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
    signIn,
    signUp,
    signOut,
    enterDemoMode,
    exitDemoMode,
  }
}
