# Assumption: mock is kinematic only; dry-run scores are zeros, not a real eval.
"""Offline mock of the block-stacking arena. No physics — enough to iterate on `act()`."""

from __future__ import annotations

import base64
import time
import uuid
from typing import Any, Mapping, MutableMapping

from vsarena.agent import Agent

_IDENTITY = [0.0, 0.0, 0.0, 1.0]
STACK_INSTRUCTION = (
    "Stack the three cubes into a tower on the pad: cyan base, orange middle, magenta on top."
)
# 8×8 RGB so dry-run stays tiny (same mime as the live harness).
_MOCK_RGB = base64.b64encode(bytes([28, 32, 40] * (8 * 8))).decode("ascii")


def _pose(x: float, y: float, z: float) -> list[float]:
    return [x, y, z, *_IDENTITY]


def mock_state(tick: int, match_id: str, *, mode: str = "vla") -> dict[str, Any]:
    """One synthetic `state` frame.

    Example:
        mock_state(0, "dry-run")["observation_mode"] == "vla"
    """
    joints = {
        "joint_1": 0.0,
        "joint_2": 0.55,
        "joint_3": -1.15,
        "joint_4": -0.35,
    }
    base: dict[str, Any] = {
        "type": "state",
        "match_id": match_id,
        "tick": tick,
        "timestamp_ms": int(time.time() * 1000),
        "observation_mode": mode,
        "instruction": STACK_INSTRUCTION,
        "scene": {
            "gripper_pose": _pose(0.2, 1.1, 0.0),
            "blocks": [],
            "joint_states": joints,
            "grasped_block_id": None,
        },
    }
    if mode == "vla":
        base["images"] = {
            "scene": {"mime": "image/rgb8", "width": 8, "height": 8, "b64": _MOCK_RGB},
        }
        return base
    slot_y = 0.72 + 0.055 * (tick % 3)
    base["scene"]["blocks"] = [
        {
            "id": "block_cyan",
            "pose": _pose(-0.12, 0.747, 0.05),
            "target_pose": _pose(0.48, 0.747, 0.22),
        },
        {
            "id": "block_orange",
            "pose": _pose(0.0, 0.747, 0.05),
            "target_pose": _pose(0.48, 0.802, 0.22),
        },
        {
            "id": "block_magenta",
            "pose": _pose(0.12, 0.747, 0.05),
            "target_pose": _pose(0.48, slot_y, 0.22),
        },
    ]
    return base


def _normalize_action(raw: Mapping[str, Any]) -> dict[str, Any]:
    gripper = raw.get("gripper_state", "open")
    if gripper not in ("open", "closed"):
        raise ValueError("gripper_state must be 'open' or 'closed'")
    out: dict[str, Any] = {"gripper_state": gripper}
    targets = raw.get("joint_targets")
    if isinstance(targets, Mapping):
        out["joint_targets"] = dict(targets)
    delta = raw.get("ee_delta")
    if isinstance(delta, Mapping):
        out["ee_delta"] = {
            "dx": float(delta.get("dx", 0)),
            "dy": float(delta.get("dy", 0)),
            "dz": float(delta.get("dz", 0)),
        }
    if "joint_targets" not in out and "ee_delta" not in out:
        raise TypeError("act() must return joint_targets and/or ee_delta")
    return out


def run_dry_run(agent: Agent, *, ticks: int = 12, mode: str = "vla") -> dict[str, Any]:
    """Call `agent.act` on mock states and return a fake `result`.

    Example:
        run_dry_run(MyAgent())["type"] == "result"
    """
    match_id = f"dry-{uuid.uuid4()}"
    last: MutableMapping[str, Any] | None = None
    for tick in range(ticks):
        state = mock_state(tick, match_id, mode=mode)
        last = _normalize_action(agent.act(state))
    assert last is not None
    return {
        "type": "result",
        "match_id": match_id,
        "status": "completed",
        "scores": {
            "spatial_accuracy": 0.0,
            "task_completion_score": 0.0,
            "joint_torque_telemetry": {"peak": 0.0, "avg": 0.0},
        },
        "elo_delta": 0,
        "dry_run": True,
        "ticks": ticks,
        "last_action": last,
        "observation_mode": mode,
    }
