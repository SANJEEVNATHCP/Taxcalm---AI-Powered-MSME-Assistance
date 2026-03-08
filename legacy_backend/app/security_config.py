"""
Security Configuration
Central configuration for all security settings
"""

import os
from datetime import timedelta
from typing import List

class SecurityConfig:
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
    
    SESSION_CONFIG = {
        'SESSION_COOKIE_SECURE': True,
        'SESSION_COOKIE_HTTPONLY': True,
        'SESSION_COOKIE_SAMESITE': 'Strict',
        'PERMANENT_SESSION_LIFETIME': timedelta(hours=2),
    }
    
    JWT_CONFIG = {
        'algorithm': 'HS256',
        'access_token_expire_minutes': 30,
        'refresh_token_expire_days': 7,
        'secret_key': os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production'),
    }
    
    PASSWORD_CONFIG = {
        'min_length': 12,
        'require_uppercase': True,
        'require_lowercase': True,
        'require_numbers': True,
        'require_special': True,
        'special_chars': '!@#$%^&*()-_=+[]{}|;:,.<>?',
    }
    
    RATE_LIMIT_CONFIG = {
        'default': '100/minute',
        'auth_login': '5/15minutes',
        'auth_signup': '10/hour',
        'file_upload': '10/hour',
        'ai_chat': '30/minute',
        'api_general': '100/minute',
        'password_reset': '3/hour',
    }
    
    CORS_CONFIG = {
        'allowed_origins': os.getenv('ALLOWED_ORIGINS', 'http://localhost:8000,http://127.0.0.1:8000').split(','),
        'allow_credentials': True,
        'allow_methods': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        'allow_headers': ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
    }
    
    SECURITY_HEADERS = {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': (
            'geolocation=(), microphone=(), camera=(), payment=(), '
            'usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
        ),
        'Content-Security-Policy': (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https:; "
            "connect-src 'self' https://api.openrouter.ai; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "form-action 'self'"
        ),
    }
    
    FILE_UPLOAD_CONFIG = {
        'max_size_mb': 50,
        'allowed_extensions': ['.pdf', '.xlsx', '.xls', '.csv', '.txt', '.doc', '.docx'],
        'scan_for_viruses': True,
    }
    
    ENCRYPTION_CONFIG = {
        'algorithm': 'AES-256-GCM',
        'key_derivation': 'PBKDF2',
        'encryption_key': os.getenv('ENCRYPTION_KEY', None),
    }
    
    AUDIT_LOG_CONFIG = {
        'enabled': True,
        'log_file': 'logs/security_audit.log',
        'retention_days': 90,
        'log_level': 'INFO',
    }
    
    API_KEY_CONFIG = {
        'enabled': True,
        'rotation_days': 90,
        'prefix': 'taxcalm_',
    }
    
    @staticmethod
    def get_cors_origins() -> List[str]:
        origins = SecurityConfig.CORS_CONFIG['allowed_origins']
        return [origin.strip() for origin in origins if origin.strip()]
    
    @staticmethod
    def validate_config():
        if not SecurityConfig.JWT_CONFIG['secret_key'] or \
           SecurityConfig.JWT_CONFIG['secret_key'] == 'your-secret-key-change-in-production':
            raise ValueError('❌ JWT_SECRET_KEY not configured. Set JWT_SECRET_KEY environment variable.')
        
        if not SecurityConfig.ENCRYPTION_CONFIG['encryption_key']:
            raise ValueError('❌ ENCRYPTION_KEY not configured. Set ENCRYPTION_KEY environment variable.')
        
        if SecurityConfig.DEBUG:
            print('⚠️  WARNING: Application running in DEBUG mode. Disable in production!')
