"""
Input Validation & Sanitization
Prevents injection attacks, XSS, and ensures data integrity
"""

import re
import json
from typing import Any, Dict, List, Optional, Union
from urllib.parse import quote
import html
from app.security_config import SecurityConfig

class InputValidator:
    
    @staticmethod
    def sanitize_string(value: str, max_length: int = 1000, allow_special: bool = False) -> str:
        if not isinstance(value, str):
            value = str(value)
        
        value = value.strip()
        
        if len(value) > max_length:
            raise ValueError(f'Input exceeds maximum length of {max_length}')
        
        if not allow_special:
            if re.search(r'[<>\"\'`]', value):
                raise ValueError('Invalid characters detected')
        
        return html.escape(value)
    
    @staticmethod
    def sanitize_html(value: str) -> str:
        return html.escape(value)
    
    @staticmethod
    def sanitize_sql(value: str) -> str:
        dangerous_patterns = [
            r"(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|EXEC|SCRIPT)\b)",
            r"(--|;|\/\*|\*\/)",
            r"(\bOR\b.*=.*)",
            r"(1=1)",
        ]
        
        for pattern in dangerous_patterns:
            if re.search(pattern, value, re.IGNORECASE):
                raise ValueError('Potential SQL injection detected')
        
        return value
    
    @staticmethod
    def validate_email(email: str) -> str:
        email = InputValidator.sanitize_string(email, max_length=254)
        
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, email):
            raise ValueError('Invalid email format')
        
        return email.lower()
    
    @staticmethod
    def validate_phone(phone: str) -> str:
        phone = re.sub(r'\D', '', phone)
        
        if len(phone) < 10 or len(phone) > 15:
            raise ValueError('Invalid phone number')
        
        return phone
    
    @staticmethod
    def validate_gst_number(gst: str) -> str:
        gst = gst.upper().strip()
        
        if not re.match(r'^[0-9A-Z]{15}$', gst):
            raise ValueError('Invalid GST number format')
        
        return gst
    
    @staticmethod
    def validate_aadhar(aadhar: str) -> str:
        aadhar = re.sub(r'\D', '', aadhar)
        
        if len(aadhar) != 12:
            raise ValueError('Aadhar must be 12 digits')
        
        return aadhar
    
    @staticmethod
    def validate_pan(pan: str) -> str:
        pan = pan.upper().strip()
        
        if not re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$', pan):
            raise ValueError('Invalid PAN format')
        
        return pan
    
    @staticmethod
    def validate_number(value: Any, min_val: float = None, max_val: float = None) -> float:
        try:
            num = float(value)
        except (ValueError, TypeError):
            raise ValueError('Invalid number format')
        
        if min_val is not None and num < min_val:
            raise ValueError(f'Value must be >= {min_val}')
        
        if max_val is not None and num > max_val:
            raise ValueError(f'Value must be <= {max_val}')
        
        return num
    
    @staticmethod
    def validate_percentage(value: Any) -> float:
        return InputValidator.validate_number(value, min_val=0, max_val=100)
    
    @staticmethod
    def validate_currency(value: Any) -> float:
        num = InputValidator.validate_number(value, min_val=0)
        return round(num, 2)
    
    @staticmethod
    def validate_url(url: str) -> str:
        url = InputValidator.sanitize_string(url, max_length=2000)
        
        if not url.startswith(('http://', 'https://', '/')):
            raise ValueError('Invalid URL format')
        
        return url
    
    @staticmethod
    def validate_gst_calculation(sales: Any, purchases: Any, rate: Any) -> tuple:
        sales = InputValidator.validate_currency(sales)
        purchases = InputValidator.validate_currency(purchases)
        rate = InputValidator.validate_percentage(rate)
        
        return sales, purchases, rate
    
    @staticmethod
    def validate_password(password: str) -> str:
        config = SecurityConfig.PASSWORD_CONFIG
        
        if len(password) < config['min_length']:
            raise ValueError(f"Password must be at least {config['min_length']} characters")
        
        if config['require_uppercase'] and not re.search(r'[A-Z]', password):
            raise ValueError('Password must contain uppercase letters')
        
        if config['require_lowercase'] and not re.search(r'[a-z]', password):
            raise ValueError('Password must contain lowercase letters')
        
        if config['require_numbers'] and not re.search(r'[0-9]', password):
            raise ValueError('Password must contain numbers')
        
        if config['require_special']:
            pattern = '[' + re.escape(config['special_chars']) + ']'
            if not re.search(pattern, password):
                raise ValueError('Password must contain special characters')
        
        return password
    
    @staticmethod
    def validate_json(data: str) -> Dict:
        try:
            parsed = json.loads(data)
            return parsed
        except json.JSONDecodeError:
            raise ValueError('Invalid JSON format')
    
    @staticmethod
    def sanitize_dict(data: Dict, schema: Dict = None) -> Dict:
        sanitized = {}
        
        for key, value in data.items():
            if not isinstance(key, str):
                continue
            
            key = InputValidator.sanitize_string(key, max_length=100)
            
            if isinstance(value, str):
                value = InputValidator.sanitize_string(value)
            elif isinstance(value, dict):
                value = InputValidator.sanitize_dict(value)
            elif isinstance(value, list):
                value = [InputValidator.sanitize_string(v) if isinstance(v, str) else v for v in value]
            
            sanitized[key] = value
        
        return sanitized
    
    @staticmethod
    def validate_file_upload(filename: str, file_size: int, allowed_extensions: List[str]) -> bool:
        from app.security_config import SecurityConfig
        
        max_size = SecurityConfig.FILE_UPLOAD_CONFIG['max_size_mb'] * 1024 * 1024
        
        if file_size > max_size:
            raise ValueError(f"File exceeds maximum size of {SecurityConfig.FILE_UPLOAD_CONFIG['max_size_mb']}MB")
        
        filename_lower = filename.lower()
        if not any(filename_lower.endswith(ext) for ext in allowed_extensions):
            raise ValueError(f"File type not allowed. Allowed: {', '.join(allowed_extensions)}")
        
        if re.search(r'[<>:"|?*\0]', filename):
            raise ValueError('Filename contains invalid characters')
        
        return True

def sanitize_for_html(text: str) -> str:
    return html.escape(text)

def sanitize_for_url(text: str) -> str:
    return quote(text, safe='')

def get_input_validator() -> InputValidator:
    return InputValidator()
