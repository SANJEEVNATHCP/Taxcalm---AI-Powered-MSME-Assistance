"""
Two-Factor Authentication (2FA) Module
Email-based OTP verification for enhanced security
"""

from typing import Optional, Tuple
import secrets
import string
from datetime import datetime, timedelta
import bcrypt
from app.db_config import get_db_connection
from app.email_service import get_email_service


def generate_otp_code(length: int = 6) -> str:
    """
    Generate a random OTP code
    
    Args:
        length: Length of OTP code (default: 6 digits)
    
    Returns:
        Random numeric OTP code
    """
    digits = string.digits
    return ''.join(secrets.choice(digits) for _ in range(length))


def hash_otp(otp_code: str) -> str:
    """Hash OTP code using bcrypt"""
    salt = bcrypt.gensalt(rounds=10)  # Faster than password hashing (10 vs 12 rounds)
    return bcrypt.hashpw(otp_code.encode('utf-8'), salt).decode('utf-8')


def verify_otp_hash(otp_code: str, hashed: str) -> bool:
    """Verify OTP code against its hash"""
    return bcrypt.checkpw(otp_code.encode('utf-8'), hashed.encode('utf-8'))


def send_otp_email(email: str, otp_code: str, username: str = "") -> bool:
    """
    Send OTP code via email
    
    Args:
        email: Recipient email address
        otp_code: 6-digit OTP code
        username: User's name for personalization
    
    Returns:
        True if email sent successfully
    """
    subject = "🔐 TaxCalm Login Verification Code"
    
    body = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
            .otp-box {{ background: white; border: 2px dashed #667eea; padding: 20px; 
                       text-align: center; font-size: 32px; font-weight: bold; 
                       letter-spacing: 8px; color: #667eea; margin: 20px 0; border-radius: 8px; }}
            .warning {{ color: #e74c3c; font-size: 14px; margin-top: 20px; }}
            .footer {{ text-align: center; color: #999; font-size: 12px; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Security Verification</h1>
            </div>
            <div class="content">
                <p>Hello {username or 'User'},</p>
                <p>You requested to log in to your TaxCalm account. Please use the verification code below:</p>
                
                <div class="otp-box">
                    {otp_code}
                </div>
                
                <p><strong>This code will expire in 10 minutes.</strong></p>
                
                <p>If you didn't request this code, please ignore this email or contact support if you're concerned about your account security.</p>
                
                <div class="warning">
                    ⚠️ Never share this code with anyone. TaxCalm will never ask for your verification code.
                </div>
            </div>
            <div class="footer">
                <p>© 2026 TaxCalm - Secure MSME Tax & Compliance Platform</p>
                <p>This is an automated message, please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    try:
        email_service = get_email_service()
        success = email_service.send_email(
            to_email=email,
            subject=subject,
            body_html=body
        )
        return success
    except Exception as e:
        print(f"❌ Failed to send OTP email: {e}")
        return False


def create_2fa_code(user_id: int, email: str, username: str = "") -> Tuple[bool, str, str]:
    """
    Generate and store 2FA code for user
    
    Args:
        user_id: User's database ID
        email: User's email address
        username: User's name for email personalization
    
    Returns:
        Tuple of (success: bool, otp_code: str, message: str)
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Invalidate any existing codes for this user
        cursor.execute('''
            DELETE FROM twofa_codes 
            WHERE user_id = ? AND verified = 0
        ''', (user_id,))
        
        # Generate new OTP code
        otp_code = generate_otp_code(6)
        code_hash = hash_otp(otp_code)
        
        # Calculate expiry (10 minutes from now)
        expires_at = datetime.now() + timedelta(minutes=10)
        
        # Store hashed code
        cursor.execute('''
            INSERT INTO twofa_codes (user_id, code_hash, created_at, expires_at, verified)
            VALUES (?, ?, ?, ?, 0)
        ''', (user_id, code_hash, datetime.now().isoformat(), expires_at.isoformat()))
        
        conn.commit()
        conn.close()
        
        # Send OTP via email
        email_sent = send_otp_email(email, otp_code, username)
        
        if not email_sent:
            return False, "", "Failed to send verification code email"
        
        print(f"✅ 2FA code sent to {email}: {otp_code}")  # Remove in production
        
        return True, otp_code, "Verification code sent to your email"
        
    except Exception as e:
        print(f"❌ Error creating 2FA code: {e}")
        return False, "", f"Error: {str(e)}"


def verify_2fa_code(user_id: int, otp_code: str) -> Tuple[bool, str]:
    """
    Verify 2FA code for user
    
    Args:
        user_id: User's database ID
        otp_code: 6-digit OTP code entered by user
    
    Returns:
        Tuple of (success: bool, message: str)
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get the most recent unverified code for this user
        cursor.execute('''
            SELECT id, code_hash, expires_at 
            FROM twofa_codes 
            WHERE user_id = ? AND verified = 0
            ORDER BY created_at DESC 
            LIMIT 1
        ''', (user_id,))
        
        row = cursor.fetchone()
        
        if not row:
            conn.close()
            return False, "No verification code found. Please request a new one."
        
        code_id, code_hash, expires_at = row
        
        # Check if code expired
        if datetime.fromisoformat(expires_at) < datetime.now():
            # Delete expired code
            cursor.execute('DELETE FROM twofa_codes WHERE id = ?', (code_id,))
            conn.commit()
            conn.close()
            return False, "Verification code has expired. Please request a new one."
        
        # Verify OTP code
        if not verify_otp_hash(otp_code, code_hash):
            conn.close()
            return False, "Invalid verification code. Please try again."
        
        # Mark code as verified
        cursor.execute('''
            UPDATE twofa_codes 
            SET verified = 1 
            WHERE id = ?
        ''', (code_id,))
        
        # Delete other unverified codes for this user
        cursor.execute('''
            DELETE FROM twofa_codes 
            WHERE user_id = ? AND id != ? AND verified = 0
        ''', (user_id, code_id))
        
        conn.commit()
        conn.close()
        
        return True, "Verification successful"
        
    except Exception as e:
        print(f"❌ Error verifying 2FA code: {e}")
        return False, f"Verification error: {str(e)}"


def cleanup_expired_codes():
    """Remove expired 2FA codes from database"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            DELETE FROM twofa_codes 
            WHERE expires_at < ? AND verified = 0
        ''', (datetime.now().isoformat(),))
        
        deleted_count = cursor.rowcount
        conn.commit()
        conn.close()
        
        if deleted_count > 0:
            print(f"🧹 Cleaned up {deleted_count} expired 2FA codes")
        
        return deleted_count
        
    except Exception as e:
        print(f"❌ Error cleaning up 2FA codes: {e}")
        return 0


if __name__ == "__main__":
    print("\n🔐 Testing 2FA System\n")
    
    # Test OTP generation
    otp = generate_otp_code()
    print(f"Generated OTP: {otp}")
    
    # Test OTP hashing
    hashed = hash_otp(otp)
    print(f"Hashed OTP: {hashed[:50]}...")
    
    # Test verification
    is_valid = verify_otp_hash(otp, hashed)
    print(f"Verification: {is_valid} ✅")
    
    # Test wrong code
    is_invalid = verify_otp_hash("000000", hashed)
    print(f"Wrong code rejected: {not is_invalid} ✅\n")
