"""
Authentication & Authorization Module
Handles user registration, login, logout, 2FA, and session management
"""

from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel, EmailStr, validator
from typing import Optional
import bcrypt
import secrets
import sqlite3
from datetime import datetime, timedelta
import re
import os

from app.db_config import get_db_connection
from app.twofa import create_2fa_code, verify_2fa_code

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# ==================== REQUEST/RESPONSE MODELS ====================

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    confirm_password: str
    
    @validator('username')
    def validate_username(cls, v):
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters')
        if len(v) > 50:
            raise ValueError('Username must be less than 50 characters')
        if not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError('Username can only contain letters, numbers, hyphens, and underscores')
        return v
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one number')
        return v
    
    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Verify2FARequest(BaseModel):
    email: EmailStr
    otp_code: str


class LogoutRequest(BaseModel):
    token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    confirm_password: str
    
    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Passwords do not match')
        return v


class AuthResponse(BaseModel):
    success: bool
    message: str
    token: Optional[str] = None
    user: Optional[dict] = None
    requires_2fa: Optional[bool] = False


# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


def generate_session_token() -> str:
    """Generate a secure random session token"""
    return secrets.token_urlsafe(32)


def generate_reset_token() -> str:
    """Generate a secure random password reset token"""
    return secrets.token_urlsafe(48)


def create_session(user_id: int, ip_address: str, user_agent: str) -> str:
    """Create a new session for a user"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    token = generate_session_token()
    expiry_hours = int(os.getenv('SESSION_EXPIRY_HOURS', '24'))
    expires_at = datetime.now() + timedelta(hours=expiry_hours)
    
    cursor.execute('''
        INSERT INTO sessions (user_id, token, ip_address, user_agent, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (user_id, token, ip_address, user_agent, expires_at.isoformat(), datetime.now().isoformat()))
    
    conn.commit()
    conn.close()
    
    return token


def invalidate_session(token: str):
    """Invalidate a session (logout)"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM sessions WHERE token = ?', (token,))
    
    conn.commit()
    conn.close()


def get_user_by_session(token: str) -> Optional[dict]:
    """Get user information from session token"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT u.id, u.username, u.email, u.role, s.expires_at
        FROM users u
        JOIN sessions s ON u.id = s.user_id
        WHERE s.token = ?
    ''', (token,))
    
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        return None
    
    # Check if session expired
    expires_at = datetime.fromisoformat(row[4])
    if expires_at < datetime.now():
        invalidate_session(token)
        return None
    
    return {
        'id': row[0],
        'username': row[1],
        'email': row[2],
        'role': row[3]
    }


# ==================== ROUTES ====================

@router.post("/register", response_model=AuthResponse)
async def register(request: RegisterRequest):
    """Register a new user account"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if username already exists
        cursor.execute('SELECT id FROM users WHERE username = ?', (request.username,))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail="Username already taken")
        
        # Check if email already exists
        cursor.execute('SELECT id FROM users WHERE email = ?', (request.email,))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Hash password
        password_hash = hash_password(request.password)
        
        # Create user
        now = datetime.now().isoformat()
        cursor.execute('''
            INSERT INTO users (username, email, password_hash, role, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (request.username, request.email, password_hash, 'User', now, now))
        
        user_id = cursor.lastrowid
        
        conn.commit()
        conn.close()
        
        return AuthResponse(
            success=True,
            message="Account created successfully! Please login.",
            user={'id': user_id, 'username': request.username, 'email': request.email}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@router.post("/login", response_model=AuthResponse)
async def login(request: Request, login_request: LoginRequest):
    """Authenticate user and create session"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get user by email
        cursor.execute('SELECT id, username, email, password_hash, role FROM users WHERE email = ?',
                      (login_request.email,))
        user = cursor.fetchone()
        
        if not user:
            conn.close()
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        user_id, username, email, password_hash, role = user
        
        # Verify password
        if not verify_password(login_request.password, password_hash):
            conn.close()
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Check if 2FA is enabled (from environment variable)
        twofa_enabled = os.getenv('ENABLE_2FA', 'true').lower() == 'true'
        
        if twofa_enabled:
            # Send OTP code
            success, otp_code, message = create_2fa_code(user_id, email, username)
            
            if not success:
                conn.close()
                raise HTTPException(status_code=500, detail=f"Failed to send verification code: {message}")
            
            conn.close()
            
            return AuthResponse(
                success=True,
                message="Verification code sent to your email",
                requires_2fa=True,
                user={'id': user_id, 'username': username, 'email': email, 'role': role}
            )
        
        # 2FA disabled - create session directly
        # Get client info
        ip_address = request.client.host if request.client else 'unknown'
        user_agent = request.headers.get('user-agent', 'unknown')
        
        # Create session
        token = create_session(user_id, ip_address, user_agent)
        
        # Log successful login in audit log
        cursor.execute('''
            INSERT INTO audit_logs (user_id, action, resource_type, ip_address, user_agent, timestamp, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, 'login', 'session', ip_address, user_agent, datetime.now().isoformat(), 'success'))
        
        conn.commit()
        conn.close()
        
        return AuthResponse(
            success=True,
            message="Login successful",
            token=token,
            user={'id': user_id, 'username': username, 'email': email, 'role': role}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")


@router.post("/verify-2fa", response_model=AuthResponse)
async def verify_2fa(request: Request, verify_request: Verify2FARequest):
    """Verify 2FA code and create session"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get user by email
        cursor.execute('SELECT id, username, email, role FROM users WHERE email = ?',
                      (verify_request.email,))
        user = cursor.fetchone()
        
        if not user:
            conn.close()
            raise HTTPException(status_code=401, detail="User not found")
        
        user_id, username, email, role = user
        
        # Verify OTP code
        success, message = verify_2fa_code(user_id, verify_request.otp_code)
        
        if not success:
            conn.close()
            raise HTTPException(status_code=401, detail=message)
        
        # Get client info
        ip_address = request.client.host if request.client else 'unknown'
        user_agent = request.headers.get('user-agent', 'unknown')
        
        # Create session
        token = create_session(user_id, ip_address, user_agent)
        
        # Log successful 2FA verification in audit log
        cursor.execute('''
            INSERT INTO audit_logs (user_id, action, resource_type, ip_address, user_agent, timestamp, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, '2fa_verify', 'session', ip_address, user_agent, datetime.now().isoformat(), 'success'))
        
        conn.commit()
        conn.close()
        
        return AuthResponse(
            success=True,
            message="2FA verification successful",
            token=token,
            user={'id': user_id, 'username': username, 'email': email, 'role': role}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"2FA verification failed: {str(e)}")


@router.post("/logout", response_model=AuthResponse)
async def logout(request: LogoutRequest):
    """Logout user and invalidate session"""
    try:
        invalidate_session(request.token)
        
        return AuthResponse(
            success=True,
            message="Logged out successfully"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Logout failed: {str(e)}")


@router.get("/me")
async def get_current_user(request: Request):
    """Get current authenticated user information"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        token = auth_header.replace('Bearer ', '')
        user = get_user_by_session(token)
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired session")
        
        return {
            'success': True,
            'user': user
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user: {str(e)}")


@router.post("/forgot-password", response_model=AuthResponse)
async def forgot_password(request: ForgotPasswordRequest):
    """Request password reset - sends reset token via email"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute('SELECT id, username FROM users WHERE email = ?', (request.email,))
        user = cursor.fetchone()
        
        if not user:
            # Don't reveal if email exists or not (security best practice)
            conn.close()
            return AuthResponse(
                success=True,
                message="If that email is registered, a password reset link has been sent"
            )
        
        user_id, username = user
        
        # Generate reset token
        reset_token = generate_reset_token()
        expires_at = datetime.now() + timedelta(hours=1)  # Token valid for 1 hour
        
        # Store reset token
        cursor.execute('''
            INSERT INTO password_resets (user_id, token, expires_at, created_at)
            VALUES (?, ?, ?, ?)
        ''', (user_id, reset_token, expires_at.isoformat(), datetime.now().isoformat()))
        
        conn.commit()
        conn.close()
        
        # TODO: Send email with reset link
        # reset_link = f"http://localhost:8000/reset-password.html?token={reset_token}"
        # send_email(request.email, "Password Reset", f"Click here to reset: {reset_link}")
        
        return AuthResponse(
            success=True,
            message="If that email is registered, a password reset link has been sent"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Password reset request failed: {str(e)}")


@router.post("/reset-password", response_model=AuthResponse)
async def reset_password(request: ResetPasswordRequest):
    """Reset password using reset token"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify reset token
        cursor.execute('''
            SELECT user_id, expires_at FROM password_resets
            WHERE token = ? AND used = 0
        ''', (request.token,))
        
        reset_record = cursor.fetchone()
        
        if not reset_record:
            conn.close()
            raise HTTPException(status_code=400, detail="Invalid or expired reset token")
        
        user_id, expires_at = reset_record
        
        # Check if token expired
        if datetime.fromisoformat(expires_at) < datetime.now():
            conn.close()
            raise HTTPException(status_code=400, detail="Reset token has expired")
        
        # Hash new password
        password_hash = hash_password(request.new_password)
        
        # Update password
        cursor.execute('''
            UPDATE users
            SET password_hash = ?, updated_at = ?
            WHERE id = ?
        ''', (password_hash, datetime.now().isoformat(), user_id))
        
        # Mark reset token as used
        cursor.execute('''
            UPDATE password_resets
            SET used = 1
            WHERE token = ?
        ''', (request.token,))
        
        # Invalidate all existing sessions for this user
        cursor.execute('DELETE FROM sessions WHERE user_id = ?', (user_id,))
        
        conn.commit()
        conn.close()
        
        return AuthResponse(
            success=True,
            message="Password reset successfully. Please login with your new password."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Password reset failed: {str(e)}")
