#!/usr/bin/env python3
"""
Authentication API endpoints.
"""

import sys
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from sqlalchemy import text

# Import from src directory using absolute imports
sys.path.insert(0, '/home/kevin/Desktop/Github/StudyLoop/src')

from db.session import db
from db.models import User, BaseService
from security.auth import security

router = APIRouter()
auth_service = BaseService(db.get_session())

# Pydantic models for request validation
class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/register")
async def register(request: RegisterRequest):
    """Register a new user account."""
    
    # Check if user already exists
    existing_user = auth_service.fetchone(
        "SELECT * FROM users WHERE username = :username OR email = :email",
        {"username": request.username, "email": request.email}
    )
    
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username or email already registered"
        )
    
    # Hash password and create user
    password_hash = security.hash_password(request.password)
    
    auth_service.execute(
        "INSERT INTO users (username, email, password_hash) VALUES (:username, :email, :password_hash)",
        {
            "username": request.username,
            "email": request.email,
            "password_hash": password_hash
        }
    )
    auth_service.commit()
    
    # Get the created user
    user = auth_service.fetchone(
        "SELECT * FROM users WHERE username = :username",
        {"username": request.username}
    )
    
    # Remove password hash from response
    user_dict = dict(user._asdict()) if hasattr(user, '_asdict') else dict(user)
    user_dict.pop("password_hash", None)
    
    return {"message": "User registered successfully", "user": user_dict}
@router.post("/login")
async def login(request: LoginRequest):
    """Login a user and return access token."""
    
    # Find user by username
    user = auth_service.fetchone(
        "SELECT * FROM users WHERE username = :username",
        {"username": request.username}
    )
    
    if not user or not security.verify_password(
        request.password, dict(user._asdict())["password_hash"] if hasattr(user, '_asdict') else user["password_hash"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=30)
    access_token = security.create_access_token(
        data={"sub": str(dict(user._asdict())["id"] if hasattr(user, '_asdict') else user["id"])},
        expires_delta=access_token_expires
    )
    
    user_dict = dict(user._asdict()) if hasattr(user, '_asdict') else dict(user)
    user_dict.pop("password_hash", None)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_dict
    }


bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    """Resolve the authenticated user from the Authorization bearer token.

    Used as a FastAPI dependency on user-specific routes. Raises 401 when the
    token is missing, invalid, expired, or references a non-existent user.
    """
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = security.verify_token(credentials.credentials)
    if payload is None or "sub" not in payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = int(payload["sub"])
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")

    user = auth_service.fetchone(
        "SELECT * FROM users WHERE id = :id", {"id": user_id}
    )
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user