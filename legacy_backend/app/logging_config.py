"""
Centralized Logging Configuration
Provides structured logging across all modules with rotation and filtering
"""

import logging
import logging.handlers
import os
import sys
from datetime import datetime
from pathlib import Path
import json


class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging"""
    
    def format(self, record):
        log_data = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }
        
        # Add exception info if present
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)
        
        # Add custom fields
        if hasattr(record, 'user_id'):
            log_data['user_id'] = record.user_id
        if hasattr(record, 'request_id'):
            log_data['request_id'] = record.request_id
        if hasattr(record, 'ip_address'):
            log_data['ip_address'] = record.ip_address
        
        return json.dumps(log_data)


class SensitiveDataFilter(logging.Filter):
    """Filter to mask sensitive data in logs"""
    
    SENSITIVE_PATTERNS = [
        ('password', '***REDACTED***'),
        ('token', '***REDACTED***'),
        ('api_key', '***REDACTED***'),
        ('secret', '***REDACTED***'),
        ('authorization', '***REDACTED***'),
    ]
    
    def filter(self, record):
        message = record.getMessage().lower()
        
        # Redact sensitive information
        for pattern, replacement in self.SENSITIVE_PATTERNS:
            if pattern in message:
                record.msg = str(record.msg).replace(message, f"[{replacement}]")
        
        return True


def setup_logging(
    log_dir: str = "logs",
    log_level: str = "INFO",
    enable_json: bool = False,
    enable_console: bool = True,
    enable_file: bool = True
):
    """
    Setup centralized logging configuration
    
    Args:
        log_dir: Directory for log files
        log_level: Minimum log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        enable_json: Use JSON format for logs
        enable_console: Enable console logging
        enable_file: Enable file logging with rotation
    """
    # Create logs directory
    log_path = Path(log_dir)
    log_path.mkdir(exist_ok=True)
    
    # Get root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper()))
    
    # Clear existing handlers
    root_logger.handlers.clear()
    
    # Choose formatter
    if enable_json:
        formatter = JSONFormatter()
    else:
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
    
    # Console handler
    if enable_console:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.INFO)
        console_handler.setFormatter(formatter)
        console_handler.addFilter(SensitiveDataFilter())
        root_logger.addHandler(console_handler)
    
    # File handlers with rotation
    if enable_file:
        # Application log (all levels)
        app_log_file = log_path / "app.log"
        app_handler = logging.handlers.RotatingFileHandler(
            app_log_file,
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=10
        )
        app_handler.setLevel(logging.DEBUG)
        app_handler.setFormatter(formatter)
        app_handler.addFilter(SensitiveDataFilter())
        root_logger.addHandler(app_handler)
        
        # Error log (errors only)
        error_log_file = log_path / "error.log"
        error_handler = logging.handlers.RotatingFileHandler(
            error_log_file,
            maxBytes=5 * 1024 * 1024,  # 5MB
            backupCount=10
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(formatter)
        root_logger.addHandler(error_handler)
        
        # Security audit log
        security_log_file = log_path / "security.log"
        security_handler = logging.handlers.RotatingFileHandler(
            security_log_file,
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=20
        )
        security_handler.setLevel(logging.INFO)
        security_handler.setFormatter(formatter)
        security_handler.addFilter(SensitiveDataFilter())
        
        # Only security-related logs should go here
        security_logger = logging.getLogger('security')
        security_logger.addHandler(security_handler)
        security_logger.propagate = False
    
    logging.info(f"Logging initialized - Level: {log_level}, Directory: {log_dir}")
    return root_logger


def get_logger(name: str) -> logging.Logger:
    """Get a logger with the specified name"""
    return logging.getLogger(name)


def get_security_logger() -> logging.Logger:
    """Get the security audit logger"""
    return logging.getLogger('security')


class LogContext:
    """Context manager for adding contextual information to logs"""
    
    def __init__(self, **context):
        self.context = context
        self.old_factory = None
    
    def __enter__(self):
        old_factory = logging.getLogRecordFactory()
        
        def record_factory(*args, **kwargs):
            record = old_factory(*args, **kwargs)
            for key, value in self.context.items():
                setattr(record, key, value)
            return record
        
        logging.setLogRecordFactory(record_factory)
        self.old_factory = old_factory
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.old_factory:
            logging.setLogRecordFactory(self.old_factory)


# Initialize logging on module import
try:
    log_level = os.getenv('LOG_LEVEL', 'INFO')
    setup_logging(log_level=log_level, enable_json=False)
except Exception as e:
    print(f"Failed to initialize logging: {e}")
    logging.basicConfig(level=logging.INFO)
