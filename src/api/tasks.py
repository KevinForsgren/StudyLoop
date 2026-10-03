#!/usr/bin/env python3
"""
Tasks API endpoints.

Every task belongs to a user and (per the schema) to a plan. All reads and
writes are scoped to the authenticated user so a user can never touch another
user's tasks.
"""

import sys
from datetime import date, datetime, timezone
from typing import Optional

sys.path.insert(0, '/home/kevin/Desktop/Github/StudyLoop/src')

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text

from api.auth import get_current_user
from db.models import BaseService
from db.session import db
from services.workload import check_within_limits

router = APIRouter(dependencies=[Depends(get_current_user)])
service = BaseService(db.get_session())


def _to_dict(row):
    return dict(row._asdict()) if hasattr(row, "_asdict") else dict(row)


def _task_to_dict(row):
    """Serialise a task row, exposing booleans as real JSON booleans."""
    data = _to_dict(row)
    if "completed" in data:
        data["completed"] = bool(data["completed"])
    return data


class TaskCreate(BaseModel):
    plan_id: int
    task_name: str
    date: date
    estimated_duration: Optional[int] = None


class TaskUpdate(BaseModel):
    task_name: Optional[str] = None
    date: Optional[date] = None
    estimated_duration: Optional[int] = None
    completed: Optional[bool] = None


def _get_owned_task(user_id: int, task_id: int) -> dict:
    row = service.fetchone(
        "SELECT * FROM tasks WHERE id = :id AND user_id = :uid",
        {"id": task_id, "uid": user_id},
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return _task_to_dict(row)


def _day_total_minutes(
    user_id: int, day: date, exclude_task_id: Optional[int] = None
) -> int:
    rows = service.fetchall(
        "SELECT id, estimated_duration FROM tasks "
        "WHERE user_id = :uid AND date = :day",
        {"uid": user_id, "day": day},
    )
    total = 0
    for r in rows:
        task = _to_dict(r)
        if exclude_task_id is not None and task["id"] == exclude_task_id:
            continue
        total += task["estimated_duration"] or 0
    return total


def _last_insert_id() -> int:
    return service.scalar(text("SELECT last_insert_rowid()"))


@router.get("/")
def get_tasks(user=Depends(get_current_user)):
    """List the authenticated user's tasks."""
    user_id = _to_dict(user)["id"]
    rows = service.fetchall(
        "SELECT * FROM tasks WHERE user_id = :uid ORDER BY date, id",
        {"uid": user_id},
    )
    return {"tasks": [_task_to_dict(r) for r in rows]}


@router.post("/")
def create_task(payload: TaskCreate, user=Depends(get_current_user)):
    """Create a task under one of the user's plans, enforcing workload limits."""
    user_id = _to_dict(user)["id"]
    plan = service.fetchone(
        "SELECT id FROM plans WHERE id = :id AND user_id = :uid",
        {"id": payload.plan_id, "uid": user_id},
    )
    if plan is None:
        raise HTTPException(status_code=404, detail="Plan not found")

    duration = payload.estimated_duration or 0
    try:
        check_within_limits(_day_total_minutes(user_id, payload.date), duration)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    service.execute(
        "INSERT INTO tasks "
        "(plan_id, user_id, task_name, date, estimated_duration, completed) "
        "VALUES (:plan_id, :user_id, :task_name, :date, :estimated_duration, 0)",
        {
            "plan_id": payload.plan_id,
            "user_id": user_id,
            "task_name": payload.task_name,
            "date": payload.date,
            "estimated_duration": payload.estimated_duration,
        },
    )
    service.commit()
    task = _get_owned_task(user_id, _last_insert_id())
    return {"task": task}


@router.get("/{task_id}")
def get_task(task_id: int, user=Depends(get_current_user)):
    """Get a single task owned by the user."""
    user_id = _to_dict(user)["id"]
    return {"task": _get_owned_task(user_id, task_id)}


@router.patch("/{task_id}")
def update_task(task_id: int, payload: TaskUpdate, user=Depends(get_current_user)):
    """Update task fields, re-enforcing workload limits when they change."""
    user_id = _to_dict(user)["id"]
    task = _get_owned_task(user_id, task_id)

    fields = payload.dict(exclude_unset=True)
    if not fields:
        return {"task": task}

    new_date = fields.get("date", task["date"])
    new_duration = fields.get("estimated_duration", task["estimated_duration"]) or 0
    try:
        check_within_limits(
            _day_total_minutes(user_id, new_date, exclude_task_id=task_id),
            new_duration,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    set_clause = ", ".join(f"{col} = :{col}" for col in fields)
    params = {**fields, "id": task_id, "uid": user_id}
    service.execute(
        f"UPDATE tasks SET {set_clause} WHERE id = :id AND user_id = :uid",
        params,
    )
    service.commit()
    return {"task": _get_owned_task(user_id, task_id)}


@router.delete("/{task_id}")
def delete_task(task_id: int, user=Depends(get_current_user)):
    """Delete a task owned by the user."""
    user_id = _to_dict(user)["id"]
    _get_owned_task(user_id, task_id)  # raises 404 when not owned
    service.execute(
        "DELETE FROM tasks WHERE id = :id AND user_id = :uid",
        {"id": task_id, "uid": user_id},
    )
    service.commit()
    return {"message": "Task deleted"}


@router.post("/{task_id}/complete")
def complete_task(task_id: int, user=Depends(get_current_user)):
    """Mark a task as completed (with timestamp) if owned by the user."""
    user_id = _to_dict(user)["id"]
    task = _get_owned_task(user_id, task_id)
    if not task["completed"]:
        service.execute(
            "UPDATE tasks SET completed = 1, completed_at = :ts "
            "WHERE id = :id AND user_id = :uid",
            {"ts": datetime.now(timezone.utc), "id": task_id, "uid": user_id},
        )
        service.commit()
    return {"task": _get_owned_task(user_id, task_id)}