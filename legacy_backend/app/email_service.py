"""
Simple Email Service using SMTP
Sends emails without requiring Google OAuth
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

class EmailService:
    """Simple SMTP email service"""
    
    def __init__(self):
        self.smtp_email = os.getenv('SMTP_EMAIL', 'alertmessage06@gmail.com')
        self.smtp_password = os.getenv('SMTP_PASSWORD')
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
    
    def send_email(self, to_email, subject, body_html):
        """
        Send email via SMTP
        
        Args:
            to_email: Recipient email address (string or list)
            subject: Email subject
            body_html: HTML body of email
        
        Returns:
            bool: True if sent successfully
        """
        if not self.smtp_password:
            print("⚠️ SMTP password not configured in .env file")
            return False
        
        try:
            # Create message
            message = MIMEMultipart('alternative')
            message['From'] = f"TAXCLAM Meetings <{self.smtp_email}>"
            
            # Handle multiple recipients
            if isinstance(to_email, list):
                message['To'] = ', '.join(to_email)
                recipients = to_email
            else:
                message['To'] = to_email
                recipients = [to_email]
            
            message['Subject'] = subject
            
            # Add HTML body
            html_part = MIMEText(body_html, 'html')
            message.attach(html_part)
            
            # Connect to SMTP server and send
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()  # Secure connection
                server.login(self.smtp_email, self.smtp_password)
                server.sendmail(self.smtp_email, recipients, message.as_string())
            
            print(f"✅ Email sent successfully to: {', '.join(recipients)}")
            return True
            
        except Exception as e:
            print(f"❌ Error sending email via SMTP: {e}")
            return False
    
    def send_meeting_invite(self, organizer_email, organizer_name, attendees_emails, 
                           meeting_title, meeting_date, meeting_time, meet_link="", agenda=""):
        """
        Send meeting invitation emails
        
        Args:
            organizer_email: Organizer's email
            organizer_name: Organizer's name
            attendees_emails: List of attendee emails
            meeting_title: Meeting title
            meeting_date: Meeting date (YYYY-MM-DD)
            meeting_time: Meeting time (HH:MM)
            meet_link: Meeting link (optional)
            agenda: Meeting agenda (optional)
        
        Returns:
            dict: Result with success status and details
        """
        if not self.smtp_password:
            return {"success": False, "error": "SMTP not configured"}
        
        # Create email HTML
        email_html = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }}
        .detail {{ margin: 10px 0; padding: 8px; background: white; border-left: 4px solid #667eea; }}
        .button {{ display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }}
        .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>📅 Meeting Invitation</h2>
        </div>
        <div class="content">
            <p>Dear Participant,</p>
            <p>You have been invited to attend the following meeting:</p>
            
            <div class="detail">
                <strong>📋 Meeting Title:</strong> {meeting_title}
            </div>
            <div class="detail">
                <strong>📅 Date:</strong> {meeting_date}
            </div>
            <div class="detail">
                <strong>🕐 Time:</strong> {meeting_time}
            </div>
            <div class="detail">
                <strong>👤 Organizer:</strong> {organizer_name} ({organizer_email})
            </div>
            {f'<div class="detail"><strong>📝 Agenda:</strong> {agenda}</div>' if agenda else ''}
            {f'<div class="detail"><strong>🔗 Join Link:</strong> <a href="{meet_link}">{meet_link}</a></div>' if meet_link and meet_link != "TBD - Will be created" else ''}
            
            <p style="margin-top: 20px;">Please mark your calendar and join on time.</p>
            
            <p>Best regards,<br><strong>TAXCLAM Meeting System</strong></p>
        </div>
        <div class="footer">
            <p>This is an automated email from TAXCLAM. Please do not reply.</p>
        </div>
    </div>
</body>
</html>
"""
        
        results = {"success": True, "sent": [], "failed": []}
        
        # Send to organizer
        if organizer_email:
            if self.send_email(organizer_email, f"Meeting Scheduled: {meeting_title}", email_html):
                results["sent"].append(organizer_email)
            else:
                results["failed"].append(organizer_email)
        
        # Send to attendees
        for attendee_email in attendees_emails:
            if attendee_email and attendee_email != organizer_email:
                if self.send_email(attendee_email, f"Meeting Invitation: {meeting_title}", email_html):
                    results["sent"].append(attendee_email)
                else:
                    results["failed"].append(attendee_email)
        
        if results["failed"]:
            results["success"] = False
            results["error"] = f"Failed to send to: {', '.join(results['failed'])}"
        
        return results
    
    def send_password_reset_email(self, to_email, username, reset_link):
        """
        Send password reset email
        
        Args:
            to_email: Recipient email
            username: User's username
            reset_link: Password reset link
        
        Returns:
            bool: True if sent successfully
        """
        email_html = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }}
        .button {{ display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }}
        .warning {{ background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 15px 0; }}
        .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>🔐 Password Reset Request</h2>
        </div>
        <div class="content">
            <p>Hi <strong>{username}</strong>,</p>
            <p>We received a request to reset your password for your TAXCLAM account.</p>
            
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center;">
                <a href="{reset_link}" class="button">Reset Password</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: white; padding: 10px; border-radius: 4px;"><a href="{reset_link}">{reset_link}</a></p>
            
            <div class="warning">
                <strong>⚠️ Important:</strong> This link will expire in 1 hour and can only be used once.
            </div>
            
            <p><strong>Didn't request this?</strong> You can safely ignore this email. Your password will not be changed.</p>
            
            <p>Best regards,<br><strong>TAXCLAM Security Team</strong></p>
        </div>
        <div class="footer">
            <p>This is an automated security email from TAXCLAM. Please do not reply.</p>
            <p>If you didn't request a password reset, please contact support immediately.</p>
        </div>
    </div>
</body>
</html>
"""
        return self.send_email(to_email, "Password Reset Request - TAXCLAM", email_html)


# Global instance
_email_service = None

def get_email_service():
    """Get email service singleton"""
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service

def send_password_reset_email(to_email, username, reset_link):
    """Convenience function to send password reset email"""
    service = get_email_service()
    return service.send_password_reset_email(to_email, username, reset_link)
