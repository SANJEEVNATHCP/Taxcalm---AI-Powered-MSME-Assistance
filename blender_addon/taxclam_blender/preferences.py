"""
TaxClam Addon Preferences
Stores the TaxClam server URL and API key persistently in Blender user preferences.
"""

import bpy
from bpy.types import AddonPreferences
from bpy.props import StringProperty, IntProperty, BoolProperty


class TaxClamAddonPreferences(AddonPreferences):
    bl_idname = __package__

    server_url: StringProperty(
        name="Server URL",
        description="TaxClam FastAPI server base URL",
        default="http://localhost:8000",
    )

    api_key: StringProperty(
        name="API Key",
        description="Optional API key for authenticated endpoints",
        default="",
        subtype="PASSWORD",
    )

    timeout: IntProperty(
        name="Request Timeout (s)",
        description="HTTP request timeout in seconds",
        default=10,
        min=1,
        max=60,
    )

    auto_fetch_on_connect: BoolProperty(
        name="Auto-fetch data on connect",
        description="Automatically fetch GST data after a successful connection",
        default=True,
    )

    def draw(self, context):
        layout = self.layout
        layout.label(text="TaxClam Server Settings", icon="WORLD_DATA")

        box = layout.box()
        box.prop(self, "server_url")
        box.prop(self, "api_key")
        box.prop(self, "timeout")
        box.prop(self, "auto_fetch_on_connect")

        layout.separator()
        row = layout.row()
        row.label(text="Run 'Connect' from the 3D Viewport N-Panel > TaxClam.", icon="INFO")
