import { Scale, X, ExternalLink, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react'
import { AureusLogo } from './AureusLogo'
import { GithubIcon } from './GithubIcon'

interface MitLicenseModalProps {
  isOpen: boolean
  onClose: () => void
}

export function MitLicenseModal({ isOpen, onClose }: MitLicenseModalProps) {
  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 5, 8, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="fade-in"
        style={{
          background: '#121218',
          border: '1px solid #2A2A38',
          borderRadius: 16,
          maxWidth: 640,
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(201, 168, 76, 0.1)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #1E1E28',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, rgba(201, 168, 76, 0.06) 0%, rgba(18, 18, 24, 0) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(201, 168, 76, 0.12)',
                border: '1px solid rgba(201, 168, 76, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#C9A84C',
              }}
            >
              <Scale size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#FFFFFF', margin: 0, letterSpacing: '-0.01em' }}>
                Licencia MIT & Reglas de Uso
              </h2>
              <p style={{ fontSize: 12, color: '#888898', margin: '2px 0 0' }}>
                AUREUS · Wealth Advisor & Financial Platform
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid #2A2A38',
              color: '#888898',
              borderRadius: 8,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#FFFFFF'
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#888898'
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Author Banner */}
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: 'rgba(201, 168, 76, 0.08)',
              border: '1px solid rgba(201, 168, 76, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <AureusLogo size={36} />
            <div style={{ flex: 1 }}>
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
            <a
              href="https://github.com/Rosdevdr/manejo_finanzas"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 12px',
                borderRadius: 8,
                background: '#16161E',
                border: '1px solid #2A2A38',
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <GithubIcon size={14} />
              <span>Ver Repo</span>
              <ExternalLink size={12} style={{ color: '#888898' }} />
            </a>
          </div>

          {/* Permitted & Conditions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <div
              style={{
                padding: 14,
                borderRadius: 10,
                background: 'rgba(52, 211, 153, 0.06)',
                border: '1px solid rgba(52, 211, 153, 0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#34D399', fontWeight: 600, fontSize: 12, marginBottom: 8 }}>
                <CheckCircle2 size={15} />
                <span>Permisos Concedidos</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: '#A0A0B0', lineHeight: 1.6 }}>
                <li>Uso comercial y personal libre</li>
                <li>Modificación total del código</li>
                <li>Distribución y creación de copias</li>
                <li>Uso privado y despliegue libre</li>
              </ul>
            </div>

            <div
              style={{
                padding: 14,
                borderRadius: 10,
                background: 'rgba(251, 191, 36, 0.06)',
                border: '1px solid rgba(251, 191, 36, 0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#FBBF24', fontWeight: 600, fontSize: 12, marginBottom: 8 }}>
                <AlertCircle size={15} />
                <span>Condición Obligatoria</span>
              </div>
              <p style={{ margin: 0, fontSize: 11.5, color: '#A0A0B0', lineHeight: 1.5 }}>
                Preservar el aviso de derechos de autor original y dar crédito a <strong>Rosdevdr (José Zapata)</strong> en cualquier redistribución o trabajo derivado.
              </p>
            </div>
          </div>

          {/* Official License Text */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#717182', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Texto Oficial de la Licencia
            </div>
            <div
              style={{
                padding: 14,
                borderRadius: 10,
                background: '#0D0D12',
                border: '1px solid #1E1E28',
                fontFamily: 'monospace',
                fontSize: 11,
                color: '#888898',
                lineHeight: 1.6,
                maxHeight: 160,
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
              }}
            >
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
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #1E1E28',
            background: '#0E0E14',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#717182' }}>
            <ShieldCheck size={14} style={{ color: '#34D399' }} />
            <span>Open Source Community Initiative</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-primary"
            style={{ padding: '8px 20px', fontSize: 12 }}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}
