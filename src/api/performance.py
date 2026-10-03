#!/usr/bin/env python3
"""
Performance API endpoints - placeholder for Phase 1.
This will be implemented in subsequent phases.
"""

from fastapi import APIRouter, Depends

from api.auth import get_current_user

router = APIRouter(dependencies=[Depends(get_current_user)])
@router.get("/")
async def get_performance():
    """Get performance data - placeholder endpoint."""
    return {"message": "Performance API endpoint (placeholder for Phase 1)"}
@router.post("/report")
async def generate_performance_report():
    """Generate performance report - placeholder endpoint."""
    return {"message": "Performance report generated (placeholder for Phase 1)"}
@router.get("/report/{report_id}")
async def get_performance_report(report_id: int):
    """Get performance report - placeholder endpoint."""
    return {"message": f"Performance report {report_id} (placeholder for Phase 1)"}