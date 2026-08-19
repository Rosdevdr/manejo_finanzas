import { Scale, X, ExternalLink, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react'
import { AureusLogo } from './AureusLogo'
import { GithubIcon } from './GithubIcon'
import './MitLicenseModal.css'

interface MitLicenseModalProps {
  isOpen: boolean
  onClose: () => void
}

export function MitLicenseModal({ isOpen, onClose }: MitLicenseModalProps) {
  if (!isOpen) return null

  return (
    <div className="mit-modal-overlay" onClick={onClose}>
      <div className="mit-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="mit-modal-header">
          <div className="mit-header-info">
            <div className="mit-header-icon">
              <Scale size={20} />
            </div>
            <div>
              <h2 className="mit-header-title">Licencia MIT & Reglas de Uso</h2>
              <p className="mit-header-sub">AUREUS · Wealth Advisor & Financial Platform</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mit-close-icon-btn"
            aria-label="Cerrar modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="mit-modal-body">
          {/* Author Banner */}
          <div className="mit-author-banner">
            <div className="mit-author-info">
              <AureusLogo size={34} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#F1D97E' }}>
                  Autor y Creador Original del Proyecto
                </div>
                <div style={{ fontSize: 12, color: '#D0D0DC', marginTop: 2 }}>
                  Desarrollado y mantenido por <strong>José Zapata</strong> (
                  <a
                    href="https://github.com/Rosdevdr"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#C9A84C', textDecoration: 'none', fontWeight: 600 }}
                  >
                    @Rosdevdr
                  </a>
                  )
                </div>
              </div>
            </div>
            <a
              href="https://github.com/Rosdevdr/manejo_finanzas"
              target="_blank"
              rel="noopener noreferrer"
              className="mit-repo-btn"
            >
              <GithubIcon size={14} />
              <span>Ver Repo</span>
              <ExternalLink size={12} style={{ color: '#888898' }} />
            </a>
          </div>

          {/* Permitted & Conditions */}
          <div className="mit-grid">
            <div className="mit-card-box permissions">
              <div className="mit-card-title">
                <CheckCircle2 size={15} />
                <span>Permisos Concedidos</span>
              </div>
              <ul className="mit-card-list">
                <li>Uso comercial y personal libre</li>
                <li>Modificación total del código</li>
                <li>Distribución y creación de copias</li>
                <li>Uso privado y despliegue libre</li>
              </ul>
            </div>

            <div className="mit-card-box conditions">
              <div className="mit-card-title">
                <AlertCircle size={15} />
                <span>Condición Obligatoria</span>
              </div>
              <p className="mit-card-text">
                Preservar el aviso de derechos de autor original y dar crédito a <strong>Rosdevdr (José Zapata)</strong> en cualquier redistribución o trabajo derivado.
              </p>
            </div>
          </div>

          {/* Official License Text */}
          <div className="mit-raw-text-container">
            <div className="mit-raw-label">Texto Oficial de la Licencia</div>
            <div className="mit-raw-box">
              {`MIT License

Copyright (c) 2026 José Zapata (Rosdevdr)
https://github.com/Rosdevdr/manejo_finanzas

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.`}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mit-modal-footer">
          <div className="mit-footer-badge">
            <ShieldCheck size={14} style={{ color: '#34D399' }} />
            <span>Open Source Community Initiative</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mit-submit-btn"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}
