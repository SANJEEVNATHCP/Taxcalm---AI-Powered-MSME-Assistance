"""
Zoom Meeting Scheduler Service
Handles meeting creation, scheduling, and management
"""

import requests
import re
from datetime import datetime, timedelta
from dateutil import parser as date_parser
import pytz
from app.zoom_auth import get_zoom_auth

class ZoomMeetingScheduler:
    """Zoom Meeting Scheduler Service"""
    
    API_BASE_URL = 'https://api.zoom.us/v2'
    
    def __init__(self):
        self.zoom_auth = get_zoom_auth()
    
    def parse_natural_language(self, user_input):
        """
        Parse natural language input to extract meeting details
        Examples:
        - "Schedule a team meeting tomorrow at 3 PM for 1 hour"
        - "Create standup tomorrow at 10 AM, 30 minutes"
        - "Meeting called 'Project Review' on Friday at 2:30 PM for 2 hours"
        
        Returns: dict with {topic, start_time_str, duration_minutes}
        """
        try:
            user_input = user_input.strip()
            
            # Extract topic (words between "meeting"/"meeting called" and time indicators)
            topic_match = re.search(
                r'(?:meeting|meeting called|schedule|create)\s+(?:a\s+)?["\']*([^"\']*?)["\']*\s+(?:tomorrow|today|next|at|on|for)',
                user_input,
                re.IGNORECASE
            )
            topic = topic_match.group(1).strip() if topic_match else "Meeting"
            
            # Extract time (tomorrow, today, specific date, etc.)
            time_match = re.search(
                r'(?:at|on)\s+(\d{1,2}):?(\d{2})?\s*(am|pm|AM|PM)?',
                user_input
            )
            
            # Extract duration
            duration_match = re.search(
                r'(?:for|duration)\s+(\d+)\s*(?:hour|hr|minute|min)',
                user_input,
                re.IGNORECASE
            )
            
            if not time_match:
                raise ValueError("Could not extract time from input")
            
            hour = int(time_match.group(1))
            minute = int(time_match.group(2)) if time_match.group(2) else 0
            period = time_match.group(3).lower() if time_match.group(3) else None
            
            # Convert 12-hour to 24-hour format
            if period == 'pm' and hour != 12:
                hour += 12
            elif period == 'am' and hour == 12:
                hour = 0
            
            # Determine date
            date_str = user_input.lower()
            if 'tomorrow' in date_str:
                meeting_date = datetime.now().date() + timedelta(days=1)
            elif 'today' in date_str:
                meeting_date = datetime.now().date()
            elif 'next' in date_str:
                # Extract day of week
                days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                for day in days:
                    if day in date_str:
                        target_day = days.index(day)
                        current_day = datetime.now().weekday()
                        days_ahead = target_day - current_day
                        if days_ahead <= 0:
                            days_ahead += 7
                        meeting_date = (datetime.now() + timedelta(days=days_ahead)).date()
                        break
                else:
                    meeting_date = datetime.now().date()
            else:
                meeting_date = datetime.now().date()
            
            # Parse duration
            duration_minutes = 60  # Default 1 hour
            if duration_match:
                duration_val = int(duration_match.group(1))
                if 'hour' in duration_match.group(0).lower():
                    duration_minutes = duration_val * 60
                else:
                    duration_minutes = duration_val
            
            # Combine date and time
            start_time_dt = datetime.combine(meeting_date, 
                                            datetime.strptime(f"{hour}:{minute:02d}", "%H:%M").time())
            
            return {
                'topic': topic,
                'start_time': start_time_dt.isoformat(),
                'duration': duration_minutes,
                'original_input': user_input
            }
            
        except Exception as e:
            print(f"Error parsing input: {e}")
            raise ValueError(f"Could not parse meeting details from input: {str(e)}")
    
    def convert_to_iso8601(self, start_time, timezone='Asia/Kolkata'):
        """
        Convert start_time to ISO 8601 format with timezone
        
        Args:
            start_time: ISO format string or datetime object
            timezone: Timezone string (default: Asia/Kolkata)
        
        Returns: ISO 8601 formatted string with timezone
        """
        try:
            # Parse if string
            if isinstance(start_time, str):
                dt = date_parser.parse(start_time)
            else:
                dt = start_time
            
            # Get timezone
            tz = pytz.timezone(timezone)
            
            # If naive datetime, assume it's in the target timezone
            if dt.tzinfo is None:
                dt = tz.localize(dt)
            else:
                # Convert to target timezone
                dt = dt.astimezone(tz)
            
            # Return ISO 8601 format
            return dt.isoformat()
            
        except Exception as e:
            print(f"Error converting time to ISO8601: {e}")
            raise ValueError(f"Could not convert time to ISO8601: {str(e)}")
    
    def create_scheduled_meeting(self, topic, start_time, duration, 
                                timezone='Asia/Kolkata', description=''):
        """
        Create a scheduled meeting via Zoom API
        
        Args:
            topic: Meeting topic
            start_time: ISO 8601 formatted start time
            duration: Duration in minutes
            timezone: Timezone (default: Asia/Kolkata)
            description: Optional meeting description
        
        Returns: dict with meeting details including join_url
        """
        try:
            # Get access token
            access_token = self.zoom_auth.get_access_token()
            if not access_token:
                raise ValueError("Failed to obtain Zoom access token")
            
            # Prepare headers
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            # Prepare meeting data
            meeting_data = {
                'topic': topic,
                'type': 2,  # Scheduled meeting
                'start_time': start_time,
                'duration': duration,
                'timezone': timezone,
                'agenda': description,
                'settings': {
                    'host_video': True,
                    'participant_video': True,
                    'join_before_host': False,
                    'waiting_room': True,
                    'audio': 'both',
                    'auto_recording': 'none'
                }
            }
            
            # Create meeting
            print(f"Creating Zoom meeting: {topic}")
            print(f"  Start: {start_time} ({timezone})")
            print(f"  Duration: {duration} minutes")
            
            response = requests.post(
                f'{self.API_BASE_URL}/users/me/meetings',
                headers=headers,
                json=meeting_data
            )
            response.raise_for_status()
            
            meeting_info = response.json()
            
            return {
                'success': True,
                'meeting_id': meeting_info.get('id'),
                'join_url': meeting_info.get('join_url'),
                'start_time': meeting_info.get('start_time'),
                'topic': meeting_info.get('topic'),
                'duration': meeting_info.get('duration'),
                'timezone': meeting_info.get('timezone')
            }
            
        except requests.exceptions.RequestException as e:
            print(f"✗ Zoom API Error: {e}")
            if hasattr(e, 'response') and hasattr(e.response, 'text'):
                print(f"  Response: {e.response.text}")
            return {
                'success': False,
                'error': f"Zoom API Error: {str(e)}"
            }
        except Exception as e:
            print(f"✗ Meeting Creation Error: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def schedule_from_natural_language(self, user_input, timezone='Asia/Kolkata'):
        """
        Complete workflow: Parse natural language → Convert time → Create meeting
        
        Args:
            user_input: Natural language meeting request
            timezone: Timezone for the meeting
        
        Returns: dict with meeting details or error
        """
        try:
            print(f"\n📝 Parsing: {user_input}")
            
            # Step 1: Parse natural language
            meeting_details = self.parse_natural_language(user_input)
            print(f"✓ Parsed: topic='{meeting_details['topic']}', duration={meeting_details['duration']}min")
            
            # Step 2: Convert to ISO 8601
            iso_time = self.convert_to_iso8601(meeting_details['start_time'], timezone)
            print(f"✓ Converted time: {iso_time}")
            
            # Step 3: Create meeting
            result = self.create_scheduled_meeting(
                topic=meeting_details['topic'],
                start_time=iso_time,
                duration=meeting_details['duration'],
                timezone=timezone
            )
            
            return result
            
        except Exception as e:
            print(f"✗ Error: {e}")
            return {
                'success': False,
                'error': str(e)
            }


# Singleton instance
_scheduler = None

def get_zoom_scheduler():
    """Get or create Zoom scheduler instance"""
    global _scheduler
    if _scheduler is None:
        _scheduler = ZoomMeetingScheduler()
    return _scheduler
