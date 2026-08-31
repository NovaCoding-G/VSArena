# Wave 1 — Email personalizzate (target #1–10)

**Data preparazione:** 2026-08-31  
**Mittente:** novacodingg@gmail.com  
**Stato:** pronte per invio manuale (copia-incolla da Gmail)

---

## 1. Hugging Face LeRobot — Rémi Cadène

**A:** remi.cadene@huggingface.co  
**Variante:** B (startup/OSS)  
**Oggetto:** `VsArena — lightweight public eval complement to LeRobot / LIBERO`

Hi Rémi,

I'm building **VsArena**, a public browser arena for embodied / VLA policy evaluation — one stacking task, watchable physics, ELO on a public board. Given LeRobot's role as the hub for real-world robotics ML (and LIBERO integration), I thought you'd be the right person to sanity-check whether this fills a gap.

**Today:** 4-DOF arm, 3 cubes, Rapier 60 Hz. VLA track = 128×128 RGB + language, no cube GPS. Scores only via harness ingest.

It could complement LeRobot as a **zero-install public scoreboard** for quick policy comparisons before heavier sim evals.

- Studio: https://vsarena.vercel.app/simulation  
- Submit: https://vsarena.vercel.app/submit  
- SDK: https://github.com/NovaCoding-G/VSArena/tree/main/sdk/python  

Would love your take on the protocol — or a LeRobot policy baseline on the board. Happy to chat 15 min or async on GitHub.

Best,  
NovaCoding-G  
novacodingg@gmail.com

---

## 2. Physical Intelligence — research team

**A:** research@physicalintelligence.company  
**Variante:** B  
**Oggetto:** `Public stacking benchmark for VLA policies — 10 min eval, harness-only ELO`

Hi,

I'm reaching out from **VsArena** — a public, browser-based stacking benchmark for embodied / VLA policies. Your π0 work and LIBERO evals are the reference point for what "good" generalist manipulation looks like; we're building a deliberately small, watchable arena for quick public comparisons.

**MVP scope (honest):** one stacking task, VLA observation contract (RGB + instruction, no privileged poses), Rapier physics, ELO via trusted harness only.

We're early (solo OSS) and looking for feedback from teams who care about eval integrity before hardware — and optionally a baseline on the public board.

- Live: https://vsarena.vercel.app/simulation  
- Protocol: https://github.com/NovaCoding-G/VSArena/blob/main/docs/harness.md  

Open to async feedback or a short call.

Best,  
NovaCoding-G  
novacodingg@gmail.com

---

## 3. OpenVLA team — Moo Jin Kim

**A:** moojink@stanford.edu  
**Variante:** A  
**Oggetto:** `VsArena — public stacking eval for OpenVLA-style policies`

Hi Moo Jin,

Congratulations again on OpenVLA's traction — it's become the default open VLA baseline. I'm building **VsArena**, a public browser arena where manipulation policies get scored on a simple stacking task with a VLA-aligned observation contract (128×128 RGB + language, no cube poses to the policy).

The goal is LMArena-style visibility for spatial policies: open URL, watch failures, compare ELO. Harness-only ingest so the board stays honest.

Would you be open to trying a fine-tuned OpenVLA (or OFT) baseline on our board, or sharing feedback on the protocol? One task on purpose — if teams won't run this, they won't run a bigger suite.

- Studio: https://vsarena.vercel.app/simulation  
- Submit: https://vsarena.vercel.app/submit  

Happy to send more detail or jump on a 15-min call.

Best,  
NovaCoding-G  
novacodingg@gmail.com

---

## 4. OpenDriveLab — Chen Jin (manipulation)

**A:** chenjin@opendrivelab.com  
**CC opzionale:** contact@opendrivelab.com  
**Variante:** A  
**Oggetto:** `Public manipulation arena — stacking benchmark with VLA observation contract`

Hi Chen Jin,

OpenDriveLab's work on UniVLA and AgiBot-World sets a high bar for embodied benchmarks. I'm building **VsArena** — a complementary, ultra-light public arena: browser Rapier sim, one stacking task, public ELO, harness-only scoring.

**VLA track:** RGB + language in, no privileged state. Python SDK + hosted harness.

We're looking for groups with benchmark culture to stress-test the protocol and optionally seed the leaderboard with a baseline.

- Live: https://vsarena.vercel.app/simulation  
- Eval integrity notes: https://github.com/NovaCoding-G/VSArena/blob/main/docs/eval-integrity.md  

Would appreciate your feedback — async or a short call.

Best,  
NovaCoding-G  
novacodingg@gmail.com

---

## 5. RAIL / BAIR — Sergey Levine

**A:** svlevine@eecs.berkeley.edu  
**Variante:** A  
**Oggetto:** `VsArena — public stacking benchmark for embodied policies (browser, harness ELO)`

Hi Sergey,

I'm building **VsArena**, a public browser arena for embodied policy evaluation — inspired by the same "make quality visible" idea as LMArena, but for a stacking manipulation task. Given RAIL's work on generalist policies and Open X-Embodiment, I'd value your perspective on whether a deliberately minimal public eval surface is useful.

**Today:** 4-DOF arm, 3 cubes, Rapier 60 Hz. VLA track with RGB + language only. ELO from harness ingest, not the client.

- https://vsarena.vercel.app/simulation  
- https://github.com/NovaCoding-G/VSArena  

No ask beyond feedback or a baseline if it seems worthwhile. Happy to keep it async.

Best,  
NovaCoding-G  
novacodingg@gmail.com

---

## 6. Stanford ILIAD — Dorsa Sadigh

**A:** dorsa@cs.stanford.edu  
**Variante:** A  
**Oggetto:** `VsArena — watchable public eval for VLA / manipulation policies`

Hi Dorsa,

Your work on trustworthy embodied AI (and co-authorship on OpenVLA) aligns closely with what we're trying to validate with **VsArena** — a public stacking benchmark where scores are harness-written and failures are watchable in the browser.

**MVP:** one task, VLA observation contract without privileged poses, Python SDK, public ELO board.

I'd appreciate feedback on eval integrity and whether this is a useful stepping stone before hardware trials — especially from groups thinking about safe, verifiable policy comparison.

- Studio: https://vsarena.vercel.app/simulation  
- Integrity docs: https://github.com/NovaCoding-G/VSArena/blob/main/docs/eval-integrity.md  

Best,  
NovaCoding-G  
novacodingg@gmail.com

---

## 7. CMU IAM Lab — Oliver Kroemer

**A:** okroemer@andrew.cmu.edu  
**Variante:** A  
**Oggetto:** `Public stacking benchmark — browser sim + harness ELO for manipulation policies`

Hi Oliver,

Given your contributions to Open X-Embodiment and lifelong manipulation learning, I wanted to share **VsArena** — a public, browser-based stacking eval for embodied policies.

**Design choices:** minimal task (3 cubes), Rapier physics, VLA track (RGB + language, no cube GPS), trusted harness ingest for leaderboard rows.

We're early and looking for feedback from manipulation researchers — and optionally a baseline policy on the public board.

- https://vsarena.vercel.app/simulation  
- https://vsarena.vercel.app/submit  

Happy to discuss async or on a short call.

Best,  
NovaCoding-G  
novacodingg@gmail.com

---

## 8. Imperial Robot Learning Lab — Edward Johns

**A:** e.johns@imperial.ac.uk  
**Variante:** A  
**Oggetto:** `VsArena — public stacking arena for VLA / manipulation policy eval`

Hi Edward,

Your Robot Learning Lab's focus on manipulation with imitation learning and VLMs is exactly the audience for **VsArena** — a public browser arena with one stacking task, watchable physics, and ELO from a trusted harness.

**VLA track:** 128×128 RGB + instruction; no privileged cube state to the policy.

I'd love your take on whether this is a useful lightweight eval before sim-to-real — and welcome any baseline submission.

- https://vsarena.vercel.app/simulation  
- https://github.com/NovaCoding-G/VSArena  

Best,  
NovaCoding-G  
novacodingg@gmail.com

---

## 9. MIT Robot Locomotion — Russ Tedrake

**A:** russt@csail.mit.edu  
**Variante:** A  
**Oggetto:** `VsArena — public stacking benchmark (browser harness, VLA observation contract)`

Hi Russ,

I'm building **VsArena**, a public stacking benchmark for embodied / VLA policies — browser Rapier sim, harness-only ELO, VLA observation contract (RGB + language, no privileged poses). Given your work on OpenVLA and merging learning with manipulation, I'd value a quick sanity check on the protocol.

- Live: https://vsarena.vercel.app/simulation  
- Protocol: https://github.com/NovaCoding-G/VSArena/blob/main/docs/harness.md  

Async feedback is great; happy to do 15 min if easier.

Best,  
NovaCoding-G  
novacodingg@gmail.com

---

## 10. Voxel51 — general inquiry

**A:** info@voxel51.com  
**Variante:** B  
**Oggetto:** `VsArena × Physical AI — public manipulation eval + dataset/debug workflow`

Hi Voxel51 team,

We're building **VsArena**, a public browser arena for embodied policy evaluation (stacking task, harness ELO, VLA observation contract). With FiftyOne's Physical AI Workbench gaining traction for robotics data QA, I wonder if there's a natural complement: VsArena for **lightweight public policy scores**, FiftyOne for **failure analysis on trajectories**.

**Today:** Rapier browser sim, Python SDK, public leaderboard at https://vsarena.vercel.app/leaderboard.

Looking for feedback from teams at the sim/eval layer — and open to exploring whether a small integration story makes sense.

Best,  
NovaCoding-G  
novacodingg@gmail.com · https://github.com/NovaCoding-G/VSArena
