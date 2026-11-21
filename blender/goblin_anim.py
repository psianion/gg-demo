"""Motion for the miniature goblin: secondary bones, six hero clips, and the files other scenes and the site load.

    blender -b --factory-startup --python goblin_anim.py -- build              out/lib/goblin_mini.blend, out/kit/goblin__mini.glb, manifest
    blender -b --factory-startup --python goblin_anim.py -- strip <out.png> [samples] [clips]   every 4th frame, for judging from stills
    blender -b --factory-startup --python goblin_anim.py -- reel <out.mp4> [samples]            the six clips back to back

The hero clips are not stock: each is written as eased curves for a handful of controls (hips, chest, head, hand and
foot targets) and solved to the rig at every frame, so feet stay planted and joints lead and follow each other. On
top of that the loose parts (ears, scarf tail, thrown-back hood, pouches, rope, mallet, sash) swing on damped
springs driven by the body, baked to keys. The 76 pack clips stay in the file as a fallback library.
"""
import json
import math
import os
import sys

import bpy
from mathutils import Matrix, Quaternion, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import goblin_mini as gm  # noqa: E402
import kit  # noqa: E402

FPS = 24
KIT = os.path.join(kit.OUT, "kit")
TAU = math.tau


# ---------------------------------------------------------------- curve helpers
def smooth(u):
    u = max(0.0, min(1.0, u))
    return u * u * (3 - 2 * u)


def lerp(a, b, u):
    if isinstance(a, (int, float)):
        return a + (b - a) * u
    if isinstance(a, Vector):
        return a.lerp(b, u)
    return tuple(x + (y - x) * u for x, y in zip(a, b))


def K(t, pts):
    """Hand-key style: hold the first and last values, ease in and out of every key between."""
    if t <= pts[0][0]:
        return pts[0][1]
    for (t0, v0), (t1, v1) in zip(pts, pts[1:]):
        if t <= t1:
            return lerp(v0, v1, smooth((t - t0) / (t1 - t0)))
    return pts[-1][1]


def bell(t, centre, half):
    return smooth(1 - abs(t - centre) / half)


def settle(t, start, length, a=0.0, b=1.0):
    """From a to b with one overshoot and a settle, the way weight arrives."""
    u = (t - start) / length
    if u <= 0:
        return a
    return a + (b - a) * (1 - math.exp(-5.5 * u) * math.cos(8.5 * u))


# ---------------------------------------------------------------- the solver
def rot(pitch=0.0, roll=0.0, yaw=0.0):
    """Pitch bows forward (toward -Y), roll leans to the figure's left (+X), yaw turns to its left."""
    return Matrix.Rotation(math.radians(yaw), 4, "Z") @ Matrix.Rotation(math.radians(roll), 4, "Y") @ Matrix.Rotation(math.radians(pitch), 4, "X")


def turned(m0, pitch=0.0, roll=0.0, yaw=0.0):
    h = m0.translation.copy()
    return Matrix.Translation(h) @ rot(pitch, roll, yaw) @ Matrix.Translation(-h) @ m0


def aimed(m0, along, twist=0.0):
    """Swing a bone to point along a direction with the least twist, then twist it about its own length."""
    h = m0.translation.copy()
    q = (m0.to_3x3() @ Vector((0, 1, 0))).normalized().rotation_difference(Vector(along).normalized())
    m = Matrix.Translation(h) @ q.to_matrix().to_4x4() @ Matrix.Translation(-h) @ m0
    return m @ Matrix.Rotation(math.radians(twist), 4, "Y") if twist else m


def two_bone(start, target, a, b, pole):
    v = target - start
    d = max(abs(a - b) + 1e-3, min(a + b - 1e-3, v.length))
    u = v.normalized()
    x = (a * a - b * b + d * d) / (2 * d)
    h = math.sqrt(max(0.0, a * a - x * x))
    p = pole - u * pole.dot(u)
    p = p.normalized() if p.length > 1e-5 else Vector((0, 1, 0))
    return start + u * x + p * h, start + u * d


class Body:
    """Rest data of the rig and the solve from a few controls to a matrix for every body bone."""

    def __init__(self, rig):
        self.rest = {b.name: b.matrix_local.copy() for b in rig.data.bones}
        self.parent = {b.name: b.parent.name if b.parent else None for b in rig.data.bones}
        self.length = {b.name: b.length for b in rig.data.bones}
        r = self.rest
        self.arm = {s: ((r[f"lowerarm.{s}"].translation - r[f"upperarm.{s}"].translation).length,
                        (r[f"wrist.{s}"].translation - r[f"lowerarm.{s}"].translation).length) for s in "lr"}
        self.leg = {s: ((r[f"lowerleg.{s}"].translation - r[f"upperleg.{s}"].translation).length,
                        (r[f"foot.{s}"].translation - r[f"lowerleg.{s}"].translation).length) for s in "lr"}
        self.shoulder = {s: r[f"upperarm.{s}"].translation.copy() for s in "lr"}
        self.ankle = {s: r[f"foot.{s}"].translation.copy() for s in "lr"}

    def inherit(self, pose, bone):
        p = self.parent[bone]
        return pose[p] @ self.rest[p].inverted() @ self.rest[bone]

    def solve(self, c):
        r, pose = self.rest, {"root": self.rest["root"].copy()}
        pose["hips"] = turned(Matrix.Translation(c["hip"]) @ self.inherit(pose, "hips"), *c["hip_rot"])
        for b in ("spine", "chest", "head"):
            pose[b] = turned(self.inherit(pose, b), *c[b])
        chest_turn = pose["chest"].to_3x3() @ r["chest"].to_3x3().inverted()
        for s, side in (("l", 1), ("r", -1)):
            arm = c[f"arm_{s}"]
            up0 = self.inherit(pose, f"upperarm.{s}")
            start = up0.translation.copy()
            if arm.get("space", "chest") == "chest":
                target, pole = start + chest_turn @ arm["off"], chest_turn @ arm["pole"]
            else:
                target, pole = arm["off"], arm["pole"]
            elbow, wrist = two_bone(start, target, *self.arm[s], pole)
            pose[f"upperarm.{s}"] = aimed(up0, elbow - start)
            pose[f"lowerarm.{s}"] = aimed(self.inherit(pose, f"lowerarm.{s}"), wrist - elbow, arm.get("twist", 0.0) * side)
            hp, hr, hy = arm.get("hand", (0, 0, 0))
            pose[f"wrist.{s}"] = self.inherit(pose, f"wrist.{s}") @ rot(hp, hr, hy * side)
            pose[f"hand.{s}"] = self.inherit(pose, f"hand.{s}")

            foot = c[f"foot_{s}"]
            hip0 = self.inherit(pose, f"upperleg.{s}")
            joint = hip0.translation.copy()
            knee, ankle = two_bone(joint, self.ankle[s] + foot["off"], *self.leg[s], Vector(foot.get("pole", (side * 0.18, -1, 0.05))))
            pose[f"upperleg.{s}"] = aimed(hip0, knee - joint)
            pose[f"lowerleg.{s}"] = aimed(self.inherit(pose, f"lowerleg.{s}"), ankle - knee)
            pose[f"foot.{s}"] = Matrix.Translation(ankle) @ rot(foot.get("pitch", 0.0), 0.0, foot.get("yaw", 0.0) * side) @ r[f"foot.{s}"].to_3x3().to_4x4()
            pose[f"toes.{s}"] = self.inherit(pose, f"toes.{s}") @ rot(-foot.get("toe", 0.0))
            if f"lid.{s}" in r:
                pose[f"lid.{s}"] = turned(self.inherit(pose, f"lid.{s}"), pitch=40 * c.get("blink", 0.0))
        return pose

    def basis(self, pose, bone):
        return self.inherit(pose, bone).inverted() @ pose[bone] if self.parent[bone] else self.rest[bone].inverted() @ pose[bone]


def stand():
    """The relaxed stance every clip starts from and returns to."""
    return {
        "squash": (1.0, 1.0), "hip": Vector((0, 0, -0.02)), "hip_rot": (2, 0, 0), "spine": (2, 0, 0), "chest": (4, 0, 0), "head": (-6, 0, 0),
        "arm_l": {"off": Vector((0.13, -0.03, -0.555)), "pole": Vector((0.35, 1, 0.1)), "hand": (0, 0, 0)},
        "arm_r": {"off": Vector((-0.13, -0.03, -0.555)), "pole": Vector((-0.35, 1, 0.1)), "hand": (0, 0, 0)},
        "foot_l": {"off": Vector((0.02, 0, 0)), "yaw": 10.0}, "foot_r": {"off": Vector((-0.02, 0, 0)), "yaw": 10.0},
        "blink": 0.0,
    }


# ---------------------------------------------------------------- the six clips
def idle_alive(t):
    c = stand()
    breath = math.sin(TAU * t / 2.0)
    shift, late = math.sin(TAU * t / 4.0), math.sin(TAU * (t - 0.22) / 4.0)

    def look(x):
        return K(x % 4.0, [(0, 0), (0.6, 0), (1.15, 26), (1.9, 24), (2.55, -18), (3.2, -16), (3.8, 0), (4, 0)])

    c["hip"] = Vector((0.032 * shift, 0.004 * breath, -0.02 - 0.006 * breath - 0.010 * abs(shift)))
    c["hip_rot"] = (2, -3.0 * shift, 0)
    c["spine"] = (2, 1.5 * late, 0.12 * look(t - 0.16))
    c["chest"] = (4 + 1.4 * breath, 2.2 * late, 0.22 * look(t - 0.10))
    nod = K(t, [(0, -6), (0.6, -6), (1.15, -11), (1.9, -10), (2.55, -1), (3.2, -2), (3.8, -6), (4, -6)])
    c["head"] = (nod + 1.5 * bell(t, 0.9, 0.2), 3.0 * late + 5 * bell(t, 2.75, 0.5), 0.66 * look(t))
    for s, side in (("l", 1), ("r", -1)):
        c[f"arm_{s}"]["off"] = c[f"arm_{s}"]["off"] + Vector((side * 0.008 * breath, 0.012 * late * side, 0.007 * breath))
        c[f"arm_{s}"]["hand"] = (4 * breath, 0, 3 * late)
    c["blink"] = max(bell(t, 0.62, 0.09), bell(t, 2.02, 0.09), bell(t, 2.20, 0.08), bell(t, 3.45, 0.09))
    return c


def greet(t):
    c = stand()
    notice = K(t, [(0, 0), (0.06, 0), (0.24, 1)])
    dip = bell(t, 0.25, 0.13)
    up = settle(t, 0.30, 0.42) * (1 - K(t, [(1.42, 0), (1.86, 1)]))
    env = K(t, [(0.50, 0), (0.64, 1), (1.30, 1), (1.48, 0)])

    def wave(x):
        return math.sin((x - 0.56) * TAU * 2.7)

    land = bell(t, 1.80, 0.16)
    c["hip"] = Vector((-0.022 * up, 0.01 * dip, -0.02 - 0.040 * dip + 0.020 * up + 0.006 * env * abs(wave(t)) - 0.018 * land))
    c["hip_rot"] = (2 + 3 * dip, 2.5 * up, 3 * up)
    c["spine"] = (2 + 3 * dip, -2 * up, 4 * up)
    c["chest"] = (4 + 7 * dip - 6 * up, -5 * up + 1.6 * env * wave(t - 0.04), 7 * up)
    c["head"] = (-6 - 7 * notice + 4 * K(t, [(1.5, 0), (1.9, 1)]), 8 * up + 3 * env * wave(t - 0.09), 20 * notice * (1 - K(t, [(1.5, 0), (1.95, 1)])))
    hang, high = Vector((0.13, -0.03, -0.555)), Vector((0.35, -0.14, 0.40))
    c["arm_l"]["off"] = hang.lerp(high, up) + Vector((0.12 * wave(t), 0.0, -0.025 * abs(wave(t)))) * env
    c["arm_l"]["pole"] = Vector((0.35, 1, 0.1)).lerp(Vector((0.9, 0.4, -0.7)), min(1.0, up))
    c["arm_l"]["twist"] = -80 * min(1.0, up)
    c["arm_l"]["hand"] = (0, 0, 22 * env * wave(t - 0.08))
    c["arm_r"]["off"] = Vector((-0.13 - 0.05 * up, -0.03 + 0.03 * dip, -0.555 + 0.035 * up))
    c["foot_l"]["pitch"] = 9 * up * (1 - land)
    c["foot_l"]["off"] = Vector((0.02, 0, 0.022 * up * (1 - land)))
    c["blink"] = max(bell(t, 0.12, 0.08), bell(t, 1.62, 0.09))
    return c


def _step(p, stride=0.36, lift=0.14):
    """One foot through a walk cycle. p = 0 is heel strike in front. Returns its offset and pitch (toe down positive)."""
    if p < 0.55:
        u = p / 0.55
        y = -stride / 2 + stride * u
        pitch = lerp(-17, 0, smooth(u / 0.2)) if u < 0.55 else lerp(0, 26, smooth((u - 0.6) / 0.4))
        z = 0.17 * math.sin(math.radians(max(0.0, pitch)))          # the heel peels off round the ball of the foot
    else:
        u = (p - 0.55) / 0.45
        y = stride / 2 - stride * smooth(u)
        pitch = lerp(26, -17, smooth(u * 1.15)) + 12 * math.sin(math.pi * u)
        z = lift * math.sin(math.pi * u) ** 0.8 + 0.075 * (1 - u) ** 2
    return Vector((0, y, z)), pitch


def walk(t):
    c = stand()
    f = t % 1.0
    a = TAU * f
    c["hip"] = Vector((0.030 * math.sin(a - 0.15), 0, -0.032 - 0.024 * math.cos(2 * (a - TAU * 0.10))))
    c["hip_rot"] = (4, -3.5 * math.sin(a), -9 * math.cos(a))
    c["spine"] = (3, 1.5 * math.sin(a - 0.3), 5 * math.cos(a - 0.2))
    c["chest"] = (6, 3.0 * math.sin(a - 0.5), 9 * math.cos(a - 0.35))
    c["head"] = (-7 + 2.2 * math.sin(2 * (a - 1.6)), -1.5 * math.sin(a - 0.8), -4 * math.cos(a - 0.5))
    for s, side, lead in (("l", 1, 0.0), ("r", -1, 0.5)):
        off, pitch = _step((f + lead) % 1.0)
        c[f"foot_{s}"] = {"off": Vector((side * 0.02, 0, 0)) + off, "pitch": pitch, "yaw": 8.0, "toe": 20 * smooth((pitch - 8) / 18)}
        swing = math.cos(a - TAU * (lead + 0.5) - 0.35)              # the arm opposite the leading leg comes forward, a beat late
        fwd = max(0.0, swing)
        c[f"arm_{s}"]["off"] = Vector((side * (0.15 + 0.02 * fwd), -0.03 - 0.17 * swing, -0.55 + 0.07 * fwd * fwd + 0.02 * max(0.0, -swing)))
        c[f"arm_{s}"]["pole"] = Vector((side * 0.4, 1, 0.2 - 0.5 * fwd))
        c[f"arm_{s}"]["hand"] = (12 * math.cos(a - TAU * (lead + 0.5) - 1.0), 0, 0)
    return c


# his hands slide along this line: forward and down, the way the rope runs from them over the island's edge (Beat 1)
ROPE_FROM, ROPE_ALONG = Vector((0.02, -0.26, 1.22)), Vector((0.0, -1.0, -0.42)).normalized()


def haul_rope(t):
    c = stand()
    big = 1.0 if t % 2.0 < 1.0 else 1.3               # the second heave of each pair is the harder one
    f = t % 1.0
    surge = 0.5 + 0.5 * math.sin(TAU * 2 * f - 1.3)

    def grip(p, side):
        if p < 0.6:
            s, up = lerp(0.37, 0.05, smooth(p / 0.6)), 0.0
        else:
            u = (p - 0.6) / 0.4
            s, up = lerp(0.05, 0.37, smooth(u)), 0.08 * math.sin(math.pi * u)
        return ROPE_FROM + ROPE_ALONG * s + Vector((side * 0.025, 0, up))

    lean = 0.035 * surge * big
    c["hip"] = Vector((0.01 * math.sin(TAU * f), 0.17 + lean, -0.20 - 0.02 * surge * big))
    c["hip_rot"] = (-15 - 5 * surge * big, 0, 5 * math.sin(TAU * f - 0.4))
    c["spine"] = (-7 - 3 * surge, 0, 4 * math.sin(TAU * f - 0.7))
    c["chest"] = (-9 - 6 * surge * big, 0, 11 * math.sin(TAU * f - 1.0))
    c["head"] = (26 + 5 * surge, 0, -9 * math.sin(TAU * f - 1.2))
    for s, side, lead in (("l", 1, 0.0), ("r", -1, 0.5)):
        p = (f + lead) % 1.0
        c[f"arm_{s}"] = {"off": grip(p, side) + Vector((0, lean, 0)), "pole": Vector((side * 0.7, 0.3, -1.0)), "space": "world",
                         "twist": -60, "hand": (0, 0, 0)}
    c["foot_l"] = {"off": Vector((0.05, -0.24, 0.012)), "pitch": -15 - 3 * surge, "yaw": 6.0, "pole": (0.25, -1, 0.1)}
    c["foot_r"] = {"off": Vector((-0.06, 0.17, 0.045)), "pitch": 20 + 4 * surge, "yaw": 24.0, "toe": 22, "pole": (-0.5, -1, 0.0)}
    c["blink"] = bell(t % 2.0, 1.42, 0.12)
    return c


def pick_up(t):
    c = stand()
    down = K(t, [(0.22, 0), (0.74, 1)]) if t < 1.0 else settle(t, 1.0, 0.55, 1.0, 0.0)
    bend = K(t - 0.07, [(0.22, 0), (0.74, 1)]) if t < 1.07 else settle(t, 1.07, 0.55, 1.0, 0.0)       # the back follows the legs
    reach = settle(t, 0.34, 0.50)
    carry = K(t, [(0.98, 0), (1.46, 1)])
    grab = bell(t, 0.90, 0.12)
    proud = bell(t, 1.85, 0.25)
    c["hip"] = Vector((0, 0.04 * down, -0.02 - 0.40 * down - 0.015 * grab + 0.012 * proud))
    c["hip_rot"] = (2 + 7 * down, 0, -4 * down)
    c["spine"] = (2 + 6 * bend, 0, -3 * bend)
    c["chest"] = (4 + 11 * bend - 5 * proud, 0, -6 * bend)
    eyes_down = K(t, [(0.02, 0), (0.22, 1)]) * (1 - K(t, [(0.5, 0), (0.8, 1)]))
    c["head"] = (-6 + 18 * eyes_down - 20 * bend + 12 * bell(t, 0.86, 0.2) + 13 * carry * (1 - bend) - 8 * proud, 6 * proud, 8 * down - 10 * proud)
    ground, chest_high = Vector((-0.12, -0.46, 0.27)), Vector((-0.07, -0.33, 1.06))
    hang_r, hang_l = Vector((-0.34, -0.10, 0.84)), Vector((0.34, -0.10, 0.84))
    c["arm_r"] = {"off": hang_r.lerp(ground, min(1.0, reach)).lerp(chest_high, carry) + Vector((0, 0, 0.03 * max(0.0, reach - 1))),
                  "pole": Vector((-0.8, 0.6, -0.2)), "space": "world", "twist": -40 * carry, "hand": (10 * grab, 0, 0)}
    knee, meet = Vector((0.27, -0.24, 0.50)), Vector((0.09, -0.33, 1.02))
    c["arm_l"] = {"off": hang_l.lerp(knee, min(1.0, down)).lerp(meet, K(t, [(1.10, 0), (1.56, 1)])), "pole": Vector((0.8, 0.6, -0.2)), "space": "world",
                  "twist": -40 * carry, "hand": (0, 0, 0)}
    for s, side in (("l", 1), ("r", -1)):
        c[f"foot_{s}"] = {"off": Vector((side * (0.02 + 0.02 * down), 0, 0)), "yaw": 10 + 12 * down, "pole": (side * (0.18 + 0.45 * down), -1, 0.05)}
    c["blink"] = max(bell(t, 0.80, 0.08), bell(t, 1.70, 0.10))
    return c


def cheer(t):
    c = stand()
    off_at, on_at, hop = 0.40, 0.84, 0.30
    u = (t - off_at) / (on_at - off_at)
    air = hop * 4 * u * (1 - u) if 0 < u < 1 else 0.0
    body = K(t, [(0, -0.02), (0.26, -0.20), (0.34, -0.18), (0.42, 0.01), (0.60, 0.02), (0.84, -0.03), (0.94, -0.19), (1.14, 0.0), (1.32, -0.04),
                 (1.60, -0.02), (2, -0.02)])

    def arms(x):
        return K(x, [(0, 0), (0.26, -0.30), (0.34, -0.24), (0.50, 1.10), (0.62, 1.0), (0.86, 0.90), (0.98, 0.50), (1.20, 1.04), (1.40, 0.92),
                     (1.78, 0), (2, 0)])

    lean = K(t, [(0, 4), (0.26, 20), (0.34, 15), (0.50, -11), (0.80, -6), (0.92, 15), (1.14, 0), (1.32, 4), (2, 4)])
    c["squash"] = K(t, [(0, (1, 1)), (0.26, (1.05, 0.93)), (0.42, (0.95, 1.08)), (0.70, (1, 1)), (0.86, (1, 1)), (0.94, (1.07, 0.91)), (1.12, (0.98, 1.03)),
                        (1.40, (1, 1)), (2, (1, 1))])
    c["hip"] = Vector((0, -0.02 * bell(t, 0.3, 0.2), body + air))
    c["hip_rot"] = (2 + 0.35 * (lean - 4), 0, 0)
    c["spine"] = (2 + 0.3 * (lean - 4), 0, 0)
    c["chest"] = (lean, 0, 0)
    c["head"] = (-6 - 0.75 * (K(t - 0.05, [(0, 4), (0.26, 20), (0.34, 15), (0.50, -11), (0.80, -6), (0.92, 15), (1.14, 0), (1.32, 4), (2, 4)]) - 4)
                 - 9 * bell(t, 0.62, 0.22), 4 * bell(t, 1.2, 0.3), 0)
    hang, high, back = Vector((0.13, -0.03, -0.555)), Vector((0.25, -0.07, 0.47)), Vector((0.20, 0.17, -0.47))
    for s, side, late in (("l", 1, 0.0), ("r", -1, 0.035)):
        k = arms(t - late)
        off = hang.lerp(high, k) if k >= 0 else hang.lerp(back, min(1.0, -k * 3.3))
        c[f"arm_{s}"]["off"] = Vector((off.x * side, off.y, off.z))
        c[f"arm_{s}"]["pole"] = Vector((side * 0.35, 1, 0.1)).lerp(Vector((side * 1.0, 0.5, -0.5)), max(0.0, min(1.0, k)))
        c[f"arm_{s}"]["twist"] = -70 * max(0.0, min(1.0, k))
        c[f"arm_{s}"]["hand"] = (max(-30, min(30, (arms(t - late) - arms(t - late - 0.08)) * 70)), 0, 0)         # wrists drag behind the arm
        tuck = 0.07 * math.sin(math.pi * u) if 0 < u < 1 else 0.0
        push = bell(t, off_at - 0.02, 0.07)
        c[f"foot_{s}"] = {"off": Vector((side * (0.02 + 0.03 * bell(t, 0.9, 0.3)), 0, air + tuck + 0.05 * push)),
                          "pitch": 26 * push + (34 * math.sin(math.pi * u) ** 0.6 if 0 < u < 1 else 0.0), "yaw": 10 + 6 * bell(t, 0.92, 0.3),
                          "toe": 18 * push, "pole": (side * (0.18 + 0.25 * bell(t, 0.94, 0.2) + 0.25 * bell(t, 0.28, 0.2)), -1, 0.05)}
    c["blink"] = max(bell(t, 0.28, 0.12), bell(t, 0.96, 0.10))
    return c


# ---------------------------------------------------------------- Beat 1: docking (blender/dock.py says where and when)
HANG_L, HANG_R = Vector((0.34, -0.10, 0.84)), Vector((-0.34, -0.10, 0.84))     # arms hanging, as a target in his own space


def mixc(a, b, k):
    """Two sets of controls, k of the way from a to b. Both must name the same controls."""
    out = {}
    for key, x in a.items():
        y = b[key]
        out[key] = mixc(x, y, k) if isinstance(x, dict) else (y if k > 0.5 else x) if isinstance(x, str) else lerp(x, y, k)
    return out


def hands_free(c):
    """The controls with both arms as targets in his own space, hanging, and every foot control spelled out."""
    for s, side, hang in (("l", 1, HANG_L), ("r", -1, HANG_R)):
        c[f"arm_{s}"] = {"off": hang.copy(), "pole": Vector((side * 0.8, 0.6, -0.2)), "space": "world", "twist": 0.0, "hand": (0, 0, 0)}
        foot = c[f"foot_{s}"]
        c[f"foot_{s}"] = {"off": foot["off"], "pitch": foot.get("pitch", 0.0), "yaw": foot.get("yaw", 0.0), "toe": foot.get("toe", 0.0),
                          "pole": tuple(foot.get("pole", (side * 0.18, -1, 0.05)))}
    return c


def take_rope(t):
    """Squats to the rope lying at his feet, takes it in both hands and straightens up into the haul."""
    low = hands_free(stand())
    low["hip"] = Vector((0, 0.08, -0.30))
    low["hip_rot"], low["spine"], low["chest"], low["head"] = (12, 0, 0), (10, 0, 0), (18, 0, 0), (8, 0, 0)
    for s, side in (("l", 1), ("r", -1)):
        low[f"arm_{s}"]["off"] = Vector((side * 0.07, -0.56, 0.16))
        low[f"arm_{s}"]["pole"] = Vector((side * 0.8, 0.3, -0.6))
        low[f"arm_{s}"]["twist"] = -40.0
        low[f"foot_{s}"]["off"] = Vector((side * 0.05, 0, 0))
        low[f"foot_{s}"]["yaw"] = 18.0
        low[f"foot_{s}"]["pole"] = (side * 0.5, -1, 0.05)
    haul = haul_rope(0.0)
    for s in "lr":
        haul[f"foot_{s}"].setdefault("toe", 0.0)
    start = hands_free(stand())
    c = mixc(start, low, smooth(t / 0.55)) if t < 0.68 else mixc(low, haul, smooth((t - 0.68) / 0.57))
    grab = bell(t, 0.62, 0.08)
    c["head"] = (c["head"][0] + 10 * bell(t, 0.2, 0.2) + 6 * grab, c["head"][1], c["head"][2])
    for s in "lr":
        c[f"arm_{s}"]["hand"] = (12 * grab, 0, 0)
    c["blink"] = bell(t, 0.66, 0.08)
    return c


TIE = Vector((0, -0.64, 1.02))      # where the rope goes round the post, in his own space, as he faces it


def tie_off(t):
    """Facing the post: takes the rope round it twice, hauls the turns tight with a lean back, lets go."""
    c = hands_free(stand())
    reach = K(t, [(0, 0), (0.3, 1), (1.4, 1), (1.55, 0.6), (1.75, 0.6), (2.0, 0)])
    tug = settle(t, 1.42, 0.35) * (1 - K(t, [(1.7, 0), (1.95, 1)]))
    c["hip"] = Vector((0, -0.04 * reach + 0.10 * tug, -0.04 * reach - 0.05 * tug))
    c["hip_rot"] = (2 + 6 * reach - 10 * tug, 0, 0)
    c["chest"] = (4 + 12 * reach - 14 * tug, 0, 0)
    c["head"] = (-6 + 22 * reach - 8 * tug, 0, 0)
    a = TAU * 2 * smooth((t - 0.3) / 1.1)                                   # two turns round the post
    round_ = TIE + Vector((-0.2 * math.sin(a), 0.2 * math.cos(a), -0.06 * a / TAU))
    held = TIE + Vector((0.18, 0.24, -0.08))
    pulled = (Vector((0.16, -0.22, 0.98)), Vector((-0.16, -0.22, 0.98)))
    for s, side, hang, live in (("l", 1, HANG_L, held), ("r", -1, HANG_R, round_)):
        to = live.lerp(pulled[0 if side > 0 else 1], min(1.0, tug))
        c[f"arm_{s}"]["off"] = hang.lerp(to, reach)
        c[f"arm_{s}"]["pole"] = Vector((side * 0.9, 0.4, -0.5))
        c[f"arm_{s}"]["twist"] = -50 * reach
    for s, side in (("l", 1), ("r", -1)):
        c[f"foot_{s}"]["off"] = Vector((side * 0.04, 0.06 * tug * (1 if side > 0 else -1), 0))
    c["blink"] = max(bell(t, 0.25, 0.08), bell(t, 1.45, 0.1))
    return c


def dust_hands(t):
    """Brushes one palm across the other, twice each way, with a pleased little nod, and lets his arms drop."""
    c = hands_free(stand())
    up = K(t, [(0, 0), (0.18, 1), (0.95, 1), (1.2, 0)])
    rub = math.sin(TAU * 2.2 * max(0.0, t - 0.18)) * K(t, [(0.15, 0), (0.25, 1), (0.85, 1), (0.95, 0)])
    pleased = bell(t, 1.02, 0.18)
    c["hip"] = Vector((0, 0, -0.02 + 0.015 * pleased))
    c["chest"] = (4 + 5 * up - 6 * pleased, 0, 3 * rub)
    c["head"] = (-6 + 16 * up - 14 * pleased, 0, 0)
    for s, side, hang in (("l", 1, HANG_L), ("r", -1, HANG_R)):
        palm = Vector((side * 0.05 + (0.07 * rub if side < 0 else -0.03 * rub), -0.30, 0.96 + (0.02 * rub * side)))
        c[f"arm_{s}"]["off"] = hang.lerp(palm, up)
        c[f"arm_{s}"]["pole"] = Vector((side * 0.9, 0.5, -0.4))
        c[f"arm_{s}"]["twist"] = -70 * up
        c[f"arm_{s}"]["hand"] = (0, 0, side * 25 * up)
    c["blink"] = bell(t, 1.0, 0.1)
    return c


CLIPS = {      # name: (function, frames, loops, what it is for, kicks to loose parts as {frame: {bone: velocity}})
    "idle_alive": (idle_alive, 96, True, "Standing by: breathing, shifting weight, a look round, an ear flick, blinks.",
                   {49: {"ear.r.1": Vector((0.3, 0.9, 1.6))}, 80: {"ear.l.1": Vector((-0.3, 0.8, 1.4))}, 50: {"ear.r.2": Vector((0.2, 1.2, 2.0))}}),
    "greet": (greet, 48, False, "Notices the visitor, waves with the whole body, settles.", {}),
    "walk": (walk, 24, True, "Walk cycle in place: planted feet, hip sway, arms a beat behind the legs.", {}),
    "haul_rope": (haul_rope, 48, True, "Leaning back, hand over hand on a rope, heels dug in. Beat 1: hauling the island in.", {}),
    "pick_up": (pick_up, 54, False, "Looks, squats, reaches with one hand, lifts with the legs, holds the find up to look at it.", {}),
    "cheer": (cheer, 48, False, "Crouch, hop with both arms thrown up, land with a squash, one more pump, settle.", {}),
    "take_rope": (take_rope, 30, False, "Squats to the rope at his feet, takes it and straightens into the haul. Beat 1.", {}),
    "tie_off": (tie_off, 48, False, "Takes the rope twice round a post in front of him, hauls it tight, lets go. Beat 1.", {}),
    "dust_hands": (dust_hands, 30, False, "Brushes his palms together, a pleased nod, arms drop. Beat 1.", {}),
}


# ---------------------------------------------------------------- loose parts
LOOSE = {}      # bone: (parent, stiffness, damping, most it may swing in degrees)


def _world(o):
    return [o.matrix_world @ v.co for v in o.data.vertices]


def extras(rig):
    """Add the small bones: two per ear, lids for blinking, and one for each hanging piece; hang the pieces on them."""
    objs = [o for o in bpy.data.objects if o.type == "MESH" and o.parent == rig]
    place = Matrix.Translation((0, -gm.HUNCH - 0.02, gm.NECK + 0.02 + 0.29 * gm.HEAD)) @ Matrix.Scale(gm.HEAD, 4)
    plan = []       # name, parent, head, tail, objects to hang, spring

    def named(prefix):
        return [o for o in objs if o.name.startswith(prefix)]

    def hang(name, parent, pieces, spring, top=None):
        pts = [p for o in pieces for p in _world(o)]
        zs = sorted(p.z for p in pts)
        hi, lo = zs[int(len(zs) * 0.92)], zs[int(len(zs) * 0.12)]
        head = top or sum((p for p in pts if p.z >= hi), Vector()) / sum(1 for p in pts if p.z >= hi)
        tail = sum((p for p in pts if p.z <= lo), Vector()) / sum(1 for p in pts if p.z <= lo)
        plan.append((name, parent, head, tail, pieces, spring))

    for s, side in (("l", 1), ("r", -1)):
        root, along = Vector((side * 0.195, 0.035, 0.035)), Vector((side * 0.80, 0.40, 0.46)).normalized()
        a, b, c = (place @ (root + along * d) for d in (0.07, 0.27, 0.46))
        plan.append((f"ear.{s}.1", "head", a, b, [], (230, 13, 28)))
        plan.append((f"ear.{s}.2", f"ear.{s}.1", b, c, [], (150, 9, 34)))
        eye = place @ Vector((side * gm.EYE[0], gm.EYE[1], gm.EYE[2]))
        lids = [o for o in named("gm_lid") if abs((o.matrix_world.translation - eye).length) < 0.02 and sum(p.z for p in _world(o)) / len(o.data.vertices) > eye.z]
        plan.append((f"lid.{s}", "head", eye, eye + Vector((0, -0.07, 0)), lids, None))
    hang("scarf_tail", "head", named("gm_cowl_tail"), (70, 6.5, 40))
    hang("hood_back", "chest", named("gm_hood_back"), (120, 10, 18))
    boxes = [o for o in named("gm_pouch") if "flap" not in o.name and "stud" not in o.name]
    for i, bx in enumerate(boxes):
        centre = sum(_world(bx), Vector()) / len(bx.data.vertices)
        mine = [o for o in named("gm_pouch") if min(boxes, key=lambda q: (sum(_world(q), Vector()) / len(q.data.vertices) - sum(_world(o), Vector()) / len(o.data.vertices)).length) is bx]
        hang(f"pouch.{i + 1}", bx.parent_bone, mine, (260, 15, 10), top=centre + Vector((0, 0, 0.07)))
    hang("rope", named("gm_rope_0")[0].parent_bone, named("gm_rope"), (110, 8, 22))
    hang("mallet", named("gm_mallet_handle")[0].parent_bone, named("gm_mallet"), (85, 6.5, 26))
    tail = named("gm_sash_tail")
    for o in tail:              # it was skinned to the torso; as a hanging end it swings better on a bone of its own
        o.modifiers.clear()
        o.vertex_groups.clear()
    hang("sash_tail", "hips", tail + named("gm_sash_knot"), (80, 6.5, 34))

    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    for name, parent, head, tail_, _, _ in plan:
        eb = rig.data.edit_bones.new(name)
        eb.head, eb.tail = head, tail_
        eb.parent = rig.data.edit_bones[parent]
        eb.use_connect = False
        eb.use_deform = name.startswith("ear")
    bpy.ops.object.mode_set(mode="OBJECT")
    rig.select_set(False)
    for name, parent, _, _, pieces, spring in plan:
        for o in pieces:
            gm.ride(o, rig, name, o.matrix_world.copy())
        if spring:
            LOOSE[name] = (parent, *spring)

    # the ears are part of the head's skin, so the head becomes a skinned mesh: skull to the head bone, ears to theirs
    head = named("gm_head")[0]
    me = head.data.copy()
    me.transform(head.matrix_world)
    head.data = me
    head.parent, head.parent_type = rig, "OBJECT"
    head.matrix_world = Matrix.Identity(4)
    unplace = place.inverted()
    groups = {n: head.vertex_groups.new(name=n) for n in ("head", "ear.l.1", "ear.l.2", "ear.r.1", "ear.r.2")}
    for v in me.vertices:
        p = unplace @ v.co
        s, side = ("l", 1) if p.x > 0 else ("r", -1)
        t = (p - Vector((side * 0.195, 0.035, 0.035))).dot(Vector((side * 0.80, 0.40, 0.46)).normalized()) / 0.46
        w2 = smooth((t - 0.42) / 0.26) if abs(p.x) > 0.17 else 0.0
        w1 = max(0.0, smooth((t - 0.04) / 0.20) - w2) if abs(p.x) > 0.17 else 0.0
        for g, w in (("head", 1 - w1 - w2), (f"ear.{s}.1", w1), (f"ear.{s}.2", w2)):
            if w > 0.001:
                groups[g].add([v.index], w, "REPLACE")
    head.modifiers.new("rig", "ARMATURE").object = rig


def swing(body, frames, loops, kicks):
    """Damped springs for the loose parts, driven by where the body takes their roots. Fills each frame's pose in place."""
    order = sorted(LOOSE, key=lambda n: 0 if LOOSE[n][0] not in LOOSE else 1)
    n = len(frames)
    for name in order:
        parent, stiff, damp, most = LOOSE[name]
        rest_local = body.rest[parent].inverted() @ body.rest[name]
        length = body.length[name]
        tip = vel = None
        runs = (list(range(n)) * 2) if loops else ([0] * 14 + list(range(n)))        # run in before recording, so it starts settled
        for step, f in enumerate(runs):
            m0 = frames[f][parent] @ rest_local
            head, target = m0.translation, m0 @ Vector((0, length, 0))
            if tip is None:
                tip, vel = target.copy(), Vector()
            for _ in range(4):
                vel += ((target - tip) * stiff - vel * damp) * (1 / FPS / 4)
                tip = tip + vel * (1 / FPS / 4)
                tip = head + (tip - head).normalized() * length
            if f in kicks and name in kicks[f] and step >= len(runs) - n:
                vel += kicks[f][name] * 0.3
            local = (m0.to_3x3().inverted() @ (tip - head)).normalized()
            q = Vector((0, 1, 0)).rotation_difference(local)
            if q.angle > math.radians(most):
                q = Quaternion(q.axis, math.radians(most))
                tip = head + (m0.to_3x3() @ (q @ Vector((0, 1, 0)))) * length
            if step >= len(runs) - n:
                frames[f][name] = m0 @ q.to_matrix().to_4x4()


def bake(rig, body, name):
    """Solve a clip at every frame and write it as an action."""
    fn, n, loops, _, kicks = CLIPS[name]
    count = n + 1                                   # frame n repeats frame 0 for loops, and holds the end for one-shots
    controls = [fn((f % n if loops else f) / FPS) for f in range(count)]
    frames = [body.solve(c) for c in controls]
    if loops:
        swing(body, frames[:n], True, kicks)
        frames[n] = dict(frames[0])
    else:
        swing(body, frames, False, kicks)
    act = bpy.data.actions.new(name)
    act.use_fake_user = True
    ad = rig.animation_data or rig.animation_data_create()
    ad.action = act
    if hasattr(act, "slots") and not len(act.slots):
        ad.action_slot = act.slots.new(id_type="OBJECT", name=rig.name)
    last = {}
    for f, (c, pose) in enumerate(zip(controls, frames)):
        for bone in pose:
            if bone == "root":
                continue
            pb = rig.pose.bones[bone]
            loc, q, _ = body.basis(pose, bone).decompose()
            if bone in last and last[bone].dot(q) < 0:
                q.negate()
            last[bone] = q
            pb.rotation_quaternion = q
            pb.keyframe_insert("rotation_quaternion", frame=f)
            if bone == "hips":
                pb.location = loc
                pb.keyframe_insert("location", frame=f)
        root = rig.pose.bones["root"]
        wide, tall = c["squash"]
        root.scale = (wide, tall, wide)             # the root bone points up, so its own Y is the figure's height
        root.keyframe_insert("scale", frame=f)
    return act


def make(clip_names=None, fig=None):
    """The goblin with its extra bones and hero clips. Returns (handle, rig, {name: action}).
    `fig` is the module that builds him: the painted miniature unless told otherwise."""
    fig = fig or gm
    LOOSE.clear()
    top, rig, stock = fig.goblin("T-Pose", 0)
    for pb in rig.pose.bones:
        pb.matrix_basis = Matrix.Identity(4)
    rig.data.pose_position = "REST"
    bpy.context.view_layer.update()
    if hasattr(fig, "extras"):
        fig.extras(rig, LOOSE)
    else:
        extras(rig)
    rig.data.pose_position = "POSE"
    body = Body(rig)
    made = {name: bake(rig, body, name) for name in (clip_names or CLIPS)}
    rig.animation_data.action = None
    for pb in rig.pose.bones:
        pb.matrix_basis = Matrix.Identity(4)
    return top, rig, made


def play(rig, act, frame):
    ad = rig.animation_data
    ad.action = act
    if hasattr(act, "slots") and len(act.slots):
        ad.action_slot = act.slots[0]
    bpy.context.scene.frame_set(frame)


# ---------------------------------------------------------------- files
def _plain_materials(objs):
    """For export: the paint is a render-time shader a game engine cannot read, so each surface falls back to its base coat."""
    swap = {}
    for o in objs:
        for slot in o.material_slots:
            m = slot.material
            if m is None:
                continue
            if m.name not in swap:
                old = m.node_tree.nodes
                new = bpy.data.materials.new(m.name.replace("gm_", "goblin_"))
                new.use_nodes = True
                b = new.node_tree.nodes["Principled BSDF"]
                src = next((x for x in old if x.type == "BSDF_PRINCIPLED"), None)
                if src:
                    b.inputs["Roughness"].default_value = src.inputs["Roughness"].default_value
                    b.inputs["Metallic"].default_value = src.inputs["Metallic"].default_value
                    b.inputs["Emission Strength"].default_value = src.inputs["Emission Strength"].default_value if not src.inputs["Emission Color"].links else 0.0
                    b.inputs["Emission Color"].default_value = src.inputs["Emission Color"].default_value
                if any(x.type == "ATTRIBUTE" for x in old) or m.name.startswith("goblin_eye"):
                    vc = new.node_tree.nodes.new("ShaderNodeVertexColor")
                    vc.layer_name = "paint"
                    new.node_tree.links.new(vc.outputs["Color"], b.inputs["Base Color"])
                else:
                    flat = next((x for x in old if x.type == "RGB"), None)
                    b.inputs["Base Color"].default_value = flat.outputs[0].default_value if flat else (src.inputs["Base Color"].default_value if src else (1, 1, 1, 1))
                swap[m.name] = new
            slot.material = swap[m.name]
        if o.name.startswith("gm_eye"):         # the iris is a shader too: paint it onto the eyeball's points
            me = o.data = o.data.copy()
            attr = me.color_attributes.new("paint", "FLOAT_COLOR", "POINT")
            for v in me.vertices:
                d = v.co.normalized().dot(Vector((0, -1, 0)))
                attr.data[v.index].color = ((0.008, 0.006, 0.004, 1) if d > 0.925 else (lerp(0.85, 1.0, smooth((d - 0.72) / 0.18)), lerp(0.40, 0.70, smooth((d - 0.72) / 0.18)), 0.08, 1)
                                            if d > 0.625 else (0.42, 0.37, 0.18, 1))
        for attr in getattr(o.data, "color_attributes", []):
            if attr.name == "paint":
                o.data.color_attributes.active_color = attr
                o.data.color_attributes.render_color_index = list(o.data.color_attributes).index(attr)


def build(fig=None, live=False):
    """Writes the library file and the kit's .glb for a goblin. `live`: in an open session, which must not be reset."""
    fig = fig or gm
    name = getattr(fig, "MODULE", "goblin__mini")
    scene = bpy.context.scene if live else kit.reset()
    scene.render.fps = FPS
    top, rig, made = make(fig=fig)
    bpy.context.view_layer.update()
    figure = [o for o in bpy.data.objects if o.type == "MESH" and o.parent is not None]
    lo, hi = kit.world_bounds(figure)
    scale = 1.1 / (fig.figure_top(figure) if hasattr(fig, "figure_top") else hi.z - lo.z)
    top.scale = (scale,) * 3
    top.name = name
    col = bpy.data.collections.new("goblin")
    scene.collection.children.link(col)
    for o in list(scene.collection.objects):
        scene.collection.objects.unlink(o)
        col.objects.link(o)
    play(rig, made["idle_alive"], 0)
    rig.animation_data.action = None
    os.makedirs(gm.LIB, exist_ok=True)
    os.makedirs(KIT, exist_ok=True)
    lib = os.path.join(gm.LIB, name.replace("__", "_") + ".blend")
    bpy.ops.wm.save_as_mainfile(filepath=lib, copy=True)
    print(f"WROTE {lib} scale={scale:.4f} actions={len(bpy.data.actions)} bones={len(rig.data.bones)}")

    # the game file: one animation per hero clip, from the actions themselves (exported as NLA tracks, every clip came
    # out as the rest pose), base-coat materials (a faceted goblin's colours are already on its faces)
    faceted = getattr(fig, "FACETED", False)
    if not faceted:
        _plain_materials(figure)
    for a in list(bpy.data.actions):
        if a.name not in made:
            bpy.data.actions.remove(a)
    glb = os.path.join(KIT, name + ".glb")
    want = dict(filepath=glb, export_format="GLB", export_apply=True, export_animations=True, export_animation_mode="ACTIONS", export_force_sampling=True,
                export_skins=True, export_yup=True, export_vertex_color="MATERIAL", export_frame_range=False, export_cameras=False, export_lights=False)
    known = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
    bpy.ops.export_scene.gltf(**{k: v for k, v in want.items() if k in known})
    print(f"WROTE {glb} bytes={os.path.getsize(glb)}")
    manifest = {
        "module": name, "file": name + ".glb", "units": "metres", "height": 1.1, "origin": "between the feet, on the ground", "faces": "-Y in Blender, +Z in glTF",
        "fps": FPS,
        "clips": [{"name": n, "first": 0, "last": CLIPS[n][1], "seconds": round(CLIPS[n][1] / FPS, 2), "loop": CLIPS[n][2], "use": CLIPS[n][3]} for n in CLIPS],
        "secondary_bones": sorted(LOOSE) + ["lid.l", "lid.r"],
        "swappable_parts": sorted({o.name.split(".")[0] for o in figure}),
        "fallback_clips": "76 pack clips (Idle, Walking_A, Interact, Sit_Chair_Idle and so on) are kept in the out/lib .blend only",
        "paint": "one flat colour a face, in vertex colour" if faceted else
                 "base coat only in the .glb; the wash and drybrush are a render-time shader in Blender and still have to be baked to textures",
    }
    with open(os.path.join(KIT, "goblin_manifest.json" if name == "goblin__mini" else name + "_manifest.json"), "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, indent=2)
    print("WROTE manifest")
    if live:
        return

    # read it back the way the site will
    kit.reset()
    bpy.ops.import_scene.gltf(filepath=glb)
    arm = next(o for o in bpy.data.objects if o.type == "ARMATURE")
    names = sorted(a.name for a in bpy.data.actions)
    print("BACK clips", names)
    print("BACK bones", len(arm.data.bones), "loose", sorted(b.name for b in arm.data.bones if b.name in LOOSE or b.name.startswith("lid")))
    print("BACK meshes", sum(o.type == "MESH" for o in bpy.data.objects), "height", round(max((o.matrix_world @ Vector(c)).z for o in bpy.data.objects if o.type == "MESH" for c in o.bound_box), 3))


# ---------------------------------------------------------------- pictures
def _table(scene, samples, width, height):
    import tabletop
    kit.setup_cycles(scene, samples=samples, width=width, height=height)
    tabletop.build_table(scene)
    tabletop.room_world(scene, strength=0.18, cam_strength=0.14)
    tabletop.lamp(scene, target=(0, 0, 1), power=70000, dist=45, size=18)
    kit.add_area(scene, "rim", (16, 22, 9), (0, 0, 1.2), 9000, 10, (0.72, 0.82, 1.0))
    return tabletop


def strip(out, samples=24, names=("greet", "walk", "cheer"), cell=(240, 340)):
    scene = kit.reset()
    scene.render.fps = FPS
    _table(scene, samples, *cell)
    top, rig, made = make(names)
    base = gm.mini_base(top, 0.95)
    base.location = (0, 0, 0.26)
    kit.add_camera(scene, (5.2, -11.5, 4.6), (0, 0, 1.78), lens=118, fstop=1.2, focus=(0, 0, 1.4))
    scene.camera.data.sensor_width = 36
    rows = []
    for name in names:
        n = CLIPS[name][1]
        picks = [f % n for f in range(0, 48, 4)]
        cells = []
        for f in picks:
            play(rig, made[name], f)
            scene.render.filepath = os.path.join(kit.OUT, "work", f"strip_{name}_{f:03d}.png")
            bpy.ops.render.render(write_still=True)
            cells.append(scene.render.filepath)
        rows.append(cells)
    import numpy as np
    bands = []
    for cells in rows:
        row = []
        for p in cells:
            img = bpy.data.images.load(p)
            w, h = img.size
            a = np.empty(w * h * 4, dtype=np.float32)
            img.pixels.foreach_get(a)
            row.append(a.reshape(h, w, 4))
        bands.append(np.concatenate(row, axis=1))
    full = np.concatenate(bands[::-1], axis=0)
    new = bpy.data.images.new("strip", full.shape[1], full.shape[0], alpha=False)
    new.pixels.foreach_set(full.ravel())
    new.filepath_raw = out
    new.file_format = "PNG"
    new.save()
    print("WROTE", out)


def reel(out, samples=40):
    scene = kit.reset()
    scene.render.fps = FPS
    tabletop = _table(scene, samples, 1280, 720)
    top, rig, made = make()
    base = gm.mini_base(top, 0.95)
    base.location = (0, 0, 0.26)
    track = rig.animation_data.nla_tracks.new()
    plan = [("idle_alive", 1), ("greet", 1), ("walk", 2), ("haul_rope", 1), ("pick_up", 1), ("cheer", 1)]
    at = 0
    marks = []
    for name, times in plan:
        n = CLIPS[name][1]
        st = track.strips.new(name, at, made[name])
        if hasattr(st, "action_slot") and len(made[name].slots):
            st.action_slot = made[name].slots[0]
        st.action_frame_start, st.action_frame_end = 0, n
        st.repeat = times
        st.extrapolation = "NOTHING"
        marks.append((name, at, at + n * times))
        at += n * times

    def only_between(o, first, last):
        for f, hidden in ((0, True), (first, False), (last, True)):
            if f == 0 and first == 0:
                continue
            o.hide_render = hidden
            o.keyframe_insert("hide_render", frame=f)

    for name, first, last in marks:
        before = set(bpy.data.objects)
        side = name == "haul_rope"
        paper = tabletop.tag(scene, name.replace("_", " "), (-2.7, -0.4, 0) if side else (0.2, -2.6, 0), rot_z=-math.pi / 2 if side else 0.0, size=0.85)
        paper.scale.x = 0.36 * len(name) + 0.7
        for o in [x for x in bpy.data.objects if x not in before]:
            only_between(o, first, last)
        if name == "haul_rope":         # the rope he is hauling on, running off toward the island
            start = Vector((0, 0, 0.32)) + ROPE_FROM - ROPE_ALONG * 0.55
            rope = gm.tube("reel_rope", [start + ROPE_ALONG * d for d in (0, 0.5, 3, 9, 16)], 0.022,
                           gm.painted("gm_rope", color=gm.C["rope"], edge=0.6, edge_r=0.01, wash_dist=0.04, grain=0.4), seg=8)
            only_between(rope, first, last)
    profile = kit.add_camera(scene, (-13.4, -3.4, 3.9), (0, -0.5, 1.6), lens=58, fstop=1.4, focus=(0, 0, 1.4))      # the pull reads from the side
    profile.data.sensor_width = 36
    front = kit.add_camera(scene, (5.6, -12.6, 4.4), (0.1, -0.2, 1.72), lens=58, fstop=1.4, focus=(0, 0, 1.4))
    front.data.sensor_width = 36
    for name, first, last in marks:
        mark = scene.timeline_markers.new(name, frame=first)
        mark.camera = profile if name == "haul_rope" else front
    scene.render.use_persistent_data = True
    scene.frame_start, scene.frame_end = 0, at - 1
    r = scene.render
    try:
        if hasattr(r.image_settings, "media_type"):
            r.image_settings.media_type = "VIDEO"
        r.image_settings.file_format = "FFMPEG"
        r.ffmpeg.format = "MPEG4"
        r.ffmpeg.codec = "H264"
        r.ffmpeg.constant_rate_factor = "HIGH"
        r.ffmpeg.gopsize = 12
        r.filepath = out
        bpy.ops.render.render(animation=True)
        print("WROTE", out, "frames", at)
    except Exception as err:        # no video writer in this build: leave numbered stills
        print("VIDEO FAILED", err)
        r.image_settings.file_format = "PNG"
        r.filepath = out.replace(".mp4", "_")
        bpy.ops.render.render(animation=True)
        print("WROTE frames", r.filepath)


if __name__ == "__main__":
    args = sys.argv[sys.argv.index("--") + 1:]
    if args[0] == "build":
        build()
    elif args[0] == "strip":
        strip(os.path.abspath(args[1]), int(args[2]) if len(args) > 2 else 24, tuple(args[3].split(",")) if len(args) > 3 else ("greet", "walk", "cheer"))
    elif args[0] == "reel":
        reel(os.path.abspath(args[1]), int(args[2]) if len(args) > 2 else 40)
