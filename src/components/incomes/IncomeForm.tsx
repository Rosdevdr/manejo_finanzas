// src/components/incomes/IncomeForm.tsx
import { useState, useEffect, type FormEvent } from 'react'
import { PlusCircle, CheckCircle2, X } from 'lucide-react'
import type { Income, IncomeType } from '../../types/finance'
import { getTodayDateString } from '../../utils/formatters'
import './IncomeForm.css'

interface IncomeFormProps {
    currentPeriod: string;
    incomeToEdit?: Income | null;
    onSave: (income: Omit<Income, 'id'> | Income) => void;
    onCancelEdit?: () => void;
}

export function IncomeForm({ currentPeriod, incomeToEdit, onSave, onCancelEdit }: IncomeFormProps) {
    const [description, setDescription] = useState('')
    const [amount, setAmount] = useState('')
    const [type, setType] = useState<IncomeType>('salary')
    const [date, setDate] = useState(getTodayDateString())
    const [error, setError] = useState<string | null>(null)

    // Si nos pasan un ingreso para editar, llenamos los inputs automáticamente
    useEffect(() => {
        if (incomeToEdit) {
            setDescription(incomeToEdit.description)
            setAmount(incomeToEdit.amount.toString())
            setType(incomeToEdit.type)
            setDate(incomeToEdit.date)
            setError(null)
        } else {
            resetForm()
        }
    }, [incomeToEdit])

    const resetForm = () => {
        setDescription('')
        setAmount('')
        setType('salary')
        setDate(getTodayDateString())
        setError(null)
    }

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()

        // 1. Validación de descripción
        if (!description.trim()) {
            setError('La descripción del ingreso es obligatoria.')
            return
        }

        // 2. Validación numérica
        const parsedAmount = parseFloat(amount)
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setError('Por favor ingresa un monto válido mayor a 0.')
            return
        }

        // 3. Si estamos editando, conservamos el ID original; si es nuevo, enviamos sin ID
        if (incomeToEdit) {
            onSave({
                ...incomeToEdit,
                description: description.trim(),
                amount: parsedAmount,
                type,
                date,
                period: currentPeriod,
            })
        } else {
            onSave({
                description: description.trim(),
                amount: parsedAmount,
                type,
                date,
                period: currentPeriod,
            })
            resetForm()
        }
    }

    return (
        <form className="income-form-card" onSubmit={handleSubmit}>
            <div className="form-header">
                <h3>{incomeToEdit ? 'Editar Ingreso' : 'Registrar Nuevo Ingreso'}</h3>
                {incomeToEdit && onCancelEdit && (
                    <button type="button" className="btn-cancel-edit" onClick={onCancelEdit}>
                        <X size={16} /> Cancelar edición
                    </button>
                )}
            </div>

            {error && <div className="form-error-banner">{error}</div>}

            <div className="form-grid">
                <div className="form-group">
                    <label htmlFor="income-desc">Descripción</label>
                    <input
                        id="income-desc"
                        type="text"
                        placeholder="Ej: Sueldo quincenal, Proyecto Freelance..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="form-input"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="income-amount">Monto (RD$)</label>
                    <input
                        id="income-amount"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="form-input"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="income-type">Tipo de Ingreso</label>
                    <select
                        id="income-type"
                        value={type}
                        onChange={(e) => setType(e.target.value as IncomeType)}
                        className="form-select"
                    >
                        <option value="salary">Sueldo / Salario Fijo</option>
                        <option value="freelance">Freelance / Honorarios</option>
                        <option value="investment">Inversiones / Dividendos</option>
                        <option value="extra">Extra / Ocasional</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="income-date">Fecha</label>
                    <input
                        id="income-date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="form-input"
                    />
                </div>
            </div>

            <div className="form-actions">
                <button type="submit" className="btn-submit-income">
                    {incomeToEdit ? (
                        <>
                            <CheckCircle2 size={18} /> Guardar Cambios
                        </>
                    ) : (
                        <>
                            <PlusCircle size={18} /> Agregar Ingreso
                        </>
                    )}
                </button>
            </div>
        </form>
    )
}
