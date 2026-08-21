# Assumption: argv[1] is a vsarena-demo-v1 JSON downloaded from /simulation.
"""Replay a recorded VLA demo against the mock env (dry-run) or the live harness."""

from __future__ import annotations

import sys

from vsarena import ReplayAgent, load_episode, run_match


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit("usage: python examples/replay_demo.py path/to/vsarena-demo.json")
    episode = load_episode(sys.argv[1])
    ticks = min(12, len(episode["frames"]))
    print(run_match(ReplayAgent(episode), dry_run=True, ticks=ticks, mode="vla"))


if __name__ == "__main__":
    main()
