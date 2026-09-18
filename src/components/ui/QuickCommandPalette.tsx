import { useState, useEffect, useRef } from 'react'
import {
  Search,
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpCircle,
  CreditCard,
  Banknote,
  Target,
  Bot,
  Flame,
  FileText,
  X,
  CornerDownLeft,
} from 'lucide-react'
import type { TabType } from '../../types/navigation'
import { triggerHaptic } from '../../utils/haptics'

interface CommandItem {
  id: string
  title: string
  category: 'Navegación' | 'Acciones' | 'Herramientas'
  icon: React.ReactNode
  shortcut?: string
  action: () => void
}

interface QuickCommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onNavigateTab: (tab: TabType) => void
  onOpenExport?: () => void
  onOpenFire?: () => void
}

export function QuickCommandPalette({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenExport,
  onOpenFire,
}: QuickCommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const commands: CommandItem[] = [
    {
      id: 'nav-dashboard',
      title: 'Ir a Consola Patrimonial (Dashboard)',
      category: 'Navegación',
      icon: <LayoutDashboard size={16} className="text-gold" />,
      shortcut: 'G D',
      action: () => onNavigateTab('dashboard'),
    },
    {
      id: 'nav-incomes',
      title: 'Ver Entradas de Capital (Ingresos)',
      category: 'Navegación',
      icon: <ArrowDownCircle size={16} className="text-emerald" />,
      shortcut: 'G I',
      action: () => onNavigateTab('incomes'),
    },
    {
      id: 'nav-expenses',
      title: 'Ver Salidas y Gastos',
      category: 'Navegación',
      icon: <ArrowUpCircle size={16} className="text-rose" />,
      shortcut: 'G G',
      action: () => onNavigateTab('expenses'),
    },
    {
      id: 'nav-credit',
      title: 'Gestión de Tarjetas y Fechas de Corte',
      category: 'Navegación',
      icon: <CreditCard size={16} className="text-gold" />,
      shortcut: 'G T',
      action: () => onNavigateTab('credit'),
    },
    {
      id: 'nav-cash',
      title: 'Retiros y Reservas de Efectivo',
      category: 'Navegación',
      icon: <Banknote size={16} className="text-amber" />,
      shortcut: 'G E',
      action: () => onNavigateTab('cash'),
    },
    {
      id: 'nav-budgets',
      title: 'Control Presupuestario y Regla 50/30/20',
      category: 'Navegación',
      icon: <Target size={16} className="text-emerald" />,
      shortcut: 'G P',
      action: () => onNavigateTab('budgets'),
    },
    {
      id: 'nav-advisor',
      title: 'Consultar al Asesor Financiero IA',
      category: 'Navegación',
      icon: <Bot size={16} className="text-purple" />,
      shortcut: 'G A',
      action: () => onNavigateTab('chat-advisor'),
    },
    {
      id: 'tool-fire',
      title: 'Simulador de Independencia Financiera (FIRE)',
      category: 'Herramientas',
      icon: <Flame size={16} className="text-amber" />,
      action: () => onOpenFire && onOpenFire(),
    },
    {
      id: 'tool-export',
      title: 'Generar Estado Financiero Certificado (PDF / CSV)',
      category: 'Herramientas',
      icon: <FileText size={16} className="text-gold" />,
      shortcut: 'Ctrl E',
      action: () => onOpenExport && onOpenExport(),
    },
  ]

  const filtered = commands.filter(c =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % Math.max(1, filtered.length))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + filtered.length) % Math.max(1, filtered.length))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filtered[selectedIndex]) {
          triggerHaptic('light')
          filtered[selectedIndex].action()
          onClose()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, filtered, onClose])

  if (!isOpen) return null

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div
        className="command-palette-dialog"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="command-input-wrapper">
          <Search size={18} className="command-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="command-search-input"
            placeholder="Escribe un comando o busca un módulo... (ej. Tarjetas, FIRE, Gastos)"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button
            type="button"
            className="command-close-btn"
            onClick={onClose}
            aria-label="Cerrar paleta"
          >
            <X size={16} />
          </button>
        </div>

        <div className="command-results-list">
          {filtered.length === 0 ? (
            <div className="command-empty-state">
              No se encontraron comandos que coincidan con &quot;{query}&quot;
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex
              return (
                <div
                  key={item.id}
                  className={`command-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    triggerHaptic('light')
                    item.action()
                    onClose()
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="command-item-left">
                    <span className="command-item-icon">{item.icon}</span>
                    <span className="command-item-title">{item.title}</span>
                  </div>
                  <div className="command-item-right">
                    {item.shortcut && (
                      <kbd className="command-shortcut-badge">{item.shortcut}</kbd>
                    )}
                    {isSelected && <CornerDownLeft size={14} className="command-enter-indicator" />}
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="command-palette-footer">
          <div className="palette-tip">
            <kbd>↑</kbd> <kbd>↓</kbd> Navegar &nbsp;·&nbsp; <kbd>Enter</kbd> Ejecutar &nbsp;·&nbsp; <kbd>Esc</kbd> Cerrar
          </div>
          <div className="palette-branding">
            AUREUS · Control de Alta Frecuencia
          </div>
        </div>
      </div>
    </div>
  )
}
