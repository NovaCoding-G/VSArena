# VsArena Outreach

Materiali per la campagna email verso laboratori e aziende embodied AI / VLA.

## Contenuti

| File | Descrizione |
|------|-------------|
| [email-templates.md](email-templates.md) | 3 varianti base (accademica, startup, italiana) |
| [wave1-drafts.md](wave1-drafts.md) | 10 email personalizzate Wave 1 (#1–10) |
| [wave1-verification.md](wave1-verification.md) | Verifica MX + fonti pubbliche |
| [contacts-wave1.csv](contacts-wave1.csv) | Contatti Wave 1 con metadata |
| [tracking.csv](tracking.csv) | Tracker invii / risposte / follow-up |
| [followup-templates.md](followup-templates.md) | Template follow-up a 7 giorni |
| [send_wave1.py](send_wave1.py) | Genera `.eml` o invia via SMTP |
| [eml/](eml/) | File `.eml` pronti per Gmail |

## Invio Wave 1

### Opzione A — Gmail (consigliata)

1. Apri [wave1-drafts.md](wave1-drafts.md)
2. Invia da **novacodingg@gmail.com** (max 5/giorno)
3. Aggiorna `tracking.csv`: `status=sent`, `sent_date=YYYY-MM-DD`

### Opzione B — Import EML

```bash
python3 outreach/send_wave1.py
```

Importa i file in `outreach/eml/` in Gmail o Thunderbird.

### Opzione C — SMTP automatico

```bash
export SMTP_HOST=smtp.gmail.com
export SMTP_PORT=587
export SMTP_USER=novacodingg@gmail.com
export SMTP_PASSWORD=<app-password>
export FROM_EMAIL=novacodingg@gmail.com
python3 outreach/send_wave1.py --send
```

## Follow-up

- **Data programmata:** 7 giorni dopo `sent_date` (default 2026-09-07)
- Template: [followup-templates.md](followup-templates.md)
- Aggiornare `tracking.csv` dopo ogni risposta

## Wave 2 e 3

Target #11–30 dal piano originale — usare le stesse varianti template adattando `wave1-drafts.md` come modello.
