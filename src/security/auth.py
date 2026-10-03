#!/usr/bin/env python3
"""
Authentication and security utilities using argon2 for password hashing.
"""

import sys
import time
from typing import Optional

# Import from src directory using absolute imports
sys.path.insert(0, '/home/kevin/Desktop/Github/StudyLoop/src')

from config.settings import get_settings
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

class SecurityUtils:
    """Security utility functions using argon2."""
    
    def __init__(self):
        self.settings = get_settings()
        self.hasher = PasswordHasher()
    
    def hash_password(self, password: str) -> str:
        """Hash a password using argon2."""
        return self.hasher.hash(password)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its argon2 hash."""
        try:
            self.hasher.verify(hashed_password, plain_password)
            return True
        except VerifyMismatchError:
            return False
        except Exception:
            return False
    
    def create_session_token(self, user_id: int) -> str:
        """Create a session token (simple token for testing)."""
        token_data = f"user_{user_id}_{int(time.time())}"
        return token_data
    
    def verify_session_token(self, token: str) -> Optional[int]:
        """Verify and decode a session token."""
        try:
            if token.startswith("user_") and "_" in token:
                parts = token.split("_")
                if len(parts) >= 3:
                    user_id = int(parts[1])
                    return user_id
        except (ValueError, IndexError):
            pass
        return None
# Global security utilities instance
security = SecurityUtils()