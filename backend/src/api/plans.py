#!/usr/bin/env python3
"""
Plans API endpoints.

A plan belongs to exactly one user and groups their tasks. Task workloads are
validated against the backend-enforced daily limits whenever tasks are created.
"""

import sys
from datetime import date
from typing import List, Optional

sys.path.insert(0, '/home/kevin/Desktop/Github/StudyLoop/backend/src')

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text

from api.auth import get_current_user
from db.models import BaseService
from db.session import db
from services import ai
from services.workload import check_within_limits, validate_plan_payload

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


class PlanTaskIn(BaseModel):
    task_name: str
    date: date
    estimated_duration: Optional[int] = None


class PlanCreate(BaseModel):
    title: str
    goal_information: Optional[str] = None
    tasks: List[PlanTaskIn] = []


class PlanGenerate(BaseModel):
    goal: str


def _get_owned_plan(user_id: int, plan_id: int) -> dict:
    row = service.fetchone(
        "SELECT * FROM plans WHERE id = :id AND user_id = :uid",
        {"id": plan_id, "uid": user_id},
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Plan not found")
    return _to_dict(row)


def _plan_tasks(user_id: int, plan_id: int) -> list:
    rows = service.fetchall(
        "SELECT * FROM tasks WHERE plan_id = :pid AND user_id = :uid ORDER BY id",
        {"pid": plan_id, "uid": user_id},
    )
    return [_task_to_dict(r) for r in rows]


def _day_total_minutes(user_id: int, day: date) -> int:
    rows = service.fetchall(
        "SELECT estimated_duration FROM tasks "
        "WHERE user_id = :uid AND date = :day",
        {"uid": user_id, "day": day},
    )
    return sum(_to_dict(r)["estimated_duration"] or 0 for r in rows)


def _validate_task_workload(user_id: int, tasks: List[PlanTaskIn]) -> None:
    """Ensure no day's total (existing + new) exceeds the enforced limits."""
    day_new: dict = {}
    for t in tasks:
        duration = t.estimated_duration or 0
        day_new[t.date] = day_new.get(t.date, 0) + duration

    for day, added in day_new.items():
        try:
            check_within_limits(
                _day_total_minutes(user_id, day), added, enforce_min=True
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc))


def _insert_plan_with_tasks(user_id: int, plan_id: int, tasks: List[PlanTaskIn]) -> list:
    for t in tasks:
        service.execute(
            "INSERT INTO tasks "
            "(plan_id, user_id, task_name, date, estimated_duration, completed) "
            "VALUES (:plan_id, :user_id, :task_name, :date, :estimated_duration, 0)",
            {
                "plan_id": plan_id,
                "user_id": user_id,
                "task_name": t.task_name,
                "date": t.date,
                "estimated_duration": t.estimated_duration,
            },
        )
    service.commit()
    return _plan_tasks(user_id, plan_id)


@router.post("/")
def create_plan(payload: PlanCreate, user=Depends(get_current_user)):
    """Create a plan, optionally with tasks, enforcing daily workload limits."""
    user_id = _to_dict(user)["id"]
    if not payload.title or not payload.title.strip():
        raise HTTPException(status_code=400, detail="Plan title is required.")
    _validate_task_workload(user_id, payload.tasks)

    service.execute(
        "INSERT INTO plans (user_id, title, goal_information) "
        "VALUES (:uid, :title, :goal)",
        {
            "uid": user_id,
            "title": payload.title.strip(),
            "goal": payload.goal_information,
        },
    )
    service.commit()
    plan_id = service.scalar(text("SELECT last_insert_rowid()"))
    created_tasks = _insert_plan_with_tasks(user_id, plan_id, payload.tasks)
    return {"plan": {**_get_owned_plan(user_id, plan_id), "tasks": created_tasks}}


@router.get("/{plan_id}")
def get_plan(plan_id: int, user=Depends(get_current_user)):
    """Get a plan and its tasks."""
    user_id = _to_dict(user)["id"]
    plan = _get_owned_plan(user_id, plan_id)
    return {"plan": {**plan, "tasks": _plan_tasks(user_id, plan_id)}}


@router.patch("/{plan_id}")
def update_plan(plan_id: int, payload: PlanCreate, user=Depends(get_current_user)):
    """Update a plan's title/goal information."""
    user_id = _to_dict(user)["id"]
    _get_owned_plan(user_id, plan_id)
    if not payload.title or not payload.title.strip():
        raise HTTPException(status_code=400, detail="Plan title is required.")
    service.execute(
        "UPDATE plans SET title = :title, goal_information = :goal "
        "WHERE id = :id AND user_id = :uid",
        {
            "title": payload.title.strip(),
            "goal": payload.goal_information,
            "id": plan_id,
            "uid": user_id,
        },
    )
    service.commit()
    return {"plan": {**_get_owned_plan(user_id, plan_id), "tasks": _plan_tasks(user_id, plan_id)}}


@router.post("/{plan_id}/add-tasks")
def add_tasks_to_plan(plan_id: int, payload: PlanCreate, user=Depends(get_current_user)):
    """Add tasks to an existing plan with workload validation."""
    user_id = _to_dict(user)["id"]
    _get_owned_plan(user_id, plan_id)
    if not payload.tasks:
        raise HTTPException(status_code=400, detail="No tasks to add.")
    _validate_task_workload(user_id, payload.tasks)
    _insert_plan_with_tasks(user_id, plan_id, payload.tasks)
    return {"plan": {**_get_owned_plan(user_id, plan_id), "tasks": _plan_tasks(user_id, plan_id)}}


@router.delete("/{plan_id}")
def delete_plan(plan_id: int, user=Depends(get_current_user)):
    """Delete a plan and its tasks."""
    user_id = _to_dict(user)["id"]
    _get_owned_plan(user_id, plan_id)
    service.execute(
        "DELETE FROM tasks WHERE plan_id = :pid AND user_id = :uid",
        {"pid": plan_id, "uid": user_id},
    )
    service.execute(
        "DELETE FROM plans WHERE id = :id AND user_id = :uid",
        {"id": plan_id, "uid": user_id},
    )
    service.commit()
    return {"message": "Plan deleted"}


@router.post("/generate")
def generate_plan(payload: PlanGenerate, user=Depends(get_current_user)):
    """Ask the AI to propose a plan from a goal.

    The returned plan is validated but NOT stored — the frontend shows it to
    the user, who confirms (POST /plans) before anything is persisted.
    """
    try:
        proposal = ai.generate_plan(payload.goal)
        validated = validate_plan_payload(proposal)
    except ai.AIUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except (ai.AIValidationError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    # Serialize dates back to ISO strings for the client.
    proposed_tasks = [
        {
            "task_name": t["task_name"],
            "date": t["date"].isoformat(),
            "estimated_duration": t["estimated_duration"],
        }
        for t in validated["tasks"]
    ]
    return {"proposal": {"title": validated["title"], "tasks": proposed_tasks}}