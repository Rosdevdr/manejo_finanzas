import { useState, useRef, useEffect, useCallback, type ReactNode, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
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
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.value === value) || options[0]

  const updateDropdownPosition = useCallback(() => {
    if (!triggerRef.current || typeof window === 'undefined') return
    const rect = triggerRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    const spaceBelow = viewportHeight - rect.bottom - 12
    const spaceAbove = rect.top - 12
    const openUpward = spaceBelow < 220 && spaceAbove > spaceBelow
    const maxHeight = Math.max(140, Math.min(270, openUpward ? spaceAbove : spaceBelow))
    const width = Math.min(Math.max(rect.width, 210), viewportWidth - 24)
    const left = Math.max(12, Math.min(rect.left, viewportWidth - width - 12))

    if (openUpward) {
      setDropdownStyle({
        position: 'fixed',
        bottom: `${Math.max(8, viewportHeight - rect.top + 6)}px`,
        top: 'auto',
        left: `${left}px`,
        width: `${width}px`,
        maxHeight: `${maxHeight}px`,
        zIndex: 20000,
      })
    } else {
      setDropdownStyle({
        position: 'fixed',
        top: `${rect.bottom + 6}px`,
        bottom: 'auto',
        left: `${left}px`,
        width: `${width}px`,
        maxHeight: `${maxHeight}px`,
        zIndex: 20000,
      })
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    updateDropdownPosition()

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(target))
      ) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    const handleScrollOrResize = () => {
      updateDropdownPosition()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', handleScrollOrResize, true)
    window.addEventListener('resize', handleScrollOrResize)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', handleScrollOrResize, true)
      window.removeEventListener('resize', handleScrollOrResize)
    }
  }, [isOpen, updateDropdownPosition])

  const dropdownElement = isOpen ? (
    <div
      ref={dropdownRef}
      className="aureus-custom-select-dropdown"
      style={dropdownStyle}
      role="listbox"
    >
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
  ) : null

  return (
    <div
      ref={containerRef}
      className={`aureus-custom-select ${compact ? 'is-compact' : ''} ${isOpen ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''}`}
    >
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className="aureus-custom-select-trigger"
        onClick={() => {
          if (disabled) return
          if (!isOpen) updateDropdownPosition()
          setIsOpen(prev => !prev)
        }}
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

      {isOpen && typeof document !== 'undefined'
        ? createPortal(dropdownElement, document.body)
        : dropdownElement}
    </div>
  )
}

