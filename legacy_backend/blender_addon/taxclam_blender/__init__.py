"""
TaxClam Blender Addon
Connects Blender 4.x to the TaxClam GST platform for UI/UX asset production.
- Builds 3D UI components and charts from live GST data
- Exports GLB/GLTF, PNG/JPEG, MP4, SVG assets for the web app
"""

bl_info = {
    "name": "TaxClam UI/UX Builder",
    "author": "TaxClam",
    "version": (1, 0, 0),
    "blender": (4, 0, 0),
    "location": "View3D > Sidebar > TaxClam",
    "description": "Connects to TaxClam API, builds 3D UI components and charts, exports web-ready assets",
    "category": "3D View",
    "doc_url": "http://localhost:8000/docs",
    "support": "COMMUNITY",
}

import bpy

# ---- sub-module imports (deferred so Blender can load bl_info without errors) ----
from . import preferences
from . import panels
from . import operators

# Classes to register in the correct dependency order
_classes = (
    preferences.TaxClamAddonPreferences,

    # API panel operators
    operators.TAXCLAM_OT_Connect,
    operators.TAXCLAM_OT_FetchData,
    operators.TAXCLAM_OT_DisconnectAPI,

    # Chart operators
    operators.TAXCLAM_OT_GenerateBarChart,
    operators.TAXCLAM_OT_GenerateDonutChart,
    operators.TAXCLAM_OT_GenerateTimeline,
    operators.TAXCLAM_OT_AnimateChart,

    # UI component operators
    operators.TAXCLAM_OT_CreateCard,
    operators.TAXCLAM_OT_CreateButton,
    operators.TAXCLAM_OT_CreateDashboard,
    operators.TAXCLAM_OT_SetupLighting,

    # Export operators
    operators.TAXCLAM_OT_ExportGLB,
    operators.TAXCLAM_OT_ExportPNG,
    operators.TAXCLAM_OT_ExportAnimation,
    operators.TAXCLAM_OT_ExportSVG,
    operators.TAXCLAM_OT_ExportAll,

    # Panels (must come after operators)
    panels.TAXCLAM_PT_APIPanel,
    panels.TAXCLAM_PT_ChartsPanel,
    panels.TAXCLAM_PT_UIBuilderPanel,
    panels.TAXCLAM_PT_ExportPanel,
)


def register():
    for cls in _classes:
        bpy.utils.register_class(cls)

    # Scene properties for storing fetched data
    bpy.types.Scene.taxclam_status = bpy.props.StringProperty(
        name="Connection Status",
        default="Disconnected"
    )
    bpy.types.Scene.taxclam_gst_data = bpy.props.StringProperty(
        name="GST Data JSON",
        default="{}"
    )
    bpy.types.Scene.taxclam_export_path = bpy.props.StringProperty(
        name="Export Path",
        default="",
        subtype="DIR_PATH",
        description="Root path of the TaxClam web app (e.g. path/to/taxclam)"
    )
    bpy.types.Scene.taxclam_card_title = bpy.props.StringProperty(
        name="Card Title",
        default="GST Summary"
    )
    bpy.types.Scene.taxclam_card_value = bpy.props.StringProperty(
        name="Card Value",
        default="₹0"
    )
    bpy.types.Scene.taxclam_chart_animated = bpy.props.BoolProperty(
        name="Animated",
        default=True,
        description="Add grow-in keyframe animation to chart"
    )

    print("[TaxClam] Addon registered successfully.")


def unregister():
    for cls in reversed(_classes):
        bpy.utils.unregister_class(cls)

    del bpy.types.Scene.taxclam_status
    del bpy.types.Scene.taxclam_gst_data
    del bpy.types.Scene.taxclam_export_path
    del bpy.types.Scene.taxclam_card_title
    del bpy.types.Scene.taxclam_card_value
    del bpy.types.Scene.taxclam_chart_animated

    print("[TaxClam] Addon unregistered.")
