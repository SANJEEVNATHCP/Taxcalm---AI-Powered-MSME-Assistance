"""
Authentication Middleware
Validates session tokens and protects routes
"""

from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import sqlite3
from datetime import datetime

from app.db_config import get_db_connection

# HTTP Bearer security scheme
security = HTTPBearer(auto_error=False)


class AuthUser:
    """Authenticated user model"""
    def __init__(self, id: int, username: str, email: str, role: str):
        self.id = id
        self.username = username
        self.email = email
        self.role = role
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role
        }
    
    def is_admin(self):
        return self.role == 'Admin'
    
    def is_accountant(self):
        return self.role in ['Admin', 'Accountant']


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> AuthUser:
    """
    Dependency to get the current authenticated user
    Raises HTTPException if not authenticated
    """
    if not credentials:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated. Please login.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = credentials.credentials
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get session and user info
        cursor.execute('''
            SELECT u.id, u.username, u.email, u.role, s.expires_at
            FROM users u
            JOIN sessions s ON u.id = s.user_id
            WHERE s.token = ?
        ''', (token,))
        
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired session. Please login again.",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        user_id, username, email, role, expires_at = row
        
        # Check if session expired
        if datetime.fromisoformat(expires_at) < datetime.now():
            # Clean up expired session
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute('DELETE FROM sessions WHERE token = ?', (token,))
            conn.commit()
            conn.close()
            
            raise HTTPException(
                status_code=401,
                detail="Session expired. Please login again.",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        return AuthUser(id=user_id, username=username, email=email, role=role)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Authentication error: {str(e)}"
        )


async def get_optional_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[AuthUser]:
    """
    Dependency to get the current user if authenticated, None otherwise
    Does not raise an exception if not authenticated
    """
    if not credentials:
        return None
    
    try:
        return await get_current_user(request, credentials)
    except HTTPException:
        return None


async def require_admin(current_user: AuthUser = Depends(get_current_user)) -> AuthUser:
    """
    Dependency to require admin role
    """
    if not current_user.is_admin():
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )
    return current_user


async def require_accountant(current_user: AuthUser = Depends(get_current_user)) -> AuthUser:
    """
    Dependency to require accountant or admin role
    """
    if not current_user.is_accountant():
        raise HTTPException(
            status_code=403,
            detail="Accountant or Admin access required"
        )
    return current_user


def log_audit(user_id: Optional[int], action: str, resource_type: str, 
              ip_address: str, user_agent: str, status: str = 'success',
              resource_id: Optional[int] = None, details: Optional[str] = None):
    """
    Log security-relevant actions to audit log
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO audit_logs 
            (user_id, action, resource_type, resource_id, ip_address, user_agent, timestamp, status, details)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, action, resource_type, resource_id, ip_address, user_agent,
              datetime.now().isoformat(), status, details))
        
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"⚠️ Audit logging failed: {e}")
