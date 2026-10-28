import { useState, useRef, useEffect, type ReactNode } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import './CustomIconSelect.css'

export interface CustomSelectOption<T extends string = string> {
  value: T
  label: string
  subtitle?: string
  icon: ReactNode
  accentColor?: string
}

interface CustomIconSelectProps<T extends string = string> {
  options: CustomSelectOption<T>[]
  value: T
  onChange: (value: T) => void
  placeholder?: string
  compact?: boolean
  disabled?: boolean
  id?: string
  ariaLabel?: string
}

export function CustomIconSelect<T extends string = string>({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  compact = false,
  disabled = false,
  id,
  ariaLabel,
}: CustomIconSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.value === value) || options[0]

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div
      ref={containerRef}
      className={`aureus-custom-select ${compact ? 'is-compact' : ''} ${isOpen ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''}`}
    >
      <button
        id={id}
        type="button"
        className="aureus-custom-select-trigger"
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || selectedOption?.label || placeholder}
        disabled={disabled}
      >
        <span className="aureus-custom-select-selected">
          {selectedOption ? (
            <>
              <span
                className="aureus-custom-select-icon-badge"
                style={
                  selectedOption.accentColor
                    ? {
                        color: selectedOption.accentColor,
                        background: `${selectedOption.accentColor}18`,
                        borderColor: `${selectedOption.accentColor}35`,
                      }
                    : undefined
                }
              >
                {selectedOption.icon}
              </span>
              <span className="aureus-custom-select-text">
                <span className="aureus-custom-select-label">{selectedOption.label}</span>
                {!compact && selectedOption.subtitle && (
                  <span className="aureus-custom-select-subtitle">{selectedOption.subtitle}</span>
                )}
              </span>
            </>
          ) : (
            <span className="aureus-custom-select-placeholder">{placeholder}</span>
          )}
        </span>
        <ChevronDown size={compact ? 14 : 16} className={`aureus-custom-select-chevron ${isOpen ? 'rotated' : ''}`} />
      </button>

      {isOpen && (
        <div className="aureus-custom-select-dropdown" role="listbox">
          {options.map(opt => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`aureus-custom-select-option ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  onChange(opt.value)
                  setIsOpen(false)
                }}
              >
                <span
                  className="aureus-custom-select-icon-badge"
                  style={
                    opt.accentColor
                      ? {
                          color: opt.accentColor,
                          background: `${opt.accentColor}18`,
                          borderColor: `${opt.accentColor}35`,
                        }
                      : undefined
                  }
                >
                  {opt.icon}
                </span>
                <span className="aureus-custom-select-text">
                  <span className="aureus-custom-select-label">{opt.label}</span>
                  {opt.subtitle && (
                    <span className="aureus-custom-select-subtitle">{opt.subtitle}</span>
                  )}
                </span>
                {isSelected && (
                  <Check size={14} className="aureus-custom-select-check" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

