# Wave 1 — Checklist invio

**Mittente:** novacodingg@gmail.com  
**Stato EML:** generati in `outreach/eml/` (10 file)  
**Tracking:** `status=eml_ready` per tutti i target

## Giorno 1 (5 email) — consigliato 2026-09-01

- [ ] #1 remi.cadene@huggingface.co — `01-hugging-face-lerobot.eml`
- [ ] #2 research@physicalintelligence.company — `02-physical-intelligence.eml`
- [ ] #3 moojink@stanford.edu — `03-openvla-team.eml`
- [ ] #4 chenjin@opendrivelab.com — `04-opendrivelab.eml`
- [ ] #5 svlevine@eecs.berkeley.edu — `05-rail-bair.eml`

Dopo ogni invio:
```bash
python3 outreach/update_tracking.py --rank N --status sent
```

## Giorno 2 (5 email) — consigliato 2026-09-02

- [ ] #6 dorsa@cs.stanford.edu — `06-stanford-iliad.eml`
- [ ] #7 okroemer@andrew.cmu.edu — `07-cmu-iam-lab.eml`
- [ ] #8 e.johns@imperial.ac.uk — `08-imperial-robot-learning-lab.eml`
- [ ] #9 russt@csail.mit.edu — `09-mit-robot-locomotion.eml`
- [ ] #10 info@voxel51.com — `10-voxel51.eml`

## Follow-up — 2026-09-07

Per righe con `status=sent` e nessuna risposta, usare [followup-templates.md](followup-templates.md).

```bash
python3 outreach/update_tracking.py --list
python3 outreach/update_tracking.py --rank 1 --status followup_sent
```

## Verifica post-invio

```bash
python3 outreach/update_tracking.py --list
```

Tutte le righe Wave 1 devono mostrare `status=sent` prima del follow-up.
