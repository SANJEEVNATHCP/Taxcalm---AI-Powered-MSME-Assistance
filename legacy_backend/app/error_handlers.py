"""
Global Error Handler Middleware
Catches and properly handles all application errors with logging and user-friendly responses
"""

import logging
import traceback
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from typing import Callable
import time

logger = logging.getLogger(__name__)
security_logger = logging.getLogger('security')


class ErrorHandlerMiddleware:
    """
    Middleware to catch and handle all errors globally
    Provides consistent error responses and comprehensive logging
    """
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        request_id = str(time.time())  # Simple request ID
        
        async def send_wrapper(message):
            # Add request ID to response headers
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))
                headers.append((b"x-request-id", request_id.encode()))
                message["headers"] = headers
            await send(message)
        
        try:
            await self.app(scope, receive, send_wrapper)
        except Exception as exc:
            logger.error(f"Unhandled exception in request {request_id}: {exc}", exc_info=True)
            
            # Send error response
            response = JSONResponse(
                status_code=500,
                content={
                    "error": "Internal Server Error",
                    "message": "An unexpected error occurred",
                    "request_id": request_id
                }
            )
            await response(scope, receive, send_wrapper)


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions"""
    
    # Log based on status code
    if exc.status_code >= 500:
        logger.error(f"Server error {exc.status_code}: {exc.detail}")
    elif exc.status_code >= 400:
        logger.warning(f"Client error {exc.status_code}: {exc.detail}")
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code
        }
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors"""
    
    errors = []
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error["loc"])
        message = error["msg"]
        errors.append({
            "field": field,
            "message": message,
            "type": error["type"]
        })
    
    logger.warning(f"Validation error on {request.url.path}: {errors}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "message": "Request validation failed",
            "details": errors
        }
    )


async def general_exception_handler(request: Request, exc: Exception):
    """Handle all uncaught exceptions"""
    
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    # Log full exception with traceback
    logger.error(
        f"Unhandled exception in {request.method} {request.url.path}",
        exc_info=True,
        extra={
            'request_id': request_id,
            'method': request.method,
            'path': request.url.path,
            'client_ip': request.client.host if request.client else 'unknown'
        }
    )
    
    # Don't expose internal error details in production
    import os
    debug_mode = os.getenv('DEBUG', 'False').lower() == 'true'
    
    error_response = {
        "error": "Internal Server Error",
        "message": "An unexpected error occurred. Please try again later.",
        "request_id": request_id
    }
    
    # Include details in debug mode
    if debug_mode:
        error_response["debug"] = {
            "exception": str(exc),
            "type": type(exc).__name__,
            "traceback": traceback.format_exc()
        }
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=error_response
    )


class RequestLoggingMiddleware:
    """
    Middleware to log all incoming requests and responses
    """
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        request_start = time.time()
        
        # Extract request info
        method = scope["method"]
        path = scope["path"]
        client = scope.get("client", ("unknown", 0))
        client_ip = client[0] if client else "unknown"
        
        # Log request
        logger.info(f"Request started: {method} {path} from {client_ip}")
        
        # Track response status
        status_code = 200
        
        async def send_wrapper(message):
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message["status"]
            await send(message)
        
        try:
            await self.app(scope, receive, send_wrapper)
        finally:
            # Log response info
            duration = (time.time() - request_start) * 1000  # ms
            
            log_func = logger.info
            if status_code >= 500:
                log_func = logger.error
            elif status_code >= 400:
                log_func = logger.warning
            
            log_func(
                f"Request completed: {method} {path} - {status_code} - {duration:.2f}ms",
                extra={
                    'method': method,
                    'path': path,
                    'status_code': status_code,
                    'duration_ms': round(duration, 2),
                    'client_ip': client_ip
                }
            )


class SecurityLoggingMiddleware:
    """
    Middleware to log security-relevant events
    """
    
    def __init__(self, app):
        self.app = app
        self.security_logger = logging.getLogger('security')
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        path = scope["path"]
        method = scope["method"]
        client = scope.get("client", ("unknown", 0))
        client_ip = client[0] if client else "unknown"
        
        # Log security-relevant endpoints
        security_paths = ['/api/auth/', '/api/finance/', '/login', '/register']
        
        is_security_path = any(security_path in path for security_path in security_paths)
        
        if is_security_path:
            self.security_logger.info(
                f"Security event: {method} {path}",
                extra={
                    'method': method,
                    'path': path,
                    'client_ip': client_ip
                }
            )
        
        await self.app(scope, receive, send)


def setup_error_handlers(app):
    """
    Setup all error handlers for the FastAPI app
    
    Args:
        app: FastAPI application instance
    """
    from fastapi.exceptions import RequestValidationError
    from starlette.exceptions import HTTPException as StarletteHTTPException
    
    # Register exception handlers
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)
    
    # Add middleware
    app.add_middleware(ErrorHandlerMiddleware)
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(SecurityLoggingMiddleware)
    
    logger.info("Error handlers and logging middleware configured")
