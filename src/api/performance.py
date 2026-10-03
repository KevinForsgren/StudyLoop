#!/usr/bin/env python3
"""
Performance API endpoints.

The backend computes all objective statistics (completion %, consistency graph,
totals). The AI only writes the interpretation for a report, and the endpoint
degrades gracefully to a computed summary when the AI is unavailable.
"""

import sys
from datetime import date, timedelta
from typing import Optional

sys.path.insert(0, '/home/kevin/Desktop/Github/StudyLoop/src')

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text

from api.auth import get_current_user
from db.models import BaseService
from db.session import db
from services import ai
from services.performance import (
    compute_period_stats,
    fallback_summary,
    performance_status,
)

router = APIRouter(dependencies=[Depends(get_current_user)])
service = BaseService(db.get_session())


def _to_dict(row):
    return dict(row._asdict()) if hasattr(row, "_asdict") else dict(row)


def _period(days: int):
    """Return (start, end) for the trailing ``days`` including today."""
    end = date.today()
    return end - timedelta(days=days - 1), end


def _user_tasks(user_id: int, start: date, end: date) -> list:
    rows = service.fetchall(
        "SELECT date, completed, estimated_duration FROM tasks "
        "WHERE user_id = :uid AND date >= :start AND date <= :end ORDER BY date",
        {"uid": user_id, "start": start, "end": end},
    )
    return [_to_dict(r) for r in rows]


@router.get("/")
def get_performance(days: int = 7, user=Depends(get_current_user)):
    """Return the user's performance stats + consistency graph for a period."""
    user_id = _to_dict(user)["id"]
    start, end = _period(days)
    stats = compute_period_stats(_user_tasks(user_id, start, end), start, end)

    # Compare against the previous period to derive a trend for the UI.
    prev_start, prev_end = start - timedelta(days=days), start - timedelta(days=1)
    prev_stats = compute_period_stats(
        _user_tasks(user_id, prev_start, prev_end), prev_start, prev_end
    )
    status = performance_status(
        stats["completion_percentage"], prev_stats["completion_percentage"]
    )

    return {
        "period_start": start.isoformat(),
        "period_end": end.isoformat(),
        "performance_status": status,
        **stats,
    }


class ReportOptions(BaseModel):
    days: int = 7
    period_start: Optional[date] = None
    period_end: Optional[date] = None


@router.post("/report")
def generate_report(options: ReportOptions = None, user=Depends(get_current_user)):
    """Generate and persist a performance report for the current period."""
    user_id = _to_dict(user)["id"]
    opts = options or ReportOptions()
    days = opts.days

    if opts.period_start and opts.period_end:
        start, end = opts.period_start, opts.period_end
    else:
        start, end = _period(days)

    stats = compute_period_stats(_user_tasks(user_id, start, end), start, end)

    prev_start = start - timedelta(days=days)
    prev_end = start - timedelta(days=1)
    prev_stats = compute_period_stats(
        _user_tasks(user_id, prev_start, prev_end), prev_start, prev_end
    )
    status = performance_status(
        stats["completion_percentage"], prev_stats["completion_percentage"]
    )

    # AI interpretation with a graceful fallback when the model is unavailable.
    try:
        summary = ai.generate_report_summary(stats, status).strip()
    except (ai.AIUnavailableError, ai.AIValidationError):
        summary = fallback_summary(stats)

    service.execute(
        "INSERT INTO reports "
        "(user_id, date, period_start, period_end, performance_percentage, "
        " performance_status, content) "
        "VALUES (:uid, :day, :start, :end, :pct, :status, :content)",
        {
            "uid": user_id,
            "day": date.today(),
            "start": start,
            "end": end,
            "pct": stats["completion_percentage"],
            "status": status,
            "content": summary,
        },
    )
    service.commit()
    report_id = service.scalar(text("SELECT last_insert_rowid()"))

    return {
        "report": {
            "id": report_id,
            "period_start": start.isoformat(),
            "period_end": end.isoformat(),
            "performance_percentage": stats["completion_percentage"],
            "performance_status": status,
            "content": summary,
        },
        "stats": stats,
    }