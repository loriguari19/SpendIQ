import { describe, it, expect } from 'vitest'
import { pidx, fromPidx, prevPeriod, inPeriod, lastPeriods, avgMonthlySpend } from './period'

describe('periodi anno+mese', () => {
  it('converte avanti e indietro', () => {
    expect(fromPidx(pidx(2026, 11))).toEqual({ year: 2026, month: 11 })
    expect(fromPidx(pidx(2027, 0))).toEqual({ year: 2027, month: 0 })
  })

  it('il mese prima di gennaio è dicembre dell\'anno precedente', () => {
    expect(prevPeriod(2027, 0)).toEqual({ year: 2026, month: 11 })
    expect(prevPeriod(2026, 5)).toEqual({ year: 2026, month: 4 })
  })

  it('gli ultimi 6 mesi a febbraio attraversano l\'anno', () => {
    expect(lastPeriods(2027, 1, 6)).toEqual([
      { year: 2026, month: 8 }, { year: 2026, month: 9 }, { year: 2026, month: 10 },
      { year: 2026, month: 11 }, { year: 2027, month: 0 }, { year: 2027, month: 1 },
    ])
  })

  it('inPeriod distingue lo stesso mese di anni diversi', () => {
    const rows = [{ year: 2026, month: 0, amount: 10 }, { year: 2027, month: 0, amount: 20 }]
    expect(inPeriod(rows, 2027, 0)).toEqual([{ year: 2027, month: 0, amount: 20 }])
  })
})

describe('spesa media mensile', () => {
  const expenses = [
    { year: 2026, month: 10, amount: 1000 },
    { year: 2026, month: 11, amount: 600 },
    { year: 2026, month: 11, amount: 400 },
    { year: 2027, month: 0, amount: 500 },
  ]

  it('a gennaio tiene conto dei mesi dell\'anno precedente', () => {
    // nov 1000, dic 1000, gen 500 → media 833,33 (prima del fix: solo gennaio, 500)
    expect(avgMonthlySpend(expenses, 2027, 0)).toBeCloseTo(833.33, 2)
  })

  it('ignora i mesi senza spese e quelli più vecchi di 12 mesi', () => {
    const old = [...expenses, { year: 2025, month: 11, amount: 9999 }]
    expect(avgMonthlySpend(old, 2027, 0)).toBeCloseTo(833.33, 2)
  })

  it('senza spese è zero', () => {
    expect(avgMonthlySpend([], 2027, 0)).toBe(0)
  })
})
