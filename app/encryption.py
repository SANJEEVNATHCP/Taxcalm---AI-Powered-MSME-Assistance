"""
Data Encryption Module
AES-256-GCM encryption for sensitive data (PAN, GSTIN, bank details, etc.)
"""

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import os
import base64
import json
from typing import Optional, Union

# Get encryption key from environment or generate one
ENCRYPTION_KEY_ENV = os.getenv('ENCRYPTION_KEY')

if not ENCRYPTION_KEY_ENV:
    # Generate a new key for development (in production, this should be in .env)
    print("⚠️ WARNING: No ENCRYPTION_KEY found in environment. Generating temporary key.")
    print("   For production, set ENCRYPTION_KEY in your .env file.")
    import secrets
    ENCRYPTION_KEY_ENV = base64.b64encode(secrets.token_bytes(32)).decode('utf-8')

# Decode the base64 key
try:
    MASTER_KEY = base64.b64decode(ENCRYPTION_KEY_ENV)
    if len(MASTER_KEY) != 32:
        raise ValueError("Encryption key must be 32 bytes (256 bits)")
except Exception as e:
    print(f"❌ Invalid ENCRYPTION_KEY in environment: {e}")
    print("   Generating new key for this session...")
    import secrets
    MASTER_KEY = secrets.token_bytes(32)
    ENCRYPTION_KEY_ENV = base64.b64encode(MASTER_KEY).decode('utf-8')
    print(f"   Generated key: {ENCRYPTION_KEY_ENV}")
    print("   Add this to your .env file as ENCRYPTION_KEY")


class DataEncryption:
    """
    AES-256-GCM encryption handler
    Provides authenticated encryption with associated data (AEAD)
    """
    
    def __init__(self, key: bytes = MASTER_KEY):
        """Initialize with 256-bit key"""
        if len(key) != 32:
            raise ValueError("Key must be exactly 32 bytes (256 bits)")
        self.key = key
    
    def encrypt(self, plaintext: str) -> str:
        """
        Encrypt plaintext string to base64-encoded ciphertext
        
        Returns: base64-encoded string in format: nonce:ciphertext:tag
        """
        if not plaintext:
            return ""
        
        if not isinstance(plaintext, str):
            plaintext = str(plaintext)
        
        # Generate random nonce (12 bytes for GCM)
        nonce = os.urandom(12)
        
        # Create AES-GCM cipher
        aesgcm = AESGCM(self.key)
        
        # Encrypt (includes authentication tag)
        ciphertext = aesgcm.encrypt(nonce, plaintext.encode('utf-8'), None)
        
        # Combine nonce + ciphertext and encode as base64
        encrypted_data = nonce + ciphertext
        return base64.b64encode(encrypted_data).decode('utf-8')
    
    def decrypt(self, encrypted_data: str) -> str:
        """
        Decrypt base64-encoded ciphertext back to plaintext
        
        Args:
            encrypted_data: base64-encoded string
        
        Returns: decrypted plaintext string
        """
        if not encrypted_data:
            return ""
        
        try:
            # Decode from base64
            encrypted_bytes = base64.b64decode(encrypted_data)
            
            # Extract nonce (first 12 bytes) and ciphertext (rest)
            nonce = encrypted_bytes[:12]
            ciphertext = encrypted_bytes[12:]
            
            # Create AES-GCM cipher
            aesgcm = AESGCM(self.key)
            
            # Decrypt and verify authentication
            plaintext = aesgcm.decrypt(nonce, ciphertext, None)
            
            return plaintext.decode('utf-8')
        
        except Exception as e:
            print(f"❌ Decryption failed: {e}")
            return "[DECRYPTION_ERROR]"
    
    def encrypt_dict(self, data: dict, fields_to_encrypt: list) -> dict:
        """
        Encrypt specific fields in a dictionary
        
        Args:
            data: Dictionary containing data
            fields_to_encrypt: List of field names to encrypt
        
        Returns: Dictionary with encrypted fields
        """
        encrypted_data = data.copy()
        
        for field in fields_to_encrypt:
            if field in encrypted_data and encrypted_data[field]:
                encrypted_data[field] = self.encrypt(str(encrypted_data[field]))
        
        return encrypted_data
    
    def decrypt_dict(self, data: dict, fields_to_decrypt: list) -> dict:
        """
        Decrypt specific fields in a dictionary
        
        Args:
            data: Dictionary containing encrypted data
            fields_to_decrypt: List of field names to decrypt
        
        Returns: Dictionary with decrypted fields
        """
        decrypted_data = data.copy()
        
        for field in fields_to_decrypt:
            if field in decrypted_data and decrypted_data[field]:
                decrypted_data[field] = self.decrypt(decrypted_data[field])
        
        return decrypted_data


# Global encryption instance
_encryptor = DataEncryption()


def encrypt_field(plaintext: Union[str, int, float, None]) -> str:
    """Encrypt a single field value"""
    if plaintext is None or plaintext == "":
        return ""
    return _encryptor.encrypt(str(plaintext))


def decrypt_field(encrypted_data: Optional[str]) -> str:
    """Decrypt a single field value"""
    if not encrypted_data:
        return ""
    return _encryptor.decrypt(encrypted_data)


def encrypt_sensitive_data(data: dict) -> dict:
    """
    Encrypt sensitive fields in data dictionary
    
    Automatically encrypts common sensitive fields:
    - PAN numbers
    - GSTIN
    - Aadhaar numbers
    - Bank account numbers
    - Phone numbers
    - Email addresses (optional, for privacy)
    """
    sensitive_fields = [
        'pan', 'pan_number', 'pan_num',
        'gstin', 'gst_number',
        'aadhar', 'aadhar_number', 'aadhar_num', 'aadhaar',
        'account_number', 'bank_account', 'account_num',
        'phone', 'mobile', 'phone_number',
        'ifsc', 'ifsc_code'
    ]
    
    return _encryptor.encrypt_dict(data, sensitive_fields)


def decrypt_sensitive_data(data: dict) -> dict:
    """
    Decrypt sensitive fields in data dictionary
    """
    sensitive_fields = [
        'pan', 'pan_number', 'pan_num',
        'gstin', 'gst_number',
        'aadhar', 'aadhar_number', 'aadhar_num', 'aadhaar',
        'account_number', 'bank_account', 'account_num',
        'phone', 'mobile', 'phone_number',
        'ifsc', 'ifsc_code'
    ]
    
    return _encryptor.decrypt_dict(data, sensitive_fields)


def hash_password_email(password: str, email: str) -> str:
    """
    Derive a deterministic encryption key from password + email
    Useful for client-side encryption where key is user-specific
    
    NOTE: This is separate from bcrypt password hashing for authentication
    """
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=email.encode('utf-8'),
        iterations=100000
    )
    return base64.b64encode(kdf.derive(password.encode('utf-8'))).decode('utf-8')


def generate_encryption_key() -> str:
    """Generate a new random 256-bit encryption key"""
    import secrets
    key = secrets.token_bytes(32)
    return base64.b64encode(key).decode('utf-8')


if __name__ == "__main__":
    # Test encryption
    print("\n🔐 Testing AES-256-GCM Encryption\n")
    
    # Test 1: Simple string encryption
    original = "ABCDE1234F"
    encrypted = encrypt_field(original)
    decrypted = decrypt_field(encrypted)
    
    print(f"Original PAN: {original}")
    print(f"Encrypted: {encrypted}")
    print(f"Decrypted: {decrypted}")
    print(f"Match: {original == decrypted} ✅\n")
    
    # Test 2: Dictionary encryption
    test_data = {
        "name": "John Doe",
        "pan": "ABCDE1234F",
        "gstin": "27AABCU9603R1ZM",
        "email": "john@example.com",
        "balance": 50000
    }
    
    print(f"Original data: {test_data}")
    encrypted_data = encrypt_sensitive_data(test_data)
    print(f"Encrypted data: {encrypted_data}")
    decrypted_data = decrypt_sensitive_data(encrypted_data)
    print(f"Decrypted data: {decrypted_data}")
    print(f"Match: {test_data == decrypted_data} ✅\n")
    
    # Test 3: Generate new key
    new_key = generate_encryption_key()
    print(f"Generated new encryption key:\n{new_key}\n")
    print("Add this to your .env file as:")
    print(f"ENCRYPTION_KEY={new_key}\n")
