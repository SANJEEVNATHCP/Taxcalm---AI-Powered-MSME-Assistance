"""
Zoom Server-to-Server OAuth Authentication
Handles token generation and validation
"""

import requests
import base64
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

class ZoomAuth:
    """Zoom OAuth Authentication Handler"""
    
    def __init__(self):
        self.client_id = os.getenv('ZOOM_CLIENT_ID')
        self.client_secret = os.getenv('ZOOM_CLIENT_SECRET')
        self.account_id = os.getenv('ZOOM_ACCOUNT_ID')
        self.oauth_token_url = 'https://zoom.us/oauth/token'
        self.access_token = None
        self.token_expires_at = None
    
    def get_access_token(self):
        """
        Get access token using Server-to-Server OAuth
        Returns: access_token (str) or None if failed
        """
        try:
            # Check if token is still valid
            if self.access_token and self.token_expires_at:
                if datetime.now() < self.token_expires_at:
                    print("Using cached access token")
                    return self.access_token
            
            # Validate required credentials
            if not all([self.client_id, self.client_secret, self.account_id]):
                raise ValueError("Missing Zoom credentials: CLIENT_ID, CLIENT_SECRET, or ACCOUNT_ID not configured")
            
            # Create Basic Auth header
            credentials = f"{self.client_id}:{self.client_secret}"
            encoded_credentials = base64.b64encode(credentials.encode()).decode()
            
            headers = {
                'Authorization': f'Basic {encoded_credentials}',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
            
            body = {
                'grant_type': 'account_credentials',
                'account_id': self.account_id
            }
            
            print("Requesting Zoom access token...")
            response = requests.post(self.oauth_token_url, headers=headers, data=body)
            response.raise_for_status()
            
            token_data = response.json()
            self.access_token = token_data.get('access_token')
            
            # Calculate token expiration (typically 1 hour, save 5 min before expiry)
            expires_in = token_data.get('expires_in', 3600)
            self.token_expires_at = datetime.now() + timedelta(seconds=expires_in - 300)
            
            print(f"✓ Access token obtained. Expires at: {self.token_expires_at}")
            return self.access_token
            
        except requests.exceptions.RequestException as e:
            print(f"✗ Zoom OAuth Error: {e}")
            if hasattr(e.response, 'text'):
                print(f"  Response: {e.response.text}")
            return None
        except Exception as e:
            print(f"✗ Authentication Error: {e}")
            return None
    
    def validate_credentials(self):
        """Validate that all required credentials are configured"""
        missing = []
        if not self.client_id:
            missing.append("ZOOM_CLIENT_ID")
        if not self.client_secret:
            missing.append("ZOOM_CLIENT_SECRET")
        if not self.account_id:
            missing.append("ZOOM_ACCOUNT_ID")
        
        if missing:
            raise ValueError(f"Missing Zoom credentials: {', '.join(missing)}")
        
        return True


# Singleton instance
_zoom_auth = None

def get_zoom_auth():
    """Get or create Zoom auth instance"""
    global _zoom_auth
    if _zoom_auth is None:
        _zoom_auth = ZoomAuth()
    return _zoom_auth
