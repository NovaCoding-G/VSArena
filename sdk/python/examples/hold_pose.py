"""Hold current joints. Dry-run: `python examples/hold_pose.py` from sdk/python after `pip install -e .`."""

from vsarena import Agent, run_match


class HoldPose(Agent):
    def act(self, state: dict) -> dict:
        joints = state["scene"]["joint_states"]
        return {"joint_targets": dict(joints), "gripper_state": "open"}


if __name__ == "__main__":
    print(run_match(HoldPose(), dry_run=True))
