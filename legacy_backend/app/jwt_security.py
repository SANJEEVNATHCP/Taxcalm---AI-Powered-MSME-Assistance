"""
JWT Security & Token Management
Handles JWT token creation, validation, and refresh logic
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from app.security_config import SecurityConfig
from app.audit_logger import get_audit_logger, AuditEventType

security = HTTPBearer()

class JWTHandler:
    def __init__(self):
        self.config = SecurityConfig.JWT_CONFIG
        self.secret_key = self.config['secret_key']
        self.algorithm = self.config['algorithm']
        self.access_token_expire = self.config['access_token_expire_minutes']
        self.refresh_token_expire = self.config['refresh_token_expire_days']
        self.audit_logger = get_audit_logger()
    
    def create_access_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire)
        
        to_encode.update({'exp': expire, 'type': 'access'})
        
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def create_refresh_token(self, data: Dict[str, Any]) -> str:
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=self.refresh_token_expire)
        
        to_encode.update({'exp': expire, 'type': 'refresh'})
        
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def create_token_pair(self, user_id: str, user_data: Dict = None) -> Dict[str, str]:
        base_data = {'sub': user_id}
        if user_data:
            base_data.update(user_data)
        
        access_token = self.create_access_token(base_data)
        refresh_token = self.create_refresh_token({'sub': user_id})
        
        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token_type': 'Bearer',
            'expires_in': self.access_token_expire * 60
        }
    
    def verify_token(self, token: str) -> Dict[str, Any]:
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail='Token has expired'
            )
        except jwt.InvalidTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail='Invalid token'
            )
    
    def refresh_access_token(self, refresh_token: str) -> Dict[str, str]:
        try:
            payload = jwt.decode(refresh_token, self.secret_key, algorithms=[self.algorithm])
            
            if payload.get('type') != 'refresh':
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail='Invalid token type'
                )
            
            user_id = payload.get('sub')
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail='Invalid token claims'
                )
            
            new_access_token = self.create_access_token({'sub': user_id})
            
            return {
                'access_token': new_access_token,
                'token_type': 'Bearer',
                'expires_in': self.access_token_expire * 60
            }
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail='Refresh token has expired'
            )
        except jwt.InvalidTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail='Invalid refresh token'
            )
    
    def get_token_from_header(self, credentials: HTTPAuthCredentials) -> str:
        return credentials.credentials

async def get_current_user(credentials: HTTPAuthCredentials = Depends(security)) -> Dict[str, Any]:
    token = credentials.credentials
    jwt_handler = JWTHandler()
    
    try:
        payload = jwt_handler.verify_token(token)
        user_id: str = payload.get('sub')
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail='Could not validate credentials'
            )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Could not validate credentials'
        )
    
    return {'user_id': user_id, 'payload': payload}

async def get_current_admin_user(current_user: Dict = Depends(get_current_user)) -> Dict[str, Any]:
    if not current_user.get('payload', {}).get('is_admin'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Admin access required'
        )
    return current_user

class TokenBlacklist:
    def __init__(self):
        self.blacklist = set()
    
    def add_token(self, token: str):
        self.blacklist.add(token)
    
    def is_blacklisted(self, token: str) -> bool:
        return token in self.blacklist
    
    def clear_expired(self):
        self.blacklist.clear()

_token_blacklist = TokenBlacklist()

def get_token_blacklist() -> TokenBlacklist:
    return _token_blacklist

def blacklist_token(token: str):
    _token_blacklist.add_token(token)

def is_token_blacklisted(token: str) -> bool:
    return _token_blacklist.is_blacklisted(token)

def get_jwt_handler() -> JWTHandler:
    return JWTHandler()
