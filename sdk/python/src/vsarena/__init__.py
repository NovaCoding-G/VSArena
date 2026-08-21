"""VSArena Python SDK.

Dry-run needs no extra packages. Live WebSocket matches: `pip install vsarena[live]`.
"""

from vsarena.agent import Agent
from vsarena.client import run_match
from vsarena.color_seek import ColorSeek
from vsarena.dataset import ReplayAgent, load_episode

__all__ = ["Agent", "ColorSeek", "ReplayAgent", "load_episode", "run_match"]
