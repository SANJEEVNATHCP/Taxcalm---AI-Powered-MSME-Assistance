"""
Enhanced Security Middleware
For both Flask and FastAPI applications
"""

import secrets
from typing import Callable, Optional
from fastapi import Request, Response
from fastapi.middleware.base import BaseHTTPMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from app.security_config import SecurityConfig
from app.audit_logger import get_audit_logger
import time

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        for header_name, header_value in SecurityConfig.SECURITY_HEADERS.items():
            response.headers[header_name] = header_value
        
        response.headers['Server'] = 'TaxCalm'
        response.headers['X-Request-ID'] = secrets.token_hex(8)
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        
        if request.url.scheme == 'https':
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
        
        return response

class CSRFProtectionMiddleware(BaseHTTPMiddleware):
    CSRF_EXEMPT_METHODS = {'GET', 'HEAD', 'OPTIONS', 'TRACE'}
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if request.method not in self.CSRF_EXEMPT_METHODS:
            csrf_token = request.headers.get('X-CSRF-Token')
            
            if not csrf_token:
                session_token = request.cookies.get('CSRF-TOKEN')
                csrf_token = request.headers.get('X-CSRF-Token', session_token)
            
            if not csrf_token and request.method not in {'GET', 'HEAD', 'OPTIONS'}:
                return Response(
                    content='CSRF token missing',
                    status_code=403,
                    headers={'Content-Type': 'application/json'}
                )
        
        response = await call_next(request)
        
        if 'Set-Cookie' not in response.headers:
            csrf_token = secrets.token_urlsafe(32)
            response.set_cookie(
                'CSRF-TOKEN',
                csrf_token,
                httponly=False,
                secure=True,
                samesite='Strict',
                max_age=3600
            )
        
        return response

class AuditLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        ip_address = request.client.host if request.client else 'unknown'
        user_id = request.headers.get('X-User-ID', 'anonymous')
        
        try:
            response = await call_next(request)
            
            duration = time.time() - start_time
            
            audit_logger = get_audit_logger()
            audit_logger.log_api_call(
                user_id=user_id,
                ip_address=ip_address,
                endpoint=request.url.path,
                method=request.method,
                status_code=response.status_code
            )
            
            response.headers['X-Process-Time'] = str(duration)
            
            return response
        except Exception as e:
            audit_logger = get_audit_logger()
            audit_logger.log_api_error(
                user_id=user_id,
                ip_address=ip_address,
                endpoint=request.url.path,
                error_msg=str(e)
            )
            raise

class RateLimitingMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.request_history = {}
        self.cleanup_interval = 300
        self.last_cleanup = time.time()
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        ip_address = request.client.host if request.client else 'unknown'
        
        current_time = time.time()
        
        if current_time - self.last_cleanup > self.cleanup_interval:
            self._cleanup_old_requests(current_time)
            self.last_cleanup = current_time
        
        if ip_address not in self.request_history:
            self.request_history[ip_address] = []
        
        self.request_history[ip_address].append(current_time)
        
        one_minute_ago = current_time - 60
        self.request_history[ip_address] = [
            t for t in self.request_history[ip_address] if t > one_minute_ago
        ]
        
        if len(self.request_history[ip_address]) > 100:
            audit_logger = get_audit_logger()
            audit_logger.log_rate_limit_exceeded(
                ip_address=ip_address,
                endpoint=request.url.path
            )
            
            return Response(
                content='Rate limit exceeded',
                status_code=429,
                headers={'Retry-After': '60'}
            )
        
        response = await call_next(request)
        response.headers['X-RateLimit-Limit'] = '100'
        response.headers['X-RateLimit-Remaining'] = str(100 - len(self.request_history[ip_address]))
        
        return response
    
    def _cleanup_old_requests(self, current_time: float):
        ten_minutes_ago = current_time - 600
        
        ips_to_remove = [
            ip for ip, times in self.request_history.items()
            if all(t < ten_minutes_ago for t in times)
        ]
        
        for ip in ips_to_remove:
            del self.request_history[ip]

class InputValidationMiddleware(BaseHTTPMiddleware):
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        content_length = request.headers.get('content-length')
        
        if content_length and int(content_length) > self.MAX_CONTENT_LENGTH:
            return Response(
                content='Request body too large',
                status_code=413,
                headers={'Content-Type': 'application/json'}
            )
        
        response = await call_next(request)
        return response

class SuspiciousActivityDetectionMiddleware(BaseHTTPMiddleware):
    SUSPICIOUS_PATTERNS = [
        'union select',
        '<script',
        'javascript:',
        '../',
        '..\\',
        'exec(',
        'eval(',
    ]
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        ip_address = request.client.host if request.client else 'unknown'
        user_id = request.headers.get('X-User-ID', 'anonymous')
        
        query_string = str(request.url.query).lower()
        
        for pattern in self.SUSPICIOUS_PATTERNS:
            if pattern in query_string:
                audit_logger = get_audit_logger()
                audit_logger.log_suspicious_activity(
                    ip_address=ip_address,
                    reason=f'Suspicious pattern detected: {pattern}',
                    details={'endpoint': request.url.path, 'query': query_string}
                )
                
                return Response(
                    content='Suspicious request detected',
                    status_code=403
                )
        
        response = await call_next(request)
        return response

def setup_security_middleware(app):
    app.add_middleware(SuspiciousActivityDetectionMiddleware)
    app.add_middleware(InputValidationMiddleware)
    app.add_middleware(RateLimitingMiddleware)
    app.add_middleware(AuditLoggingMiddleware)
    app.add_middleware(CSRFProtectionMiddleware)
    app.add_middleware(SecurityHeadersMiddleware)
