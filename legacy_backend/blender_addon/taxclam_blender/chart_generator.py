"""
TaxClam 3D Chart Generator
Creates parametric 3D bar charts, donut charts, and timelines from GST data.
Supports keyframe animation for cinematic grow-in effects.
"""

import bpy
import bmesh
import math


# ── Color palette (linear) ───────────────────────────────────────────────────
PALETTE = [
    (1.0, 0.843, 0.0, 1.0),          # Gold
    (0.063, 0.725, 0.506, 1.0),       # Emerald
    (0.235, 0.510, 0.965, 1.0),       # Blue
    (0.937, 0.267, 0.267, 1.0),       # Red
    (0.612, 0.384, 0.965, 1.0),       # Purple
]


def _bar_material(index, emission=0.4):
    from .ui_component_builder import _ensure_material
    color = PALETTE[index % len(PALETTE)]
    name = f"TaxClam_Bar_{index}"
    return _ensure_material(name, color, metallic=0.3, roughness=0.3,
                            emission_strength=emission)


def _torus_segment(name, inner_r, outer_r, start_angle, end_angle,
                   height=0.4, segments=64, z=0):
    """
    Build a torus arc segment (one slice of a donut chart).
    """
    bm = bmesh.new()
    step = (end_angle - start_angle) / segments
    mid_r = (inner_r + outer_r) / 2
    half_h = height / 2
    half_thick = (outer_r - inner_r) / 2

    top_outer, top_inner, bot_outer, bot_inner = [], [], [], []
    for i in range(segments + 1):
        a = start_angle + i * step
        ca, sa = math.cos(a), math.sin(a)
        top_outer.append(bm.verts.new((ca * outer_r, sa * outer_r, z + half_h)))
        top_inner.append(bm.verts.new((ca * inner_r, sa * inner_r, z + half_h)))
        bot_outer.append(bm.verts.new((ca * outer_r, sa * outer_r, z - half_h)))
        bot_inner.append(bm.verts.new((ca * inner_r, sa * inner_r, z - half_h)))

    n = segments + 1
    for i in range(segments):
        # Outer side
        bm.faces.new([top_outer[i], top_outer[i+1], bot_outer[i+1], bot_outer[i]])
        # Inner side
        bm.faces.new([top_inner[i+1], top_inner[i], bot_inner[i], bot_inner[i+1]])
        # Top face
        bm.faces.new([top_outer[i], top_inner[i], top_inner[i+1], top_outer[i+1]])
        # Bottom face
        bm.faces.new([bot_outer[i+1], bot_inner[i+1], bot_inner[i], bot_outer[i]])

    # End caps
    bm.faces.new([top_outer[0], top_inner[0], bot_inner[0], bot_outer[0]])
    bm.faces.new([top_outer[-1], bot_outer[-1], bot_inner[-1], top_inner[-1]])

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


# ── Bar Chart ────────────────────────────────────────────────────────────────

def create_bar_chart(data=None, labels=None, animated=True, location=(0, 0, 0)):
    """
    Create a 3D bar chart from a list of values.
    data: list of floats
    labels: list of strings (optional)
    animated: bool — add grow-from-zero animation
    Returns parent empty.
    """
    if data is None:
        data = [18000, 12000, 25000, 8000, 31000]
    if labels is None:
        labels = [f"Month {i+1}" for i in range(len(data))]

    max_val = max(data) if data else 1
    bar_width = 0.6
    spacing = 1.0
    max_height = 4.0

    parent = bpy.data.objects.new("BarChart", None)
    parent.empty_display_type = "PLAIN_AXES"
    parent.location = location
    bpy.context.collection.objects.link(parent)

    scene = bpy.context.scene
    if animated:
        scene.frame_start = 1
        scene.frame_end = max(80, len(data) * 12)

    for i, (val, label) in enumerate(zip(data, labels)):
        height = max(0.05, (val / max_val) * max_height)
        x = i * (bar_width + spacing)

        bar_mesh = bpy.data.meshes.new(f"Bar_{label}")
        bm = bmesh.new()
        bmesh.ops.create_cube(bm, size=1.0)
        bm.to_mesh(bar_mesh)
        bm.free()

        bar = bpy.data.objects.new(f"Bar_{label}", bar_mesh)
        bar.scale = (bar_width, bar_width, height)
        bar.location = (x, 0, 0)
        bar.data.materials.append(_bar_material(i))
        bar.parent = parent
        bpy.context.collection.objects.link(bar)

        if animated:
            start_frame = 1 + i * 8
            end_frame = start_frame + 20

            # Flat at frame start
            bar.scale = (bar_width, bar_width, 0.001)
            bar.location = (x, 0, 0)
            bar.keyframe_insert(data_path="scale", frame=start_frame)
            bar.keyframe_insert(data_path="location", frame=start_frame)

            # Full height
            bar.scale = (bar_width, bar_width, height)
            bar.location = (x, 0, height / 2)
            bar.keyframe_insert(data_path="scale", frame=end_frame)
            bar.keyframe_insert(data_path="location", frame=end_frame)

            # Ease: set interpolation to EXPO on all fcurves
            if bar.animation_data and bar.animation_data.action:
                for fc in bar.animation_data.action.fcurves:
                    for kp in fc.keyframe_points:
                        kp.interpolation = "EXPO"
        else:
            bar.location = (x, 0, height / 2)

    print(f"[TaxClam] Bar chart created with {len(data)} bars. Animated={animated}")
    return parent


# ── Donut Chart ──────────────────────────────────────────────────────────────

def create_donut_chart(segments=None, animated=True, location=(0, 0, 0)):
    """
    Create a 3D donut chart from a list of (label, value) tuples.
    Mirrors the existing Chart.js donut in TaxClam.
    Returns parent empty.
    """
    if segments is None:
        segments = [("Output GST", 2), ("Input GST", 1), ("Net GST", 1)]

    total = sum(v for _, v in segments)
    if total == 0:
        total = 1

    parent = bpy.data.objects.new("DonutChart", None)
    parent.empty_display_type = "PLAIN_AXES"
    parent.location = location
    bpy.context.collection.objects.link(parent)

    scene = bpy.context.scene
    if animated:
        scene.frame_start = 1
        scene.frame_end = 80

    current_angle = 0.0
    gap = 0.04  # radians between segments

    for idx, (label, value) in enumerate(segments):
        arc = (value / total) * (2 * math.pi) - gap
        if arc <= 0:
            continue

        seg_obj = _torus_segment(
            f"Donut_{label}",
            inner_r=1.0, outer_r=1.8,
            start_angle=current_angle,
            end_angle=current_angle + arc,
            height=0.45
        )
        seg_obj.data.materials.append(_bar_material(idx))
        seg_obj.parent = parent

        if animated:
            # Scale Z: flat to full
            seg_obj.scale = (1, 1, 0.001)
            seg_obj.keyframe_insert(data_path="scale", frame=1 + idx * 10)
            seg_obj.scale = (1, 1, 1)
            seg_obj.keyframe_insert(data_path="scale", frame=20 + idx * 10)

            if seg_obj.animation_data and seg_obj.animation_data.action:
                for fc in seg_obj.animation_data.action.fcurves:
                    for kp in fc.keyframe_points:
                        kp.interpolation = "BACK"

        current_angle += arc + gap

    # Inner hole (navy cylinder)
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.95, depth=0.55, location=location
    )
    hole = bpy.context.active_object
    from .ui_component_builder import get_navy_material
    hole.data.materials.append(get_navy_material())
    hole.parent = parent
    hole.name = "DonutChart_Hole"

    print(f"[TaxClam] Donut chart created with {len(segments)} segments. Animated={animated}")
    return parent


# ── Timeline Chart ───────────────────────────────────────────────────────────

def create_timeline(history=None, animated=True, location=(0, 0, 0)):
    """
    Create a 3D timeline / area chart from calculation history.
    history: list of dicts with 'period' and 'net_gst' keys.
    """
    if history is None:
        history = [
            {"period": "Jan", "net_gst": 12000},
            {"period": "Feb", "net_gst": 18000},
            {"period": "Mar", "net_gst": 9000},
            {"period": "Apr", "net_gst": 22000},
            {"period": "May", "net_gst": 15000},
            {"period": "Jun", "net_gst": 28000},
        ]

    values = [h.get("net_gst", 0) for h in history]
    labels = [h.get("period", str(i)) for i, h in enumerate(history)]

    return create_bar_chart(
        data=values,
        labels=labels,
        animated=animated,
        location=location
    )
