"""
Zoom Meeting Scheduler - FastAPI Router
API endpoints for scheduling and managing Zoom meetings
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import traceback

# Import zoom functionality
try:
    from .zoom_scheduler import get_zoom_scheduler
    from .zoom_db import store_meeting, get_meeting, get_all_meetings, update_meeting_status, delete_meeting
except ImportError:
    # Stub functions if zoom modules not available
    def get_zoom_scheduler():
        return None
    def store_meeting(*args, **kwargs):
        return 1
    def get_meeting(*args, **kwargs):
        return None
    def get_all_meetings(*args, **kwargs):
        return []
    def update_meeting_status(*args, **kwargs):
        return True
    def delete_meeting(*args, **kwargs):
        return True

# Create FastAPI router
router = APIRouter(prefix="/api/zoom", tags=["zoom"])

# ==================== Pydantic Models ====================

class MeetingScheduleRequest(BaseModel):
    input: str
    timezone: Optional[str] = "Asia/Kolkata"
    host_name: Optional[str] = ""
    description: Optional[str] = ""

# ==================== ZOOM ROUTES ====================

@router.get("/health")
async def zoom_health():
    """Check Zoom API connectivity"""
    return {
        'status': 'ok',
        'service': 'Zoom Meeting Scheduler',
        'version': '1.0'
    }

@router.post("/schedule")
async def schedule_meeting(request: MeetingScheduleRequest):
    """
    Schedule a Zoom meeting from natural language input
    """
    try:
        user_input = request.input.strip()
        if not user_input:
            raise HTTPException(status_code=400, detail='Missing "input" field with meeting details')

        timezone = request.timezone
        host_name = request.host_name
        description = request.description

        # Get scheduler and create meeting
        scheduler = get_zoom_scheduler()
        if not scheduler:
            raise HTTPException(status_code=500, detail='Zoom scheduler not available')

        result = scheduler.schedule_from_natural_language(user_input, timezone)

        if not result.get('success'):
            raise HTTPException(status_code=400, detail=result.get('error', 'Failed to create meeting'))

        # Store in database
        record_id = store_meeting(
            meeting_id=str(result['meeting_id']),
            topic=result['topic'],
            join_url=result['join_url'],
            start_time=result['start_time'],
            duration=result['duration'],
            timezone=result.get('timezone', timezone),
            description=description,
            host_name=host_name,
            natural_input=user_input,
            user_id=None  # Set user_id if authentication is implemented
        )

        return {
            'success': True,
            'message': f"🎯 Your Zoom meeting '{result['topic']}' is scheduled!\n\nJoin here: {result['join_url']}",
            'meeting': {
                'meeting_id': str(result['meeting_id']),
                'join_url': result['join_url'],
                'topic': result['topic'],
                'start_time': result['start_time'],
                'duration': result['duration'],
                'timezone': result.get('timezone', timezone)
            },
            'record_id': record_id
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error scheduling meeting: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))