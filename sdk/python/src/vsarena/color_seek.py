# Assumption: thresholds match lib/vision/blobs.ts; pick height uses table + cube half (task geometry, not cube GPS).
"""Vision baseline: chase cyan/orange/magenta blobs, then the pad."""

from __future__ import annotations

import base64
from typing import Any, Mapping, MutableMapping

from vsarena.agent import Agent

_ORDER = ("cyan", "orange", "magenta")
_STEP = 0.03
_XY_CLOSE = 6.0
_XY_NEAR = 14.0
_HELD_PX = 10.0
_STACKED_PAD = 8.0
_TABLE_TOP_Y = 0.72
_CUBE_HALF = 0.0275
_CUBE_SIZE = 0.055
_STACK = (0.48, 0.22)
_HOVER_Y = _TABLE_TOP_Y + _CUBE_HALF + 0.12
_PICK_Y = _TABLE_TOP_Y + _CUBE_HALF + 0.012
_DOWN_TICKS = 24
_PINCH_TICKS = 16
_LIFT_TICKS = 12
_CARRY_MAX = 80
_DROP_TICKS = 18
_OPEN_TICKS = 12
_PLACE_XY = 0.03
_CARRY_CLEAR = 0.11
_X_SPAN = 0.75 - (-0.55)
_Z_SPAN = 0.5 - (-0.5)


def _classify(r: int, g: int, b: int) -> str | None:
    if r > 220 and g > 220 and b > 220:
        return "tcp"
    if r < 80 and g > 120 and b > 180:
        return "cyan"
    if r > 200 and 90 < g < 210 and b < 90:
        return "orange"
    if r > 160 and g < 90 and b > 90:
        return "magenta"
    if r < 55 and 55 < g < 95 and 75 < b < 110:
        return "pad"
    return None


def find_blobs(rgb: bytes, size: int) -> dict[str, tuple[float, float, int] | None]:
    """Centroids `(u, v, count)` keyed like the TypeScript finder."""
    acc = {k: [0.0, 0.0, 0] for k in ("cyan", "orange", "magenta", "tcp", "pad")}
    for v in range(size):
        for u in range(size):
            i = (v * size + u) * 3
            if i + 2 >= len(rgb):
                break
            key = _classify(rgb[i], rgb[i + 1], rgb[i + 2])
            if not key:
                continue
            acc[key][0] += u
            acc[key][1] += v
            acc[key][2] += 1
    out: dict[str, tuple[float, float, int] | None] = {}
    mins = {"cyan": 6, "orange": 6, "magenta": 6, "tcp": 4, "pad": 8}
    for key, (su, sv, n) in acc.items():
        out[key] = (su / n, sv / n, n) if n >= mins[key] else None
    return out


def _decode(state: Mapping[str, Any]) -> tuple[bytes, int] | None:
    img = (state.get("images") or {}).get("scene") or {}
    if img.get("mime") != "image/rgb8":
        return None
    raw = base64.b64decode(img["b64"])
    return raw, int(img["width"])


def _step(dx: float, dy: float, dz: float) -> dict[str, float]:
    mag = (dx * dx + dy * dy + dz * dz) ** 0.5
    if mag <= _STEP or mag < 1e-9:
        return {"dx": dx, "dy": dy, "dz": dz}
    s = _STEP / mag
    return {"dx": dx * s, "dy": dy * s, "dz": dz * s}


def _near(a: tuple[float, float, int], b: tuple[float, float, int], px: float) -> bool:
    return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2) ** 0.5 <= px


def _tcp_y(state: Mapping[str, Any]) -> float:
    pose = state.get("scene", {}).get("gripper_pose") or []
    if len(pose) > 1 and isinstance(pose[1], (int, float)):
        return float(pose[1])
    return _HOVER_Y


def _tcp_world(state: Mapping[str, Any]) -> tuple[float, float, float]:
    pose = state.get("scene", {}).get("gripper_pose") or []
    x = float(pose[0]) if len(pose) > 0 and isinstance(pose[0], (int, float)) else 0.0
    y = float(pose[1]) if len(pose) > 1 and isinstance(pose[1], (int, float)) else _HOVER_Y
    z = float(pose[2]) if len(pose) > 2 and isinstance(pose[2], (int, float)) else 0.0
    return x, y, z


def _slot_y(hue: str) -> float:
    return _TABLE_TOP_Y + _CUBE_HALF + _ORDER.index(hue) * _CUBE_SIZE


def _on_pad(x: float, z: float, tol: float = _PLACE_XY) -> bool:
    return ((x - _STACK[0]) ** 2 + (z - _STACK[1]) ** 2) ** 0.5 <= tol


def _hold(state: Mapping[str, Any], grip: str) -> dict[str, Any]:
    joints = state["scene"]["joint_states"]
    return {"joint_targets": dict(joints), "gripper_state": grip}


class ColorSeek(Agent):
    """Scripted VLA-track policy. Live: `run_match(ColorSeek(), dry_run=False, mode="vla")`."""

    def __init__(self) -> None:
        self.phase = "hover"
        self.hold = 0
        self.target = "cyan"
        self.last_goal: tuple[float, float, int] | None = None
        self.last_plan = "ColorSeek idle"

    def act(self, state: Mapping[str, Any]) -> MutableMapping[str, Any]:
        frame = _decode(state)
        if frame is None:
            self.last_plan = "ColorSeek no image"
            return _hold(state, "open")
        rgb, size = frame
        blobs = find_blobs(rgb, size)
        tcp = blobs["tcp"]
        if tcp is None:
            self.last_plan = "ColorSeek lost TCP"
            return _hold(state, "open")

        pad = blobs["pad"]
        cube = blobs[self.target]
        if cube:
            self.last_goal = cube
        occluded = cube is None and self.last_goal is not None and _near(tcp, self.last_goal, _XY_NEAR)

        while True:
            blob = blobs[self.target]
            stacked = blob is not None and pad is not None and _near(blob, pad, _STACKED_PAD)
            if stacked and self.phase == "hover":
                idx = _ORDER.index(self.target) + 1
                if idx >= len(_ORDER):
                    self.phase = "done"
                    self.last_plan = "ColorSeek stacked"
                    return _hold(state, "open")
                self.target = _ORDER[idx]
                self.phase = "hover"
                self.hold = 0
                self.last_goal = None
                continue
            break

        if self.phase == "done":
            return _hold(state, "open")

        goal = cube or self.last_goal
        if goal is None and self.phase == "hover":
            self.last_plan = f"ColorSeek wait {self.target}"
            return _hold(state, "open")
        aim = goal or tcp
        du, dv = aim[0] - tcp[0], aim[1] - tcp[1]
        dx = (du / (size - 1)) * _X_SPAN
        dz = -(dv / (size - 1)) * _Z_SPAN
        xy_dist = (du * du + dv * dv) ** 0.5
        xy_close = xy_dist <= _XY_CLOSE or occluded
        y = _tcp_y(state)
        wx, wy, wz = _tcp_world(state)
        slot_y = _slot_y(self.target)

        if self.phase == "hover":
            self.last_plan = f"Seek {self.target}"
            self.hold += 1
            if (xy_close and self.hold > 3) or (xy_dist <= _XY_NEAR and self.hold > 40):
                self.phase, self.hold = "down", 0
            return {"ee_delta": _step(dx, _HOVER_Y - y, dz), "gripper_state": "open"}
        if self.phase == "down":
            self.last_plan = f"Down {self.target}"
            self.hold += 1
            if y <= _PICK_Y + 0.02 or self.hold > _DOWN_TICKS:
                self.phase, self.hold = "pinch", 0
            return {"ee_delta": _step(dx * 0.35, _PICK_Y - y, dz * 0.35), "gripper_state": "open"}
        if self.phase == "pinch":
            self.last_plan = f"Pinch {self.target}"
            self.hold += 1
            if self.hold > _PINCH_TICKS:
                self.phase, self.hold = "lift", 0
            return {"ee_delta": _step(dx * 0.15, _PICK_Y - y, dz * 0.15), "gripper_state": "closed"}
        if self.phase == "lift":
            self.last_plan = f"Lift {self.target}"
            self.hold += 1
            if self.hold > _LIFT_TICKS:
                self.phase, self.hold = "carry", 0
            return {"ee_delta": _step(0, 0.024, 0), "gripper_state": "closed"}
        if self.phase == "carry":
            if cube and not _near(cube, tcp, _HELD_PX) and not (pad and _near(cube, pad, _STACKED_PAD)):
                self.last_plan = f"Retry {self.target}"
                self.phase, self.hold = "hover", 0
                return {"ee_delta": _step(0, 0.01, 0), "gripper_state": "open"}
            self.last_plan = f"Carry {self.target}"
            self.hold += 1
            hover_y = slot_y + _CARRY_CLEAR
            at_pad = _on_pad(wx, wz)
            if (at_pad and abs(wy - hover_y) < 0.05) or self.hold > _CARRY_MAX:
                self.phase, self.hold = "drop", 0
            return {
                "ee_delta": _step(_STACK[0] - wx, hover_y - wy, _STACK[1] - wz),
                "gripper_state": "closed",
            }
        if self.phase == "drop":
            self.last_plan = f"Place {self.target}"
            self.hold += 1
            place_y = slot_y + 0.012
            settled = _on_pad(wx, wz, _PLACE_XY + 0.01) and wy <= place_y + 0.03
            if (settled and self.hold > 4) or self.hold > _DROP_TICKS:
                self.phase, self.hold = "open", 0
            return {
                "ee_delta": _step(_STACK[0] - wx, place_y - wy, _STACK[1] - wz),
                "gripper_state": "closed",
            }
        if self.phase == "open":
            self.last_plan = f"Release {self.target}"
            self.hold += 1
            if self.hold > _OPEN_TICKS:
                if _on_pad(wx, wz, 0.055):
                    idx = _ORDER.index(self.target) + 1
                    if idx >= len(_ORDER):
                        self.phase = "done"
                    else:
                        self.target = _ORDER[idx]
                        self.phase = "hover"
                        self.last_goal = None
                else:
                    self.last_plan = f"Retry {self.target}"
                    self.phase = "hover"
                    self.last_goal = None
                self.hold = 0
            return {"ee_delta": _step(0, 0.014, 0), "gripper_state": "open"}
        return _hold(state, "open")
