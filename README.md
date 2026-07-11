# SpendIQ

**AI financial coach** personale — non un semplice expense tracker. L'utente dichiara obiettivi economici e l'AI propone piani realistici basati sulle spese reali dei mesi precedenti.

> "L'AI non ti chiede cosa vuoi fare, ti dice cosa puoi fare realisticamente."

PWA installabile su mobile, in italiano, pensata per giovani adulti (25-35) con uno stipendio.

## Stack

- React 18 + Vite, Recharts, inline styles (nessuna libreria UI)
- Supabase (PostgreSQL + Auth + RLS)
- Anthropic API (`claude-sonnet-4-6`) chiamata dal browser
- Hosting: Vercel

## Setup

### 1. Supabase

1. Crea un progetto su [supabase.com](https://supabase.com)
2. Apri **SQL Editor** ed esegui l'intero contenuto di [`supabase-schema.sql`](supabase-schema.sql)
3. In **Authentication → Providers** verifica che Email sia attivo (signup con conferma email)
4. Copia da **Settings → API**: Project URL e publishable key

### 2. Variabili d'ambiente

Compila `.env` (già presente con placeholder):

```
VITE_SUPABASE_URL=<project url supabase>
VITE_SUPABASE_KEY=<publishable key supabase (sb_publishable_...)>
VITE_ANTHROPIC_KEY=<chiave anthropic (sk-ant-...)>
```

### 3. Avvio

```bash
npm install
npm run dev      # sviluppo su localhost:5173
npm run build    # build di produzione
```

### Deploy Vercel

Push su GitHub → import repo su Vercel → aggiungi le 3 variabili d'ambiente nelle Environment Variables → deploy.

## Funzionalità

- **Dashboard**: hero card con budget del mese, barra mesi, grafici (andamento 6 mesi + torta categorie), griglia categorie, transazioni principali
- **Obiettivi**: crea un obiettivo → "Analizza con AI" → l'AI calcola fattibilità, quota mensile e consiglia quale categoria tagliare basandosi sulle spese reali → "Accetta piano AI"
- **Import estratto conto**: PDF (pdf.js) o Excel (SheetJS) → categorizzazione automatica AI → review con checkbox → import
- **AI Coach Chat**: FAB in basso a destra, risponde con il contesto finanziario completo
- **Gestione**: spese, ricorrenti (toggle on/off), entrate (stipendio + extra mensili), categorie custom
- **4 feature intelligenti**: insight proattivo giornaliero (banner), entrate variabili, report di fine mese (on-demand + banner automatico nei primi 5 giorni), spese ricorrenti applicate automaticamente

## Note tecniche

- **Deviazione dallo schema del brief**: `expenses.cat_id` e `recurring.cat_id` sono `text` invece di `integer`, perché le categorie di default hanno id `'1'`–`'8'` mentre le custom hanno id UUID — un integer non potrebbe referenziarle.
- **Icone PWA**: `public/icons/` contiene placeholder generati da `node scripts/gen-icons.mjs`. Sostituirle con icone reali prima della produzione.

## ⚠️ Refactor prioritari per la produzione

1. **Spostare le chiamate Anthropic lato server** (Supabase Edge Function o Vercel Serverless Function): chiamare l'API dal browser espone la chiave. Accettabile solo per il beta test tra amici.
2. Icone PWA reali (192px e 512px)
3. Gestione errori più robusta sul parsing PDF (le scansioni immagine non sono parsabili → l'Excel è più affidabile)

**Roadmap rimandata (non implementare ora):** modalità coppia/famiglia con budget condivisi.
