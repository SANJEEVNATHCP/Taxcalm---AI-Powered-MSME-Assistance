"""
TaxClam Blender API Router
Provides data endpoints consumed by the Blender addon and the Three.js web viewer.
"""

from fastapi import APIRouter
from typing import List, Dict, Any, Optional
import os
import glob

router = APIRouter(prefix="/api/blender", tags=["blender"])

# ── GST Summary ───────────────────────────────────────────────────────────────

@router.get("/gst-data")
async def get_gst_data() -> Dict[str, Any]:
    """
    Return a GST summary for use in Blender charts and the Three.js viewer.
    Pulls real data from the finance DB when available; returns safe defaults otherwise.
    """
    try:
        from .finance_models import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor()

        # Aggregate income/expense totals
        cursor.execute(
            "SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type='Income'"
        )
        total_sales = cursor.fetchone()[0] or 0

        cursor.execute(
            "SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type='Expense'"
        )
        total_purchases = cursor.fetchone()[0] or 0

        # Use 18% as default rate for display
        rate = 0.18
        output_gst = round(total_sales * rate / (1 + rate), 2)
        input_gst = round(total_purchases * rate / (1 + rate), 2)
        net_gst = round(output_gst - input_gst, 2)

        # Monthly history (last 6 months)
        cursor.execute("""
            SELECT
                strftime('%Y-%m', transaction_date) as period,
                SUM(CASE WHEN type='Income' THEN amount ELSE 0 END) as sales,
                SUM(CASE WHEN type='Expense' THEN amount ELSE 0 END) as purchases
            FROM transactions
            GROUP BY period
            ORDER BY period DESC
            LIMIT 6
        """)
        rows = cursor.fetchall()
        conn.close()

        history = []
        for period, sales, purchases in reversed(rows):
            out = round(float(sales or 0) * rate / (1 + rate), 2)
            inp = round(float(purchases or 0) * rate / (1 + rate), 2)
            history.append({
                "period": period,
                "output_gst": out,
                "input_gst": inp,
                "net_gst": round(out - inp, 2)
            })

        return {
            "output_gst": output_gst,
            "input_gst": input_gst,
            "net_gst": net_gst,
            "total_sales": total_sales,
            "total_purchases": total_purchases,
            "gst_rate": 18,
            "history": history,
            "donut_segments": [
                {"label": "Output GST", "value": output_gst, "color": "#FFD700"},
                {"label": "Input GST",  "value": input_gst,  "color": "#10B981"},
                {"label": "Net GST",    "value": abs(net_gst), "color": "#3B82F6"},
            ]
        }

    except Exception:
        # Return safe demo data so the Blender addon always has something to render
        return {
            "output_gst": 18000,
            "input_gst": 12000,
            "net_gst": 6000,
            "total_sales": 100000,
            "total_purchases": 66666,
            "gst_rate": 18,
            "history": [
                {"period": "2025-10", "output_gst": 14000, "input_gst": 9000,  "net_gst": 5000},
                {"period": "2025-11", "output_gst": 16000, "input_gst": 10000, "net_gst": 6000},
                {"period": "2025-12", "output_gst": 15000, "input_gst": 11000, "net_gst": 4000},
                {"period": "2026-01", "output_gst": 18000, "input_gst": 12000, "net_gst": 6000},
                {"period": "2026-02", "output_gst": 20000, "input_gst": 13000, "net_gst": 7000},
                {"period": "2026-03", "output_gst": 18000, "input_gst": 12000, "net_gst": 6000},
            ],
            "donut_segments": [
                {"label": "Output GST", "value": 18000, "color": "#FFD700"},
                {"label": "Input GST",  "value": 12000, "color": "#10B981"},
                {"label": "Net GST",    "value": 6000,  "color": "#3B82F6"},
            ]
        }


# ── Available Exported Assets ─────────────────────────────────────────────────

@router.get("/assets")
async def list_assets() -> Dict[str, List[str]]:
    """
    Return paths of all Blender-exported assets available in the static folder.
    Used by the Three.js viewer to discover loadable models.
    """
    base = "static"
    models = _glob_relative(os.path.join(base, "models"), "*.glb")
    images = _glob_relative(os.path.join(base, "images", "blender"), "*.png")
    images += _glob_relative(os.path.join(base, "images", "blender"), "*.jpg")
    animations = _glob_relative(os.path.join(base, "animations"), "*.mp4")
    svgs = _glob_relative(os.path.join(base, "images", "blender"), "*.svg")

    return {
        "models": models,
        "images": images,
        "animations": animations,
        "svgs": svgs,
    }


def _glob_relative(directory: str, pattern: str) -> List[str]:
    if not os.path.isdir(directory):
        return []
    matches = glob.glob(os.path.join(directory, pattern))
    # Return web-relative paths (forward slashes)
    return [p.replace("\\", "/") for p in matches]
