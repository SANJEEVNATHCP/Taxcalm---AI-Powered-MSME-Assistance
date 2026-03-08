"""
Google Meet & Gmail Integration
Creates Google Meet links and sends emails using Client ID and Client Secret
"""

import os
import pickle
import smtplib
from datetime import datetime, timedelta
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

# Scopes required (only Calendar for Meet links)
SCOPES = [
    'https://www.googleapis.com/auth/calendar'
]

class GoogleMeetIntegration:
    """Handle Google Meet creation and Gmail sending using Client ID/Secret"""
    
    def __init__(self):
        self.client_id = os.getenv('GOOGLE_CLIENT_ID')
        self.client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
        self.redirect_uri = os.getenv('GOOGLE_REDIRECT_URI', 'http://localhost:8000/oauth2callback')
        
        # SMTP configuration for email sending
        self.smtp_email = os.getenv('SMTP_EMAIL', 'alertmessage06@gmail.com')
        self.smtp_password = os.getenv('SMTP_PASSWORD')
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        
        self.creds = None
        self.calendar_service = None
        
        # Check if credentials are configured
        if not self.client_id or not self.client_secret:
            print("⚠️ Google credentials not configured in .env")
            return
        
        self.authenticate()
    
    def authenticate(self):
        """Authenticate with Google APIs using Client ID and Secret"""
        # Token file stores user's access and refresh tokens
        if os.path.exists('token.pickle'):
            with open('token.pickle', 'rb') as token:
                self.creds = pickle.load(token)
        
        # If no valid credentials, initiate OAuth flow
        if not self.creds or not self.creds.valid:
            if self.creds and self.creds.expired and self.creds.refresh_token:
                try:
                    self.creds.refresh(Request())
                except Exception as e:
                    print(f"⚠️ Token refresh failed: {e}")
                    self.creds = None
            
            if not self.creds:
                # Create OAuth flow using client ID and secret
                client_config = {
                    "web": {
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "redirect_uris": [self.redirect_uri],
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token"
                    }
                }
                
                flow = Flow.from_client_config(
                    client_config,
                    scopes=SCOPES,
                    redirect_uri=self.redirect_uri
                )
                
                # Get authorization URL
                auth_url, _ = flow.authorization_url(
                    access_type='offline',
                    include_granted_scopes='true',
                    prompt='consent'
                )
                
                print("\n" + "="*70)
                print("🔐 GOOGLE AUTHENTICATION REQUIRED")
                print("="*70)
                print(f"\n1. Open this URL in your browser:\n\n{auth_url}\n")
                print("2. Login with your Gmail account")
                print("3. Grant permissions")
                print("4. Copy the authorization code from the redirect URL")
                print("\nPaste the authorization code here:")
                
                auth_code = input("Authorization code: ").strip()
                
                # Exchange code for credentials
                try:
                    flow.fetch_token(code=auth_code)
                    self.creds = flow.credentials
                    
                    # Save credentials for next run
                    with open('token.pickle', 'wb') as token:
                        pickle.dump(self.creds, token)
                    
                    print("✅ Authentication successful!")
                except Exception as e:
                    print(f"❌ Authentication failed: {e}")
                    return False
        
        # Build services
        try:
            # Only Calendar service needed (SMTP handles emails)
            self.calendar_service = build('calendar', 'v3', credentials=self.creds)
            print("✅ Google Calendar authenticated successfully")
            return True
        except Exception as e:
            print(f"❌ Failed to build Google services: {e}")
            return False
    
    def create_google_meet(self, title, start_time, duration, attendees_emails, description=""):
        """
        Create a Google Calendar event with Google Meet link
        
        Args:
            title: Meeting title
            start_time: Start datetime (datetime object)
            duration: Duration in minutes
            attendees_emails: List of email addresses
            description: Meeting description
        
        Returns:
            dict with meet_link and event_id
        """
        if not self.calendar_service:
            return {'success': False, 'error': 'Google Calendar service not initialized'}
        
        try:
            # Calculate end time
            end_time = start_time + timedelta(minutes=duration)
            
            # Prepare attendees
            attendees = [{'email': email.strip()} for email in attendees_emails if email.strip()]
            
            # Create event
            event = {
                'summary': title,
                'description': description,
                'start': {
                    'dateTime': start_time.isoformat(),
                    'timeZone': 'Asia/Kolkata',
                },
                'end': {
                    'dateTime': end_time.isoformat(),
                    'timeZone': 'Asia/Kolkata',
                },
                'attendees': attendees,
                'conferenceData': {
                    'createRequest': {
                        'requestId': f"meet-{int(datetime.now().timestamp())}",
                        'conferenceSolutionKey': {'type': 'hangoutsMeet'}
                    }
                },
                'reminders': {
                    'useDefault': False,
                    'overrides': [
                        {'method': 'email', 'minutes': 30},
                        {'method': 'popup', 'minutes': 10},
                    ],
                },
            }
            
            # Insert event
            event = self.calendar_service.events().insert(
                calendarId='primary',
                body=event,
                conferenceDataVersion=1,
                sendUpdates='all'  # Sends calendar invites to attendees
            ).execute()
            
            # Extract Google Meet link
            meet_link = event.get('hangoutLink', '')
            event_id = event.get('id', '')
            
            print(f"✅ Google Meet created: {meet_link}")
            
            return {
                'success': True,
                'meet_link': meet_link,
                'event_id': event_id,
                'calendar_link': event.get('htmlLink', '')
            }
            
        except HttpError as error:
            print(f"❌ Google Calendar API error: {error}")
            return {'success': False, 'error': str(error)}
        except Exception as e:
            print(f"❌ Error creating Google Meet: {e}")
            return {'success': False, 'error': str(e)}
    
    def send_email(self, to_email, subject, body_html):
        """
        Send email via SMTP (Gmail)
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            body_html: HTML body of email
        
        Returns:
            bool: True if sent successfully
        """
        if not self.smtp_password:
            print("⚠️ SMTP password not configured")
            return False
        
        try:
            # Create message
            message = MIMEMultipart('alternative')
            message['From'] = f"CAA Meetings <{self.smtp_email}>"
            message['To'] = to_email
            message['Subject'] = subject
            
            # Add HTML body
            html_part = MIMEText(body_html, 'html')
            message.attach(html_part)
            
            # Connect to SMTP server and send
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()  # Secure connection
                server.login(self.smtp_email, self.smtp_password)
                server.send_message(message)
            
            print(f"✅ Email sent to: {to_email} (via SMTP)")
            return True
            
        except Exception as e:
            print(f"❌ Error sending email via SMTP: {e}")
            return False
    
    def send_meeting_invite(self, organizer_email, organizer_name, attendees_emails, 
                           meeting_title, meeting_date, meeting_time, meet_link, agenda=""):
        """
        Send meeting invitation emails to organizer and attendees
        """
        # Create email HTML template
        email_html = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .meeting-details {{ background: white; padding: 20px; border-left: 4px solid #667eea; 
                                   margin: 20px 0; border-radius: 5px; }}
                .button {{ display: inline-block; background: #667eea; color: white; padding: 15px 30px; 
                          text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }}
                .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📋 CAA Meeting Invitation</h1>
                </div>
                <div class="content">
                    <h2>You're invited to a meeting!</h2>
                    
                    <div class="meeting-details">
                        <h3>📅 {meeting_title}</h3>
                        <p><strong>Organized by:</strong> {organizer_name}</p>
                        <p><strong>Date:</strong> {meeting_date}</p>
                        <p><strong>Time:</strong> {meeting_time}</p>
                        {f'<p><strong>Agenda:</strong><br>{agenda}</p>' if agenda else ''}
                    </div>
                    
                    <p style="text-align: center;">
                        <a href="{meet_link}" class="button">🔗 Join Google Meet</a>
                    </p>
                    
                    <p><strong>Meeting Instructions:</strong></p>
                    <ul>
                        <li>Click the "Join Google Meet" button above at the scheduled time</li>
                        <li>You will also receive a Google Calendar invite</li>
                        <li>Please join on time and be prepared</li>
                        <li>Ensure your camera and microphone are working</li>
                    </ul>
                    
                    <div class="footer">
                        <p>GST Stress-Reducer - CAA Meetings System</p>
                        <p>This is an automated message. Please do not reply to this email.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        results = {'organizer': False, 'attendees': []}
        
        # ✅ ALWAYS send to organizer (user who created the meeting)
        print(f"\n📧 Sending meeting invite to ORGANIZER: {organizer_email}")
        organizer_sent = self.send_email(
            organizer_email,
            f"✅ CAA Meeting Created: {meeting_title}",
            email_html
        )
        results['organizer'] = organizer_sent
        
        if organizer_sent:
            print(f"✅ Organizer email sent successfully to {organizer_email}")
        else:
            print(f"❌ Failed to send email to organizer {organizer_email}")
        
        # ✅ Send to all attendees (excluding organizer to avoid duplicate)
        if attendees_emails:
            print(f"\n📧 Sending meeting invites to {len(attendees_emails)} attendee(s)")
            for email in attendees_emails:
                email_clean = email.strip()
                if email_clean and email_clean.lower() != organizer_email.lower():
                    print(f"  → Sending to attendee: {email_clean}")
                    sent = self.send_email(
                        email_clean,
                        f"📋 CAA Meeting Invitation: {meeting_title}",
                        email_html
                    )
                    results['attendees'].append({'email': email_clean, 'sent': sent})
                    
                    if sent:
                        print(f"  ✅ Sent successfully to {email_clean}")
                    else:
                        print(f"  ❌ Failed to send to {email_clean}")
                elif email_clean.lower() == organizer_email.lower():
                    print(f"  ⏭️ Skipping {email_clean} (already sent as organizer)")
        
        print(f"\n📧 Email Summary: Organizer: {'✅' if organizer_sent else '❌'}, Attendees: {len([a for a in results['attendees'] if a['sent']])}/{len(results['attendees'])}\n")
        
        return results


# Singleton instance
_google_meet = None

def get_google_meet():
    """Get or create Google Meet integration instance"""
    global _google_meet
    if _google_meet is None:
        _google_meet = GoogleMeetIntegration()
    return _google_meet
