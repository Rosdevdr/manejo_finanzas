import React from 'react'
import { AureusLogo } from '../ui/AureusLogo'
import './SplashScreenLoader.css'

export interface SplashScreenLoaderProps {
  message?: string
  subtext?: string
  isExiting?: boolean
  theme?: 'light' | 'dark'
}

export const SplashScreenLoader: React.FC<SplashScreenLoaderProps> = ({
  message = 'Cargando AUREUS',
  subtext = 'Inicializando módulos...',
  isExiting = false,
  theme,
}) => {
  // Sincronización unificada de tema: prioridad prop > DOM attribute > localStorage > fallback
  const [resolvedTheme, setResolvedTheme] = React.useState<'light' | 'dark'>(() => {
    if (theme) return theme
    if (typeof document !== 'undefined') {
      const docTheme = document.documentElement.getAttribute('data-theme')
      if (docTheme === 'light' || docTheme === 'dark') return docTheme
    }
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('aureus_theme')
      if (stored === 'light' || stored === 'dark') return stored
    }
    return 'dark'
  })

  React.useEffect(() => {
    if (theme) {
      setResolvedTheme(theme)
      return
    }
    if (typeof document !== 'undefined') {
      const updateTheme = () => {
        const docTheme = document.documentElement.getAttribute('data-theme') as 'light' | 'dark'
        if (docTheme) setResolvedTheme(docTheme)
      }
      const observer = new MutationObserver(updateTheme)
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
      return () => observer.disconnect()
    }
  }, [theme])

  return (
    <div
      className={`splash-screen-overlay ${isExiting ? 'exiting' : ''} ${resolvedTheme === 'light' ? 'light-mode' : 'dark-mode'}`}
      data-theme={resolvedTheme}
      role="status"
      aria-live="polite"
      aria-label={`${message}. ${subtext}`}
    >
      <div className="splash-screen-container">
        {/* Logo AUREUS animado con aura contextual */}
        <div className="splash-logo-wrapper">
          <div className="splash-logo-halo" />
          <AureusLogo size={120} className="splash-logo-svg" />
        </div>

        {/* Loader circular dorado / champagne */}
        <div className="splash-loader-ring">
          <div className="loader-ring" />
        </div>

        {/* Textos informativos de carga */}
        <div className="splash-text">
          <p className="splash-loading-text">{message}</p>
          <p className="splash-subtext">{subtext}</p>
        </div>

        {/* Barra de progreso fluida de alta precisión */}
        <div className="splash-progress-track">
          <div className="splash-progress-indicator" />
        </div>
      </div>
    </div>
  )
}

export default SplashScreenLoader
