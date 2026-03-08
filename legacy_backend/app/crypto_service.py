"""
Cryptographic Service
Handles encryption/decryption of sensitive data
"""

import os
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
import secrets
from typing import Tuple
import json

class CryptoService:
    def __init__(self, master_key: str = None):
        if not master_key:
            master_key = os.getenv('ENCRYPTION_KEY')
        
        if not master_key:
            raise ValueError('ENCRYPTION_KEY environment variable not set')
        
        self.master_key = master_key.encode() if isinstance(master_key, str) else master_key
    
    def _derive_key(self, salt: bytes, info: bytes = b'') -> bytes:
        kdf = PBKDF2(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        return kdf.derive(self.master_key + info)
    
    def encrypt(self, plaintext: str, associated_data: str = '') -> str:
        if isinstance(plaintext, dict):
            plaintext = json.dumps(plaintext)
        
        plaintext_bytes = plaintext.encode() if isinstance(plaintext, str) else plaintext
        associated_data_bytes = associated_data.encode() if isinstance(associated_data, str) else associated_data
        
        salt = secrets.token_bytes(16)
        nonce = secrets.token_bytes(12)
        
        key = self._derive_key(salt)
        cipher = AESGCM(key)
        
        ciphertext = cipher.encrypt(nonce, plaintext_bytes, associated_data_bytes)
        
        encrypted = base64.b64encode(salt + nonce + ciphertext).decode('utf-8')
        return encrypted
    
    def decrypt(self, encrypted: str, associated_data: str = '') -> str:
        try:
            encrypted_bytes = base64.b64decode(encrypted)
            
            salt = encrypted_bytes[:16]
            nonce = encrypted_bytes[16:28]
            ciphertext = encrypted_bytes[28:]
            
            associated_data_bytes = associated_data.encode() if isinstance(associated_data, str) else associated_data
            
            key = self._derive_key(salt)
            cipher = AESGCM(key)
            
            plaintext = cipher.decrypt(nonce, ciphertext, associated_data_bytes)
            return plaintext.decode('utf-8')
        except Exception as e:
            raise ValueError(f'Decryption failed: {str(e)}')
    
    def hash_password(self, password: str) -> Tuple[str, str]:
        import bcrypt
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8'), salt.decode('utf-8')
    
    def verify_password(self, password: str, hashed: str) -> bool:
        import bcrypt
        try:
            return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
        except Exception:
            return False
    
    def generate_secure_token(self, length: int = 32) -> str:
        return secrets.token_urlsafe(length)
    
    @staticmethod
    def mask_sensitive_data(data: str, show_chars: int = 4) -> str:
        if len(data) <= show_chars:
            return '*' * len(data)
        return data[:show_chars] + '*' * (len(data) - show_chars)
    
    @staticmethod
    def mask_email(email: str) -> str:
        parts = email.split('@')
        if len(parts) != 2:
            return CryptoService.mask_sensitive_data(email)
        
        local = parts[0]
        domain = parts[1]
        
        if len(local) <= 2:
            masked_local = '*' * len(local)
        else:
            masked_local = local[0] + '*' * (len(local) - 2) + local[-1]
        
        return f'{masked_local}@{domain}'
    
    @staticmethod
    def mask_phone(phone: str) -> str:
        if len(phone) < 4:
            return '*' * len(phone)
        return '*' * (len(phone) - 4) + phone[-4:]
    
    @staticmethod
    def mask_gst_number(gst: str) -> str:
        if len(gst) < 6:
            return '*' * len(gst)
        return gst[:6] + '*' * (len(gst) - 6)

def get_crypto_service() -> CryptoService:
    return CryptoService()
