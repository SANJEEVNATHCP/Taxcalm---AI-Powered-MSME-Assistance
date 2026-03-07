"""
TaxClam N-Panel
Adds a "TaxClam" tab in the 3D Viewport sidebar with four sub-panels:
  API → Charts → UI Builder → Export
"""

import bpy
import json


class TAXCLAM_PT_APIPanel(bpy.types.Panel):
    bl_label = "API Connection"
    bl_idname = "TAXCLAM_PT_APIPanel"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_category = "TaxClam"
    bl_order = 10

    def draw(self, context):
        layout = self.layout
        scene = context.scene
        prefs = context.preferences.addons[__package__].preferences

        # Status indicator
        status = scene.taxclam_status
        is_connected = status.startswith("Connected")
        row = layout.row()
        row.alert = not is_connected
        row.label(text=status, icon="CHECKMARK" if is_connected else "ERROR")

        layout.separator()
        layout.label(text="Server URL:", icon="WORLD_DATA")
        layout.prop(prefs, "server_url", text="")

        row = layout.row(align=True)
        row.operator("taxclam.connect", icon="PLAY")
        row.operator("taxclam.disconnect", icon="X", text="")

        layout.separator()
        col = layout.column(align=True)
        col.operator("taxclam.fetch_data", icon="IMPORT")

        # Show summary of fetched data
        raw = scene.taxclam_gst_data
        try:
            d = json.loads(raw)
            if d:
                box = layout.box()
                box.label(text="Live GST Data", icon="SPREADSHEET")
                for key in ["output_gst", "input_gst", "net_gst"]:
                    if key in d:
                        row = box.row()
                        row.label(text=key.replace("_", " ").title() + ":")
                        row.label(text=f"₹{d[key]:,.0f}")
        except (json.JSONDecodeError, TypeError, ValueError):
            pass


class TAXCLAM_PT_ChartsPanel(bpy.types.Panel):
    bl_label = "3D Charts"
    bl_idname = "TAXCLAM_PT_ChartsPanel"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_category = "TaxClam"
    bl_order = 20

    def draw(self, context):
        layout = self.layout
        scene = context.scene

        layout.prop(scene, "taxclam_chart_animated", icon="ARMATURE_DATA")
        layout.separator()

        col = layout.column(align=True)
        col.label(text="Generate:", icon="BARCHART")
        col.operator("taxclam.gen_bar_chart", icon="NLA")
        col.operator("taxclam.gen_donut_chart", icon="MESH_TORUS")
        col.operator("taxclam.gen_timeline", icon="TIME")

        layout.separator()
        layout.operator("taxclam.animate_chart", icon="PLAY", text="Preview Animation")


class TAXCLAM_PT_UIBuilderPanel(bpy.types.Panel):
    bl_label = "UI Components"
    bl_idname = "TAXCLAM_PT_UIBuilderPanel"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_category = "TaxClam"
    bl_order = 30

    def draw(self, context):
        layout = self.layout
        scene = context.scene

        box = layout.box()
        box.label(text="Card Settings", icon="NODE_MATERIAL")
        box.prop(scene, "taxclam_card_title", text="Title")
        box.prop(scene, "taxclam_card_value", text="Value")
        box.operator("taxclam.create_card", icon="MESH_PLANE")

        layout.separator()
        col = layout.column(align=True)
        col.operator("taxclam.create_button", icon="MESH_CUBE")
        col.operator("taxclam.create_dashboard", icon="WORKSPACE")

        layout.separator()
        layout.separator()
        layout.operator("taxclam.setup_lighting", icon="LIGHT_SUN")

        layout.separator()
        box2 = layout.box()
        box2.label(text="Export Path (web app root):", icon="FILEBROWSER")
        box2.prop(scene, "taxclam_export_path", text="")


class TAXCLAM_PT_ExportPanel(bpy.types.Panel):
    bl_label = "Export"
    bl_idname = "TAXCLAM_PT_ExportPanel"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_category = "TaxClam"
    bl_order = 40

    def draw(self, context):
        layout = self.layout

        layout.label(text="Individual Exports:", icon="EXPORT")
        col = layout.column(align=True)
        col.operator("taxclam.export_glb",       icon="SCENE_DATA",       text="GLB  (Three.js)")
        col.operator("taxclam.export_png",        icon="IMAGE_DATA",       text="PNG  (Render)")
        col.operator("taxclam.export_animation",  icon="RENDER_ANIMATION", text="MP4  (Animation)")
        col.operator("taxclam.export_svg",        icon="FILE_VECTOR_PNG",  text="SVG  (Line Art)")

        layout.separator()
        row = layout.row()
        row.scale_y = 1.6
        row.operator("taxclam.export_all", icon="FUND", text="Export All Formats")
