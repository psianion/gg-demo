"""Figures: load a pack character, pose it from one of its own clips, repaint it, stand it on a base.

The KayKit adventurers and skeletons share one rig and one clip library (Idle, Interact, PickUp, Throw, Sit...),
so anything built on that rig can use every clip.
"""
import math
import os

import bmesh
import bpy
from mathutils import Matrix, Vector

import kit
import paint

HUMAN_HEIGHT = 3.4      # pack scale is kept: a human figure is about 3.4 units tall
GOBLIN_HEIGHT = 2.45

_mat_cache = {}
_serial = 0


def _clip(actions, clip):
    for a in actions:
        base = a.name.split("|")[-1]
        if base == clip or base.rsplit(".", 1)[0] == clip:
            return a
    raise KeyError(clip)


def _pose(rig, actions, clip, frame):
    scene = bpy.context.scene
    act = _clip(actions, clip)
    ad = rig.animation_data or rig.animation_data_create()
    # start from the rest pose: the clip the importer leaves active has already moved bones this clip may not key
    ad.action = None
    for pb in rig.pose.bones:
        pb.location = (0, 0, 0)
        pb.rotation_quaternion = (1, 0, 0, 0)
        pb.rotation_euler = (0, 0, 0)
        pb.scale = (1, 1, 1)
    ad.action = act
    if getattr(act, "slots", None):
        ad.action_slot = act.slots[0]
    scene.frame_set(frame)
    bpy.context.view_layer.update()
    # keep the evaluated pose on the bones themselves, then let go of the clip, so each figure can use its own frame
    ev = rig.evaluated_get(bpy.context.evaluated_depsgraph_get())
    basis = {pb.name: pb.matrix_basis.copy() for pb in ev.pose.bones}
    ad.action = None
    for pb in rig.pose.bones:
        pb.matrix_basis = basis[pb.name]
    bpy.context.view_layer.update()


def _load(path, keep=None, drop=None):
    before = set(bpy.data.actions)
    new, roots = kit.import_model(path)
    for o in list(new):
        gone = o.name.startswith("Icosphere") or o.type == "EMPTY" and o.name.endswith("_end")
        if o.type == "MESH" and o.parent_bone in ("handslot.r", "handslot.l") and (keep is None or o.name.split(".")[0] not in keep):
            gone = True
        if drop and o.name.split(".")[0] in drop:
            gone = True
        if gone:
            new.remove(o)
            if o in roots:
                roots.remove(o)
            bpy.data.objects.remove(o, do_unlink=True)
    actions = [a for a in bpy.data.actions if a not in before]
    rig = next(o for o in new if o.type == "ARMATURE")
    # packs reuse object names ("Rig", "CharacterArmature"); a later import can then disturb an earlier figure,
    # so every figure gets names of its own
    global _serial
    _serial += 1
    for o in new:
        o.name = f"f{_serial:02d}_{o.name}"
    rig.data.name = f"f{_serial:02d}_{rig.data.name}"
    # the importer stacks every clip as an NLA track; left in, they override the pose we pick
    ad = rig.animation_data
    if ad:
        for t in list(ad.nla_tracks):
            ad.nla_tracks.remove(t)
    return new, roots, rig, actions


def _ear(name, length, radius, mat):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=10, radius1=radius, radius2=radius * 0.06, depth=length)
    for v in bm.verts:
        v.co.z += length / 2            # root at the origin, tip along +Z
        v.co.y *= 0.32                  # flat like a leaf
        v.co.x += 0.35 * radius * (v.co.z / length) ** 2   # a slight sweep
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    ob.data.materials.append(mat)
    paint.set_smooth([ob])
    return ob


def _add_ears(new, rig, skin, head_prefix):
    """Big pointed ears on the head bone, placed from the head mesh in the rest pose."""
    rig.data.pose_position = "REST"
    bpy.context.view_layer.update()
    head = [o for o in new if o.type == "MESH" and head_prefix in o.name]
    lo, hi = kit.world_bounds(head)
    cx, cy = (lo.x + hi.x) / 2, (lo.y + hi.y) / 2
    hw, hh = (hi.x - lo.x) / 2, hi.z - lo.z
    mat = paint.paint_material("goblin_ear", color=skin, edge_radius=0.03)
    for side in (-1, 1):
        ear = _ear("ear", length=hw * 1.25, radius=hh * 0.20, mat=mat)
        ear.parent = rig
        ear.parent_type = "BONE"
        ear.parent_bone = "head"
        bpy.context.view_layer.update()
        out = Vector((side * 1.0, 0.25, 0.42)).normalized()     # outward, a little back, a little up
        rot = out.to_track_quat("Z", "Y").to_matrix().to_4x4()
        ear.matrix_world = Matrix.Translation((cx + side * hw * 0.80, cy + 0.02, lo.z + hh * 0.46)) @ rot
        new.append(ear)
    rig.data.pose_position = "POSE"
    bpy.context.view_layer.update()


def _finish(name, new, roots, height, grey):
    paint.set_smooth(new)
    g = kit.group(name, roots)
    bpy.context.view_layer.update()
    lo, hi = kit.world_bounds(new)
    s = height / (hi.z - lo.z)
    g.scale = (s, s, s)
    bpy.context.view_layer.update()
    lo, hi = kit.world_bounds(new)
    g.location = (-(lo.x + hi.x) / 2, -(lo.y + hi.y) / 2, -lo.z)
    # wrap once more so callers get a clean handle with feet at its origin
    top = bpy.data.objects.new(name + "_fig", None)
    bpy.context.scene.collection.objects.link(top)
    g.parent = top
    top["meshes"] = [o.name for o in new if o.type == "MESH"]
    return top


def kaykit(pack_dir, model, clip="Idle", frame=8, keep=None, drop=None, height=HUMAN_HEIGHT, grey=False,
           goblin=False, head_scale=1.0):
    path = os.path.join(pack_dir, "Characters", "gltf", model + ".glb")
    new, roots, rig, actions = _load(path, keep=keep, drop=drop)
    if goblin:
        cache = paint.repaint_object_materials(new, goblin_skin=True, grey=grey)
        skin = paint.P["goblin"]
        for m in cache.values():
            for n in m.node_tree.nodes:
                if n.type == "TEX_IMAGE" and n.image and "skin" in n.image:
                    skin = tuple(n.image["skin"])
        if not grey:
            _add_ears(new, rig, skin, "Head")
        else:
            _add_ears(new, rig, (0.36, 0.37, 0.39), "Head")
    else:
        paint.repaint_object_materials(new, grey=grey, cache=_mat_cache)
    _pose(rig, actions, clip, frame)
    if head_scale != 1.0:
        rig.pose.bones["head"].scale = (head_scale,) * 3
        bpy.context.view_layer.update()
    return _finish(model, new, roots, height, grey)


def quaternius(path, clip="Idle", frame=6, height=GOBLIN_HEIGHT, grey=False, skin_as_goblin=True):
    new, roots, rig, actions = _load(path)
    for o in new:
        if o.type != "MESH":
            continue
        for slot in o.material_slots:
            src = slot.material
            p = src.node_tree.nodes.get("Principled BSDF")
            img = next((n.image for n in src.node_tree.nodes if n.type == "TEX_IMAGE" and n.image), None)
            if img is not None:
                slot.material = paint.paint_material(src.name + "_p", image=paint.repaint_image(img), grey=grey)
                continue
            c = tuple(p.inputs["Base Color"].default_value[:3])
            if skin_as_goblin and src.name.split(".")[0].endswith("_Main"):
                c = paint.P["goblin"]
            elif "Eye_White" in src.name:
                c = paint.P["bone"]
            elif "Eye_Black" in src.name:
                c = paint.P["ink"]
            else:
                c = paint.snap_color(tuple(min(1.0, v * 1.6) for v in c))
            slot.material = paint.paint_material(src.name + "_p", color=c, grey=grey)
    _pose(rig, actions, clip, frame)
    return _finish(os.path.basename(path), new, roots, height, grey)


# ---- the one base design (style rule 4) -------------------------------------------------------------------
def make_base(radius=1.25, height=0.26, flock=True):
    """Dark round base, thin brass rim, flocked top. Origin at the centre of the top face."""
    scene = bpy.context.scene
    root = bpy.data.objects.new("base", None)
    scene.collection.objects.link(root)

    def cyl(name, r1, r2, h, z, mat, seg=64, bevel=0.0):
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r1, radius2=r2, depth=h)
        me = bpy.data.meshes.new(name)
        bm.to_mesh(me)
        bm.free()
        ob = bpy.data.objects.new(name, me)
        scene.collection.objects.link(ob)
        ob.location.z = z
        ob.parent = root
        me.materials.append(mat)
        if bevel:
            b = ob.modifiers.new("bevel", "BEVEL")
            b.width = bevel
            b.segments = 3
            b.limit_method = "ANGLE"
        for p in me.polygons:
            p.use_smooth = True
        return ob

    black = _base_mat("base_black", paint.P["base"], rough=0.32)
    brass = _base_mat("base_brass", paint.P["brass"], rough=0.28, metallic=1.0)
    cyl("base_body", radius * 1.04, radius * 0.97, height, -height / 2, black, bevel=0.05)
    cyl("base_rim", radius * 1.0, radius * 1.0, 0.045, -0.035, brass, bevel=0.012)
    if flock:
        top = _mat_cache.get("flock") or paint.paint_material("base_flock", color=paint.P["earth"], flock=0.6, wash=0.4, edge=0.15)
        _mat_cache["flock"] = top
        t = cyl("base_top", radius * 0.93, radius * 0.80, 0.07, 0.03, top, seg=48)
        return root, t
    return root, None


def _base_mat(name, color, rough, metallic=0.0):
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metallic
    return m


def on_base(fig, radius=1.25):
    """Stand a figure on a base. Returns the base root; move that."""
    base, _ = make_base(radius)
    fig.parent = base
    fig.location = (0, 0, 0.06)
    return base
