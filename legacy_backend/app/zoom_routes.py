"""
Zoom Meeting Scheduler Routes
Flask endpoints for scheduling and managing Zoom meetings
"""

from flask import Blueprint, request, jsonify
from app.zoom_scheduler import get_zoom_scheduler
from app.zoom_db import store_meeting, get_meeting, get_all_meetings, update_meeting_status, delete_meeting

zoom_bp = Blueprint('zoom', __name__, url_prefix='/api/zoom')

@zoom_bp.route('/health', methods=['GET'])
def zoom_health():
    """Check Zoom API connectivity"""
    return jsonify({
        'status': 'ok',
        'service': 'Zoom Meeting Scheduler',
        'version': '1.0'
    }), 200


@zoom_bp.route('/schedule', methods=['POST', 'OPTIONS'])
def schedule_meeting():
    """
    Schedule a Zoom meeting from natural language input
    
    Request body:
    {
        "input": "Schedule a team meeting tomorrow at 3 PM for 1 hour",
        "timezone": "Asia/Kolkata",  # Optional, defaults to Asia/Kolkata
        "host_name": "John Doe"  # Optional
    }
    
    Response:
    {
        "success": true,
        "meeting": {
            "meeting_id": "123456789",
            "join_url": "https://zoom.us/j/123456789",
            "topic": "Team Meeting",
            "start_time": "2026-02-04T15:00:00+05:30",
            "duration": 60,
            "timezone": "Asia/Kolkata"
        },
        "message": "Your Zoom meeting is scheduled!",
        "record_id": 1
    }
    """
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.json
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        user_input = data.get('input', '').strip()
        if not user_input:
            return jsonify({
                'success': False,
                'error': 'Missing "input" field with meeting details'
            }), 400
        
        timezone = data.get('timezone', 'Asia/Kolkata')
        host_name = data.get('host_name', '')
        description = data.get('description', '')
        
        # Get scheduler and create meeting
        scheduler = get_zoom_scheduler()
        result = scheduler.schedule_from_natural_language(user_input, timezone)
        
        if not result.get('success'):
            return jsonify({
                'success': False,
                'error': result.get('error', 'Failed to create meeting')
            }), 400
        
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
        
        return jsonify({
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
        }), 201
        
    except Exception as e:
        print(f"Error in schedule_meeting: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@zoom_bp.route('/meetings', methods=['GET'])
def list_meetings():
    """
    Get all scheduled meetings
    
    Query params:
    - limit: Max number of meetings to return (default: 50)
    
    Response:
    {
        "success": true,
        "count": 5,
        "meetings": [...]
    }
    """
    try:
        limit = request.args.get('limit', 50, type=int)
        user_id = request.args.get('user_id', None, type=int)
        
        meetings = get_all_meetings(user_id=user_id, limit=limit)
        
        return jsonify({
            'success': True,
            'count': len(meetings),
            'meetings': meetings
        }), 200
        
    except Exception as e:
        print(f"Error in list_meetings: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@zoom_bp.route('/meeting/<int:record_id>', methods=['GET'])
def get_meeting_details(record_id):
    """
    Get details of a specific meeting
    
    Response:
    {
        "success": true,
        "meeting": {...}
    }
    """
    try:
        meeting = get_meeting(record_id=record_id)
        
        if not meeting:
            return jsonify({
                'success': False,
                'error': 'Meeting not found'
            }), 404
        
        return jsonify({
            'success': True,
            'meeting': meeting
        }), 200
        
    except Exception as e:
        print(f"Error in get_meeting_details: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@zoom_bp.route('/meeting/<int:record_id>/status', methods=['PUT'])
def update_status(record_id):
    """
    Update meeting status
    
    Request body:
    {
        "status": "Completed"  # or "Cancelled"
    }
    """
    try:
        data = request.json
        status = data.get('status', '').strip()
        
        if not status:
            return jsonify({
                'success': False,
                'error': 'Missing status field'
            }), 400
        
        success = update_meeting_status(record_id, status)
        
        if not success:
            return jsonify({
                'success': False,
                'error': 'Failed to update meeting'
            }), 400
        
        return jsonify({
            'success': True,
            'message': f'Meeting status updated to {status}'
        }), 200
        
    except Exception as e:
        print(f"Error in update_status: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@zoom_bp.route('/meeting/<int:record_id>', methods=['DELETE'])
def remove_meeting(record_id):
    """
    Delete a meeting record
    
    Response:
    {
        "success": true,
        "message": "Meeting deleted"
    }
    """
    try:
        success = delete_meeting(record_id)
        
        if not success:
            return jsonify({
                'success': False,
                'error': 'Failed to delete meeting'
            }), 400
        
        return jsonify({
            'success': True,
            'message': 'Meeting deleted successfully'
        }), 200
        
    except Exception as e:
        print(f"Error in remove_meeting: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@zoom_bp.route('/parse', methods=['POST'])
def parse_input():
    """
    Parse natural language input without creating a meeting
    Useful for testing or previewing meeting details
    
    Request body:
    {
        "input": "Schedule a team meeting tomorrow at 3 PM for 1 hour"
    }
    
    Response:
    {
        "success": true,
        "parsed": {
            "topic": "Team Meeting",
            "start_time": "2026-02-04T15:00:00",
            "duration": 60
        }
    }
    """
    try:
        data = request.json
        user_input = data.get('input', '').strip()
        
        if not user_input:
            return jsonify({
                'success': False,
                'error': 'Missing "input" field'
            }), 400
        
        scheduler = get_zoom_scheduler()
        parsed = scheduler.parse_natural_language(user_input)
        
        return jsonify({
            'success': True,
            'parsed': {
                'topic': parsed['topic'],
                'start_time': parsed['start_time'],
                'duration': parsed['duration']
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
