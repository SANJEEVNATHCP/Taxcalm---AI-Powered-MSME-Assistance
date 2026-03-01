"""
Security Audit Logger
Logs all security-related events for compliance and forensics
"""

import logging
import json
from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum
import os
from app.security_config import SecurityConfig
from app.crypto_service import CryptoService

class AuditEventType(Enum):
    LOGIN_SUCCESS = 'login_success'
    LOGIN_FAILURE = 'login_failure'
    LOGOUT = 'logout'
    PASSWORD_CHANGE = 'password_change'
    PASSWORD_RESET = 'password_reset'
    ACCOUNT_CREATED = 'account_created'
    ACCOUNT_LOCKED = 'account_locked'
    ACCOUNT_UNLOCKED = 'account_unlocked'
    
    AUTHENTICATION_FAILED = 'authentication_failed'
    AUTHORIZATION_FAILED = 'authorization_failed'
    INVALID_TOKEN = 'invalid_token'
    TOKEN_EXPIRED = 'token_expired'
    
    DATA_ACCESS = 'data_access'
    DATA_MODIFIED = 'data_modified'
    DATA_DELETED = 'data_deleted'
    
    FILE_UPLOADED = 'file_uploaded'
    FILE_DOWNLOADED = 'file_downloaded'
    FILE_DELETED = 'file_deleted'
    
    API_CALL = 'api_call'
    API_ERROR = 'api_error'
    RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded'
    
    SUSPICIOUS_ACTIVITY = 'suspicious_activity'
    SECURITY_VIOLATION = 'security_violation'
    CONFIGURATION_CHANGED = 'configuration_changed'

class AuditLogger:
    def __init__(self):
        self.config = SecurityConfig.AUDIT_LOG_CONFIG
        self._setup_logger()
    
    def _setup_logger(self):
        log_dir = os.path.dirname(self.config['log_file'])
        if log_dir and not os.path.exists(log_dir):
            os.makedirs(log_dir, exist_ok=True)
        
        self.logger = logging.getLogger('audit')
        self.logger.setLevel(getattr(logging, self.config['log_level']))
        
        formatter = logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        
        file_handler = logging.FileHandler(self.config['log_file'])
        file_handler.setFormatter(formatter)
        self.logger.addHandler(file_handler)
    
    def log_event(
        self,
        event_type: AuditEventType,
        user_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        resource: Optional[str] = None,
        action: Optional[str] = None,
        status: str = 'success',
        details: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None
    ):
        if not self.config['enabled']:
            return
        
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'event_type': event_type.value,
            'user_id': user_id or 'anonymous',
            'ip_address': ip_address or 'unknown',
            'resource': resource,
            'action': action,
            'status': status,
            'details': details or {},
            'error': error
        }
        
        if event_type in [AuditEventType.LOGIN_FAILURE, AuditEventType.AUTHENTICATION_FAILED, 
                          AuditEventType.SECURITY_VIOLATION, AuditEventType.SUSPICIOUS_ACTIVITY]:
            self.logger.warning(json.dumps(log_entry))
        else:
            self.logger.info(json.dumps(log_entry))
    
    def log_login_attempt(self, user_id: str, ip_address: str, success: bool, reason: str = None):
        event_type = AuditEventType.LOGIN_SUCCESS if success else AuditEventType.LOGIN_FAILURE
        self.log_event(
            event_type=event_type,
            user_id=user_id,
            ip_address=ip_address,
            action='authentication',
            status='success' if success else 'failure',
            error=reason
        )
    
    def log_logout(self, user_id: str, ip_address: str):
        self.log_event(
            event_type=AuditEventType.LOGOUT,
            user_id=user_id,
            ip_address=ip_address,
            action='logout'
        )
    
    def log_password_change(self, user_id: str, ip_address: str, success: bool):
        event_type = AuditEventType.PASSWORD_CHANGE
        self.log_event(
            event_type=event_type,
            user_id=user_id,
            ip_address=ip_address,
            action='password_change',
            status='success' if success else 'failure'
        )
    
    def log_data_access(self, user_id: str, ip_address: str, resource: str, details: Dict = None):
        self.log_event(
            event_type=AuditEventType.DATA_ACCESS,
            user_id=user_id,
            ip_address=ip_address,
            resource=resource,
            action='read',
            details=details
        )
    
    def log_data_modification(self, user_id: str, ip_address: str, resource: str, action: str, details: Dict = None):
        self.log_event(
            event_type=AuditEventType.DATA_MODIFIED,
            user_id=user_id,
            ip_address=ip_address,
            resource=resource,
            action=action,
            details=details
        )
    
    def log_api_call(self, user_id: str, ip_address: str, endpoint: str, method: str, status_code: int):
        self.log_event(
            event_type=AuditEventType.API_CALL,
            user_id=user_id,
            ip_address=ip_address,
            resource=endpoint,
            action=method,
            details={'status_code': status_code}
        )
    
    def log_api_error(self, user_id: str, ip_address: str, endpoint: str, error_msg: str):
        self.log_event(
            event_type=AuditEventType.API_ERROR,
            user_id=user_id,
            ip_address=ip_address,
            resource=endpoint,
            status='error',
            error=error_msg
        )
    
    def log_rate_limit_exceeded(self, ip_address: str, endpoint: str):
        self.log_event(
            event_type=AuditEventType.RATE_LIMIT_EXCEEDED,
            ip_address=ip_address,
            resource=endpoint,
            status='blocked'
        )
    
    def log_suspicious_activity(self, ip_address: str, reason: str, details: Dict = None):
        self.log_event(
            event_type=AuditEventType.SUSPICIOUS_ACTIVITY,
            ip_address=ip_address,
            status='alert',
            error=reason,
            details=details
        )
    
    def log_security_violation(self, user_id: Optional[str], ip_address: str, violation_type: str, details: Dict = None):
        self.log_event(
            event_type=AuditEventType.SECURITY_VIOLATION,
            user_id=user_id,
            ip_address=ip_address,
            resource=violation_type,
            status='violation',
            details=details
        )
    
    def log_file_operation(self, event_type: AuditEventType, user_id: str, ip_address: str, 
                          filename: str, file_size: int = None, status: str = 'success'):
        self.log_event(
            event_type=event_type,
            user_id=user_id,
            ip_address=ip_address,
            resource=filename,
            status=status,
            details={'file_size': file_size} if file_size else None
        )
    
    def get_user_audit_log(self, user_id: str, limit: int = 100) -> list:
        try:
            with open(self.config['log_file'], 'r') as f:
                lines = f.readlines()
            
            user_logs = []
            for line in lines[-limit*10:]:
                try:
                    entry = json.loads(line.split(' - ')[-1] if ' - ' in line else line)
                    if entry.get('user_id') == user_id:
                        user_logs.append(entry)
                except:
                    continue
            
            return user_logs[-limit:]
        except Exception as e:
            return []

_audit_logger = None

def get_audit_logger() -> AuditLogger:
    global _audit_logger
    if _audit_logger is None:
        _audit_logger = AuditLogger()
    return _audit_logger
