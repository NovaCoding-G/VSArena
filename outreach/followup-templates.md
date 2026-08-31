# Wave 1 — Follow-up (7 giorni)

**Data follow-up programmata:** 2026-09-07 (7 giorni dopo preparazione 2026-08-31)  
**Condizione:** inviare solo se `status != replied` in [tracking.csv](tracking.csv)

---

## Template follow-up breve (EN)

**Oggetto:** `Re: {{ORIGINAL_SUBJECT}}`

Hi {{NAME}},

Quick bump on VsArena — the public stacking benchmark I shared last week. No pressure if timing isn't right.

If helpful, the 30-second version:
- Browser demo: https://vsarena.vercel.app/simulation
- Submit an agent: https://vsarena.vercel.app/submit

Happy to answer one specific question async if that's easier than a call.

Best,  
NovaCoding-G

---

## Template follow-up (IT) — per Wave 3 futura

**Oggetto:** `Re: VsArena — arena pubblica per policy embodied/VLA`

Buongiorno {{NAME}},

un breve follow-up sull'email della scorsa settimana su **VsArena**. Capisco se non è il momento giusto — in caso vi fosse utile:

- Demo browser: https://vsarena.vercel.app/simulation  
- Guida submit: https://vsarena.vercel.app/submit  

Resto a disposizione per un feedback asincrono su protocollo o osservazioni.

Un saluto,  
NovaCoding-G

---

## Regole follow-up

| Regola | Dettaglio |
|--------|-----------|
| Max follow-up | 1 per contatto |
| Stop | Se rispondono "not interested" o non rispondono al follow-up |
| Canale alternativo | #1 LeRobot → Discord; #10 Voxel51 → LinkedIn |
| Aggiornare tracking | `status=followup_sent`, `followup_date=YYYY-MM-DD` |

---

## Checklist settimanale tracking

1. Aprire `tracking.csv`
2. Per ogni riga con `status=sent` e `response_date` vuota oltre 7 giorni → inviare follow-up
3. Aggiornare `response_type`: `positive` | `neutral` | `negative` | `no_reply`
4. Se `positive` → proporre call 15 min + link submit personalizzato
