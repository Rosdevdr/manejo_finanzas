import { useState, useEffect, useCallback } from 'react'
import {
  ShieldCheck,
  KeyRound,
  QrCode,
  Copy,
  Check,
  X,
  Lock,
  Smartphone,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import './SecurityModal.css'

interface SecurityModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail?: string | null
  onUpdatePassword: (newPassword: string) => Promise<{ error: Error | null }>
}

interface Factor {
  id: string
  friendly_name?: string
  factor_type: string
  status: 'verified' | 'unverified'
}

export function SecurityModal({
  isOpen,
  onClose,
  userEmail,
  onUpdatePassword,
}: SecurityModalProps) {
  const [factors, setFactors] = useState<Factor[]>([])
  const [loadingFactors, setLoadingFactors] = useState(true)
  const [enrollingFactor, setEnrollingFactor] = useState<{
    id: string
    qr_code: string
    secret: string
    uri: string
  } | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Password change state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const hasVerified2FA = factors.some(f => f.status === 'verified')

  const refreshFactors = useCallback(async () => {
    if (!supabase || !isSupabaseConfigured) return
    try {
      const { data, error: factorsErr } = await supabase.auth.mfa.listFactors()
      if (!factorsErr && data) {
        setFactors((data.totp as Factor[]) || [])
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (!isOpen || !supabase || !isSupabaseConfigured) return

    let isMounted = true

    supabase.auth.mfa.listFactors().then(({ data, error: factorsErr }) => {
      if (isMounted) {
        if (!factorsErr && data) {
          setFactors((data.totp as Factor[]) || [])
        }
        setLoadingFactors(false)
      }
    }).catch(() => {
      if (isMounted) setLoadingFactors(false)
    })

    return () => {
      isMounted = false
    }
  }, [isOpen])

  const handleClose = () => {
    setError(null)
    setSuccess(null)
    setPasswordSuccess(null)
    setPasswordError(null)
    setEnrollingFactor(null)
    setVerificationCode('')
    onClose()
  }

  if (!isOpen) return null

  const handleStartEnrollment = async () => {
    if (!supabase || !isSupabaseConfigured) return
    setError(null)
    setSuccess(null)
    try {
      // Limpiar factores no verificados previos si los hay
      for (const factor of factors.filter(f => f.status === 'unverified')) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id })
      }

      const { data, error: enrollErr } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'Aureus Finanzas',
        friendlyName: 'Authenticator App',
      })

      if (enrollErr) {
        setError(enrollErr.message)
        return
      }

      if (data && data.totp) {
        setEnrollingFactor({
          id: data.id,
          qr_code: data.totp.qr_code,
          secret: data.totp.secret,
          uri: data.totp.uri,
        })
      }
    } catch {
      setError('Error al iniciar la configuración 2FA.')
    }
  }

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase || !enrollingFactor || !verificationCode) return

    setIsVerifying(true)
    setError(null)

    try {
      const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({
        factorId: enrollingFactor.id,
      })

      if (challengeErr) {
        setError(challengeErr.message)
        setIsVerifying(false)
        return
      }

      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: enrollingFactor.id,
        challengeId: challengeData.id,
        code: verificationCode.trim(),
      })

      if (verifyErr) {
        setError('Código inválido o expirado. Asegúrate de ingresar los 6 dígitos actuales.')
        setIsVerifying(false)
        return
      }

      setSuccess('¡Autenticación de Dos Factores (2FA) activada exitosamente!')
      setEnrollingFactor(null)
      setVerificationCode('')
      refreshFactors()
    } catch {
      setError('Ocurrió un error al verificar el código.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleDisable2FA = async (factorId: string) => {
    if (!supabase) return
    if (!window.confirm('¿Estás seguro de que deseas desactivar la autenticación de dos factores?')) {
      return
    }

    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId })
      if (error) {
        setError(error.message)
      } else {
        setSuccess('2FA ha sido desactivado.')
        setEnrollingFactor(null)
        refreshFactors()
      }
    } catch {
      setError('Error al desactivar 2FA.')
    }
  }

  const handleCopySecret = () => {
    if (enrollingFactor?.secret) {
      navigator.clipboard.writeText(enrollingFactor.secret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)

    if (newPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden.')
      return
    }

    setIsUpdatingPassword(true)
    const { error } = await onUpdatePassword(newPassword)
    setIsUpdatingPassword(false)

    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordSuccess('¡Contraseña actualizada correctamente!')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  return (
    <div className="security-modal-overlay" onClick={handleClose}>
      <div className="security-modal-card fade-in" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="security-modal-header">
          <div className="security-header-title">
            <div className="security-icon-wrap">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3>Seguridad & Autenticación 2FA</h3>
              <p className="security-subtitle">{userEmail || 'Usuario Aureus'}</p>
            </div>
          </div>
          <button type="button" className="security-close-btn" onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        <div className="security-modal-body">
          {error && (
            <div className="security-alert error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="security-alert success">
              <Check size={16} />
              <span>{success}</span>
            </div>
          )}

          {/* ================= 2FA STATUS SECTION ================= */}
          <div className="security-section">
            <div className="section-header">
              <div className="section-title-wrap">
                <Smartphone size={16} className="section-icon" />
                <h4>Autenticación de Dos Factores (TOTP 2FA)</h4>
              </div>
              <div className={`status-badge ${hasVerified2FA ? 'active' : 'inactive'}`}>
                {hasVerified2FA ? 'Activo (Protegido)' : 'Inactivo'}
              </div>
            </div>

            <p className="section-desc">
              Protege tu cuenta exigiendo un código de 6 dígitos desde tu aplicación de autenticación
              (Google Authenticator, Authy, Microsoft o Apple Keychain) al iniciar sesión.
            </p>

            {loadingFactors ? (
              <div className="security-loading">
                <RefreshCw size={16} className="spin" />
                <span>Consultando estado 2FA...</span>
              </div>
            ) : hasVerified2FA ? (
              <div className="twofa-active-box">
                <div className="twofa-active-info">
                  <ShieldCheck size={24} color="#34D399" />
                  <div>
                    <div className="twofa-active-title">2FA Habilitado con App Autenticadora</div>
                    <div className="twofa-active-sub">Tu cuenta requiere un código de 6 dígitos en cada inicio de sesión.</div>
                  </div>
                </div>
                {factors.map(f => (
                  <button
                    key={f.id}
                    type="button"
                    className="btn-disable-2fa"
                    onClick={() => handleDisable2FA(f.id)}
                  >
                    Desactivar 2FA
                  </button>
                ))}
              </div>
            ) : enrollingFactor ? (
              /* Enrolling flow */
              <div className="enroll-box">
                <div className="enroll-step-title">
                  <QrCode size={16} />
                  <span>Paso 1: Escanea el código QR</span>
                </div>
                <p className="enroll-step-desc">
                  Abre tu app de autenticación (Google Authenticator, 1Password, Authy o Apple) y escanea:
                </p>

                <div className="qr-container">
                  <img
                    src={enrollingFactor.qr_code}
                    alt="Código QR 2FA"
                    className="qr-image"
                  />
                </div>

                <div className="secret-key-box">
                  <span className="secret-label">O ingresa esta clave manual:</span>
                  <div className="secret-code-row">
                    <code>{enrollingFactor.secret}</code>
                    <button
                      type="button"
                      className="copy-btn"
                      onClick={handleCopySecret}
                      title="Copiar Clave"
                    >
                      {copied ? <Check size={14} color="#34D399" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <form onSubmit={handleVerify2FA} className="verify-form">
                  <div className="enroll-step-title">
                    <KeyRound size={16} />
                    <span>Paso 2: Ingresa el código de 6 dígitos generado</span>
                  </div>
                  <div className="verify-input-group">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="000000"
                      value={verificationCode}
                      onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      className="verify-code-input"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isVerifying || verificationCode.length !== 6}
                      className="btn-verify-submit"
                    >
                      {isVerifying ? 'Verificando...' : 'Activar 2FA'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <button
                type="button"
                className="btn-enable-2fa"
                onClick={handleStartEnrollment}
              >
                <ShieldCheck size={16} />
                <span>Activar Autenticación de Dos Factores</span>
              </button>
            )}
          </div>

          <div className="security-divider" />

          {/* ================= CHANGE PASSWORD SECTION ================= */}
          <div className="security-section">
            <div className="section-header">
              <div className="section-title-wrap">
                <Lock size={16} className="section-icon" />
                <h4>Cambiar Contraseña</h4>
              </div>
            </div>

            {passwordError && (
              <div className="security-alert error">
                <AlertCircle size={15} />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="security-alert success">
                <Check size={15} />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="password-form">
              <div className="password-field">
                <label>Nueva Contraseña</label>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="security-input"
                  required
                />
              </div>

              <div className="password-field">
                <label>Confirmar Nueva Contraseña</label>
                <input
                  type="password"
                  placeholder="Repite la contraseña"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="security-input"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingPassword || !newPassword}
                className="btn-update-password"
              >
                {isUpdatingPassword ? 'Actualizando...' : 'Actualizar Contraseña'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
