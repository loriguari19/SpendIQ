# SpendIQ

**AI financial coach** personale — non un semplice expense tracker. L'utente dichiara obiettivi economici e l'AI propone piani realistici basati sulle spese reali dei mesi precedenti.

> "L'AI non ti chiede cosa vuoi fare, ti dice cosa puoi fare realisticamente."

PWA installabile su mobile, in italiano, pensata per giovani adulti (25-35) con uno stipendio.

## Stack

- React 18 + Vite, Recharts, inline styles (nessuna libreria UI)
- Supabase (PostgreSQL + Auth + RLS + Edge Functions)
- Anthropic API chiamata **solo dal server** (Edge Function `ai`): la chiave non è mai nel browser
- pdf.js e SheetJS installati da npm e caricati solo durante l'import
- Hosting: Vercel

## Setup

### 1. Database Supabase

1. Crea un progetto su [supabase.com](https://supabase.com)
2. Apri **SQL Editor** ed esegui, in quest'ordine:
   1. [`supabase-schema.sql`](supabase-schema.sql)
   2. [`migration-tx-date.sql`](migration-tx-date.sql)
   3. [`migration-buckets.sql`](migration-buckets.sql)
   4. [`migration-p0-security.sql`](migration-p0-security.sql) (consenso AI, limite giornaliero AI)
3. In **Authentication → Providers** verifica che Email sia attivo (signup con conferma email)
4. Copia da **Settings → API**: Project URL e publishable key

### 2. Edge Functions (AI ed eliminazione account)

Le funzioni sono in [`supabase/functions/`](supabase/functions): `ai` (proxy verso Anthropic con autenticazione,
consenso, limite giornaliero e system prompt lato server) e `delete-account`.

```bash
npx supabase login
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-... --project-ref <ref-del-progetto>
npx supabase functions deploy ai --project-ref <ref-del-progetto>
npx supabase functions deploy delete-account --project-ref <ref-del-progetto>
```

Secret opzionali della funzione `ai`:

| Secret | Default | A cosa serve |
|---|---|---|
| `ANTHROPIC_MODEL` | `claude-sonnet-4-6` | Modello usato dal coach |
| `AI_DAILY_LIMIT` | `60` | Richieste AI al giorno per utente |
| `ALLOWED_ORIGINS` | qualsiasi | Origini ammesse, separate da virgola (es. `https://tuo-dominio.it`) |

Imposta anche un **limite di spesa mensile** nella console Anthropic.

### 3. Variabili d'ambiente del frontend

Compila `.env` (vedi [`.env.example`](.env.example)):

```
VITE_SUPABASE_URL=<project url supabase>
VITE_SUPABASE_KEY=<publishable key supabase (sb_publishable_...)>
```

> ⚠️ Non mettere mai la chiave Anthropic in una variabile `VITE_*`: tutto ciò che inizia con `VITE_`
> finisce nel JavaScript pubblico. La build fallisce se trova una chiave nel bundle.

### 4. Avvio

```bash
npm install
npm run dev      # sviluppo su localhost:5173
npm test         # test unitari e test di fumo dell'interfaccia
npm run build    # build di produzione + controllo segreti nel bundle
```

### Deploy Vercel

Push su GitHub → import repo su Vercel → aggiungi le 2 variabili `VITE_SUPABASE_*` nelle Environment Variables → deploy.

### Prima di aprire al pubblico

- Completa i punti in rosso di [`public/privacy.html`](public/privacy.html) e [`public/termini.html`](public/termini.html) e falli verificare da un legale.
- Firma i DPA con Supabase e Anthropic.
- Vedi [`AUDIT-REPORT.md`](AUDIT-REPORT.md) per la roadmap completa (P1 e successivi).

## Funzionalità

- **Dashboard**: hero card con budget del mese, barra mesi, grafici (andamento 6 mesi + torta categorie), griglia categorie, transazioni principali
- **Obiettivi**: crea un obiettivo → "Analizza con AI" → l'AI calcola fattibilità, quota mensile e consiglia quale categoria tagliare basandosi sulle spese reali → "Accetta piano AI"
- **Import estratto conto**: PDF (pdf.js) o Excel (SheetJS) → categorizzazione automatica AI → review con checkbox → import
- **AI Coach Chat**: FAB in basso a destra, risponde con il contesto finanziario completo
- **Gestione**: spese, ricorrenti (toggle on/off), entrate (stipendio + extra mensili), categorie custom, account (coach AI on/off, esportazione dati, eliminazione account)
- **4 feature intelligenti**: insight proattivo giornaliero (banner), entrate variabili, report di fine mese (on-demand + banner automatico nei primi 5 giorni), spese ricorrenti applicate automaticamente

## Note tecniche

- **Deviazione dallo schema del brief**: `expenses.cat_id` e `recurring.cat_id` sono `text` invece di `integer`, perché le categorie di default hanno id `'1'`–`'8'` mentre le custom hanno id UUID — un integer non potrebbe referenziarle.
- **Icone PWA**: `public/icons/` contiene placeholder generati da `node scripts/gen-icons.mjs`. Sostituirle con icone reali prima della produzione.

## Stato rispetto all'audit

I punti P0 di [`AUDIT-REPORT.md`](AUDIT-REPORT.md) sono stati implementati nel codice (chiave AI lato server, librerie di import da npm,
gestione multi-anno, consenso AI, export ed eliminazione account, disclaimer). Restano da fare lato operativo: rotazione della chiave,
deploy delle Edge Function, completamento dei testi legali. I punti P1–P3 sono ancora aperti.

**Roadmap rimandata (non implementare ora):** modalità coppia/famiglia con budget condivisi.
