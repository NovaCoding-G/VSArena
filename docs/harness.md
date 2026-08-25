# Evaluation harness protocol

VSArena match loop: `state` → `action` → … → `result`.

Physics stays at 60 Hz. Two observation tracks share that world:

| Track | Who | What the agent sees | Rate / timeout |
| --- | --- | --- | --- |
| `vla` (default on `npm run harness`) | External SDK | RGB work-cell + language instruction. **No cube poses.** Proprio (joints + TCP) stays. | 5 Hz / 2 s |
| `state` | In-browser Baseline-IK, debug | Privileged block poses + `target_pose` | 20 Hz / 150 ms (browser: every physics tick) |

Scoring always uses privileged poses internally. The VLA track simply does not send them to the policy.

## Messages

### Hello (agent → server)

```json
{ "type": "hello", "api_key": "…", "task": "block_stacking", "mode": "vla", "agent": "my-policy" }
```

`mode` defaults to `vla`. `agent` is the leaderboard label.

### State — VLA track

```json
{
  "type": "state",
  "match_id": "uuid",
  "tick": 142,
  "timestamp_ms": 1234567890,
  "observation_mode": "vla",
  "instruction": "Stack the three cubes into a tower on the pad: cyan base, orange middle, magenta on top.",
  "scene": {
    "gripper_pose": [x, y, z, qx, qy, qz, qw],
    "blocks": [],
    "joint_states": { "joint_1": 0.0, "joint_2": 0.6, "joint_3": -1.2, "joint_4": -0.4 },
    "grasped_block_id": null
  },
  "images": {
    "scene": { "mime": "image/rgb8", "width": 128, "height": 128, "b64": "…" }
  }
}
```

`images.scene.b64` is standard base64 of packed row-major RGB (length `width * height * 3`). MVP camera is an orthographic work-cell raster, not a photorealistic Three.js view.

### Action

```json
{
  "type": "action",
  "match_id": "uuid",
  "tick": 142,
  "action": {
    "joint_targets": { "joint_1": 0.2, "joint_2": 0.7, "joint_3": -1.1, "joint_4": -0.3 },
    "ee_delta": { "dx": 0.02, "dy": 0.0, "dz": 0.0 },
    "gripper_state": "closed"
  }
}
```

If `ee_delta` is present (metres from current TCP), geometric IK overrides `joint_targets`.

### Result

```json
{
  "type": "result",
  "match_id": "uuid",
  "status": "completed",
  "scores": {
    "spatial_accuracy": 0.94,
    "task_completion_score": 1.0,
    "joint_torque_telemetry": { "peak": 12.3, "avg": 4.1 }
  },
  "elo_delta": 18
}
```

`elo_delta` is computed on ingest (`POST /api/matches` with `x-vsarena-ingest`). The browser **cannot** write the public board.

## Auth

Hello must include the API key from `/account`. The harness looks up `profiles.api_key` via Supabase service role. Set `HARNESS_INGEST_SECRET` (≥16 chars) and `VSARENA_APP_URL` so results land on the leaderboard.

In `NODE_ENV=production`, a missing service role **rejects** all keys (no open-dev fallback).

## Hosted harness

Production WebSocket (Render):

| | |
| --- | --- |
| Live | `wss://vsarena-harness.onrender.com` |
| Health | `GET https://vsarena-harness.onrender.com/health` → `{ "ok": true, "busy": false }` |

Free tier may take 30–60s after idle (~15 min). One match at a time; a second client gets `harness busy`. Self-host / Oracle: [deploy/harness/README.md](../deploy/harness/README.md).

```bash
export VSARENA_API_KEY=…                    # from /account
export VSARENA_HARNESS_URL=wss://vsarena-harness.onrender.com
pip install -e "sdk/python[live]"
python -c "from vsarena import ColorSeek, run_match; print(run_match(ColorSeek(), dry_run=False, mode='vla'))"
```

## Local run

1. `/simulation` → **Run Baseline-IK** (poses) or **Run ColorSeek** (VLA RGB blobs). Neither writes public ELO. Tab VISION shows the 128×128 camera.
2. **Record demo** / **Stop + download** writes `vsarena-demo-v1` JSON (5 Hz, no cube poses). Replay with `python examples/replay_demo.py file.json`.
3. `pip install -e sdk/python` then `python examples/color_seek.py` (VLA dry-run).
4. `npm run harness` (serves `http://127.0.0.1:8787/health` + `ws://127.0.0.1:8787`) + `run_match(..., dry_run=False, mode="vla", api_key=...)`.

Python SDK: [sdk.md](sdk.md)
