"""Save a smaller JPEG copy of a render, for review pages and quick looks.

    blender -b --factory-startup --python shrink.py -- <width> <in.png> <out.jpg> [<in.png> <out.jpg> ...]
"""
import os
import sys

import bpy

args = sys.argv[sys.argv.index("--") + 1:]
width = int(args[0])
for src, out in zip(args[1::2], args[2::2]):
    img = bpy.data.images.load(os.path.abspath(src))
    img.scale(width, round(img.size[1] * width / img.size[0]))
    img.file_format = "JPEG"
    img.filepath_raw = os.path.abspath(out)
    img.save()
    print("WROTE", out)
