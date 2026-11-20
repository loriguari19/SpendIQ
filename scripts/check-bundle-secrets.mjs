// Controllo post-build: nessun segreto deve finire nel bundle pubblico.
// Eseguito automaticamente da "npm run build" (script postbuild). Fallisce la build se trova qualcosa.
import fs from 'fs'
import path from 'path'

const DIST = path.join(process.cwd(), 'dist')
const PATTERNS = [
  [/sk-ant-[A-Za-z0-9_-]{8,}/, 'chiave API Anthropic'],
  [/sb_secret_[A-Za-z0-9_-]{8,}/, 'secret key Supabase'],
  [/anthropic-dangerous-direct-browser-access/, 'chiamata diretta ad Anthropic dal browser'],
  [/api\.anthropic\.com/, 'endpoint Anthropic nel codice client'],
]

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])
}

if (!fs.existsSync(DIST)) {
  console.error('dist/ non trovata: esegui prima la build.')
  process.exit(1)
}

const hits = []
for (const file of walk(DIST)) {
  if (!/\.(js|mjs|html|css|json|map)$/.test(file)) continue
  const text = fs.readFileSync(file, 'utf8')
  for (const [re, label] of PATTERNS) if (re.test(text)) hits.push(`${path.relative(process.cwd(), file)}: ${label}`)
}

if (hits.length) {
  console.error('✗ Segreti o chiamate vietate trovati nel bundle:\n  ' + hits.join('\n  '))
  process.exit(1)
}
console.log('✓ Nessun segreto nel bundle')
