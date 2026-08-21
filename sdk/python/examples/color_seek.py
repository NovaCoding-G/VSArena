"""Vision baseline. Dry-run: `python examples/color_seek.py` from sdk/python after `pip install -e .`."""

from vsarena import ColorSeek, run_match

if __name__ == "__main__":
    print(run_match(ColorSeek(), dry_run=True, mode="vla"))
