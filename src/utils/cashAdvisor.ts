// src/utils/cashAdvisor.ts
import type { CashReason } from '../types/finance'

export interface CashAdvisoryResult {
    level: 'info' | 'warning' | 'danger' | 'success';
    title: string;
    message: string;
    recommendation: string;
}

/**
 * Evalúa un retiro en efectivo contra la razón y la liquidez disponible
 */
export function evaluateCashWithdrawal(
    withdrawalAmount: number,
    reason: CashReason,
    availableBalance: number
): CashAdvisoryResult {
    const percentageOfBalance = availableBalance > 0
        ? (withdrawalAmount / availableBalance) * 100
        : 100;

    // 1. Alerta crítica: El retiro supera el 40% del dinero libre disponible
    if (percentageOfBalance > 40 && availableBalance > 0) {
        return {
            level: 'danger',
            title: '🚨 Retiro de Alto Impacto Presupuestario',
            message: `Este retiro de efectivo representa el ${percentageOfBalance.toFixed(1)}% de tu dinero disponible del mes.`,
            recommendation: 'Si este retiro no corresponde a un compromiso ineludible, corres alto riesgo de quedarte sin liquidez para cubrir imprevistos a fin de mes.',
        };
    }

    // 2. Reglas según el motivo seleccionado
    switch (reason) {
        case 'pocket_money':
            return {
                level: 'warning',
                title: '⚠️ Dinero de Bolsillo: Zona de Microgastos',
                message: 'El efectivo sin destino específico suele perderse en compras impulsivas o gastos hormiga.',
                recommendation: 'Te sugerimos fijar un tope semanal de efectivo o registrar cada compra mayor a RD$ 100 en la sección de Gastos (método Efectivo).',
            };

        case 'specific_service':
            return {
                level: 'info',
                title: 'ℹ️ Pago de Servicio en Efectivo',
                message: 'Retiro destinado a un pago directo que no acepta tarjeta o transferencia.',
                recommendation: 'Recuerda registrar el gasto correspondiente en la categoría adecuada (ej. Servicios o Vivienda) en cuanto realices el pago.',
            };

        case 'leisure_nightout':
            return {
                level: 'warning',
                title: '🍻 Salida / Ocio en Efectivo',
                message: 'Estudios financieros demuestran que el 90% del efectivo llevado a eventos sociales se gasta por completo.',
                recommendation: 'Considera este monto como 100% gastado desde ahora y ajusta tus gastos variables restantes del mes.',
            };

        case 'emergency':
            return {
                level: 'info',
                title: '🏥 Retiro por Emergencia o Imprevisto',
                message: 'Has indicado que este retiro atiende una situación imprevista.',
                recommendation: 'El asesor recomienda compensar este gasto reduciendo temporalmente las salidas y entretenimiento de las próximas 2 semanas.',
            };

        case 'unassigned':
        default:
            return {
                level: 'danger',
                title: '❓ Retiro Sin Destino Definido',
                message: 'Retirar dinero del banco sin una meta clara es la principal causa de descontrol financiero.',
                recommendation: 'Define el propósito de este dinero o manténlo en tu cuenta bancaria donde puedas monitorearlo.',
            };
    }
}
