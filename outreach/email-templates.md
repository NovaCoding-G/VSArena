# VsArena — Template email outreach

Sender: **novacodingg@gmail.com**  
Reply-to: **novacodingg@gmail.com**

Links da includere in ogni email:
- Live demo: https://vsarena.vercel.app/simulation
- Leaderboard: https://vsarena.vercel.app/leaderboard
- Submit guide: https://vsarena.vercel.app/submit
- Harness protocol: https://vsarena.vercel.app/docs (o `docs/harness.md` su GitHub)
- Repo: https://github.com/NovaCoding-G/VSArena

---

## Variante A — Accademica (lab / paper authors)

**Oggetto:** `Public stacking benchmark for VLA policies — watchable eval, no Isaac Sim`

**Quando usarla:** Tier A accademici (#3–9), laboratori EU con focus ricerca.

---

Hi {{NAME}},

I'm building **VsArena** — a public, browser-based evaluation arena for embodied / VLA policies (think LMArena, but for a stacking manipulation task). Your work on {{THEIR_PROJECT}} is exactly the kind of policy eval we want to make easier to share and compare.

**What it is today (MVP, honest limits):**
- One task: stack three colored cubes (cyan → orange → magenta) with a 4-DOF arm in Rapier physics (60 Hz).
- **VLA track:** 128×128 RGB + language instruction — no privileged cube poses to the policy.
- **Trusted scoring:** public ELO is written only by the harness; the browser cannot fake the board.
- Python SDK + WebSocket harness; dry-run locally, live ingest for the leaderboard.

**Why I'm reaching out:** we'd love early feedback from groups already running manipulation benchmarks — and optionally a baseline submission (fine-tuned VLA, scripted policy, or even teleop) to seed the public board.

- Studio (no install): https://vsarena.vercel.app/simulation  
- Submit: https://vsarena.vercel.app/submit  
- Protocol: https://github.com/NovaCoding-G/VSArena/blob/main/docs/harness.md  

Happy to jump on a 15-minute call if useful. No SLA — solo maintainer OSS.

Best,  
{{YOUR_NAME}}  
VSArena · https://vsarena.vercel.app

---

## Variante B — Startup / industry (embodied AI companies)

**Oggetto:** `Lightweight public policy eval before hardware — stacking arena + ELO`

**Quando usarla:** Physical Intelligence, Skild, Pollen, Voxel51, TRI, ecc.

---

Hi {{NAME}},

Quick note on something we're shipping in the embodied-AI eval space.

**VsArena** is a public URL where manipulation policies get scored in the open: watch the physics, replay failures, read an ELO board. One deliberate stacking task (3 cubes, 4-DOF arm) so teams can sanity-check a policy in ~10 minutes without spinning up Isaac Sim.

**For VLA-style policies:**
- Observation = 128×128 RGB + natural-language instruction (no cube GPS).
- Harness-only ingest for leaderboard integrity.
- Python SDK; hosted harness at `wss://vsarena-harness.onrender.com`.

We're early (solo OSS MVP) and looking for teams who evaluate policies before real-robot deploy — feedback on the protocol, or a baseline agent on the board, would be hugely valuable.

- Live: https://vsarena.vercel.app/simulation  
- Docs / submit: https://vsarena.vercel.app/submit  

Open to a short call or async feedback via GitHub issues.

Best,  
{{YOUR_NAME}}  
novacodingg@gmail.com · https://github.com/NovaCoding-G/VSArena

---

## Variante C — Italiana (laboratori IT / EU vicini)

**Oggetto:** `VsArena — arena pubblica browser per policy embodied/VLA (benchmark stacking)`

**Quando usarla:** Tier C — Polimi, IIT, Sant'Anna, NOI, CNR, ecc.

---

Buongiorno {{NAME}},

mi chiamo {{YOUR_NAME}} e sto sviluppando **VsArena**, un'arena pubblica browser-first per valutare agenti embodied e policy VLA su un task di stacking (3 cubi colorati, braccio 4-DOF, fisica Rapier).

L'idea è rendere l'eval **osservabile e confrontabile** come LMArena fa per i LLM: URL pubblico, replay delle partite, leaderboard ELO scritta solo dall'harness (il client browser non può barare).

**Stato attuale (MVP trasparente):**
- Track VLA: immagine 128×128 + istruzione linguistica, senza pose privilegiate dei cubi.
- SDK Python + protocollo WebSocket; dry-run locale o submit live.
- Un solo task, volutamente semplice, per validare adozione prima di espandere.

Il lavoro del {{THEIR_LAB}} su {{THEIR_TOPIC}} è molto allineato: mi farebbe piacere un vostro feedback sul protocollo, o — se vi interessa — una baseline sulla leaderboard pubblica.

- Demo: https://vsarena.vercel.app/simulation  
- Guida submit: https://vsarena.vercel.app/submit  
- Repo: https://github.com/NovaCoding-G/VSArena  

Disponibile per una call breve (15 min) o scambio asincrono via email/GitHub.

Un saluto,  
{{YOUR_NAME}}  
novacodingg@gmail.com
