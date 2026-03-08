"""
Zoom Meetings Database Management
Functions to store and retrieve Zoom meeting details
"""

from app.finance_models import get_db_connection
from datetime import datetime
import json

def store_meeting(meeting_id, topic, join_url, start_time, duration, 
                 timezone='Asia/Kolkata', description='', host_name='', 
                 natural_input='', user_id=None):
    """
    Store scheduled meeting in database
    
    Args:
        meeting_id: Zoom meeting ID
        topic: Meeting topic
        join_url: Join URL from Zoom
        start_time: ISO 8601 start time
        duration: Duration in minutes
        timezone: Meeting timezone
        description: Meeting description/agenda
        host_name: Meeting host name
        natural_input: Original natural language input
        user_id: User ID (optional)
    
    Returns: Meeting record ID or None if failed
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        now = datetime.now().isoformat()
        
        cursor.execute('''
            INSERT INTO zoom_meetings 
            (meeting_id, topic, join_url, start_time, duration, timezone, 
             description, host_name, status, natural_language_input, user_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (meeting_id, topic, join_url, start_time, duration, timezone,
              description, host_name, 'Scheduled', natural_input, user_id, now, now))
        
        conn.commit()
        record_id = cursor.lastrowid
        conn.close()
        
        print(f"✓ Meeting stored in database with ID: {record_id}")
        return record_id
        
    except Exception as e:
        print(f"✗ Error storing meeting: {e}")
        return None


def get_meeting(meeting_id=None, record_id=None):
    """
    Retrieve a meeting by Zoom meeting_id or database record_id
    
    Returns: Meeting dict or None
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if meeting_id:
            cursor.execute('SELECT * FROM zoom_meetings WHERE meeting_id = ?', (meeting_id,))
        elif record_id:
            cursor.execute('SELECT * FROM zoom_meetings WHERE id = ?', (record_id,))
        else:
            return None
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return dict(row)
        return None
        
    except Exception as e:
        print(f"✗ Error retrieving meeting: {e}")
        return None


def get_all_meetings(user_id=None, limit=50):
    """
    Retrieve all meetings, optionally filtered by user
    
    Returns: List of meeting dicts
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if user_id:
            cursor.execute('''
                SELECT * FROM zoom_meetings 
                WHERE user_id = ? 
                ORDER BY start_time DESC 
                LIMIT ?
            ''', (user_id, limit))
        else:
            cursor.execute('''
                SELECT * FROM zoom_meetings 
                ORDER BY start_time DESC 
                LIMIT ?
            ''', (limit,))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
        
    except Exception as e:
        print(f"✗ Error retrieving meetings: {e}")
        return []


def update_meeting_status(record_id, status):
    """
    Update meeting status (Scheduled, Completed, Cancelled, etc.)
    
    Returns: True if successful
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        now = datetime.now().isoformat()
        
        cursor.execute('''
            UPDATE zoom_meetings 
            SET status = ?, updated_at = ?
            WHERE id = ?
        ''', (status, now, record_id))
        
        conn.commit()
        conn.close()
        
        print(f"✓ Meeting status updated to: {status}")
        return True
        
    except Exception as e:
        print(f"✗ Error updating meeting: {e}")
        return False


def delete_meeting(record_id):
    """
    Delete a meeting record
    
    Returns: True if successful
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM zoom_meetings WHERE id = ?', (record_id,))
        
        conn.commit()
        conn.close()
        
        print(f"✓ Meeting deleted")
        return True
        
    except Exception as e:
        print(f"✗ Error deleting meeting: {e}")
        return False
