# Wave 1 — Verifica deliverability contatti

**Data verifica:** 2026-08-31  
**Metodo:** record MX del dominio + verifica fonte pubblica dell'indirizzo

## Riepilogo

| Esito | Conteggio |
|-------|-----------|
| MX valido | 10/10 |
| Fonte pubblica verificata | 10/10 |
| Indirizzo generico (routing incerto) | 2 (#2 research@, #10 info@) |

## Dettaglio per contatto

### 1. remi.cadene@huggingface.co
- **MX:** Google Workspace (`aspmx.l.google.com`)
- **Fonte:** [huggingface/lerobot CONTRIBUTING.md](https://github.com/huggingface/lerobot/blob/main/CONTRIBUTING.md)
- **Rischio:** basso — contatto esplicito per inquiry LeRobot

### 2. research@physicalintelligence.company
- **MX:** Google Workspace
- **Fonte:** [pi.website blog](https://www.pi.website/blog/pi0)
- **Rischio:** medio — inbox team, possibile routing interno

### 3. moojink@stanford.edu
- **MX:** Proofpoint (`pphosted.com`)
- **Fonte:** paper OpenVLA correspondence
- **Rischio:** basso

### 4. chenjin@opendrivelab.com
- **MX:** Feishu (`feishu.cn`)
- **Fonte:** OpenDriveLab Challenge 2025 organizers
- **Rischio:** basso — contatto track manipulation

### 5. svlevine@eecs.berkeley.edu
- **MX:** Google Workspace
- **Fonte:** rail.eecs.berkeley.edu/contact
- **Rischio:** basso — alto volume email, risposta non garantita

### 6. dorsa@cs.stanford.edu
- **MX:** Stanford CS (`cs.stanford.edu`)
- **Fonte:** dorsa.fyi
- **Rischio:** basso

### 7. okroemer@andrew.cmu.edu
- **MX:** Google Workspace
- **Fonte:** CMU faculty directory / alphaXiv
- **Rischio:** basso

### 8. e.johns@imperial.ac.uk
- **MX:** Microsoft 365 (`mail.protection.outlook.com`)
- **Fonte:** robot-learning.uk
- **Rischio:** basso

### 9. russt@csail.mit.edu
- **MX:** MIT CSAIL (`incoming.csail.mit.edu`)
- **Fonte:** CSAIL robotics center directory
- **Rischio:** basso-medio — PI molto richiesto

### 10. info@voxel51.com
- **MX:** Google Workspace
- **Fonte:** GitHub org profile
- **Rischio:** medio — inbox generica, considerare follow-up su LinkedIn

## Raccomandazioni pre-invio

1. Inviare **max 10 email in 2 giorni** (5/giorno) per evitare flag spam su Gmail mittente.
2. Personalizzare ulteriormente se avete connessione comune (paper citato, evento, GitHub issue).
3. Per #1 LeRobot: alternativa async via [Discord LeRobot](https://discord.gg/q8Dzzpym3f) se nessuna risposta in 7 giorni.
4. Non usare BCC massivo — invii individuali da novacodingg@gmail.com.
5. Includere link unsubscribe implicito: "Reply 'not interested' and I won't follow up."

## A/B subject line (Wave 1)

| Gruppo | Subject A | Subject B |
|--------|-----------|-----------|
| Accademici (#3–9) | `Public stacking benchmark for VLA policies — watchable eval, no Isaac Sim` | `VsArena — LMArena-style public eval for manipulation policies` |
| Industry (#1–2, #10) | `Lightweight public policy eval before hardware — stacking arena + ELO` | `VsArena × {{ORG}} — 10 min public manipulation benchmark` |

Test consigliato: metà Wave 1 con Subject A, metà con Subject B; tracciare open/reply manualmente.
