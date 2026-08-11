// src/components/incomes/IncomesView.tsx
import { useState } from 'react'
import { Wallet, Briefcase, Plus } from 'lucide-react'
import type { Income } from '../../types/finance'
import { IncomeForm } from './IncomeForm'
import { IncomeList } from './IncomeList'
import { formatCurrency } from '../../utils/formatters'
import './IncomesView.css'

interface IncomesViewProps {
    currentPeriod: string;
    incomes: Income[];
    onAddIncome: (income: Omit<Income, 'id'>) => void;
    onUpdateIncome: (income: Income) => void;
    onDeleteIncome: (id: string) => void;
}

export function IncomesView({
    currentPeriod,
    incomes,
    onAddIncome,
    onUpdateIncome,
    onDeleteIncome,
}: IncomesViewProps) {
    const [incomeToEdit, setIncomeToEdit] = useState<Income | null>(null)

    // Filtrar ingresos que corresponden al período actual
    const periodIncomes = incomes.filter((i) => i.period === currentPeriod)

    // Cálculos matemáticos puros
    const totalSalary = periodIncomes
        .filter((i) => i.type === 'salary')
        .reduce((sum, i) => sum + i.amount, 0)

    const totalExtra = periodIncomes
        .filter((i) => i.type !== 'salary')
        .reduce((sum, i) => sum + i.amount, 0)

    const totalIncome = totalSalary + totalExtra

    const handleSave = (incomeData: Omit<Income, 'id'> | Income) => {
        if ('id' in incomeData) {
            onUpdateIncome(incomeData)
            setIncomeToEdit(null)
        } else {
            onAddIncome(incomeData)
        }
    }

    return (
        <div className="incomes-view-layout">
            {/* Resumen Superior de Ingresos */}
            <div className="income-summary-grid">
                <div className="summary-stat-card primary">
                    <div className="stat-icon-wrapper income">
                        <Wallet size={24} />
                    </div>
                    <div>
                        <span className="stat-label">Ingreso Total ({currentPeriod})</span>
                        <p className="stat-value highlight">{formatCurrency(totalIncome)}</p>
                    </div>
                </div>

                <div className="summary-stat-card">
                    <div className="stat-icon-wrapper salary">
                        <Briefcase size={24} />
                    </div>
                    <div>
                        <span className="stat-label">Sueldo / Salario Base</span>
                        <p className="stat-value">{formatCurrency(totalSalary)}</p>
                    </div>
                </div>

                <div className="summary-stat-card">
                    <div className="stat-icon-wrapper extra">
                        <Plus size={24} />
                    </div>
                    <div>
                        <span className="stat-label">Freelance & Extras</span>
                        <p className="stat-value">{formatCurrency(totalExtra)}</p>
                    </div>
                </div>
            </div>

            {/* Formulario de registro/edición */}
            <IncomeForm
                currentPeriod={currentPeriod}
                incomeToEdit={incomeToEdit}
                onSave={handleSave}
                onCancelEdit={() => setIncomeToEdit(null)}
            />

            {/* Lista interactiva */}
            <IncomeList
                incomes={periodIncomes}
                onEdit={(income) => setIncomeToEdit(income)}
                onDelete={onDeleteIncome}
            />
        </div>
    )
}
