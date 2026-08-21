"""CLI: `python -m vsarena` runs a hold-pose dry-run."""

from __future__ import annotations

import json
from typing import Any, Mapping, MutableMapping

from vsarena.agent import Agent
from vsarena.client import run_match


class HoldPose(Agent):
    """Sanity-check agent: keep current joints, gripper open."""

    def act(self, state: Mapping[str, Any]) -> MutableMapping[str, Any]:
        joints = state["scene"]["joint_states"]
        return {"joint_targets": dict(joints), "gripper_state": "open"}


def main() -> None:
    result = run_match(HoldPose(), dry_run=True)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
