// Un "periodo" è una coppia anno+mese (mese 0-11). L'indice year*12+month permette di
// confrontare e scorrere i mesi senza casi speciali al cambio d'anno.
export const pidx = (year, month) => year * 12 + month

export const fromPidx = p => ({ year: Math.floor(p / 12), month: ((p % 12) + 12) % 12 })

export const prevPeriod = (year, month) => fromPidx(pidx(year, month) - 1)

// righe (spese, entrate, piani) di un certo mese
export const inPeriod = (rows, year, month) => rows.filter(r => r.month === month && r.year === year)

// gli ultimi n periodi fino a quello indicato compreso, dal più vecchio al più recente
export function lastPeriods(year, month, n) {
  const end = pidx(year, month)
  const out = []
  for (let p = end - n + 1; p <= end; p++) out.push(fromPidx(p))
  return out
}

const sumAmount = rows => rows.reduce((a, r) => a + (+r.amount || 0), 0)

// spesa media mensile sugli ultimi 12 mesi (mese indicato compreso), contando solo i mesi con spese
export function avgMonthlySpend(expenses, year, month) {
  const totals = lastPeriods(year, month, 12)
    .map(p => sumAmount(inPeriod(expenses, p.year, p.month)))
    .filter(t => t > 0)
  return totals.length ? totals.reduce((a, b) => a + b, 0) / totals.length : 0
}
