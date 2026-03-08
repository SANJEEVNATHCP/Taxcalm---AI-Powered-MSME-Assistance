"""
TaxClam 3D UI Component Builder
Parametric mesh generators for dashboard cards, buttons, and panel layouts.
All geometry is created programmatically via bmesh — no external assets required.
"""

import bpy
import bmesh
import mathutils
from math import pi, cos, sin


# ── Brand colors (linear, not sRGB) ──────────────────────────────────────────
GOLD = (1.0, 0.843, 0.0, 1.0)          # #FFD700
EMERALD = (0.063, 0.725, 0.506, 1.0)   # #10B981
DEEP_NAVY = (0.043, 0.067, 0.125, 1.0) # #0B1120
GLASS_WHITE = (0.95, 0.98, 1.0, 0.08)  # translucent glass
OFF_WHITE = (0.973, 0.980, 0.988, 1.0) # #F8FAFC


# ── Material helpers ──────────────────────────────────────────────────────────

def _ensure_material(name, base_color, metallic=0.0, roughness=0.4,
                     emission_strength=0.0, alpha=1.0, transmission=0.0):
    mat = bpy.data.materials.get(name)
    if mat is None:
        mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    mat.blend_method = "BLEND" if alpha < 1.0 else "OPAQUE"
    nodes = mat.node_tree.nodes
    nodes.clear()

    out = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    mat.node_tree.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    bsdf.inputs["Base Color"].default_value = base_color
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Alpha"].default_value = alpha
    bsdf.inputs["Transmission Weight"].default_value = transmission

    if emission_strength > 0:
        bsdf.inputs["Emission Color"].default_value = base_color
        bsdf.inputs["Emission Strength"].default_value = emission_strength

    return mat


def get_gold_material():
    return _ensure_material("TaxClam_Gold", GOLD, metallic=0.9, roughness=0.2,
                            emission_strength=0.3)


def get_emerald_material():
    return _ensure_material("TaxClam_Emerald", EMERALD, metallic=0.2, roughness=0.3,
                            emission_strength=0.5)


def get_glass_material():
    return _ensure_material("TaxClam_Glass", GLASS_WHITE, metallic=0.0, roughness=0.05,
                            alpha=0.15, transmission=0.9)


def get_navy_material():
    return _ensure_material("TaxClam_Navy", DEEP_NAVY, metallic=0.0, roughness=0.8)


def get_text_material():
    return _ensure_material("TaxClam_Text", OFF_WHITE, metallic=0.0, roughness=1.0,
                            emission_strength=0.2)


# ── Rounded rectangle mesh ────────────────────────────────────────────────────

def _create_rounded_rect_mesh(name, width, height, depth, radius, segments=8):
    """
    Build a rounded-rectangle slab (extruded pill shape).
    Returns the created mesh object.
    """
    bm = bmesh.new()
    half_w = width / 2
    half_h = height / 2
    r = min(radius, half_w, half_h)

    corners = [
        ( half_w - r,  half_h - r),
        (-half_w + r,  half_h - r),
        (-half_w + r, -half_h + r),
        ( half_w - r, -half_h + r),
    ]
    angles_start = [0, pi / 2, pi, 3 * pi / 2]

    verts_2d = []
    for (cx, cy), start_angle in zip(corners, angles_start):
        for i in range(segments + 1):
            a = start_angle + i * (pi / 2) / segments
            verts_2d.append((cx + r * cos(a), cy + r * sin(a)))

    z_top = depth / 2
    z_bot = -depth / 2

    top_verts = [bm.verts.new((x, y, z_top)) for x, y in verts_2d]
    bot_verts = [bm.verts.new((x, y, z_bot)) for x, y in verts_2d]

    n = len(top_verts)
    # Side faces
    for i in range(n):
        bm.faces.new([top_verts[i], top_verts[(i + 1) % n],
                      bot_verts[(i + 1) % n], bot_verts[i]])

    # Top / bottom cap (simple fan)
    bm.faces.new(top_verts)
    bm.faces.new(list(reversed(bot_verts)))

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


# ── Public API ────────────────────────────────────────────────────────────────

def create_card(title="GST Summary", value="₹0", color="gold",
                width=4.0, height=2.0, depth=0.12, location=(0, 0, 0)):
    """
    Create a floating dashboard card with glass body and a colored accent strip.
    Returns the parent empty that groups both objects.
    """
    parent = bpy.data.objects.new(f"Card_{title}", None)
    parent.empty_display_type = "PLAIN_AXES"
    parent.location = location
    bpy.context.collection.objects.link(parent)

    # Glass body
    body = _create_rounded_rect_mesh(f"Card_Body_{title}", width, height, depth, 0.18)
    body.data.materials.append(get_glass_material())
    body.parent = parent

    # Accent strip (top edge)
    accent_mat = get_gold_material() if color == "gold" else get_emerald_material()
    strip = _create_rounded_rect_mesh(f"Card_Strip_{title}", width * 0.95, 0.08, depth + 0.01, 0.04)
    strip.location = (0, height / 2 - 0.1, 0)
    strip.data.materials.append(accent_mat)
    strip.parent = parent

    print(f"[TaxClam] Created card: '{title}' = {value}")
    return parent


def create_button(label="Calculate", color="gold", width=2.5, height=0.7, depth=0.1,
                  location=(0, 0, 0)):
    """Create a 3D call-to-action button mesh."""
    btn = _create_rounded_rect_mesh(f"Button_{label}", width, height, depth, 0.35)
    mat = get_gold_material() if color == "gold" else get_emerald_material()
    btn.data.materials.append(mat)
    btn.location = location
    print(f"[TaxClam] Created button: '{label}'")
    return btn


def create_dashboard_panel(data_dict=None, layout="grid"):
    """
    Build a full dashboard panel with multiple cards populated from data_dict.
    data_dict keys: 'output_gst', 'input_gst', 'net_gst'
    """
    if data_dict is None:
        data_dict = {"output_gst": 0, "input_gst": 0, "net_gst": 0}

    parent = bpy.data.objects.new("Dashboard_Panel", None)
    parent.empty_display_type = "PLAIN_AXES"
    bpy.context.collection.objects.link(parent)

    items = [
        ("Output GST", f"₹{data_dict.get('output_gst', 0):,.0f}", "gold"),
        ("Input GST", f"₹{data_dict.get('input_gst', 0):,.0f}", "emerald"),
        ("Net GST", f"₹{data_dict.get('net_gst', 0):,.0f}", "gold"),
    ]

    spacing = 4.5
    for i, (title, value, color) in enumerate(items):
        x = (i - 1) * spacing
        card = create_card(title, value, color, location=(x, 0, 0))
        card.parent = parent

    print(f"[TaxClam] Dashboard panel created with {len(items)} cards.")
    return parent


def setup_studio_lighting():
    """
    Create a 3-point lighting rig matching TaxClam brand (warm key, cool fill, rim).
    Removes existing lights first.
    """
    for obj in list(bpy.context.scene.objects):
        if obj.type == "LIGHT":
            bpy.data.objects.remove(obj, do_unlink=True)

    lights = [
        # (name, type, energy, color, location, rotation)
        ("Key_Light", "AREA", 400, (1.0, 0.9, 0.7), (4, -2, 6), (-0.8, 0.6, 0.5)),
        ("Fill_Light", "AREA", 150, (0.5, 0.7, 1.0), (-5, 3, 4), (0.7, -0.4, -0.3)),
        ("Rim_Light", "SPOT", 200, (0.063, 0.725, 0.506), (-2, -5, 3), (0.9, -0.5, 0.0)),
    ]

    for name, ltype, energy, color, loc, rot in lights:
        light_data = bpy.data.lights.new(name=name, type=ltype)
        light_data.energy = energy
        light_data.color = color[:3]
        if ltype == "SPOT":
            light_data.spot_size = 0.8
            light_data.spot_blend = 0.3

        light_obj = bpy.data.objects.new(name, light_data)
        light_obj.location = loc
        light_obj.rotation_euler = rot
        bpy.context.collection.objects.link(light_obj)

    # Set dark world background
    world = bpy.context.scene.world or bpy.data.worlds.new("TaxClam_World")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background") or world.node_tree.nodes.new("ShaderNodeBackground")
    bg.inputs["Color"].default_value = (*DEEP_NAVY[:3], 1.0)
    bg.inputs["Strength"].default_value = 0.1

    print("[TaxClam] Studio lighting rig created.")
