import { describe, it, expect } from 'vitest'
import {
  isLeapYear,
  getDaysInMonth,
  getPreviousPeriod,
  getNextPeriod,
  formatPeriodLabel,
  getMonthProgress,
  getAllAvailablePeriods,
  calculateCumulativeBalance,
} from '../calendar'

describe('Calendar and Period Engine', () => {
  describe('isLeapYear', () => {
    it('correctly identifies leap years', () => {
      expect(isLeapYear(2024)).toBe(true)
      expect(isLeapYear(2028)).toBe(true)
      expect(isLeapYear(2000)).toBe(true)
      expect(isLeapYear(2026)).toBe(false)
      expect(isLeapYear(1900)).toBe(false)
    })
  })

  describe('getDaysInMonth', () => {
    it('returns 29 for February in leap years and 28 in regular years', () => {
      expect(getDaysInMonth(2024, 2)).toBe(29)
      expect(getDaysInMonth(2026, 2)).toBe(28)
      expect(getDaysInMonth(2028, 2)).toBe(29)
    })

    it('returns 30 for April, June, September, November', () => {
      expect(getDaysInMonth(2026, 4)).toBe(30)
      expect(getDaysInMonth(2026, 6)).toBe(30)
      expect(getDaysInMonth(2026, 9)).toBe(30)
      expect(getDaysInMonth(2026, 11)).toBe(30)
    })

    it('returns 31 for January, March, May, July, August, October, December', () => {
      expect(getDaysInMonth(2026, 1)).toBe(31)
      expect(getDaysInMonth(2026, 3)).toBe(31)
      expect(getDaysInMonth(2026, 5)).toBe(31)
      expect(getDaysInMonth(2026, 7)).toBe(31)
      expect(getDaysInMonth(2026, 8)).toBe(31)
      expect(getDaysInMonth(2026, 10)).toBe(31)
      expect(getDaysInMonth(2026, 12)).toBe(31)
    })
  })

  describe('Period navigation', () => {
    it('navigates to previous period seamlessly across year boundaries', () => {
      expect(getPreviousPeriod('2026-08')).toBe('2026-07')
      expect(getPreviousPeriod('2026-01')).toBe('2025-12')
      expect(getPreviousPeriod('2025-12')).toBe('2025-11')
    })

    it('navigates to next period seamlessly across year boundaries', () => {
      expect(getNextPeriod('2026-08')).toBe('2026-09')
      expect(getNextPeriod('2026-12')).toBe('2027-01')
      expect(getNextPeriod('2027-01')).toBe('2027-02')
    })
  })

  describe('formatPeriodLabel', () => {
    it('formats period strings into Spanish month and year', () => {
      expect(formatPeriodLabel('2026-08')).toBe('Agosto 2026')
      expect(formatPeriodLabel('2026-09')).toBe('Septiembre 2026')
      expect(formatPeriodLabel('2027-01')).toBe('Enero 2027')
    })
  })

  describe('getMonthProgress', () => {
    it('calculates days remaining and alert if near end of month', () => {
      // Simular fecha del 29 de Agosto 2026
      const mockDate = new Date(2026, 7, 29) // Agosto es mes 7 en JS 0-indexed
      const progress = getMonthProgress('2026-08', mockDate)

      expect(progress.totalDays).toBe(31)
      expect(progress.currentDay).toBe(29)
      expect(progress.daysRemaining).toBe(2)
      expect(progress.isMonthEndingSoon).toBe(true)
    })
  })

  describe('calculateCumulativeBalance', () => {
    it('correctly calculates rollover from previous months when current month has 0 movements', () => {
      const mockIncomes = [
        { period: '2026-08', amount: 85000 },
        { period: '2026-08', amount: 15000 },
      ]
      const mockExpenses = [
        { period: '2026-08', amount: 40000 },
        { period: '2026-08', amount: 20000 },
      ]

      const res = calculateCumulativeBalance(mockIncomes, mockExpenses, '2026-09')
      expect(res.carriedOverBalance).toBe(40000) // 100,000 - 60,000
      expect(res.periodIncome).toBe(0)
      expect(res.periodExpense).toBe(0)
      expect(res.periodNet).toBe(0)
      expect(res.totalCumulativeBalance).toBe(40000)
    })

    it('combines previous rollover balance with current period movements', () => {
      const mockIncomes = [
        { period: '2026-08', amount: 100000 },
        { period: '2026-09', amount: 50000 },
      ]
      const mockExpenses = [
        { period: '2026-08', amount: 70000 },
        { period: '2026-09', amount: 20000 },
      ]

      const res = calculateCumulativeBalance(mockIncomes, mockExpenses, '2026-09')
      expect(res.carriedOverBalance).toBe(30000)
      expect(res.periodIncome).toBe(50000)
      expect(res.periodExpense).toBe(20000)
      expect(res.periodNet).toBe(30000)
      expect(res.totalCumulativeBalance).toBe(60000)
    })
  })

  describe('getAllAvailablePeriods', () => {
    it('includes registered periods and does not produce duplicates', () => {
      const periods = getAllAvailablePeriods(['2025-05', '2026-08', '2026-09'], '2026-08')
      expect(periods.some(p => p.value === '2025-05')).toBe(true)
      expect(periods.some(p => p.value === '2026-08')).toBe(true)
      const values = periods.map(p => p.value)
      const uniqueValues = new Set(values)
      expect(values.length).toBe(uniqueValues.size)
    })
  })
})
