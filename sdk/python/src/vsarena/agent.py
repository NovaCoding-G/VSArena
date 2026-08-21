"""Agent base class. Implement `act` and pass an instance to `run_match`."""

from __future__ import annotations

from typing import Any, Mapping, MutableMapping


class Agent:
    """Policy interface used by the mock env and the live harness.

    Example:
        class Hold(Agent):
            def act(self, state: Mapping[str, Any]) -> MutableMapping[str, Any]:
                joints = state["scene"]["joint_states"]
                return {"joint_targets": dict(joints), "gripper_state": "open"}
    """

    def act(self, state: Mapping[str, Any]) -> MutableMapping[str, Any]:
        """Return an action dict for this `state` message.

        Args:
            state: On-wire `type=state` payload. VLA mode has `instruction` + `images`,
                empty `scene.blocks`.

        Returns:
            `joint_targets` and/or `ee_delta`, plus `gripper_state`.
        """
        raise NotImplementedError("implement Agent.act")
