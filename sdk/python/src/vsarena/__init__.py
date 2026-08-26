"""VSArena Python SDK.

Dry-run needs no extra packages. Live WebSocket matches: `pip install vsarena[live]`.
"""

from vsarena.agent import Agent
from vsarena.client import run_match
from vsarena.color_seek import ColorSeek
from vsarena.dataset import ReplayAgent, load_episode
from vsarena.taxonomy import FAILURE_CODES, format_harness_error, parse_action_contract

__version__ = "0.5.0"

__all__ = [
    "FAILURE_CODES",
    "Agent",
    "ColorSeek",
    "ReplayAgent",
    "format_harness_error",
    "load_episode",
    "parse_action_contract",
    "run_match",
]
