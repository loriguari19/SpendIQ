import { pidx } from './period'

// ─── Buste di budget ─────────────────────────────────────────────────────────
// Ogni spesa vive in una di 3 buste; il salvadanaio è la quota per gli obiettivi.
export const BUCKETS = {
  ricorrenti: { name: 'Ricorrenti', icon: 'repeat', color: '#7C3AED', bg: '#F5F3FF' },
  spesa: { name: 'Spesa', icon: 'cart', color: '#059669', bg: '#ECFDF5' },
  svago: { name: 'Svago', icon: 'fun', color: '#D97706', bg: '#FFFBEB' },
  salvadanaio: { name: 'Salvadanaio', icon: 'target', color: '#2563EB', bg: '#EFF4FF' },
}
export const BUCKET_KEYS = ['ricorrenti', 'spesa', 'svago']

// sottocategorie di Casa che sono di fatto spese fisse mensili
const CASA_FISSE = /affitto|mutuo|condominio|utenze|internet/i

// busta suggerita per una spesa (usata anche per le spese vecchie senza colonna bucket)
export function guessBucket(catId, sub, recurring) {
  if (recurring) return 'ricorrenti'
  if (String(catId) === '4') return 'spesa'
  if (String(catId) === '1' && CASA_FISSE.test(sub || '')) return 'ricorrenti'
  return 'svago'
}

export function bucketOf(e) {
  if (e.bucket && BUCKETS[e.bucket]) return e.bucket
  return guessBucket(e.cat_id, e.sub, !!e.recurring_id)
}

// totale speso per busta in un insieme di spese
export function spentByBucket(expenses) {
  const s = { ricorrenti: 0, spesa: 0, svago: 0 }
  for (const e of expenses) s[bucketOf(e)] += +e.amount || 0
  return s
}

// Riporto: i residui (positivi o negativi) di Spesa e Svago di tutti i mesi pianificati
// precedenti a quello indicato si trascinano in avanti, anche a cavallo d'anno.
export function carryFor(budgets, expenses, year, month) {
  const target = pidx(year, month)
  const out = { spesa: 0, svago: 0 }
  for (const b of budgets) {
    if (pidx(b.year, b.month) >= target) continue
    const sp = spentByBucket(expenses.filter(e => e.month === b.month && e.year === b.year))
    out.spesa += (+b.spesa || 0) - sp.spesa
    out.svago += (+b.svago || 0) - sp.svago
  }
  return out
}
