#!/usr/bin/env python3
"""
Workload enforcement rules.

The backend enforces a minimum and maximum daily planned workload so that an
AI-generated (or manually entered) schedule always keeps the user progressing
toward their goals without becoming unachievable.
"""

from datetime import date
from typing import List, Optional

# Backend-enforced daily limits (in minutes).
MIN_WORKLOAD_MINUTES = 90     # 1 hour 30 minutes per day
MAX_WORKLOAD_MINUTES = 600    # 10 hours per day


def check_within_limits(
    current_total: int,
    additional: int = 0,
    enforce_min: bool = False,
) -> int:
    """Return the new daily total after adding ``additional`` minutes.

    Raises ``ValueError`` when the resulting daily workload exceeds the
    guaranteed maximum, or (when ``enforce_min`` is set) falls below the
    guaranteed minimum.
    """
    new_total = current_total + additional
    if new_total > MAX_WORKLOAD_MINUTES:
        raise ValueError(
            f"Daily workload would be {new_total} minutes, exceeding the "
            f"maximum of {MAX_WORKLOAD_MINUTES} minutes (10 hours)."
        )
    if enforce_min and new_total < MIN_WORKLOAD_MINUTES:
        raise ValueError(
            f"Daily workload is {new_total} minutes, below the minimum of "
            f"{MIN_WORKLOAD_MINUTES} minutes (1 hour 30 minutes)."
        )
    return new_total


def _parse_date(value) -> date:
    if isinstance(value, date):
        return value
    return date.fromisoformat(str(value))


def validate_plan_payload(data) -> dict:
    """Validate a proposed AI/manual plan structure.

    Ensures the payload contains a title and a list of tasks where every task
    has a name, a valid date and a positive estimated duration, and that no
    single day's total planned work exceeds the enforced limits.

    Returns the validated plan dict (durations coerced to int). Raises
    ``ValueError`` with a human-readable message otherwise.
    """
    if not isinstance(data, dict):
        raise ValueError("Plan must be a JSON object.")
    title = data.get("title")
    tasks = data.get("tasks")
    if not title or not str(title).strip():
        raise ValueError("Plan is missing a title.")
    if not isinstance(tasks, list):
        raise ValueError("Plan is missing a 'tasks' list.")

    normalized = {"title": str(title).strip(), "tasks": []}
    day_totals: dict = {}

    for idx, task in enumerate(tasks):
        if not isinstance(task, dict):
            raise ValueError(f"Task #{idx + 1} must be an object.")
        task_name = task.get("task_name") or task.get("name")
        if not task_name or not str(task_name).strip():
            raise ValueError(f"Task #{idx + 1} is missing a name.")

        raw_date = task.get("date")
        if not raw_date:
            raise ValueError(f"Task '{task_name}' is missing a date.")
        try:
            task_date = _parse_date(raw_date)
        except (TypeError, ValueError):
            raise ValueError(f"Task '{task_name}' has an invalid date '{raw_date}'.")

        raw_duration = task.get("estimated_duration") or task.get("duration")
        try:
            duration = int(raw_duration)
        except (TypeError, ValueError):
            raise ValueError(f"Task '{task_name}' has an invalid duration.")
        if duration <= 0:
            raise ValueError(
                f"Task '{task_name}' duration must be a positive number of minutes."
            )

        day_totals.setdefault(task_date, 0)
        day_totals[task_date] = check_within_limits(
            day_totals[task_date], duration, enforce_min=False
        )

        normalized["tasks"].append(
            {
                "task_name": str(task_name).strip(),
                "date": task_date,
                "estimated_duration": duration,
            }
        )

    return normalized