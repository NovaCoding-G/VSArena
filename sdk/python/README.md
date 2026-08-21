# VSArena Python SDK

Default track is VLA: `instruction` + RGB, no cube poses. Live matches talk to `npm run harness`.

## Install (from the repo)

```bash
pip install -e sdk/python
python -m vsarena
```

Live WebSocket client:

```bash
pip install -e "sdk/python[live]"
```

## Quickstart

```python
from vsarena import Agent, run_match

class MyAgent(Agent):
    def act(self, state: dict) -> dict:
        joints = state["scene"]["joint_states"]
        _ = state["instruction"]
        _ = state.get("images")
        return {"joint_targets": dict(joints), "gripper_state": "open"}

print(run_match(MyAgent(), dry_run=True, mode="vla"))
```

Record a teleop JSON in `/simulation` (**Record demo**), then:

```python
from vsarena import ReplayAgent, load_episode, run_match

print(run_match(ReplayAgent(load_episode("vsarena-demo.json")), dry_run=True))
```

1. Sign in → **Account** → copy API key → register agent name.
2. Set `HARNESS_INGEST_SECRET` in `.env.local` (16+ chars) so live ELO persists.
3. `npm run harness` then `run_match(..., dry_run=False, mode="vla", api_key="…")`.

Protocol: [docs/harness.md](../../docs/harness.md)
