# Evaluation integrity (v0.5.0)

What a public stacking ELO must disclose, vs what VSArena actually ships. Written against the usual “sim eval” shopping list (simulator provenance, reset, schemas, latency, hidden scenes, replay, failure taxonomy, negative controls, held-out sets).

Studio (`/simulation`) is still the **public canonical** layout. Official ELO is the hosted harness (`NODE_ENV=production` → `held_out`).

| Item | Status | What we do |
| --- | --- | --- |
| Simulator / version provenance | **Have** | Every official `result` stamps `provenance`: product `0.5.0`, Rapier `0.20.0`, physics 60 Hz, git SHA (Render/Vercel/`GIT_COMMIT`), Node, observation mode, latency budget, policy Hz, scene id/seed/hash. `GET /health` exposes the same eval block. |
| Reset determinism | **Have** | Same `match_id` → same spawn hash. `ArenaSimulation.create({ spawns })` rebuilds from that layout. We do **not** claim bit-identical Rapier across OS/CPU after N steps. |
| Observation / action schemas | **Have** | VLA: RGB + instruction, **no cube poses**. State: privileged poses (debug). Actions are checked with `parseActionContract` before they touch Rapier. Invalid actions do not move the arm. |
| Latency budget | **Have** | VLA 2 s / 5 Hz (8 consecutive late actions → `policy.timeout`). State 150 ms / 20 Hz (20 strikes). Late ticks still hold the last valid action until the budget trips. |
| Hidden-scene construction | **Partial** | Production harness samples 8 in-repo held-out XY layouts + jitter from `match_id`. **Those coordinates are in git** (this repo is open source). They are not the Studio layout, so a policy that only memorizes the screenshot of `/simulation` should not auto-win ELO. |
| Replay artifacts | **Have** | `result.replay` is `vsarena-replay-v1`: sparse privileged poses (no RGB). Sent to the agent. **Not** written to Postgres (keep the jsonb column small). |
| Failure taxonomy | **Have** | `failure.code` is dotted: `policy.*` / `protocol.*` / `harness.*`. Wire `error` messages are `code: human text`. Disconnect mid-match is `harness.disconnect` and **does not** ingest ELO. |
| Negative controls | **Have** | Fixtures in `lib/eval/actionSchema.ts` and `sdk/python` (`parse_action_contract`). Empty motion, NaN joints, unknown joints, huge `ee_delta`. |
| Held-out private scenes (ELO ≠ git memorization) | **Partial** | Operators set `VSARENA_HELD_OUT_JSON` (three `{id, position}` cubes) on the harness host. That override is **not** in this repository. Without it, a determined reader can still memorize `lib/eval/scenes.ts`. |

## Honest limits

- ColorSeek / Baseline-IK in the browser still use the public layout and **do not** write ELO.
- In-repo `held_out` is a *different public set*, not a secret set.
- Replay is an audit trail, not a pixel-perfect video.
- Horizon-end incomplete matches stay `status: completed` so ELO still uses `task_completion_score` (same as before v0.5). Timeout-budget and invalid-action-budget aborts are `failed`.

## Operator env

| Variable | Default | Meaning |
| --- | --- | --- |
| `VSARENA_SCENE_SET` | `held_out` when `NODE_ENV=production`, else `public` | Force `public` or `held_out` |
| `VSARENA_HELD_OUT_JSON` | unset | Private three-cube JSON; sets `provenance.scene.private_override` |
| `RENDER_GIT_COMMIT` / `VERCEL_GIT_COMMIT_SHA` / `GIT_COMMIT` | `unknown` | SHA stamped on results |

## Wire extras on `result`

```json
{
  "failure": {
    "code": "policy.task_incomplete",
    "domain": "policy",
    "message": "policy.task_incomplete: horizon reached without a full stack",
    "recoverable": false
  },
  "provenance": {
    "product": "0.5.0",
    "rapier": "0.20.0",
    "physics_hz": 60,
    "git_sha": "…",
    "scene": { "set": "held_out", "id": "held_out.layout-3", "seed": 1, "hash": "…", "private_override": false }
  },
  "replay": { "format": "vsarena-replay-v1", "samples": [] }
}
```

Ingest stores `{ peak, avg, eval: { failure, provenance } }` inside existing `joint_torque_telemetry` jsonb (no migration).
