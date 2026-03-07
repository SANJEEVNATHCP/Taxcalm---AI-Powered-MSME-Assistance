"""
TaxClam Export Manager
One-click export of Blender scenes to all formats needed by the TaxClam web app:
  PNG/JPEG  →  static/images/blender/
  GLB/GLTF  →  static/models/
  MP4       →  static/animations/
  SVG       →  static/images/blender/ (via Freestyle)
"""

import bpy
import os


def _resolve_path(context, subfolder, filename):
    """Resolve export path relative to the web app root set in the scene."""
    base = context.scene.taxclam_export_path
    if not base:
        base = os.path.join(os.path.expanduser("~"), "taxclam_exports")
    else:
        base = bpy.path.abspath(base)
    dest = os.path.join(base, "static", subfolder)
    os.makedirs(dest, exist_ok=True)
    return os.path.join(dest, filename)


def _configure_render_settings(resolution=(1920, 1080), samples=128):
    scene = bpy.context.scene
    scene.render.resolution_x = resolution[0]
    scene.render.resolution_y = resolution[1]
    scene.render.resolution_percentage = 100
    if scene.render.engine == "CYCLES":
        scene.cycles.samples = samples
        scene.cycles.use_denoising = True
    elif scene.render.engine == "BLENDER_EEVEE_NEXT":
        scene.eevee.taa_render_samples = samples // 4


# ── PNG / JPEG ────────────────────────────────────────────────────────────────

def export_png(context, filename="taxclam_render.png"):
    """Render current frame to PNG in static/images/blender/."""
    out_path = _resolve_path(context, os.path.join("images", "blender"), filename)
    _configure_render_settings()
    scene = bpy.context.scene
    scene.render.filepath = out_path
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    bpy.ops.render.render(write_still=True)
    print(f"[TaxClam] PNG exported → {out_path}")
    return out_path


def export_jpeg(context, filename="taxclam_render.jpg", quality=95):
    """Render current frame to JPEG."""
    out_path = _resolve_path(context, os.path.join("images", "blender"), filename)
    _configure_render_settings()
    scene = bpy.context.scene
    scene.render.filepath = out_path
    scene.render.image_settings.file_format = "JPEG"
    scene.render.image_settings.quality = quality
    bpy.ops.render.render(write_still=True)
    print(f"[TaxClam] JPEG exported → {out_path}")
    return out_path


# ── GLB / GLTF ────────────────────────────────────────────────────────────────

def export_glb(context, filename="taxclam_scene.glb", selected_only=False):
    """
    Export scene (or selection) as a Draco-compressed GLB for Three.js.
    Lands in static/models/.
    """
    out_path = _resolve_path(context, "models", filename)
    export_kwargs = dict(
        filepath=out_path,
        export_format="GLB",
        use_selection=selected_only,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_animations=True,
        export_morph=True,
        export_skins=False,
        export_lights=True,
        export_cameras=True,
        export_apply=True,          # apply modifiers
        export_image_format="WEBP", # smaller textures
    )
    bpy.ops.export_scene.gltf(**export_kwargs)
    print(f"[TaxClam] GLB exported → {out_path}")
    return out_path


# ── MP4 Animation ─────────────────────────────────────────────────────────────

def export_animation_mp4(context, filename="taxclam_animation.mp4"):
    """
    Render the full animation to MP4 (FFmpeg H.264).
    Falls back to PNG frame sequence if FFmpeg is unavailable in Blender.
    """
    scene = bpy.context.scene
    _configure_render_settings(samples=64)  # faster for video

    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format = "MPEG4"
    scene.render.ffmpeg.codec = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.ffmpeg.audio_codec = "NONE"

    out_path = _resolve_path(context, "animations", filename)
    scene.render.filepath = out_path

    try:
        bpy.ops.render.render(animation=True)
        print(f"[TaxClam] MP4 exported → {out_path}")
        return out_path
    except RuntimeError:
        # Fallback: PNG frame sequence
        frames_dir = _resolve_path(context, os.path.join("animations", "frames"), "frame_")
        scene.render.filepath = frames_dir
        scene.render.image_settings.file_format = "PNG"
        bpy.ops.render.render(animation=True)
        print(f"[TaxClam] MP4 unavailable — PNG frames exported → {frames_dir}")
        return frames_dir


# ── SVG via Freestyle ──────────────────────────────────────────────────────────

def export_svg(context, filename="taxclam_lineart.svg"):
    """
    Render a Freestyle SVG line-art export of the current frame.
    Useful for icon-quality SVG assets derived from 3D geometry.
    """
    scene = bpy.context.scene
    scene.render.use_freestyle = True
    scene.svg_export.use_svg_export = True

    out_path = _resolve_path(context, os.path.join("images", "blender"), filename)
    scene.render.filepath = out_path
    scene.render.image_settings.file_format = "PNG"  # PNG + SVG written side-by-side

    bpy.ops.render.render(write_still=True)
    # Blender writes <name>.svg alongside the PNG
    svg_path = out_path.replace(".svg", "0001.svg")
    print(f"[TaxClam] SVG exported → {svg_path}")
    return svg_path


# ── Export All ────────────────────────────────────────────────────────────────

def export_all(context, base_name="taxclam_scene"):
    """Run all four export types in sequence. Returns dict of output paths."""
    results = {}
    try:
        results["png"] = export_png(context, f"{base_name}.png")
    except Exception as e:
        results["png"] = f"ERROR: {e}"
    try:
        results["glb"] = export_glb(context, f"{base_name}.glb")
    except Exception as e:
        results["glb"] = f"ERROR: {e}"
    try:
        results["mp4"] = export_animation_mp4(context, f"{base_name}.mp4")
    except Exception as e:
        results["mp4"] = f"ERROR: {e}"
    try:
        results["svg"] = export_svg(context, f"{base_name}.svg")
    except Exception as e:
        results["svg"] = f"ERROR: {e}"
    print(f"[TaxClam] Export complete: {results}")
    return results
