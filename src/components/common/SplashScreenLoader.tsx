import React from 'react'
import { AureusLogo } from '../ui/AureusLogo'
import './SplashScreenLoader.css'

export interface SplashScreenLoaderProps {
  message?: string
  subtext?: string
  isExiting?: boolean
}

export const SplashScreenLoader: React.FC<SplashScreenLoaderProps> = ({
  message = 'Cargando AUREUS',
  subtext = 'Inicializando módulos...',
  isExiting = false,
}) => {
  return (
    <div
      className={`splash-screen-overlay ${isExiting ? 'exiting' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={`${message}. ${subtext}`}
    >
      <div className="splash-screen-container">
        {/* Logo AUREUS animado con aura dorada */}
        <div className="splash-logo-wrapper">
          <div className="splash-logo-halo" />
          <AureusLogo size={120} className="splash-logo-svg" />
        </div>

        {/* Loader circular dorado */}
        <div className="splash-loader-ring">
          <div className="loader-ring" />
        </div>

        {/* Textos informativos de carga */}
        <div className="splash-text">
          <p className="splash-loading-text">{message}</p>
          <p className="splash-subtext">{subtext}</p>
        </div>
      </div>
    </div>
  )
}

export default SplashScreenLoader
