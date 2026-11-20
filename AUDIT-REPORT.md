# SpendIQ — Audit professionale pre-lancio

**Data:** 16 novembre 2026 · **Commit analizzato:** `0a3ee9b` (branch `main`, working tree pulito)
**Perimetro:** intero repository (17 file tracciati, ~2.900 righe di codice applicativo)
**Nessuna modifica al codice è stata fatta durante l'audit.**

Legenda gravità: **P0** bloccante · **P1** alta · **P2** media · **P3** bassa
Legenda stato: **[CONFERMATO]** verificato leggendo il codice e/o eseguendolo · **[RISCHIO]** plausibile ma dipende da dati/condizioni non verificabili · **[MIGLIORAMENTO]** facoltativo
Complessità: **S** < ½ giornata · **M** 1–3 giorni · **L** 4–10 giorni · **XL** > 2 settimane

---

## Aggiornamento del 16 novembre 2026 — stato dei P0

Il resto del documento descrive il codice **com'era al commit `0a3ee9b`**. Dopo l'audit sono stati implementati i P0:

| P0 | Stato nel codice | Cosa resta da fare a mano |
|---|---|---|
| SEC-1 Chiave Anthropic | ✅ Chiamate AI spostate nella Edge Function `supabase/functions/ai` (JWT, consenso, limite giornaliero, modello e system prompt lato server). La build fallisce se trova una chiave nel bundle. | Ruotare la chiave, impostarla come secret, fare il deploy delle funzioni, togliere `VITE_ANTHROPIC_KEY` da `.env` e da Vercel, impostare un tetto di spesa |
| SEC-2 / SEC-3 pdf.js e SheetJS | ✅ `pdfjs-dist` 6.5 e `xlsx` 0.20.3 da npm, caricati solo all'import; `loadScript` rimosso | — |
| BUG-1 Anno solare | ✅ Dati caricati senza filtro sull'anno e paginati, selettore anno, media/riporto/grafico/report a cavallo d'anno | — |
| Privacy, consenso, account | ✅ Consenso esplicito al coach AI (verificato anche dal server), esportazione dati, eliminazione account, accettazione termini alla registrazione, bozze di `privacy.html` e `termini.html` | Completare i segnaposto nei testi legali e farli verificare; firmare i DPA |
| Disclaimer coach | ✅ System prompt con limiti lato server, avviso in chat e nel consenso | Verifica legale del posizionamento |

In più, emersi durante il lavoro e corretti: il limite di 1000 righe per richiesta di Supabase (le spese oltre la millesima non venivano caricate) e il reinserimento delle ricorrenti quando il caricamento iniziale falliva.

**Verificato:** 20 test automatici (logica dei periodi, riporto, interfaccia simulata al 3 gennaio 2027), build, controllo segreti nel bundle, schermata di registrazione nel browser.
**Non verificato:** le Edge Function non sono state eseguite né deployate (serve il tuo progetto Supabase); il parsing di PDF/Excel reali con le nuove versioni delle librerie; i flussi con login reale.

---

## 0. Cosa è stato realmente testato

| Verifica | Eseguita? | Esito |
|---|---|---|
| Lettura completa di tutti i file sorgente, SQL, config | ✅ Sì | — |
| `npm run build` | ✅ Sì | Build OK, un solo chunk JS da **855 kB** (236 kB gzip), warning di Vite |
| Ricerca della chiave Anthropic nel bundle di produzione `dist/` | ✅ Sì | **Chiave presente in chiaro** in `dist/assets/index-*.js` |
| `npm audit` / `npm outdated` | ✅ Sì | 0 vulnerabilità runtime; 7 (5 high) solo in dev-dependencies (catena Vite 5) |
| Esecuzione in Node delle funzioni pure (`parseAmount`, `extractTx`, `markDuplicates`, `RIC_KEYWORDS`) con casi limite | ✅ Sì | Bug confermati (vedi §3) |
| Avvio dev server e schermata di login a 375×812 (mobile) | ✅ Sì | Rendering OK; problemi di accessibilità confermati dall'albero di accessibilità |
| Contrasto colori della palette (calcolo WCAG) | ✅ Sì | Diversi colori sotto soglia AA |
| Login/registrazione e tutti i flussi autenticati (dashboard, spese, piano, obiettivi, import, chat) | ❌ **No** | Richiederebbe credenziali su un servizio esterno (Supabase) e chiamate a pagamento ad Anthropic. Valutati solo tramite lettura del codice |
| Test con estratti conto reali (PDF/Excel Intesa/Easybank) | ❌ No | Nessun file di esempio nel repo |
| Comportamento offline / errori di rete | ❌ No (analisi statica) | Il codice non gestisce gli errori nella maggior parte dei casi |
| Test su dispositivi fisici Android/iOS | ❌ No | Differenze descritte in base al codice e alle convenzioni note delle piattaforme |

---

## 1. Comprensione del progetto (Fase 1)

**Cos'è davvero:** non è un'app nativa Android/iOS. È una **PWA web** (React 18 + Vite) servita da browser, installabile sulla home. Questa distinzione è fondamentale per la valutazione di pubblicazione negli store (§9).

| Livello | Tecnologia |
|---|---|
| UI | React 18.3, stili inline, Recharts 2.15 per i grafici, font Inter da Google Fonts |
| Backend/DB | Supabase (PostgreSQL + Auth email/password + Row Level Security), chiamato direttamente dal browser |
| AI | API Anthropic chiamata **direttamente dal browser** con `anthropic-dangerous-direct-browser-access`, modello `claude-sonnet-4-6` hardcoded |
| Parsing file | pdf.js 3.11.174 e SheetJS 0.20.1 caricati a runtime da CDN esterne |
| Hosting previsto | Vercel (da README) |
| Test / lint / CI / TypeScript | **Assenti** |

**Struttura:** praticamente tutta l'app è in un unico file, [src/App.jsx](src/App.jsx) (2.632 righe): design system, helper, 12 componenti, logica di business, chiamate AI, accesso al DB.

**Schermate e flussi principali**
1. **Login / Registrazione** (`AuthScreen`)
2. **Dashboard**: barra mesi, banner insight AI, banner report, banner ricorrenti rilevate, card "Speso", **Piano del mese** (buste Spesa / Svago / Salvadanaio con riporto), obiettivi, grafico 6 mesi, torta categorie, griglia categorie, transazioni principali
3. **Dettaglio categoria**
4. **Obiettivi**: lista + creazione → "Analizza con AI" → "Accetta piano AI"
5. **Import estratto conto**: PDF/Excel → categorizzazione AI → rilevamento duplicati → revisione → import
6. **Gestione**: tab Spese / Ricorrenti / Entrate / Categorie
7. **Modali**: nuova/modifica spesa, stipendio, entrata extra, report mensile, piano di gestione, conferma ricorrenti
8. **Chat AI Coach** (pannello flottante)

**Automatismi:** inserimento automatico delle ricorrenti a ogni caricamento, rinnovo automatico del piano a inizio mese, insight giornaliero, rilevamento ricorrenti.

---

## 2. Valutazione generale

| Area | Voto | Sintesi |
|---|---|---|
| Idea e proposta di valore | 7/10 | Buona: "budget a buste + coach AI che conosce i tuoi numeri" è un concetto chiaro e utile per il target 25–35 |
| UI visiva | 7/10 | Pulita, coerente, moderna. Stile curato per un prototipo |
| UX e flussi | 5/10 | Ricca di funzioni ma con incoerenze, cancellazioni senza conferma, nessuna navigazione "indietro", onboarding assente |
| Qualità del codice / architettura | 3/10 | Monolite da 2.600 righe, logica e UI mescolate, errori ignorati quasi ovunque, nessun test |
| Sicurezza e privacy | **2/10** | **Chiave API esposta pubblicamente**, librerie da CDN senza integrità con CVE nota, nessuna informativa privacy |
| Correttezza dei dati | 4/10 | Bug strutturale al cambio d'anno, ricorrenti che "resuscitano", salvataggi falliti mostrati come riusciti |
| Accessibilità | 2/10 | Nessun attributo ARIA, zoom disabilitato, contrasti insufficienti, controlli non raggiungibili da tastiera |
| Prontezza al rilascio commerciale | **2/10** | Adatta a un beta chiuso **solo dopo** aver risolto i P0 |

**Giudizio sintetico:** un prototipo funzionale e ben presentato, con una buona intuizione di prodotto, ma **non pubblicabile**. Ha almeno un problema di sicurezza che può costare denaro reale dal primo giorno online, diversi bug che corrompono o nascondono i dati dell'utente, e mancano tutti i requisiti legali/di store per un'app finanziaria.

### Punti di forza
- **RLS attivo su tutte le tabelle** con policy `auth.uid() = user_id`: i dati di un utente non sono leggibili da altri anche se la chiave Supabase è pubblica (corretto by design).
- I testi generati dall'AI sono resi come testo React, **mai con `dangerouslySetInnerHTML`** → nessun XSS dalle risposte del modello.
- `parseAmount` gestisce correttamente la virgola italiana nei casi comuni (`15,53`, `1.234,56`).
- Il contesto finanziario passato all'AI (`buildContext`) è compatto e non include email o dati identificativi.
- Il concetto di buste con riporto e salvadanaio distribuito proporzionalmente sugli obiettivi è originale e sensato.
- Stati di caricamento e stati vuoti presenti in quasi tutte le schermate.
- L'import segnala e deseleziona i probabili duplicati prima dell'inserimento.

### Punti di debolezza
- Sicurezza della chiave AI e delle librerie esterne.
- Tutti i dati sono legati all'**anno solare corrente**: il 1° gennaio l'app "dimentica" lo storico.
- Gli errori di rete e DB sono quasi sempre ignorati in silenzio.
- La logica economica critica (quota mensile, fattibilità di un obiettivo) è delegata all'LLM invece che calcolata.
- Posizionamento "consulente finanziario" senza tutele legali.

---

## 3. Problemi tecnici (Fase 2 — Code review)

### 3.1 Sicurezza

#### SEC-1 · Chiave API Anthropic esposta nel bundle pubblico — **P0** [CONFERMATO]
- **Evidenza:** [App.jsx:249](src/App.jsx:249) e [App.jsx:268](src/App.jsx:268) leggono `import.meta.env.VITE_ANTHROPIC_KEY`; Vite incorpora tutte le variabili `VITE_*` nel JS. Verificato: la chiave `sk-ant-…` è presente in chiaro in `dist/assets/index-CLhFo92o.js`. Il README stesso lo riconosce (§"Refactor prioritari").
- **Impatto:** chiunque apra il sito, **anche senza registrarsi**, può estrarre la chiave dagli strumenti sviluppatore e usarla per qualunque scopo a tue spese, senza limiti. Rischio economico diretto, sospensione dell'account Anthropic, abuso per contenuti vietati attribuiti al tuo account.
- **Soluzione:** spostare tutte le chiamate AI su un backend (Supabase Edge Function o Vercel Serverless Function) che: verifica il JWT Supabase dell'utente, costruisce il prompt lato server, applica un rate limit per utente (es. N richieste/giorno) e un tetto di spesa. **Ruotare subito la chiave attuale** se è mai stata deployata o condivisa. Impostare un limite di spesa nella console Anthropic.
- **Verifica:** `grep -r "sk-ant" dist/` deve restituire zero risultati; nel tab Network del browser nessuna richiesta verso `api.anthropic.com`; una chiamata all'endpoint senza JWT valido deve restituire 401.
- **Complessità:** M

#### SEC-2 · pdf.js 3.11.174 vulnerabile a esecuzione di codice tramite PDF malevolo (CVE-2024-4367) — **P0** [CONFERMATO nel codice / RISCHIO di sfruttamento]
- **Evidenza:** [App.jsx:1009-1011](src/App.jsx:1009) carica pdf.js 3.11.174 e chiama `getDocument({ data })` **senza** `isEvalSupported: false`. Le versioni di pdf.js precedenti alla 4.2.67 sono vulnerabili a esecuzione di JavaScript arbitrario tramite font manipolati, a meno di quella opzione.
- **Impatto:** un PDF costruito ad arte (es. "estratto conto" ricevuto via email) può eseguire codice nell'origine dell'app → furto del token di sessione Supabase (in `localStorage`) e, finché resta nel client, della chiave Anthropic. In un'app finanziaria è grave.
- **Soluzione:** aggiornare pdf.js a una versione corrente installata via npm (`pdfjs-dist`) e impacchettata nel bundle, passare comunque `isEvalSupported: false`. Valutare il parsing lato server.
- **Verifica:** versione in `package-lock.json` ≥ 4.2.67; test con PDF di prova pubblici per la CVE (in ambiente isolato).
- **Complessità:** S–M

#### SEC-3 · Script di terze parti caricati da CDN senza Subresource Integrity — **P1** [CONFERMATO]
- **Evidenza:** `loadScript` ([App.jsx:283-293](src/App.jsx:283)) inietta `<script>` da `cdnjs.cloudflare.com` e `cdn.sheetjs.com` senza attributo `integrity`. Anche SheetJS 0.20.1 è inferiore alla 0.20.2, che corregge un ReDoS (CVE-2024-22363).
- **Impatto:** se la CDN viene compromessa o serve un file alterato, codice esterno gira con accesso ai dati finanziari e alla sessione. Dipendenza a runtime da tre domini esterni, quindi anche fragilità (l'import non funziona se la CDN è irraggiungibile).
- **Soluzione:** installare `pdfjs-dist` e `xlsx` (dal tarball ufficiale SheetJS ≥ 0.20.2) come dipendenze npm, importarli con `import()` dinamico (così restano fuori dal bundle iniziale). Aggiungere una Content-Security-Policy.
- **Verifica:** nessun `document.createElement('script')` nel codice; scheda Network senza richieste a CDN durante l'import.
- **Complessità:** S

#### SEC-4 · Nessuna Content-Security-Policy né header di sicurezza — **P2** [CONFERMATO]
- **Evidenza:** nessun `vercel.json` / header; [index.html](index.html) senza meta CSP.
- **Impatto:** nessuna mitigazione in caso di XSS (vedi SEC-2).
- **Soluzione:** `vercel.json` con CSP (`script-src 'self'`, `connect-src` limitato a Supabase e al proprio backend), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- **Verifica:** securityheaders.com o `curl -I` sul deploy.
- **Complessità:** S

#### SEC-5 · Funzione trigger `security definer` senza `search_path` fisso — **P3** [CONFERMATO]
- **Evidenza:** [supabase-schema.sql:95-101](supabase-schema.sql:95).
- **Impatto:** pratica sconsigliata da Supabase (il linter la segnala); rischio basso nel tuo setup.
- **Soluzione:** aggiungere `set search_path = public` alla definizione.
- **Verifica:** Supabase → Advisors → Security senza avvisi.
- **Complessità:** S

#### SEC-6 · Nessun vincolo di validazione lato DB — **P2** [CONFERMATO]
- **Evidenza:** lo schema non ha `CHECK` su `amount > 0`, `month between 0 and 11`, lunghezza massima di `note`/`name`, né `UNIQUE` sulle spese ricorrenti generate.
- **Impatto:** un client modificato (o un bug) può scrivere dati incoerenti che rompono i calcoli; nessuna difesa contro inserimenti doppi (vedi BUG-3).
- **Soluzione:** aggiungere `CHECK` e un indice unico parziale `(user_id, recurring_id, year, month) WHERE recurring_id IS NOT NULL`.
- **Verifica:** tentativo di insert con `amount = -5` restituisce errore.
- **Complessità:** S

### 3.2 Bug funzionali e di correttezza dei dati

#### BUG-1 · Tutta l'app è vincolata all'anno solare corrente — **P0** [CONFERMATO]
- **Evidenza:** `YEAR = now.getFullYear()` ([App.jsx:1537](src/App.jsx:1537)); `loadAll` scarica solo `expenses`, `incomes`, `budgets` con `.eq('year', YEAR)` ([App.jsx:1580-1585](src/App.jsx:1580)); dopo il salvataggio le spese di un altro anno vengono rimosse dallo stato (`.filter(e => e.year === YEAR)`, [App.jsx:1964](src/App.jsx:1964), [1978](src/App.jsx:1978), [2052](src/App.jsx:2052)); il banner del report di dicembre è disattivato a gennaio (`prevMYear === YEAR`, [App.jsx:1805](src/App.jsx:1805)); il grafico "6 mesi" mostra 0 per i mesi dell'anno precedente ([App.jsx:2072](src/App.jsx:2072)); `generatePlan` non trova il "mese scorso" a gennaio ([App.jsx:1842](src/App.jsx:1842)); il riporto delle buste si azzera ([App.jsx:1659](src/App.jsx:1659)); la barra mesi non ha selettore anno.
- **Impatto:** dal 1° gennaio 2027 (tra ~6 settimane) ogni utente vedrà dashboard vuota, media spese azzerata, piano AI senza storico, report di dicembre irraggiungibile. Una spesa inserita a gennaio con data di dicembre **sparisce dall'interfaccia subito dopo il salvataggio** (salvata nel DB ma invisibile). È il tipico errore da prototipo generato con l'AI e testato in un solo periodo.
- **Soluzione:** ragionare per "periodo" (`year*12+month`) invece che per anno; caricare almeno gli ultimi 12–13 mesi; aggiungere un selettore anno; calcolare riporti e medie su finestre mobili.
- **Verifica:** test automatici con data simulata (`vi.setSystemTime('2027-01-03')`) su: media spese, grafico 6 mesi, report dicembre, salvataggio spesa con data dell'anno precedente.
- **Complessità:** M–L

#### BUG-2 · Le spese ricorrenti cancellate ricompaiono a ogni apertura — **P1** [CONFERMATO]
- **Evidenza:** [App.jsx:1598-1608](src/App.jsx:1598): a ogni `loadAll`, per ogni ricorrente attiva senza una spesa collegata nel mese corrente viene inserita una nuova spesa. Se l'utente elimina la spesa auto-generata (es. "quest'anno Netflix l'ho saltato"), al successivo caricamento viene reinserita.
- **Impatto:** l'utente non riesce a correggere i propri dati senza disattivare la ricorrente; frustrazione e numeri sbagliati.
- **Soluzione:** registrare l'"applicazione" della ricorrente per mese (tabella o colonna `last_applied_period` sulla ricorrente) e inserire solo se non già applicata, indipendentemente dall'esistenza della spesa. Meglio ancora: farlo lato server con un job pianificato (pg_cron / Edge Function schedulata).
- **Verifica:** elimina la spesa ricorrente del mese → ricarica → non deve ricomparire.
- **Complessità:** S–M

#### BUG-3 · Inserimento ricorrenti duplicato con più dispositivi/tab, e mancante se l'app non viene aperta — **P1** [RISCHIO]
- **Evidenza:** stessa logica client-side senza vincolo unico nel DB. Due tab o telefono+PC aperti a inizio mese eseguono entrambi l'insert. In sviluppo (`React.StrictMode`, [main.jsx:6](src/main.jsx:6)) l'effetto può girare due volte. Inoltre la ricorrente viene applicata solo al mese in cui l'app viene aperta, con data = oggi (non la data reale di addebito): se l'utente non apre l'app a marzo, marzo non avrà le ricorrenti.
- **Impatto:** spese doppie o mancanti → budget errati.
- **Soluzione:** indice unico (vedi SEC-6) + generazione server-side schedulata con giorno di addebito configurabile.
- **Verifica:** aprire due tab contemporaneamente all'inizio di un mese simulato; controllare il numero di righe.
- **Complessità:** M

#### BUG-4 · Salvataggi falliti mostrati come riusciti (errori ignorati) — **P1** [CONFERMATO]
- **Evidenza:**
  - `ExpenseModal.save` chiude sempre il modale dopo `onSave`, che non restituisce esito ([App.jsx:416-423](src/App.jsx:416)); `saveExpense` ignora gli errori diversi da colonne mancanti ([App.jsx:1948-1980](src/App.jsx:1948)).
  - `deleteExpense`, `deleteIncome`, `deleteRecurring`, `deleteGoal`, `deleteCategory` rimuovono l'elemento dallo stato **anche se la DELETE fallisce** ([App.jsx:1982-2043](src/App.jsx:1982)).
  - `saveSalary` aggiorna lo stato prima e ignora l'errore ([App.jsx:1987-1990](src/App.jsx:1987)).
  - L'import mostra "Import completato" qualunque sia l'esito ([App.jsx:1086-1093](src/App.jsx:1086)). Verificato in Node: una data come `31/02/2026` produce `tx_date: "2026-02-31"`, che PostgreSQL rifiuta → **l'intero lotto non viene salvato** ma l'utente vede "completato".
  - `loadAll` non controlla gli errori delle 7 query: con rete instabile l'utente vede un'app vuota come se non avesse dati.
  - `askAI` non controlla `res.ok`: chiave scaduta, credito esaurito (402/429/529) diventano risposte vuote; ogni messaggio dice "Verifica la chiave API Anthropic", testo inadatto a un utente finale.
- **Impatto:** perdita silenziosa di dati e fiducia; dati sullo schermo diversi da quelli nel DB.
- **Soluzione:** uno strato dati unico (`api.js`) che lancia errori; ogni azione mostra un toast di errore e non chiude il modale; aggiornamenti ottimistici con rollback; validazione delle date; messaggi d'errore pensati per l'utente.
- **Verifica:** DevTools → Network → Offline, poi aggiungi/elimina una spesa: deve comparire un errore e lo stato non deve cambiare.
- **Complessità:** M

#### BUG-5 · `parseAmount("1.500")` restituisce 1,5 € — **P1** [CONFERMATO]
- **Evidenza:** [App.jsx:168-174](src/App.jsx:168). Testato: `"1.500" → 1.5`, `"1,2,3" → 1.2`, `"1e3" → 1000`.
- **Impatto:** un utente italiano che scrive lo stipendio "1.500" o un obiettivo "10.000" salva un valore mille volte più piccolo. Stipendio e obiettivi sono la base di tutti i calcoli e dei consigli AI.
- **Soluzione:** regola esplicita per la locale italiana: il punto seguito da esattamente 3 cifre è separatore delle migliaia; rifiutare input ambigui o con più separatori decimali; mostrare l'importo interpretato sotto il campo.
- **Verifica:** test unitari su `1.500`, `1.500,50`, `12.5`, `12,5`, `1,2,3`, `abc`.
- **Complessità:** S

#### BUG-6 · Quota mensile e fattibilità degli obiettivi calcolate dall'LLM — **P1** [CONFERMATO]
- **Evidenza:** `analyzeGoal` chiede al modello di "calcolare la quota mensile" e decidere `raggiungibile` ([App.jsx:1830-1835](src/App.jsx:1830)); il valore `mensile` viene salvato come `monthly_ai` e usato per distribuire il salvadanaio ([App.jsx:1687-1692](src/App.jsx:1687)). Allo stesso modo `generatePlan` si fida della divisione proposta dall'AI, controllando solo che sia un numero finito ([App.jsx:597](src/App.jsx:597)).
- **Impatto:** gli LLM sbagliano l'aritmetica in modo non deterministico; un numero errato diventa la "quota ufficiale" e guida la ripartizione dei risparmi. Il verdetto "raggiungibile" può contraddire i numeri mostrati.
- **Soluzione:** calcolare in codice quota = (target − risparmiato) / mesi e fattibilità = quota ≤ margine; chiedere all'AI solo il consiglio testuale, passandole i numeri già calcolati. Validare l'output dell'AI con uno schema (o usare structured outputs / tool use).
- **Verifica:** test unitari sul calcolo; confronto su 20 obiettivi tra numero mostrato e formula.
- **Complessità:** S

#### BUG-7 · Il riporto delle buste può gonfiarsi o falsarsi — **P2** [RISCHIO]
- **Evidenza:** `carryFor` ([App.jsx:1657-1668](src/App.jsx:1657)) somma budget − speso per **tutti** i mesi pianificati, inclusi mesi futuri pianificati per errore e mesi in cui l'utente non ha registrato spese. Il rinnovo automatico ([App.jsx:1672-1684](src/App.jsx:1672)) copia il piano precedente, incluso il valore `ricorrenti` non più aggiornato.
- **Impatto:** se l'utente smette di registrare per un mese, a quello successivo risulta un "tesoretto" inesistente; consigli AI basati su residui falsi.
- **Soluzione:** riporto solo dal mese immediatamente precedente (o opzione esplicita), mai dai mesi futuri; ricalcolare `ricorrenti` al rinnovo; mostrare all'utente da dove viene il riporto.
- **Verifica:** scenario simulato: piano a settembre senza spese → ottobre deve mostrare un riporto spiegato e limitabile.
- **Complessità:** S–M

#### BUG-8 · Parser estratto conto fragile e legato a un formato — **P1** [CONFERMATO / RISCHIO]
- **Evidenza:** `extractTx` ([App.jsx:983-1005](src/App.jsx:983)) riconosce un'uscita solo se l'importo ha il segno meno. Testato: una riga con colonna "Dare" senza segno (`45,20`) restituisce **zero transazioni**. Nessuna validazione della data (`31/02` accettato). Il parser Excel ([App.jsx:1029-1058](src/App.jsx:1029)) usa come descrizione la stringa più lunga della riga e prende il primo numero negativo, euristica che può scegliere la colonna sbagliata. Nessun limite al numero di righe (costo AI illimitato). Le entrate (accrediti) vengono ignorate.
- **Impatto:** con molte banche l'import non trova nulla o importa importi/descrizioni errati. L'interfaccia dichiara supporto "Intesa Sanpaolo / Easybank", non verificabile senza file campione.
- **Soluzione:** profili di parsing per banca + mappatura manuale delle colonne per Excel/CSV; supporto CSV; anteprima con correzione inline di categoria/importo; limite di righe; test con file anonimizzati reali.
- **Verifica:** suite di fixture (un file per banca supportata) con risultati attesi.
- **Complessità:** L

#### BUG-9 · Rilevamento duplicati e ricorrenti con falsi positivi — **P3** [CONFERMATO]
- **Evidenza:** `markDuplicates` ([App.jsx:216-227](src/App.jsx:216)) marca come "doppione" due acquisti legittimi uguali nello stesso giorno (testato). `RIC_KEYWORDS` ([App.jsx:194](src/App.jsx:194)) riconosce "via **ferrata** shop" (`rata `), "c**hera**tina" (`hera`), "pizza **anytime**" come abbonamenti (testato).
- **Impatto:** basso (sono solo suggerimenti deselezionati), ma generano rumore.
- **Soluzione:** confini di parola (`\b`), confronto anche sulla descrizione per i doppioni.
- **Verifica:** test unitari sui casi sopra.
- **Complessità:** S

#### BUG-10 · `confirmSalvadanaio` non atomico — **P2** [CONFERMATO]
- **Evidenza:** [App.jsx:1880-1897](src/App.jsx:1880): N update separati sugli obiettivi, poi l'update del budget; nessun controllo d'errore. Se uno fallisce, alcuni obiettivi risultano incrementati e il salvadanaio non risulta accantonato → premendo di nuovo si **conta due volte**.
- **Soluzione:** funzione Postgres (RPC) transazionale.
- **Verifica:** simulare un errore a metà (rete offline dopo il primo update).
- **Complessità:** S

#### BUG-11 · Minori — **P3** [CONFERMATO]
- Insight giornaliero memorizzato in `sessionStorage` con data UTC ([App.jsx:1789](src/App.jsx:1789)): una chiamata AI per ogni nuova scheda/apertura PWA invece di una al giorno.
- `fmt()` mostra `45,2 €` invece di `45,20 €` (manca `minimumFractionDigits: 2`).
- `new Date(g.deadline)` interpreta `YYYY-MM-DD` come UTC ([App.jsx:766](src/App.jsx:766)): corretto in Italia, sbagliato di un giorno nei fusi negativi.
- Si possono creare piani per mesi futuri e obiettivi con scadenza passata o target ≤ 0 (nessuna validazione).
- "Aggiungi entrata" nella Gestione ([App.jsx:1335-1337](src/App.jsx:1335)) senza stato busy: doppio tap = doppia entrata.

### 3.3 Architettura, manutenibilità, codice "tipico da AI"

| ID | Problema | Gravità | Complessità |
|---|---|---|---|
| ARC-1 | **Monolite** da 2.632 righe in [App.jsx](src/App.jsx): design system, business logic, accesso dati, prompt AI e UI nello stesso file; il componente `App` ha 22 `useState` e ~500 righe di logica. Ogni modifica rischia regressioni. | P1 | L |
| ARC-2 | **Zero test**, nessun linter, nessun type-checking, nessuna CI. Per un'app che calcola soldi è il primo investimento da fare (prima del refactor). | P1 | M |
| ARC-3 | **Fallback "a regex sui messaggi d'errore"** per colonne non ancora migrate (`/bucket/i.test(error.message)`, [App.jsx:1935-1946](src/App.jsx:1935), [1956-1963](src/App.jsx:1956), [1750](src/App.jsx:1750)): workaround che maschera errori reali. Sostituire con migration versionate (`supabase/migrations/`, Supabase CLI) e rimuovere i fallback. | P2 | S |
| ARC-4 | **Codice duplicato**: `askAI`/`askAIChat` identiche ([App.jsx:244-276](src/App.jsx:244)); calcolo "speso per busta" ripetuto 4 volte; calcolo mesi rimanenti ripetuto 3 volte; markup di card spesa con matita/cestino ripetuto 3 volte; spinner ripetuto 7 volte. | P2 | S |
| ARC-5 | **Nessun routing**: la vista corrente è uno `useState` ([App.jsx:1550](src/App.jsx:1550)). Su Android il tasto/gesto Indietro chiude l'app invece di tornare alla schermata precedente; nessun deep link. | P1 | S–M |
| ARC-6 | **Modello AI hardcoded** in due punti (`claude-sonnet-4-6`); nessuna configurazione centralizzata, nessun timeout o retry, nessun `AbortController`. Verificare la data di ritiro del modello e centralizzarlo (sarà comunque spostato lato server). | P2 | S |
| ARC-7 | **Prompt senza system prompt** né guardrail; il contesto finanziario viene concatenato nel messaggio utente. Le risposte della chat sono limitate a "massimo 2 frasi" con 200 token: troppo poco per un "consulente". | P2 | S |
| ARC-8 | **Prestazioni**: bundle unico da 855 kB (Recharts incluso subito); `cats.find` e `filter` ripetuti in render su tutte le spese dell'anno; funzioni ricreate a ogni render. Accettabile con pochi dati, degrada con migliaia di righe. Code-splitting delle viste (`React.lazy`) e indicizzazione per mese. | P2 | M |
| ARC-9 | **Dipendenze**: tutte senza vulnerabilità runtime, ma React 18 (attuale 19), Vite 5 (attuale 8, con 5 vulnerabilità high nella catena di build in dev), Recharts 2 (attuale 3). Non urgente; pianificare aggiornamento dopo i test. | P3 | M |
| ARC-10 | **Stato locale non sincronizzato**: candidati ricorrenti scartati salvati in `localStorage` (si ripresentano su altro dispositivo); nessun refresh dei dati se modificati da un altro dispositivo. | P3 | S |

---

## 4. UI/UX (Fase 3)

> Valutazione basata sul codice e sulla schermata di login realmente visualizzata a 375×812. Le schermate autenticate non sono state viste a runtime.

### Cosa funziona
Stile coerente (palette, raggi, spaziature), gerarchia tipografica chiara nella card "Speso", buone scelte di stati vuoti con call-to-action, layout centrato a 480 px adatto al mobile, rispetto di `safe-area-inset-bottom` nella nav.

### Problemi

| ID | Problema | Evidenza | Gravità | Soluzione | Complessità |
|---|---|---|---|---|---|
| UX-1 | **Cancellazioni senza conferma né annulla** (spese, entrate, ricorrenti, sottocategorie); un tap sul cestino da 15 px accanto alla matita cancella definitivamente | [App.jsx:2477](src/App.jsx:2477), [2534](src/App.jsx:2534), [1262](src/App.jsx:1262), [1300](src/App.jsx:1300), [1351](src/App.jsx:1351), [2221](src/App.jsx:2221) | P1 | Snackbar "Eliminata · Annulla" (soft delete) o swipe-to-delete con conferma | S |
| UX-2 | **Nessun onboarding**: al primo accesso stipendio = 0, dashboard "su 0 € di entrate", piano non creabile in modo sensato | flusso `loadAll` | P1 | Wizard 3 step: stipendio → ricorrenti principali → primo piano | M |
| UX-3 | **Tasto Indietro Android** chiude l'app (vedi ARC-5); i modali non si chiudono con Indietro né con Esc | [App.jsx:365-385](src/App.jsx:365) | P1 | History API / router; chiusura modale su `popstate` ed Esc | S–M |
| UX-4 | Tap sullo sfondo del modale **chiude e perde i dati** inseriti | [App.jsx:367](src/App.jsx:367) | P2 | Chiedere conferma se il form è "sporco" | S |
| UX-5 | **Troppi concetti sovrapposti** in dashboard: categorie *e* buste *e* salvadanaio *e* obiettivi *e* margine; "Rimanente" (entrate − speso) e "Da vivere" (entrate − ricorrenti − salvadanaio) sono due numeri diversi per la stessa domanda "quanto posso spendere?" | [App.jsx:2207-2211](src/App.jsx:2207), [2255](src/App.jsx:2255) | P1 | Un solo numero eroe: "Puoi ancora spendere X € fino al 30" basato sulle buste; categorie in secondo piano | M |
| UX-6 | "Transazioni principali" ordinate per importo, non per data: l'utente cerca l'ultima spesa inserita | [App.jsx:2078](src/App.jsx:2078) | P2 | Lista "Ultime spese" per data + link "Vedi tutte" | S |
| UX-7 | FAB chat nero sovrapposto al contenuto, pannello chat fisso 480 px: su iOS con tastiera aperta l'input può finire coperto | [App.jsx:1480-1484](src/App.jsx:1480) | P2 | Chat a schermo intero su mobile, `visualViewport` / `dvh` | S |
| UX-8 | Messaggi d'errore tecnici rivolti all'utente finale ("Verifica la chiave API Anthropic", "esegui migration-buckets.sql nell'SQL Editor") | [App.jsx:546](src/App.jsx:546), [1872](src/App.jsx:1872) | P1 | Testi utente + logging tecnico separato | S |
| UX-9 | Errori Supabase mostrati in inglese al login ("Invalid login credentials") | [App.jsx:311](src/App.jsx:311) | P2 | Mappa errori → italiano | S |
| UX-10 | Mancano "Password dimenticata?", cambio email/password, eliminazione account, esportazione dati | `AuthScreen` | P0 per gli store (vedi §9) | Flussi Supabase `resetPasswordForEmail` + pagina profilo | M |
| UX-11 | Nessun indicatore di anno; mesi futuri cliccabili senza distinzione visiva | [App.jsx:2130-2139](src/App.jsx:2130) | P2 | Selettore mese/anno, mesi futuri attenuati | S |
| UX-12 | Il valore dei grafici non è leggibile senza tooltip (asse Y nascosto); torta senza alternativa testuale completa | [App.jsx:2394](src/App.jsx:2394) | P3 | Etichetta valore max/medio | S |
| UX-13 | Importi con un solo decimale ("45,2 €") | `fmt` | P3 | 2 decimali fissi | S |

### Accessibilità (WCAG 2.2 AA) — oggi **non conforme**

| ID | Problema | Evidenza | Gravità |
|---|---|---|---|
| A11Y-1 | **Zoom disabilitato** (`maximum-scale=1, user-scalable=no`) | [index.html:5](index.html:5) | P1 |
| A11Y-2 | **Nessun attributo ARIA** in tutto il codice; pulsanti solo-icona (logout, chiudi, cestino, matita, "+", invio chat) senza nome accessibile | verificato con grep e albero di accessibilità | P1 |
| A11Y-3 | Label non associate agli input (`<label>` senza `htmlFor`): lo screen reader annuncia il placeholder ("••••••••") invece di "Password" | [App.jsx:86-95](src/App.jsx:86), verificato nel browser | P1 |
| A11Y-4 | Controlli fatti con `<div>`/`<span>` cliccabili (link "Registrati", toggle ricorrenti, checkbox import, selettore colore, chiusura banner): non raggiungibili da tastiera, nessun ruolo | [App.jsx:352](src/App.jsx:352), [1291](src/App.jsx:1291), [1162](src/App.jsx:1162), [1367](src/App.jsx:1367) | P1 |
| A11Y-5 | Contrasti insufficienti (calcolati): testo secondario `#8A8A9A` su bianco **3,40:1**, su sfondo app **3,15:1**; etichette nav inattive `#C4C4CC` **1,73:1**; ambra su ambra chiaro **3,07:1** (minimo AA testo normale: 4,5:1) | palette `P` [App.jsx:10-17](src/App.jsx:10) | P1 |
| A11Y-6 | Target di tocco sotto 44×44 px (cestino/matita ~23 px, "x" dei chip entrate ~15 px) | vari | P2 |
| A11Y-7 | Modali senza `role="dialog"`, focus trap, ritorno del focus; i nuovi messaggi chat non sono annunciati (`aria-live`) | [App.jsx:365](src/App.jsx:365), [1497](src/App.jsx:1497) | P2 |
| A11Y-8 | Colore unica informazione per stato (verde/arancio/rosso delle buste) | [App.jsx:191](src/App.jsx:191) | P3 |

**Complessità complessiva accessibilità:** M (2–3 giorni con una piccola libreria di componenti accessibili).

### Coerenza con le convenzioni delle piattaforme
- **Android:** gestione del tasto Indietro mancante (critico); nessuna icona "maskable" nel manifest (l'icona verrà ritagliata); `theme_color` del manifest (`#2563EB`) diverso dal meta `theme-color` (`#ffffff`).
- **iOS:** nessuna `apple-touch-icon` (verificato) → sulla home compare uno screenshot; senza service worker né splash screen; `apple-mobile-web-app-capable` è deprecato in favore del manifest; limiti di storage e notifiche delle PWA su iOS.
- **Entrambe:** nessuna modalità scura (`prefers-color-scheme`), nessun supporto alla dimensione testo di sistema (font in px fissi), icone PWA placeholder (quadrato blu con cerchio).

---

## 5. Vulnerabilità e rischi (riepilogo)

| Rischio | Tipo | Gravità |
|---|---|---|
| Chiave Anthropic pubblica → costi illimitati / abuso | Sicurezza, economico | **P0** |
| pdf.js con CVE-2024-4367 → esecuzione codice da PDF → furto sessione | Sicurezza | **P0** |
| Script da CDN senza SRI, SheetJS < 0.20.2 | Supply chain | P1 |
| Dati finanziari inviati a un fornitore AI USA senza informativa, base giuridica né DPA | **GDPR** (art. 13, 28, 44 ss.) | **P0** per il lancio pubblico |
| Assenza di privacy policy, termini d'uso, cancellazione account ed esportazione dati | GDPR (art. 15, 17, 20), requisiti store | **P0** per il lancio pubblico |
| Chatbot presentato come "consulente finanziario" che può dare indicazioni su ETF/crypto/investimenti senza disclaimer: in Italia la consulenza in materia di investimenti è attività riservata (TUF) | Legale/regolamentare | **P1** — da verificare con un legale |
| Obblighi di trasparenza sull'uso dell'AI (AI Act, applicabili da agosto 2026) | Regolamentare | P2 — da verificare con un legale |
| Google Fonts caricati da server Google (trasferimento IP) | GDPR, precedente giurisprudenziale UE | P3 — self-host del font |
| Nessun monitoraggio errori (Sentry o simili) né analytics di prodotto | Operativo | P2 |
| Nessun backup/strategia di migrazione documentata | Operativo | P2 |

---

## 6. Funzionalità incomplete o mancanti (Fase 5 — Product review)

**Incomplete / simulate**
- Icone PWA placeholder (dichiarato nel README).
- "Supporto Intesa Sanpaolo / Easybank" non verificabile e con parser fragile (BUG-8).
- Le ricorrenti non hanno un giorno di addebito né una frequenza (solo mensile).
- Il report mensile e l'insight non sono salvati: si rigenerano (e si pagano) ogni volta.
- La chat non ha memoria tra le sessioni né conosce lo storico oltre la "spesa media".

**Mancanti, rilevanti per il valore del prodotto**
1. Recupero password, profilo, cancellazione account, export CSV dei dati (**obbligatori**).
2. Onboarding guidato.
3. Gestione multi-anno e storico.
4. Notifiche (promemoria di registrare le spese, avviso busta quasi esaurita). Su iOS le notifiche web richiedono PWA installata.
5. Ricerca e filtri nelle spese.
6. Ricorrenti con frequenza (settimanale, annuale: assicurazione auto, bollo).
7. Entrate oltre lo stipendio fisso ben modellate (freelance, stipendio variabile, tredicesima/quattordicesima: molto rilevante in Italia).
8. Modalità offline (service worker) per inserire spese anche senza rete.
9. In prospettiva: collegamento conto via Open Banking PSD2 (aggregatore terzo), che renderebbe l'import manuale secondario.

**Da semplificare o eliminare**
- **Doppio sistema categorie + buste.** Le 8 categorie e le 3 buste si sovrappongono (Svago è sia categoria che busta, Spesa idem). Scegliere un modello primario (le buste sono il vero elemento distintivo) e usare le categorie solo come etichette.
- **"Margine" negli Obiettivi** calcolato su entrate correnti − media annua, diverso da "Da vivere" del piano: due numeri per lo stesso concetto.
- **Banner multipli** in dashboard (insight, report, ricorrenti) che si impilano: raggrupparli in un'unica area "Il coach dice…".
- Categoria "Investimenti" trattata come spesa: gonfia lo "speso" e confonde il risparmio. Va modellata come trasferimento/risparmio.

**Qualità dell'esperienza complessiva:** il cuore dell'app (piano a buste + coach) è convincente. Il problema principale non è la mancanza di funzioni, che sono già molte, ma la loro **affidabilità**: in un'app di soldi un singolo numero sbagliato (1.500 → 1,5 €; dashboard vuota a gennaio; spesa che ricompare) distrugge la fiducia più di qualsiasi funzione mancante.

---

## 7. Roadmap per priorità

### P0 — Bloccanti (prima di qualunque utente esterno)
| # | Intervento | Rif. | Complessità |
|---|---|---|---|
| 1 | Ruotare la chiave Anthropic e spostare tutte le chiamate AI su Edge/Serverless Function con auth JWT, rate limit per utente e tetto di spesa | SEC-1 | M |
| 2 | pdf.js aggiornato (npm) con `isEvalSupported:false`; SheetJS ≥ 0.20.2 da npm; eliminare `loadScript` | SEC-2, SEC-3 | S–M |
| 3 | Correggere la logica legata all'anno solare (entro fine dicembre 2026) | BUG-1 | M–L |
| 4 | Privacy policy, termini, consenso al trattamento AI, DPA con Supabase/Anthropic, cancellazione account + export dati | §5, UX-10 | M (+ consulenza legale) |
| 5 | Disclaimer "non è consulenza finanziaria" + system prompt che rifiuta raccomandazioni su strumenti specifici | §5, ARC-7 | S |

### P1 — Alta (prima del beta pubblico)
| # | Intervento | Rif. | Complessità |
|---|---|---|---|
| 6 | Introdurre test (Vitest) sulle funzioni di calcolo e parsing + ESLint + CI GitHub Actions | ARC-2 | M |
| 7 | Gestione errori uniforme (toast, nessuna chiusura su errore, rollback) | BUG-4, UX-8 | M |
| 8 | `parseAmount` locale-aware | BUG-5 | S |
| 9 | Calcoli economici deterministici; AI solo per il testo; validazione schema delle risposte | BUG-6 | S |
| 10 | Ricorrenti: niente resurrezione, vincolo unico, generazione server-side schedulata | BUG-2, BUG-3, SEC-6 | M |
| 11 | Routing + tasto Indietro + modali chiudibili con Indietro/Esc | ARC-5, UX-3 | S–M |
| 12 | Conferma/annulla sulle cancellazioni | UX-1 | S |
| 13 | Accessibilità di base: zoom, label, aria-label, controlli nativi, contrasti | A11Y-1…5 | M |
| 14 | Onboarding e semplificazione del "numero eroe" | UX-2, UX-5 | M |
| 15 | Parser import: mappatura colonne, CSV, fixture di test per banca | BUG-8 | L |
| 16 | Suddividere `App.jsx` (cartelle `components/`, `features/`, `lib/api`, `lib/money`) **dopo** i test | ARC-1 | L |

### P2 — Media (prima del lancio negli store)
| # | Intervento | Rif. | Complessità |
|---|---|---|---|
| 17 | Migration versionate con Supabase CLI, rimozione fallback a regex, `CHECK` sul DB | ARC-3, SEC-6 | S |
| 18 | Salvadanaio transazionale (RPC) | BUG-10 | S |
| 19 | Regole di riporto chiare | BUG-7 | S–M |
| 20 | CSP e header di sicurezza | SEC-4 | S |
| 21 | Service worker, icone reali + maskable, apple-touch-icon, splash | §4 | M |
| 22 | Code-splitting, cache di insight/report nel DB | ARC-8, BUG-11 | M |
| 23 | Monitoraggio errori e analytics rispettosi della privacy | §5 | S |
| 24 | Chat: risposte più ricche, storico persistente, contesto multi-mese | ARC-7 | M |

### P3 — Bassa
| # | Intervento | Rif. | Complessità |
|---|---|---|---|
| 25 | Aggiornamento dipendenze (React 19, Vite 8, Recharts 3) | ARC-9 | M |
| 26 | Dark mode, testo dinamico | §4 | M |
| 27 | Regex ricorrenti con confini di parola, doppioni più precisi | BUG-9 | S |
| 28 | Font self-hosted, `search_path` sul trigger, formattazione a 2 decimali | §5, SEC-5, UX-13 | S |

**Stima indicativa complessiva:** P0 ≈ 1,5–2,5 settimane; P0+P1 ≈ 6–8 settimane per una persona; fino a P2 ≈ 10–12 settimane.

---

## 8. Strategia di verifica consigliata

1. **Unit test (Vitest)** per: `parseAmount`, `fmt`, `extractTx`, parser Excel, `markDuplicates`, `carryFor`, quota obiettivi, ripartizione salvadanaio, logica multi-anno con data simulata.
2. **Test di integrazione** su un progetto Supabase di staging dedicato (mai produzione), con utenti di test creati da script di seed.
3. **E2E (Playwright)** sui flussi: registrazione → onboarding → spesa → piano → obiettivo → import → chat (con AI mockata), su viewport iPhone e Android, inclusa modalità offline.
4. **Audit accessibilità** con axe-core in CI + prova manuale con VoiceOver (iOS) e TalkBack (Android).
5. **Test su dispositivi reali**: iPhone (Safari, PWA installata) e Android (Chrome, PWA installata o TWA).
6. **Revisione di sicurezza** dopo SEC-1: verifica che nessun segreto sia nel bundle (step CI che fallisce se trova `sk-ant`).

---

## 9. Prontezza al rilascio su App Store e Google Play

**Stato attuale: non pubblicabile su nessuno dei due store.** Oggi l'app non è nemmeno un pacchetto per gli store: è un sito web PWA.

| Requisito | Google Play | App Store |
|---|---|---|
| Pacchetto nativo | Possibile via **TWA** (Bubblewrap/PWABuilder) con Digital Asset Links | Serve un wrapper (**Capacitor**). Rischio di rifiuto per la linea guida 4.2 (funzionalità minima / "sito impacchettato") se l'app non offre un'esperienza da app vera |
| Eliminazione account in-app | Richiesta (anche via web) | **Obbligatoria** (5.1.1(v)) — oggi assente |
| Privacy policy accessibile | Obbligatoria | Obbligatoria — oggi assente |
| Dichiarazioni dati | Sezione Data Safety | Privacy Nutrition Labels — dati finanziari + condivisione con fornitore AI da dichiarare |
| Dichiarazione funzionalità finanziarie | Richiesta dalla Play Console | — |
| Login funzionante per il revisore | Account demo con dati | Account demo con dati |
| Icone e screenshot reali | Mancanti | Mancanti |
| Stabilità e gestione errori | Insufficiente | Insufficiente |
| Contenuti AI | Policy sui contenuti generati dall'AI (segnalazione dei contenuti offensivi) | Le app con AI generativa vengono esaminate con attenzione; serve moderazione/segnalazione |

**Raccomandazione:** lanciare prima come **PWA in beta chiusa** (dopo P0 e P1), raccogliere metriche di retention, poi Google Play via TWA (percorso più semplice) e solo dopo valutare iOS con Capacitor, arricchendo l'esperienza nativa (notifiche, Face ID, widget) per superare la 4.2.

---

## 10. Giudizio complessivo motivato

SpendIQ ha **un'identità di prodotto chiara e una UI curata**, sopra la media dei prototipi generati con l'AI: il piano a buste con riporto e il coach che ragiona sui numeri reali dell'utente sono un buon punto di partenza per differenziarsi dagli expense tracker generici.

Però, valutata come un'azienda valuterebbe un prodotto prima del lancio, l'app **non è pronta**:

1. **Sicurezza:** la chiave AI è pubblicamente estraibile da chiunque visiti il sito, e il parser PDF usa una versione con una vulnerabilità nota di esecuzione di codice. Sono problemi da risolvere prima ancora di condividere il link con altre persone.
2. **Correttezza:** diversi difetti confermati producono numeri sbagliati o dati che spariscono: importi "1.500" letti come 1,5 €, storico azzerato al cambio d'anno (tra sei settimane), ricorrenti che ricompaiono, salvataggi falliti presentati come riusciti. In un'app finanziaria la fiducia nei numeri è il prodotto.
3. **Manutenibilità:** un unico file da 2.600 righe senza test rende ogni correzione rischiosa. Il primo passo deve essere una rete di test sulle funzioni di calcolo, poi il refactor.
4. **Conformità:** mancano privacy policy, consenso al trattamento AI, cancellazione account e un posizionamento legale prudente sul "consulente finanziario". Sono requisiti necessari sia per gli store sia per il GDPR.

**Voto complessivo di prontezza commerciale: 3/10.** Con i P0 risolti diventa un buon beta privato; con P0+P1 (stimati in 6–8 settimane di lavoro) può reggere un beta pubblico come PWA; la pubblicazione sugli store richiede in più il blocco P2 e il packaging nativo.
