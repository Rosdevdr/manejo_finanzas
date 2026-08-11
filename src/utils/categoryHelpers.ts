// src/utils/categoryHelpers.ts
import {
    Home,
    Utensils,
    Car,
    Zap,
    HeartPulse,
    Gamepad2,
    GraduationCap,
    CreditCard,
    HelpCircle
} from 'lucide-react'
import type { ExpenseCategory } from '../types/finance'

export interface CategoryInfo {
    label: string;
    icon: typeof Home;
    color: string;
    bgLight: string;
}

export const CATEGORY_MAP: Record<ExpenseCategory, CategoryInfo> = {
    housing: {
        label: 'Vivienda / Renta',
        icon: Home,
        color: '#3b82f6',
        bgLight: 'rgba(59, 130, 246, 0.12)',
    },
    food: {
        label: 'Alimentación / Super',
        icon: Utensils,
        color: '#10b981',
        bgLight: 'rgba(16, 185, 129, 0.12)',
    },
    transport: {
        label: 'Transporte / Gasolina',
        icon: Car,
        color: '#f59e0b',
        bgLight: 'rgba(245, 158, 11, 0.12)',
    },
    utilities: {
        label: 'Servicios (Luz, Agua, Net)',
        icon: Zap,
        color: '#06b6d4',
        bgLight: 'rgba(6, 182, 212, 0.12)',
    },
    health: {
        label: 'Salud / Farmacia',
        icon: HeartPulse,
        color: '#ec4899',
        bgLight: 'rgba(236, 72, 153, 0.12)',
    },
    entertainment: {
        label: 'Ocio / Salidas',
        icon: Gamepad2,
        color: '#a855f7',
        bgLight: 'rgba(168, 85, 247, 0.12)',
    },
    education: {
        label: 'Educación / Cursos',
        icon: GraduationCap,
        color: '#6366f1',
        bgLight: 'rgba(99, 102, 241, 0.12)',
    },
    debt: {
        label: 'Pago de Deudas',
        icon: CreditCard,
        color: '#f43f5e',
        bgLight: 'rgba(244, 63, 94, 0.12)',
    },
    other: {
        label: 'Otros / Imprevistos',
        icon: HelpCircle,
        color: '#94a3b8',
        bgLight: 'rgba(148, 163, 184, 0.12)',
    },
}
