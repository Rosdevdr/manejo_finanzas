import { useState, useEffect, type FormEvent } from 'react'
import {
  Mail,
  Lock,
  ArrowRight,
  BrainCircuit,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  PlayCircle,
  Sparkles,
  Zap,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react'
import { AureusLogo } from '../ui/AureusLogo'
import { GithubIcon } from '../ui/GithubIcon'
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '../../utils/rateLimiter'
import { sanitizeString } from '../../utils/security'
import { supabase } from '../../lib/supabase'
import './LoginView.css'

interface LoginViewProps {
  onSignIn: (email: string, password: string) => Promise<{ error: Error | null; needsMfa?: boolean }>
  onSignUp: (email: string, password: string) => Promise<{ error: Error | null }>
  onSendPasswordReset?: (email: string) => Promise<{ error: Error | null }>
  onUpdateUserPassword?: (newPassword: string) => Promise<{ error: Error | null }>
  onEnterDemoMode: () => void
  isSupabaseConfigured: boolean
  isPasswordRecovery?: boolean
  onClearPasswordRecovery?: () => void
  needsMfa?: boolean
  mfaFactorId?: string | null
  onVerifyMfa?: (code: string) => Promise<{ error: Error | null }>
  onCancelMfa?: () => Promise<void>
}

type AuthTab = 'login' | 'register' | 'forgot' | 'update-password' | 'mfa'

export function LoginView({
  onSignIn,
  onSignUp,
  onSendPasswordReset,
  onUpdateUserPassword,
  onEnterDemoMode,
  isSupabaseConfigured,
  isPasswordRecovery,
  onClearPasswordRecovery,
  needsMfa,
  mfaFactorId: propMfaFactorId,
  onVerifyMfa,
  onCancelMfa,
}: LoginViewProps) {
  const [tab, setTab] = useState<AuthTab>(() => (isPasswordRecovery ? 'update-password' : needsMfa ? 'mfa' : 'login'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(propMfaFactorId || null)
  const [hasRecoveryMfa, setHasRecoveryMfa] = useState(false)
  const [recoveryFactorId, setRecoveryFactorId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [lockSeconds, setLockSeconds] = useState(() => checkRateLimit('login_auth').remainingSeconds)

  useEffect(() => {
    if (propMfaFactorId) {
      setMfaFactorId(propMfaFactorId)
    }
  }, [propMfaFactorId])

  useEffect(() => {
    if (needsMfa) {
      setTab('mfa')
      setError(null)
    } else if (isPasswordRecovery) {
      setTab('update-password')
    }
  }, [needsMfa, isPasswordRecovery])

  // Detectar si la cuenta en recuperación tiene factor MFA activo
  useEffect(() => {
    if (tab === 'update-password' && supabase) {
      supabase.auth.mfa.listFactors().then(({ data, error: factorsErr }) => {
        if (!factorsErr && data) {
          const verified = data.totp?.find(f => f.status === 'verified')
          if (verified) {
            setHasRecoveryMfa(true)
            setRecoveryFactorId(verified.id)
          }
        }
      }).catch(() => {})
    }
  }, [tab])


  useEffect(() => {
    if (lockSeconds <= 0) return

    const timer = setInterval(() => {
      const { isLocked, remainingSeconds } = checkRateLimit('login_auth')
      if (isLocked && remainingSeconds > 0) {
        setLockSeconds(remainingSeconds)
      } else {
        setLockSeconds(0)
        clearInterval(timer)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [lockSeconds])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Rate limiting check
    const rateStatus = checkRateLimit('login_auth')
    if (rateStatus.isLocked) {
      setLockSeconds(rateStatus.remainingSeconds)
      setError(`Protección activa: Demasiados intentos fallidos. Espera ${rateStatus.remainingSeconds} segundos.`)
      return
    }

    const cleanEmail = sanitizeString(email)

    // 1. Password Reset Request Flow
    if (tab === 'forgot') {
      if (!cleanEmail) {
        setError('Por favor ingresa tu correo electrónico.')
        return
      }
      setLoading(true)
      try {
        if (onSendPasswordReset) {
          const { error: err } = await onSendPasswordReset(cleanEmail)
          if (err) {
            setError(err.message)
          } else {
            setSuccess('¡Enlace de recuperación enviado! Revisa tu bandeja de entrada o spam.')
          }
        }
      } catch {
        setError('Error al enviar el correo de recuperación.')
      } finally {
        setLoading(false)
      }
      return
    }

    // 2. Password Update Flow (after recovery link)
    if (tab === 'update-password') {
      if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.')
        return
      }
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden.')
        return
      }
      if (hasRecoveryMfa) {
        const cleanMfa = mfaCode.replace(/\D/g, '')
        if (cleanMfa.length !== 6) {
          setError('Ingresa el código de 6 dígitos de tu aplicación autenticadora (Google o iOS).')
          return
        }
      }
      setLoading(true)
      try {
        if (hasRecoveryMfa && supabase) {
          const factorId = recoveryFactorId || mfaFactorId || propMfaFactorId
          if (factorId) {
            const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({
              factorId,
            })
            if (challengeErr) {
              setError(challengeErr.message)
              setLoading(false)
              return
            }
            const { error: verifyErr } = await supabase.auth.mfa.verify({
              factorId,
              challengeId: challengeData.id,
              code: mfaCode.trim(),
            })
            if (verifyErr) {
              setError('Código 2FA incorrecto o expirado. No se autorizó el cambio de contraseña.')
              setLoading(false)
              return
            }
          }
        }

        if (onUpdateUserPassword) {
          const { error: err } = await onUpdateUserPassword(password)
          if (err) {
            setError(err.message)
          } else {
            setSuccess('¡Contraseña actualizada con éxito! Ya puedes iniciar sesión.')
            if (onClearPasswordRecovery) onClearPasswordRecovery()
            setTab('login')
          }
        }
      } catch {
        setError('Error al actualizar la contraseña.')
      } finally {
        setLoading(false)
      }
      return
    }

    // 3. MFA 2FA Challenge Verification Flow
    if (tab === 'mfa') {
      const cleanMfa = mfaCode.replace(/\D/g, '')
      if (cleanMfa.length !== 6) {
        setError('Ingresa el código de 6 dígitos de tu aplicación autenticadora (Google / iOS).')
        return
      }
      setLoading(true)
      try {
        if (onVerifyMfa) {
          const { error: verifyErr } = await onVerifyMfa(cleanMfa)
          if (verifyErr) {
            setError(verifyErr.message)
            setLoading(false)
            return
          }
          resetRateLimit('login_auth')
        } else if (supabase) {
          const activeFactor = mfaFactorId || propMfaFactorId
          let factorIdToUse = activeFactor
          if (!factorIdToUse) {
            const { data: factorData } = await supabase.auth.mfa.listFactors()
            const verifiedTotp = factorData?.totp?.find(f => f.status === 'verified')
            if (!verifiedTotp) {
              setError('No se encontró un factor 2FA configurado.')
              setLoading(false)
              return
            }
            factorIdToUse = verifiedTotp.id
          }
          const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({
            factorId: factorIdToUse,
          })
          if (challengeErr) {
            setError(challengeErr.message)
            setLoading(false)
            return
          }
          const { error: verifyErr } = await supabase.auth.mfa.verify({
            factorId: factorIdToUse,
            challengeId: challengeData.id,
            code: cleanMfa,
          })
          if (verifyErr) {
            setError('Código 2FA incorrecto o expirado. Intenta de nuevo.')
            setLoading(false)
            return
          }
          resetRateLimit('login_auth')
        }
      } catch {
        setError('Error al verificar código 2FA.')
      } finally {
        setLoading(false)
      }
      return
    }

    // 4. Standard Register Validation
    if (tab === 'register') {
      if (!cleanEmail || !password) {
        setError('Por favor completa todos los campos.')
        return
      }
      if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.')
        return
      }
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden.')
        return
      }
    }

    if (!cleanEmail || !password) {
      setError('Por favor completa todos los campos.')
      return
    }

    setLoading(true)

    try {
      if (tab === 'login') {
        const { error: err } = await onSignIn(cleanEmail, password)
        if (err) {
          const limit = recordFailedAttempt('login_auth')
          if (limit.isLocked) {
            setLockSeconds(limit.remainingSeconds)
            setError(`Cuenta bloqueada temporalmente por seguridad. Reintenta en ${limit.remainingSeconds} segundos.`)
          } else {
            setError(err.message === 'Invalid login credentials' ? 'Credenciales incorrectas. Verifica tu correo y contraseña.' : err.message)
          }
        } else {
          // Check if user has MFA AAL2 required
          if (supabase) {
            const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
            if (aalData && aalData.nextLevel === 'aal2' && aalData.currentLevel === 'aal1') {
              const { data: factorData } = await supabase.auth.mfa.listFactors()
              const verifiedTotp = factorData?.totp?.find(f => f.status === 'verified')
              if (verifiedTotp) {
                setMfaFactorId(verifiedTotp.id)
                setTab('mfa')
                setLoading(false)
                return
              }
            }
          }
          resetRateLimit('login_auth')
        }
      } else {
        const { error: err } = await onSignUp(cleanEmail, password)
        if (err) {
          setError(err.message)
        } else {
          resetRateLimit('login_auth')
          setSuccess('¡Cuenta creada exitosamente! Ya puedes entrar.')
          setTab('login')
        }
      }
    } catch {
      setError('Ocurrió un error inesperado. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card fade-in">
        {/* ================= LEFT HERO PANEL ================= */}
        <div className="auth-hero-panel">
          <div>
            <div className="auth-hero-header">
              <div className="auth-logo-badge">
                <AureusLogo size={42} />
                <div>
                  <div className="auth-brand-name">AUREUS</div>
                  <div className="auth-brand-sub">WEALTH ADVISOR</div>
                </div>
              </div>
              <h1 className="auth-hero-title">
                Tu Patrimonio, Inteligencia y Control en <span>Tiempo Real</span>
              </h1>
              <p className="auth-hero-desc">
                Gestión patrimonial inteligente con sincronización continua entre tu teléfono móvil y computadora.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="auth-features-list">
              <div className="auth-feature-item">
                <div className="auth-feature-icon gold">
                  <Zap size={16} />
                </div>
                <div>
                  <div className="auth-feature-title">Sincronización IRT Instantánea</div>
                  <div className="auth-feature-desc">
                    Tus ingresos, gastos y retiros se reflejan al instante en todos tus dispositivos vía WebSockets.
                  </div>
                </div>
              </div>

              <div className="auth-feature-item">
                <div className="auth-feature-icon emerald">
                  <BrainCircuit size={16} />
                </div>
                <div>
                  <div className="auth-feature-title">Asesor Inteligente de Efectivo</div>
                  <div className="auth-feature-desc">
                    Alertas en vivo para evitar gastos hormiga y control de impacto contra tu liquidez mensual.
                  </div>
                </div>
              </div>

              <div className="auth-feature-item">
                <div className="auth-feature-icon purple">
                  <TrendingUp size={16} />
                </div>
                <div>
                  <div className="auth-feature-title">Análisis Predictivo 50/30/20 & 2FA</div>
                  <div className="auth-feature-desc">
                    Diagnóstico de fondo de emergencia y seguridad con doble factor de autenticación TOTP.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer with GitHub and Status */}
          <div className="auth-hero-footer">
            <a
              href="https://github.com/Rosdevdr/manejo_finanzas"
              target="_blank"
              rel="noopener noreferrer"
              className="auth-github-btn"
              title="Ver repositorio en GitHub"
            >
              <GithubIcon size={16} />
              <span>GitHub Repository</span>
            </a>

            <div className="auth-badge-stat">
              <ShieldCheck size={14} />
              <span>PostgreSQL + RLS + 2FA</span>
            </div>
          </div>
        </div>

        {/* ================= RIGHT FORM PANEL ================= */}
        <div className="auth-form-panel">
          {tab === 'login' || tab === 'register' ? (
            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab-btn ${tab === 'login' ? 'active' : ''}`}
                onClick={() => { setTab('login'); setError(null); setSuccess(null) }}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${tab === 'register' ? 'active' : ''}`}
                onClick={() => { setTab('register'); setError(null); setSuccess(null) }}
              >
                Crear Cuenta
              </button>
            </div>
          ) : tab === 'forgot' ? (
            <div style={{ marginBottom: 18 }}>
              <button
                type="button"
                onClick={() => { setTab('login'); setError(null); setSuccess(null) }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'transparent',
                  border: 'none',
                  color: '#888898',
                  fontSize: 12.5,
                  cursor: 'pointer',
                  marginBottom: 10,
                }}
              >
                <ArrowLeft size={14} />
                <span>Volver al inicio de sesión</span>
              </button>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', margin: '0 0 4px' }}>
                Recuperar Contraseña
              </h2>
              <p style={{ fontSize: 12.5, color: '#888898', margin: 0, lineHeight: 1.4 }}>
                Ingresa tu correo y te enviaremos un enlace seguro para restablecerla.
              </p>
            </div>
          ) : tab === 'update-password' ? (
            <div style={{ marginBottom: 18 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', margin: '0 0 4px' }}>
                Restablecer Contraseña
              </h2>
              <p style={{ fontSize: 12.5, color: '#888898', margin: 0, lineHeight: 1.4 }}>
                Crea una nueva contraseña segura para tu cuenta de Aureus Finanzas.
              </p>
            </div>
          ) : (
            /* MFA Challenge Tab */
            <div style={{ marginBottom: 18 }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                borderRadius: 20,
                background: 'rgba(243, 202, 101, 0.12)',
                border: '1px solid rgba(243, 202, 101, 0.3)',
                color: '#F3CA65',
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 12,
              }}>
                <KeyRound size={14} />
                <span>Autenticación de Dos Factores Activa</span>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', margin: '0 0 4px' }}>
                Verificación 2FA Requerida
              </h2>
              <p style={{ fontSize: 12.5, color: '#888898', margin: 0, lineHeight: 1.4 }}>
                Ingresa el código de 6 dígitos de tu app autenticadora para desbloquear el panel.
              </p>
            </div>
          )}

          {lockSeconds > 0 && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: 12,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: '#F87171',
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 16,
            }}>
              <ShieldAlert size={18} style={{ flexShrink: 0 }} />
              <span>
                Protección contra fuerza bruta activa. Intenta de nuevo en{' '}
                <strong style={{ color: '#FFFFFF', fontSize: 13 }}>{lockSeconds}s</strong>
              </span>
            </div>
          )}

          {error && !lockSeconds && <div className="auth-error-msg">{error}</div>}
          {success && (
            <div className="auth-success-msg" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={16} color="#34D399" />
              <span>{success}</span>
            </div>
          )}

          {!isSupabaseConfigured && (
            <div style={{
              background: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.25)',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 12,
              color: '#FBBF24',
              marginBottom: 14,
              lineHeight: 1.4,
            }}>
              💡 <strong>Configuración en curso:</strong> Puedes explorar el <strong>Modo Demo</strong> o conectar Supabase agregando tus credenciales en el archivo <code>.env.local</code>.
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {/* MFA 2FA Challenge Input */}
            {tab === 'mfa' ? (
              <div className="auth-field">
                <label className="auth-label">Código Autenticador (6 Dígitos)</label>
                <div className="auth-input-wrapper">
                  <KeyRound size={16} className="auth-input-icon" />
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    className="auth-input"
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      letterSpacing: '6px',
                      fontSize: 18,
                      fontWeight: 700,
                      textAlign: 'center',
                    }}
                    required
                    autoFocus
                  />
                </div>
              </div>
            ) : tab === 'forgot' ? (
              /* Forgot password email input */
              <div className="auth-field">
                <label className="auth-label">Correo Electrónico Registrado</label>
                <div className="auth-input-wrapper">
                  <Mail size={16} className="auth-input-icon" />
                  <input
                    type="email"
                    placeholder="ejemplo@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="auth-input"
                    required
                  />
                </div>
              </div>
            ) : tab === 'update-password' ? (
              /* Password update fields */
              <>
                {hasRecoveryMfa && (
                  <div className="auth-field">
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 12px',
                      background: 'rgba(243, 202, 101, 0.12)',
                      border: '1px solid rgba(243, 202, 101, 0.3)',
                      borderRadius: 8,
                      color: '#F3CA65',
                      fontSize: 12,
                      fontWeight: 600,
                      marginBottom: 10,
                    }}>
                      <ShieldCheck size={16} style={{ flexShrink: 0 }} />
                      <span>Verificación 2FA Requerida (Google / iOS Authenticator)</span>
                    </div>
                    <label className="auth-label">Código de 6 Dígitos de tu Aplicación Autenticadora</label>
                    <div className="auth-input-wrapper">
                      <KeyRound size={16} className="auth-input-icon" />
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        placeholder="000000"
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                        className="auth-input"
                        style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          letterSpacing: '6px',
                          fontSize: 18,
                          fontWeight: 700,
                          textAlign: 'center',
                        }}
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                )}

                <div className="auth-field">
                  <label className="auth-label">Nueva Contraseña</label>
                  <div className="auth-input-wrapper">
                    <Lock size={16} className="auth-input-icon" />
                    <input
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="auth-input"
                      required
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <label className="auth-label">Confirmar Nueva Contraseña</label>
                  <div className="auth-input-wrapper">
                    <Lock size={16} className="auth-input-icon" />
                    <input
                      type="password"
                      placeholder="Repite la nueva contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="auth-input"
                      required
                    />
                  </div>
                </div>
              </>
            ) : (
              /* Standard login/register form */
              <>
                <div className="auth-field">
                  <label className="auth-label">Correo Electrónico</label>
                  <div className="auth-input-wrapper">
                    <Mail size={16} className="auth-input-icon" />
                    <input
                      type="email"
                      placeholder="ejemplo@correo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="auth-input"
                      required
                      disabled={lockSeconds > 0}
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="auth-label">Contraseña</label>
                    {tab === 'login' && (
                      <button
                        type="button"
                        onClick={() => { setTab('forgot'); setError(null); setSuccess(null) }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#C9A84C',
                          fontSize: 11.5,
                          fontWeight: 500,
                          cursor: 'pointer',
                          marginBottom: 4,
                          padding: 0,
                          transition: 'color 0.15s ease',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#F3CA65' }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#C9A84C' }}
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    )}
                  </div>
                  <div className="auth-input-wrapper">
                    <Lock size={16} className="auth-input-icon" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="auth-input"
                      required
                      disabled={lockSeconds > 0}
                    />
                  </div>
                </div>

                {tab === 'register' && (
                  <div className="auth-field">
                    <label className="auth-label">Confirmar Contraseña</label>
                    <div className="auth-input-wrapper">
                      <Lock size={16} className="auth-input-icon" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="auth-input"
                        required
                        disabled={lockSeconds > 0}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={loading || lockSeconds > 0}
              className="auth-submit-btn"
            >
              {loading ? (
                <span>Procesando...</span>
              ) : lockSeconds > 0 ? (
                <span>Bloqueado ({lockSeconds}s)</span>
              ) : tab === 'forgot' ? (
                <>
                  <span>Enviar Enlace de Recuperación</span>
                  <ArrowRight size={16} />
                </>
              ) : tab === 'update-password' ? (
                <>
                  <span>Guardar Nueva Contraseña</span>
                  <ArrowRight size={16} />
                </>
              ) : tab === 'mfa' ? (
                <>
                  <span>Verificar y Acceder</span>
                  <ArrowRight size={16} />
                </>
              ) : (
                <>
                  <span>{tab === 'login' ? 'Entrar a Mi Panel' : 'Registrar Cuenta'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {tab === 'mfa' && (
              <button
                type="button"
                onClick={async () => {
                  if (onCancelMfa) await onCancelMfa()
                  setTab('login')
                  setMfaCode('')
                  setError(null)
                }}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  marginTop: 10,
                  height: 42,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                }}
              >
                ← Cancelar e iniciar con otra cuenta
              </button>
            )}

            {tab === 'update-password' && (
              <button
                type="button"
                onClick={() => {
                  if (onClearPasswordRecovery) onClearPasswordRecovery()
                  setTab('login')
                  setPassword('')
                  setConfirmPassword('')
                  setMfaCode('')
                  setError(null)
                }}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  marginTop: 10,
                  height: 42,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                }}
              >
                ← Cancelar y volver al inicio
              </button>
            )}
          </form>

          {tab !== 'mfa' && tab !== 'update-password' && (
            <>
              <div className="auth-divider">o acceso sin cuenta</div>

              <button
                type="button"
                onClick={onEnterDemoMode}
                className="auth-demo-btn"
              >
                <PlayCircle size={16} className="text-[#C9A84C]" />
                <span>Continuar en Modo Demo (Local)</span>
                <Sparkles size={14} className="text-[#C9A84C]" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
