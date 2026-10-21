// ==============================================================================
// AUREUS · CUADRO DESLIZANTE DE SELECCIÓN DE PERÍODO (MES Y AÑO)
// ==============================================================================

import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  RotateCcw,
} from 'lucide-react'
import { MONTH_NAMES } from '../../utils/calendar'
import { triggerHaptic } from '../../utils/haptics'
import './PeriodSlideSelector.css'

interface PeriodSlideSelectorProps {
  isOpen: boolean
  onClose: () => void
  currentPeriod: string // 'YYYY-MM'
  onSelectPeriod: (period: string) => void
}

export function PeriodSlideSelector({
  isOpen,
  onClose,
  currentPeriod,
  onSelectPeriod,
}: PeriodSlideSelectorProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Desglosar periodo actual
  const [initYear, initMonth] = useMemo(() => {
    const parts = (currentPeriod || '').split('-')
    const y = parseInt(parts[0], 10) || new Date().getFullYear()
    const m = parseInt(parts[1], 10) || (new Date().getMonth() + 1)
    return [y, m]
  }, [currentPeriod])

  const [selectedYear, setSelectedYear] = useState<number>(initYear)
  const [selectedMonth, setSelectedMonth] = useState<number>(initMonth)

  // Sincronizar cuando se abra
  useEffect(() => {
    if (isOpen) {
      setSelectedYear(initYear)
      setSelectedMonth(initMonth)
    }
  }, [isOpen, initYear, initMonth])

  // Cerrar al presionar Escape o clic fuera
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Píldoras rápidas de años (2 anteriores, actual, 2 siguientes)
  const yearPills = [
    selectedYear - 2,
    selectedYear - 1,
    selectedYear,
    selectedYear + 1,
    selectedYear + 2,
  ]

  const handleApply = (year: number = selectedYear, month: number = selectedMonth) => {
    triggerHaptic('success')
    const formatted = `${year}-${String(month).padStart(2, '0')}`
    onSelectPeriod(formatted)
    onClose()
  }

  const handleSelectMonth = (monthIndex: number) => {
    triggerHaptic('light')
    const newMonth = monthIndex + 1
    setSelectedMonth(newMonth)
    // Aplicar de inmediato para máxima fluidez
    handleApply(selectedYear, newMonth)
  }

  const handleResetToCurrent = () => {
    triggerHaptic('light')
    const now = new Date()
    const nowYear = now.getFullYear()
    const nowMonth = now.getMonth() + 1
    setSelectedYear(nowYear)
    setSelectedMonth(nowMonth)
    handleApply(nowYear, nowMonth)
  }

  return (
    <div className="period-slide-backdrop" role="dialog" aria-modal="true" aria-label="Seleccionar período">
      <div className="period-slide-panel" ref={panelRef}>
        {/* Cabecera */}
        <div className="period-slide-header">
          <div className="period-slide-title-group">
            <div className="period-slide-icon">
              <Calendar size={18} />
            </div>
            <div>
              <h3 className="period-slide-title">Seleccionar Período</h3>
              <p className="period-slide-subtitle">Elige el mes y año a consultar</p>
            </div>
          </div>
          <button
            type="button"
            className="period-slide-close"
            onClick={onClose}
            aria-label="Cerrar selector"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo con los 2 Parámetros */}
        <div className="period-slide-body">
          {/* Parámetro 1: Año */}
          <div>
            <label className="period-parameter-label">Parámetro 1 · Año</label>
            <div className="period-year-stepper">
              <button
                type="button"
                className="period-year-btn"
                onClick={() => {
                  triggerHaptic('light')
                  setSelectedYear(y => y - 1)
                }}
                aria-label="Año anterior"
              >
                <ChevronLeft size={18} />
              </button>

              <span className="period-year-display">{selectedYear}</span>

              <button
                type="button"
                className="period-year-btn"
                onClick={() => {
                  triggerHaptic('light')
                  setSelectedYear(y => y + 1)
                }}
                aria-label="Año siguiente"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="period-year-quick-pills">
              {yearPills.map(y => (
                <button
                  key={y}
                  type="button"
                  className={`period-year-pill ${y === selectedYear ? 'active' : ''}`}
                  onClick={() => {
                    triggerHaptic('light')
                    setSelectedYear(y)
                  }}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          {/* Parámetro 2: Mes */}
          <div>
            <label className="period-parameter-label">Parámetro 2 · Mes</label>
            <div className="period-months-grid">
              {MONTH_NAMES.map((monthName, idx) => {
                const monthNum = idx + 1
                const isSelected = selectedMonth === monthNum
                return (
                  <button
                    key={monthName}
                    type="button"
                    className={`period-month-tile ${isSelected ? 'active' : ''}`}
                    onClick={() => handleSelectMonth(idx)}
                  >
                    <span>{monthName}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Pie con Acciones */}
        <div className="period-slide-footer">
          <button
            type="button"
            className="period-current-btn"
            onClick={handleResetToCurrent}
          >
            <RotateCcw size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
            Mes Actual (Hoy)
          </button>

          <button
            type="button"
            className="period-apply-btn"
            onClick={() => handleApply()}
          >
            <Check size={16} />
            <span>Aplicar</span>
          </button>
        </div>
      </div>
    </div>
  )
}
