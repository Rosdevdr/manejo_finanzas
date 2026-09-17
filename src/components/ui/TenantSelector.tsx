import { useState, useRef, useEffect } from 'react'
import { Building, ChevronDown, Check, Sparkles } from 'lucide-react'
import { useTenant } from '../../context/TenantContext'

export function TenantSelector() {
  const { tenant, setTenantSlug, availableTenants } = useTenant()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="tenant-selector-container" ref={menuRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="tenant-badge-btn"
        onClick={() => setOpen(!open)}
        title="Cambiar cliente de Marca Blanca (Multi-Tenant)"
        aria-label="Selector de Marca Blanca"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          padding: '5px 12px',
          borderRadius: 9999,
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#D1D5DB',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.18s ease',
        }}
      >
        <Building size={13} style={{ color: tenant.theme.colors.brandAccent }} />
        <span style={{ color: '#FFFFFF', fontWeight: 700 }}>{tenant.name}</span>
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: tenant.theme.colors.brandPrimary,
            boxShadow: `0 0 6px ${tenant.theme.colors.brandPrimary}`,
            display: 'inline-block',
          }}
        />
        <ChevronDown size={12} style={{ opacity: 0.6, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <div
          className="tenant-dropdown-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 270,
            background: '#111319',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 14,
            padding: 8,
            boxShadow: '0 12px 36px rgba(0,0,0,0.7)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div style={{ padding: '6px 8px 4px', fontSize: 10, fontWeight: 700, color: '#8E95A5', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Clientes de Marca Blanca
          </div>

          {availableTenants.map(t => {
            const isSelected = t.slug === tenant.slug
            return (
              <button
                key={t.slug}
                type="button"
                onClick={() => {
                  setTenantSlug(t.slug)
                  setOpen(false)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 10px',
                  borderRadius: 9,
                  background: isSelected ? 'rgba(255,255,255,0.06)' : 'transparent',
                  border: isSelected ? `1px solid ${t.theme.colors.brandPrimary}55` : '1px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: t.theme.colors.brandPrimary,
                      boxShadow: `0 0 8px ${t.theme.colors.brandPrimary}`,
                    }}
                  />
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#FFFFFF' }}>{t.name}</div>
                    <div style={{ fontSize: 10.5, color: '#8E95A5' }}>
                      {t.feature_flags.ai_advisor ? 'Asesor IA Activo' : 'Sin módulo IA'} · {t.transaction_limits.currency}
                    </div>
                  </div>
                </div>
                {isSelected && <Check size={14} style={{ color: t.theme.colors.brandAccent }} />}
              </button>
            )
          })}

          <div style={{ marginTop: 4, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 6, fontSize: 10.5, color: '#64748B' }}>
            <Sparkles size={11} style={{ color: tenant.theme.colors.brandAccent }} />
            <span>Multi-Tenant RLS & Tokens</span>
          </div>
        </div>
      )}
    </div>
  )
}
