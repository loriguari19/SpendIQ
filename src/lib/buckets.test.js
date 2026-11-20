import { describe, it, expect } from 'vitest'
import { guessBucket, bucketOf, spentByBucket, carryFor } from './buckets'

describe('buste', () => {
  it('assegna la busta in base a categoria e ricorrenza', () => {
    expect(guessBucket('4', 'Supermercato', false)).toBe('spesa')
    expect(guessBucket('1', 'Affitto', false)).toBe('ricorrenti')
    expect(guessBucket('3', 'Ristoranti', false)).toBe('svago')
    expect(guessBucket('3', 'Ristoranti', true)).toBe('ricorrenti')
  })

  it('la busta salvata sulla spesa vince sull\'ipotesi', () => {
    expect(bucketOf({ bucket: 'svago', cat_id: '4', sub: 'Supermercato' })).toBe('svago')
    expect(bucketOf({ bucket: 'inesistente', cat_id: '4', sub: 'Supermercato' })).toBe('spesa')
  })

  it('somma lo speso per busta', () => {
    const s = spentByBucket([
      { cat_id: '4', sub: 'Supermercato', amount: 50 },
      { cat_id: '3', sub: 'Bar', amount: '12.5' },
      { cat_id: '6', sub: 'Streaming', amount: 13, recurring_id: 'r1' },
    ])
    expect(s).toEqual({ ricorrenti: 13, spesa: 50, svago: 12.5 })
  })
})

describe('riporto tra mesi', () => {
  const budgets = [
    { year: 2026, month: 10, spesa: 300, svago: 200 },
    { year: 2026, month: 11, spesa: 300, svago: 200 },
  ]
  const expenses = [
    { year: 2026, month: 10, cat_id: '4', sub: 'Supermercato', amount: 250 }, // +50 spesa
    { year: 2026, month: 10, cat_id: '3', sub: 'Bar', amount: 260 },          // −60 svago
    { year: 2026, month: 11, cat_id: '4', sub: 'Supermercato', amount: 320 }, // −20 spesa
  ]

  it('non c\'è riporto sul primo mese pianificato', () => {
    expect(carryFor(budgets, expenses, 2026, 10)).toEqual({ spesa: 0, svago: 0 })
  })

  it('riporta il residuo del mese precedente', () => {
    expect(carryFor(budgets, expenses, 2026, 11)).toEqual({ spesa: 50, svago: -60 })
  })

  it('a gennaio il riporto arriva dall\'anno precedente', () => {
    // prima del fix a gennaio il riporto si azzerava
    expect(carryFor(budgets, expenses, 2027, 0)).toEqual({ spesa: 30, svago: 140 })
  })

  it('i piani di mesi futuri non entrano nel riporto', () => {
    const withFuture = [...budgets, { year: 2027, month: 3, spesa: 999, svago: 999 }]
    expect(carryFor(withFuture, expenses, 2027, 0)).toEqual({ spesa: 30, svago: 140 })
  })
})
