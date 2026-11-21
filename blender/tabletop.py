"""The table the miniatures stand on, and the room light around it."""
import math
import os

import bpy

import kit
import paint

PH = os.path.join(kit.VENDOR, "polyhaven")


def wood_material(tile=90.0, name="wood_table_worn"):
    m = bpy.data.materials.new("table_wood")
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (1 / tile, 1 / tile, 1)
    mp.inputs["Rotation"].default_value = (0, 0, math.radians(8))
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])

    def tex(suffix, colorspace):
        t = nt.nodes.new("ShaderNodeTexImage")
        t.image = bpy.data.images.load(os.path.join(PH, f"{name}_{suffix}.jpg"))
        t.image.colorspace_settings.name = colorspace
        nt.links.new(mp.outputs["Vector"], t.inputs["Vector"])
        return t

    d = tex("diff", "sRGB")
    r = tex("rough", "Non-Color")
    n = tex("nor", "Non-Color")
    # a little darker and warmer than the scan, so the painted set stays the brightest thing on the table
    hsv = nt.nodes.new("ShaderNodeHueSaturation")
    hsv.inputs["Value"].default_value = 0.55
    hsv.inputs["Saturation"].default_value = 0.85
    nt.links.new(d.outputs["Color"], hsv.inputs["Color"])
    nt.links.new(hsv.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(r.outputs["Color"], bsdf.inputs["Roughness"])
    nm = nt.nodes.new("ShaderNodeNormalMap")
    nm.inputs["Strength"].default_value = 1.0
    nt.links.new(n.outputs["Color"], nm.inputs["Color"])
    nt.links.new(nm.outputs["Normal"], bsdf.inputs["Normal"])
    return m


def build_table(scene, size=(176.0, 124.0), center=(0.0, 4.0), thick=4.0):
    """A real table with a far edge, so the room shows behind the set."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=(center[0], center[1], -thick / 2))
    t = bpy.context.object
    t.name = "table"
    t.scale = (size[0], size[1], thick)
    bpy.ops.object.transform_apply(scale=True)
    b = t.modifiers.new("bevel", "BEVEL")
    b.width = 0.6
    b.segments = 4
    t.data.materials.append(wood_material())
    return t


def room_world(scene, strength=0.25, hdri="fireplace_2k.hdr", rot=0.0, cam_strength=0.5):
    w = bpy.data.worlds.new("room")
    w.use_nodes = True
    nt = w.node_tree
    bg = nt.nodes["Background"]
    env = nt.nodes.new("ShaderNodeTexEnvironment")
    env.image = bpy.data.images.load(os.path.join(PH, hdri))
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Rotation"].default_value = (0, 0, rot)
    nt.links.new(tc.outputs["Generated"], mp.inputs["Vector"])
    nt.links.new(mp.outputs["Vector"], env.inputs["Vector"])
    nt.links.new(env.outputs["Color"], bg.inputs["Color"])
    # the room lights the set only faintly, but the camera sees it brighter, so the backdrop is not a black hole
    lp = nt.nodes.new("ShaderNodeLightPath")
    mix = nt.nodes.new("ShaderNodeMix")
    mix.inputs[2].default_value = strength
    mix.inputs[3].default_value = cam_strength
    nt.links.new(lp.outputs["Is Camera Ray"], mix.inputs[0])
    nt.links.new(mix.outputs[0], bg.inputs["Strength"])
    scene.world = w
    return w


def lamp(scene, target=(0, 0, 0), power=90000.0, dist=60.0, size=22.0):
    """The one key light (style rule 3): a warm lamp from the upper left, behind the viewer's left shoulder."""
    d = KEY_DIR
    loc = (target[0] + d[0] * dist, target[1] + d[1] * dist, target[2] + d[2] * dist)
    return kit.add_area(scene, "key_lamp", loc, target, power, size, color=(1.0, 0.86, 0.68))


# Direction from the set toward the key light, in world space. Every shot keeps it.
KEY_DIR = (-0.52, -0.42, 0.74)


def tag(scene, text, loc, rot_z=0.0, size=0.9):
    """A small paper label lying on the table."""
    bpy.ops.mesh.primitive_plane_add(size=1, location=(loc[0], loc[1], loc[2] + 0.012))
    p = bpy.context.object
    p.scale = (size * 1.5, size * 1.0, 1)
    p.rotation_euler.z = rot_z
    pm = bpy.data.materials.get("tag_paper") or bpy.data.materials.new("tag_paper")
    pm.use_nodes = True
    pm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (*paint.P["paper"], 1)
    pm.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.9
    p.data.materials.append(pm)
    cu = bpy.data.curves.new("txt", "FONT")
    cu.body = text
    cu.align_x = "CENTER"
    cu.align_y = "CENTER"
    cu.size = size * 0.8
    t = bpy.data.objects.new("txt", cu)
    scene.collection.objects.link(t)
    t.location = (loc[0], loc[1], loc[2] + 0.02)
    t.rotation_euler.z = rot_z
    im = bpy.data.materials.get("tag_ink") or bpy.data.materials.new("tag_ink")
    im.use_nodes = True
    im.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (*paint.P["ink"], 1)
    cu.materials.append(im)
    return p
