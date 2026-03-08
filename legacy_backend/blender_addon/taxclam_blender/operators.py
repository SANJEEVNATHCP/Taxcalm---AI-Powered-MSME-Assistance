"""
TaxClam Blender Operators
All bpy.types.Operator subclasses wired to panel buttons.
"""

import bpy
import json
from . import api_client


# ═══════════════════════════════════════════════════════════════════════════════
# API Operators
# ═══════════════════════════════════════════════════════════════════════════════

class TAXCLAM_OT_Connect(bpy.types.Operator):
    bl_idname = "taxclam.connect"
    bl_label = "Connect"
    bl_description = "Ping the TaxClam server to verify connection"

    def execute(self, context):
        ok, result = api_client.check_connection(context)
        if ok:
            context.scene.taxclam_status = f"Connected — {result.get('app', 'TaxClam')}"
            self.report({"INFO"}, f"Connected to TaxClam: {result}")
            prefs = context.preferences.addons[__package__].preferences
            if prefs.auto_fetch_on_connect:
                bpy.ops.taxclam.fetch_data()
        else:
            context.scene.taxclam_status = f"Error: {result}"
            self.report({"ERROR"}, f"Cannot connect: {result}")
        return {"FINISHED"}


class TAXCLAM_OT_FetchData(bpy.types.Operator):
    bl_idname = "taxclam.fetch_data"
    bl_label = "Fetch GST Data"
    bl_description = "Download live GST summary data from the TaxClam API"

    def execute(self, context):
        ok, result = api_client.fetch_gst_data(context)
        if ok:
            context.scene.taxclam_gst_data = json.dumps(result)
            self.report({"INFO"}, f"GST data fetched: {list(result.keys())}")
        else:
            self.report({"ERROR"}, f"Fetch failed: {result}")
        return {"FINISHED"}


class TAXCLAM_OT_DisconnectAPI(bpy.types.Operator):
    bl_idname = "taxclam.disconnect"
    bl_label = "Disconnect"
    bl_description = "Clear connection status"

    def execute(self, context):
        context.scene.taxclam_status = "Disconnected"
        context.scene.taxclam_gst_data = "{}"
        self.report({"INFO"}, "Disconnected from TaxClam.")
        return {"FINISHED"}


# ═══════════════════════════════════════════════════════════════════════════════
# Chart Operators
# ═══════════════════════════════════════════════════════════════════════════════

class TAXCLAM_OT_GenerateBarChart(bpy.types.Operator):
    bl_idname = "taxclam.gen_bar_chart"
    bl_label = "Generate Bar Chart"
    bl_description = "Create a 3D bar chart from fetched GST data"

    def execute(self, context):
        from .chart_generator import create_bar_chart
        raw = context.scene.taxclam_gst_data
        try:
            data_dict = json.loads(raw)
            history = data_dict.get("history", [])
            if history:
                values = [h.get("net_gst", 0) for h in history]
                labels = [h.get("period", str(i)) for i, h in enumerate(history)]
            else:
                values = [data_dict.get("output_gst", 18000),
                          data_dict.get("input_gst", 12000),
                          data_dict.get("net_gst", 6000)]
                labels = ["Output GST", "Input GST", "Net GST"]
        except json.JSONDecodeError:
            values = [18000, 12000, 6000]
            labels = ["Output GST", "Input GST", "Net GST"]

        create_bar_chart(
            data=values, labels=labels,
            animated=context.scene.taxclam_chart_animated
        )
        self.report({"INFO"}, f"Bar chart created with {len(values)} bars.")
        return {"FINISHED"}


class TAXCLAM_OT_GenerateDonutChart(bpy.types.Operator):
    bl_idname = "taxclam.gen_donut_chart"
    bl_label = "Generate Donut Chart"
    bl_description = "Create a 3D donut chart matching the TaxClam web dashboard"

    def execute(self, context):
        from .chart_generator import create_donut_chart
        raw = context.scene.taxclam_gst_data
        try:
            data_dict = json.loads(raw)
            segs = [
                ("Output GST", max(1, data_dict.get("output_gst", 2))),
                ("Input GST",  max(1, data_dict.get("input_gst", 1))),
                ("Net GST",    max(1, abs(data_dict.get("net_gst", 1)))),
            ]
        except json.JSONDecodeError:
            segs = [("Output GST", 2), ("Input GST", 1), ("Net GST", 1)]

        create_donut_chart(
            segments=segs,
            animated=context.scene.taxclam_chart_animated
        )
        self.report({"INFO"}, "Donut chart created.")
        return {"FINISHED"}


class TAXCLAM_OT_GenerateTimeline(bpy.types.Operator):
    bl_idname = "taxclam.gen_timeline"
    bl_label = "Generate Timeline"
    bl_description = "Create a 3D timeline chart from GST history"

    def execute(self, context):
        from .chart_generator import create_timeline
        raw = context.scene.taxclam_gst_data
        try:
            data_dict = json.loads(raw)
            history = data_dict.get("history", None)
        except json.JSONDecodeError:
            history = None

        create_timeline(history=history, animated=context.scene.taxclam_chart_animated)
        self.report({"INFO"}, "Timeline chart created.")
        return {"FINISHED"}


class TAXCLAM_OT_AnimateChart(bpy.types.Operator):
    bl_idname = "taxclam.animate_chart"
    bl_label = "Preview Animation"
    bl_description = "Play back the chart grow-in animation in the viewport"

    def execute(self, context):
        context.scene.frame_current = 1
        bpy.ops.screen.animation_play()
        return {"FINISHED"}


# ═══════════════════════════════════════════════════════════════════════════════
# UI Component Operators
# ═══════════════════════════════════════════════════════════════════════════════

class TAXCLAM_OT_CreateCard(bpy.types.Operator):
    bl_idname = "taxclam.create_card"
    bl_label = "Create Card"
    bl_description = "Add a single floating dashboard card to the scene"

    def execute(self, context):
        from .ui_component_builder import create_card
        create_card(
            title=context.scene.taxclam_card_title,
            value=context.scene.taxclam_card_value,
            color="gold"
        )
        self.report({"INFO"}, f"Card '{context.scene.taxclam_card_title}' created.")
        return {"FINISHED"}


class TAXCLAM_OT_CreateButton(bpy.types.Operator):
    bl_idname = "taxclam.create_button"
    bl_label = "Create Button"
    bl_description = "Add a 3D CTA button mesh to the scene"

    def execute(self, context):
        from .ui_component_builder import create_button
        create_button(label="Calculate GST", color="gold")
        self.report({"INFO"}, "Button created.")
        return {"FINISHED"}


class TAXCLAM_OT_CreateDashboard(bpy.types.Operator):
    bl_idname = "taxclam.create_dashboard"
    bl_label = "Create Full Dashboard"
    bl_description = "Build a complete dashboard panel from fetched GST data"

    def execute(self, context):
        from .ui_component_builder import create_dashboard_panel
        raw = context.scene.taxclam_gst_data
        try:
            data_dict = json.loads(raw)
        except json.JSONDecodeError:
            data_dict = {}
        create_dashboard_panel(data_dict=data_dict)
        self.report({"INFO"}, "Dashboard panel created.")
        return {"FINISHED"}


class TAXCLAM_OT_SetupLighting(bpy.types.Operator):
    bl_idname = "taxclam.setup_lighting"
    bl_label = "Setup Studio Lighting"
    bl_description = "Create a 3-point cinematic lighting rig with TaxClam brand colors"

    def execute(self, context):
        from .ui_component_builder import setup_studio_lighting
        setup_studio_lighting()
        self.report({"INFO"}, "Studio lighting rig created.")
        return {"FINISHED"}


# ═══════════════════════════════════════════════════════════════════════════════
# Export Operators
# ═══════════════════════════════════════════════════════════════════════════════

class TAXCLAM_OT_ExportGLB(bpy.types.Operator):
    bl_idname = "taxclam.export_glb"
    bl_label = "Export GLB"
    bl_description = "Export scene as Draco-compressed GLB for Three.js"

    def execute(self, context):
        from .export_manager import export_glb
        path = export_glb(context)
        self.report({"INFO"}, f"GLB exported → {path}")
        return {"FINISHED"}


class TAXCLAM_OT_ExportPNG(bpy.types.Operator):
    bl_idname = "taxclam.export_png"
    bl_label = "Export PNG"
    bl_description = "Render current frame to PNG"

    def execute(self, context):
        from .export_manager import export_png
        path = export_png(context)
        self.report({"INFO"}, f"PNG exported → {path}")
        return {"FINISHED"}


class TAXCLAM_OT_ExportAnimation(bpy.types.Operator):
    bl_idname = "taxclam.export_animation"
    bl_label = "Export MP4"
    bl_description = "Render full animation to MP4 (H.264)"

    def execute(self, context):
        from .export_manager import export_animation_mp4
        path = export_animation_mp4(context)
        self.report({"INFO"}, f"Animation exported → {path}")
        return {"FINISHED"}


class TAXCLAM_OT_ExportSVG(bpy.types.Operator):
    bl_idname = "taxclam.export_svg"
    bl_label = "Export SVG"
    bl_description = "Render Freestyle line-art SVG"

    def execute(self, context):
        from .export_manager import export_svg
        path = export_svg(context)
        self.report({"INFO"}, f"SVG exported → {path}")
        return {"FINISHED"}


class TAXCLAM_OT_ExportAll(bpy.types.Operator):
    bl_idname = "taxclam.export_all"
    bl_label = "Export All Formats"
    bl_description = "Export PNG, GLB, MP4, and SVG in one click"

    def invoke(self, context, event):
        return context.window_manager.invoke_confirm(self, event)

    def execute(self, context):
        from .export_manager import export_all
        results = export_all(context)
        ok = [k for k, v in results.items() if not str(v).startswith("ERROR")]
        fail = [k for k, v in results.items() if str(v).startswith("ERROR")]
        msg = f"Exported: {', '.join(ok)}"
        if fail:
            msg += f" | Failed: {', '.join(fail)}"
        self.report({"INFO"} if not fail else {"WARNING"}, msg)
        return {"FINISHED"}
