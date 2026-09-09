// src/components/ui/InstallAppModal.tsx
import { useState, useEffect } from 'react'
import { X, Smartphone, Download, Share2, PlusSquare, CheckCircle, Apple, Shield } from 'lucide-react'
import './InstallAppModal.css'

interface InstallAppModalProps {
  isOpen: boolean
  onClose: () => void
  isInstallable: boolean
  onInstallPwa: () => void
}

type Platform = 'ios' | 'android' | 'desktop'

function detectInitialPlatform(): Platform {
  if (typeof window === 'undefined') return 'android'
  const ua = window.navigator.userAgent.toLowerCase()
  if (/iphone|ipad|ipod/.test(ua)) return 'ios'
  if (/android/.test(ua)) return 'android'
  return 'desktop'
}

export function InstallAppModal({
  isOpen,
  onClose,
  isInstallable,
  onInstallPwa,
}: InstallAppModalProps) {
  const [platform, setPlatform] = useState<Platform>(detectInitialPlatform)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="install-modal-overlay" onClick={onClose}>
      <div className="install-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Encabezado */}
        <div className="install-modal-header">
          <div className="install-modal-title">
            <div className="install-logo-icon">
              <Smartphone size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, color: '#FFFFFF', fontWeight: 700 }}>
                Instalar AUREUS en tu Dispositivo
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9CA3AF' }}>
                Acceso ultra-rápido a pantalla completa sin navegador
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 8,
              color: '#888898',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Selector de Plataforma */}
        <div className="install-platform-tabs">
          <button
            type="button"
            className={`install-tab-btn ${platform === 'ios' ? 'active' : ''}`}
            onClick={() => setPlatform('ios')}
          >
            <Apple size={16} /> iPhone / iPad
          </button>
          <button
            type="button"
            className={`install-tab-btn ${platform === 'android' ? 'active' : ''}`}
            onClick={() => setPlatform('android')}
          >
            <Smartphone size={16} /> Android (APK)
          </button>
          <button
            type="button"
            className={`install-tab-btn ${platform === 'desktop' ? 'active' : ''}`}
            onClick={() => setPlatform('desktop')}
          >
            <Download size={16} /> Computadora
          </button>
        </div>

        {/* Contenido según la plataforma */}
        <div className="install-modal-body">
          {platform === 'ios' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="install-benefit-pill">
                  <Shield size={12} /> 100% Gratuito · Sin App Store
                </span>
                <span style={{ fontSize: 11, color: '#F3CA65', fontFamily: 'Space Mono, monospace' }}>
                  iOS Safari
                </span>
              </div>

              <div className="install-step-card">
                <div className="install-step-num">1</div>
                <div className="install-step-content">
                  <h4>Toca el botón Compartir</h4>
                  <p>
                    En la barra de navegación de <strong>Safari</strong> (en la parte inferior de tu iPhone), pulsa el ícono de compartir (<Share2 size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> con flecha hacia arriba).
                  </p>
                </div>
              </div>

              <div className="install-step-card">
                <div className="install-step-num">2</div>
                <div className="install-step-content">
                  <h4>Selecciona "Agregar a la pantalla de inicio"</h4>
                  <p>
                    Desplázate hacia abajo en el menú de opciones y toca en <PlusSquare size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> <strong>"Agregar a la pantalla de inicio"</strong> (o <em>Add to Home Screen</em>).
                  </p>
                </div>
              </div>

              <div className="install-step-card">
                <div className="install-step-num">3</div>
                <div className="install-step-content">
                  <h4>Confirma presionando "Agregar"</h4>
                  <p>
                    En la esquina superior derecha, toca <strong>"Agregar"</strong>. Se creará de inmediato el ícono dorado de AUREUS en la pantalla de inicio de tu iPhone, listo para usarse como app nativa a pantalla completa.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="install-btn-action install-btn-gold"
                onClick={onClose}
              >
                <CheckCircle size={16} /> ¡Entendido, ya sé cómo agregarlo!
              </button>
            </>
          )}

          {platform === 'android' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="install-benefit-pill">
                  <CheckCircle size={12} /> Compatible con Samsung, Xiaomi, Motorola, Pixel
                </span>
                <span style={{ fontSize: 11, color: '#34D399', fontFamily: 'Space Mono, monospace' }}>
                  Android APK
                </span>
              </div>

              {isInstallable ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p style={{ fontSize: 13, color: '#D1D5DB', margin: 0 }}>
                    Tu navegador permite instalar AUREUS directamente en tu teléfono con 1 solo toque como aplicación nativa (WebAPK):
                  </p>
                  <button
                    type="button"
                    className="install-btn-action install-btn-emerald"
                    onClick={() => {
                      onInstallPwa()
                      onClose()
                    }}
                  >
                    <Download size={18} /> Instalar en Android con 1 Clic
                  </button>
                </div>
              ) : null}

              <div className="install-step-card">
                <div className="install-step-num">APK</div>
                <div className="install-step-content">
                  <h4>Instalación vía APK Nativo</h4>
                  <p>
                    AUREUS cuenta con soporte completo de compilación nativa en <strong>Capacitor para Android</strong>. El archivo ejecutable autónomo <code>app-debug.apk</code> o <code>app-release.apk</code> puede instalarse directamente en cualquier dispositivo Android permitiendo orígenes desconocidos.
                  </p>
                </div>
              </div>

              <div style={{ background: 'rgba(201, 168, 76, 0.08)', border: '1px solid rgba(201, 168, 76, 0.25)', borderRadius: 10, padding: 12, fontSize: 11.5, color: '#F3CA65' }}>
                💡 <strong>Ventaja:</strong> No requiere cuenta de Google Play para instalarse; puedes distribuir el APK directamente por WhatsApp, Telegram o enlace directo de descarga.
              </div>
            </>
          )}

          {platform === 'desktop' && (
            <>
              <p style={{ fontSize: 13, color: '#D1D5DB', margin: 0 }}>
                Puedes instalar AUREUS en tu computadora (Windows, Mac o Linux) para tener una ventana propia e independiente en tu barra de tareas:
              </p>

              {isInstallable ? (
                <button
                  type="button"
                  className="install-btn-action install-btn-gold"
                  onClick={() => {
                    onInstallPwa()
                    onClose()
                  }}
                >
                  <Download size={18} /> Instalar en la Computadora
                </button>
              ) : (
                <div className="install-step-card">
                  <div className="install-step-num">💻</div>
                  <div className="install-step-content">
                    <h4>Instalación desde Chrome / Edge</h4>
                    <p>
                      Haz clic en el ícono de instalación (<Download size={12} style={{ display: 'inline' }} />) que aparece en la barra de direcciones de tu navegador en la esquina derecha para anclar AUREUS a tu barra de tareas.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
