// src/utils/formatters.ts

/**
 * Formatea un número como moneda (ej: RD$ 50,000.00)
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-DO', {
        style: 'currency',
        currency: 'DOP',
        minimumFractionDigits: 2,
    }).format(amount).replace('DOP', 'RD$');
}

/**
 * Retorna la fecha de hoy en formato YYYY-MM-DD para inicializar inputs de tipo date
 */
export function getTodayDateString(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
}
