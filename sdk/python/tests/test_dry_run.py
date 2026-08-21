import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from vsarena import Agent, ColorSeek, ReplayAgent, load_episode, run_match
from vsarena.mock_env import mock_state


class Hold(Agent):
    def act(self, state):
        return {"joint_targets": dict(state["scene"]["joint_states"]), "gripper_state": "open"}


class DryRunTests(unittest.TestCase):
    def test_vla_mock_hides_blocks(self) -> None:
        msg = mock_state(0, "m")
        self.assertEqual(msg["type"], "state")
        self.assertEqual(msg["observation_mode"], "vla")
        self.assertEqual(msg["scene"]["blocks"], [])
        self.assertIn("instruction", msg)
        self.assertEqual(msg["images"]["scene"]["mime"], "image/rgb8")

    def test_state_mock_keeps_blocks(self) -> None:
        msg = mock_state(0, "m", mode="state")
        self.assertEqual(len(msg["scene"]["blocks"]), 3)

    def test_dry_run_result(self) -> None:
        result = run_match(Hold(), dry_run=True, ticks=4)
        self.assertEqual(result["type"], "result")
        self.assertTrue(result["dry_run"])
        self.assertEqual(result["last_action"]["gripper_state"], "open")
        self.assertEqual(result["observation_mode"], "vla")

    def test_color_seek_dry_run(self) -> None:
        result = run_match(ColorSeek(), dry_run=True, ticks=3, mode="vla")
        self.assertEqual(result["type"], "result")
        self.assertIn(result["last_action"]["gripper_state"], ("open", "closed"))

    def test_rejects_bad_task(self) -> None:
        with self.assertRaises(ValueError):
            run_match(Hold(), task="flying")

    def test_load_episode_and_replay(self) -> None:
        episode = {
            "format": "vsarena-demo-v1",
            "task": "block_stacking",
            "observation_mode": "vla",
            "instruction": "stack",
            "hz": 5,
            "created_at": "2026-08-20T00:00:00Z",
            "frames": [
                {
                    "t": 0,
                    "tick": 1,
                    "timestamp_ms": 0,
                    "images": {
                        "scene": {
                            "mime": "image/rgb8",
                            "width": 1,
                            "height": 1,
                            "b64": "CgoK",
                        }
                    },
                    "scene": {
                        "gripper_pose": [0, 0, 0, 0, 0, 0, 1],
                        "joint_states": {
                            "joint_1": 0.1,
                            "joint_2": 0.2,
                            "joint_3": -1.0,
                            "joint_4": 0.0,
                        },
                    },
                    "action": {
                        "joint_targets": {
                            "joint_1": 0.1,
                            "joint_2": 0.2,
                            "joint_3": -1.0,
                            "joint_4": 0.0,
                        },
                        "ee_delta": {"dx": 0.01, "dy": 0.0, "dz": 0.0},
                        "gripper_state": "closed",
                    },
                }
            ],
        }
        loaded = load_episode(episode)
        result = run_match(ReplayAgent(loaded), dry_run=True, ticks=2, mode="vla")
        self.assertEqual(result["last_action"]["gripper_state"], "closed")
        self.assertEqual(result["last_action"]["ee_delta"]["dx"], 0.01)
        with self.assertRaises(ValueError):
            load_episode({**episode, "format": "nope"})


if __name__ == "__main__":
    unittest.main()
