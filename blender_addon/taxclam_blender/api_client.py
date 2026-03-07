"""
TaxClam API Client
HTTP communication between Blender and the TaxClam FastAPI server.
Uses only Python standard library (urllib) — no external dependencies required.
"""

import urllib.request
import urllib.error
import json
import os


def _get_prefs(context):
    return context.preferences.addons[__package__].preferences


def _make_headers(prefs):
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if prefs.api_key:
        headers["X-API-Key"] = prefs.api_key
    return headers


def get_server_url(context):
    prefs = _get_prefs(context)
    return prefs.server_url.rstrip("/")


def check_connection(context):
    """
    Ping /health endpoint.
    Returns (True, data_dict) or (False, error_message).
    """
    prefs = _get_prefs(context)
    url = get_server_url(context) + "/health"
    try:
        req = urllib.request.Request(url, headers=_make_headers(prefs))
        with urllib.request.urlopen(req, timeout=prefs.timeout) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return True, data
    except urllib.error.URLError as e:
        return False, str(e.reason)
    except Exception as e:
        return False, str(e)


def fetch_gst_data(context):
    """
    Fetch live GST summary from /api/blender/gst-data.
    Returns (True, data_dict) or (False, error_message).
    """
    prefs = _get_prefs(context)
    url = get_server_url(context) + "/api/blender/gst-data"
    try:
        req = urllib.request.Request(url, headers=_make_headers(prefs))
        with urllib.request.urlopen(req, timeout=prefs.timeout) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return True, data
    except urllib.error.URLError as e:
        return False, str(e.reason)
    except Exception as e:
        return False, str(e)


def list_exported_assets(context):
    """
    Fetch the list of currently available exported assets from /api/blender/assets.
    Returns (True, list) or (False, error_message).
    """
    prefs = _get_prefs(context)
    url = get_server_url(context) + "/api/blender/assets"
    try:
        req = urllib.request.Request(url, headers=_make_headers(prefs))
        with urllib.request.urlopen(req, timeout=prefs.timeout) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return True, data
    except urllib.error.URLError as e:
        return False, str(e.reason)
    except Exception as e:
        return False, str(e)


def resolve_export_path(context, subfolder, filename):
    """
    Resolve an absolute export path, creating directories as needed.
    Tries scene.taxclam_export_path first; falls back to ~/taxclam_exports/.
    """
    base = context.scene.taxclam_export_path
    if not base or not os.path.isdir(bpy.path.abspath(base)):
        base = os.path.join(os.path.expanduser("~"), "taxclam_exports")

    base = bpy.path.abspath(base) if base.startswith("//") else base
    dest = os.path.join(base, "static", subfolder)
    os.makedirs(dest, exist_ok=True)
    return os.path.join(dest, filename)


# Needed for bpy.path.abspath resolution inside this module
try:
    import bpy
except ImportError:
    bpy = None  # Allow import in unit test contexts
