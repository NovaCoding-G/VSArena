# Assumption: vsarena-demo-v1 JSON from the in-browser recorder; not LeRobot parquet yet.
"""Load teleop / rollout demos recorded on the VLA track."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Mapping, MutableMapping

from vsarena.agent import Agent

DEMO_FORMAT = "vsarena-demo-v1"


def load_episode(source: str | Path | Mapping[str, Any]) -> dict[str, Any]:
    """Parse and validate a `vsarena-demo-v1` episode.

    Args:
        source: File path or already-loaded dict.

    Example:
        ep = load_episode("vsarena-demo.json")
        ReplayAgent(ep).act(ep["frames"][0])
    """
    if isinstance(source, Mapping):
        episode = dict(source)
    else:
        raw = Path(source).read_text(encoding="utf-8")
        episode = json.loads(raw)
    if episode.get("format") != DEMO_FORMAT:
        raise ValueError(f"expected format {DEMO_FORMAT}, got {episode.get('format')!r}")
    if episode.get("observation_mode") != "vla":
        raise ValueError("demos must be observation_mode='vla'")
    frames = episode.get("frames")
    if not isinstance(frames, list) or len(frames) == 0:
        raise ValueError("episode has no frames")
    for index, frame in enumerate(frames):
        if not isinstance(frame, Mapping):
            raise ValueError(f"frame {index} is not an object")
        action = frame.get("action")
        if not isinstance(action, Mapping):
            raise ValueError(f"frame {index} missing action")
        if action.get("gripper_state") not in ("open", "closed"):
            raise ValueError(f"frame {index} has invalid gripper_state")
        if "images" not in frame:
            raise ValueError(f"frame {index} missing images")
    return episode


class ReplayAgent(Agent):
    """Replay stored actions in order. Ignores live images (sanity-check a recording).

    Example:
        run_match(ReplayAgent(load_episode(path)), dry_run=True)
    """

    def __init__(self, episode: Mapping[str, Any]) -> None:
        frames = episode.get("frames")
        if not isinstance(frames, list) or not frames:
            raise ValueError("ReplayAgent needs a non-empty episode")
        self._frames = frames
        self._i = 0

    def act(self, state: Mapping[str, Any]) -> MutableMapping[str, Any]:
        del state
        frame = self._frames[min(self._i, len(self._frames) - 1)]
        self._i += 1
        action = dict(frame["action"])
        out: dict[str, Any] = {"gripper_state": action["gripper_state"]}
        if action.get("joint_targets") is not None:
            out["joint_targets"] = dict(action["joint_targets"])
        if action.get("ee_delta") is not None:
            out["ee_delta"] = dict(action["ee_delta"])
        return out
