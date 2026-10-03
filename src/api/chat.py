#!/usr/bin/env python3
"""
Chat API endpoints - placeholder for Phase 1.
This will be implemented in subsequent phases.
"""

from fastapi import APIRouter, Depends

from api.auth import get_current_user

router = APIRouter(dependencies=[Depends(get_current_user)])
@router.post("/")
async def chat():
    """Chat with AI - placeholder endpoint."""
    return {"message": "Chat API endpoint (placeholder for Phase 1)"}