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
} from 'lucide-react'
import { AureusLogo } from '../ui/AureusLogo'
import { GithubIcon } from '../ui/GithubIcon'
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '../../utils/rateLimiter'
import { sanitizeString } from '../../utils/security'
import './LoginView.css'

interface LoginViewProps {
  onSignIn: (email: string, password: string) => Promise<{ error: Error | null }>
  onSignUp: (email: string, password: string) => Promise<{ error: Error | null }>
  onEnterDemoMode: () => void
  isSupabaseConfigured: boolean
}

export function LoginView({
  onSignIn,
  onSignUp,
  onEnterDemoMode,
  isSupabaseConfigured,
}: LoginViewProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [lockSeconds, setLockSeconds] = useState(() => checkRateLimit('login_auth').remainingSeconds)

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

    // Verificar Rate Limiting
    const rateStatus = checkRateLimit('login_auth')
    if (rateStatus.isLocked) {
      setLockSeconds(rateStatus.remainingSeconds)
      setError(`Protección activa: Demasiados intentos fallidos. Espera ${rateStatus.remainingSeconds} segundos.`)
      return
    }

    const cleanEmail = sanitizeString(email)
    if (!cleanEmail || !password) {
      setError('Por favor completa todos los campos.')
      return
    }

    if (tab === 'register') {
      if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.')
        return
      }
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden.')
        return
      }
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
                  <div className="auth-feature-title">Análisis Predictivo 50/30/20</div>
                  <div className="auth-feature-desc">
                    Diagnóstico de fondo de emergencia, tasa de retención y veredictos de inversión automáticos.
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
              <span>PostgreSQL + RLS</span>
            </div>
          </div>
        </div>

        {/* ================= RIGHT FORM PANEL ================= */}
        <div className="auth-form-panel">
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
          {success && <div className="auth-success-msg">{success}</div>}

          {!isSupabaseConfigured && (
            <div style={{
              background: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.25)',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 12,
              color: '#FBBF24',
              marginBottom: 14,
              lineHeight: 1.4
            }}>
              💡 <strong>Configuración en curso:</strong> Puedes explorar el <strong>Modo Demo</strong> o conectar Supabase agregando tus credenciales en el archivo <code>.env.local</code>.
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
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
              <label className="auth-label">Contraseña</label>
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

            <button
              type="submit"
              disabled={loading || lockSeconds > 0}
              className="auth-submit-btn"
            >
              {loading ? (
                <span>Procesando...</span>
              ) : lockSeconds > 0 ? (
                <span>Bloqueado ({lockSeconds}s)</span>
              ) : (
                <>
                  <span>{tab === 'login' ? 'Entrar a Mi Panel' : 'Registrar Cuenta'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

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
        </div>
      </div>
    </div>
  )
}
