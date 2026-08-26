import math
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from vsarena.taxonomy import (
    FAILURE_CODES,
    NEGATIVE_ACTION_FIXTURES,
    format_harness_error,
    parse_action_contract,
)


class TaxonomyTests(unittest.TestCase):
    def test_codes_are_dotted_domains(self) -> None:
        for code in FAILURE_CODES:
            self.assertIn(code.split(".", 1)[0], ("policy", "protocol", "harness"))

    def test_error_string_includes_code(self) -> None:
        self.assertEqual(
            format_harness_error({"code": "harness.busy", "message": "retry shortly"}),
            "harness.busy: retry shortly",
        )
        self.assertEqual(
            format_harness_error({"code": "harness.busy", "message": "harness.busy: already prefixed"}),
            "harness.busy: already prefixed",
        )

    def test_negative_action_fixtures(self) -> None:
        ok, _ = parse_action_contract(
            {"gripper_state": "open", "joint_targets": {"joint_1": 0.1, "joint_2": 0.2, "joint_3": -1, "joint_4": 0}}
        )
        self.assertTrue(ok)
        for fixture in NEGATIVE_ACTION_FIXTURES:
            ok, reason = parse_action_contract(fixture["action"])
            self.assertFalse(ok, fixture["name"])
            self.assertTrue(reason)
        ok_nan, _ = parse_action_contract(
            {"gripper_state": "open", "joint_targets": {"joint_1": math.nan}}
        )
        self.assertFalse(ok_nan)


if __name__ == "__main__":
    unittest.main()
