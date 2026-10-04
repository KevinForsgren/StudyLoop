#!/usr/bin/env python3
"""
Chat API endpoints.

Lets the authenticated user have a conversation with the local AI. Each
exchange is persisted in the Chats table. When the AI is unavailable a clear
503 is returned so the frontend can let the user retry.
"""

import sys
from datetime import date, datetime, timezone

sys.path.insert(0, '/home/kevin/Desktop/Github/StudyLoop/backend/src')

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from api.auth import get_current_user
from db.models import BaseService
from db.session import db
from services import ai

router = APIRouter(dependencies=[Depends(get_current_user)])
service = BaseService(db.get_session())


def _to_dict(row):
    return dict(row._asdict()) if hasattr(row, "_asdict") else dict(row)


class ChatRequest(BaseModel):
    message: str


SYSTEM_PROMPT = (
    "You are StudyLoop's planning assistant. Help the user break their goals "
    "into realistic tasks and stay consistent with their schedule. Be concise, "
    "practical and encouraging. Never ask for sensitive account data.\n\n"
    "When the user asks you to CREATE a plan, schedule, or add tasks, do TWO things:\n"
    "1) Reply with a short plain-text confirmation.\n"
    "2) Then append a JSON code block exactly like this (no other JSON):\n"
    '```json\n{"tasks": [{"task_name": "Short task name", "date": "YYYY-MM-DD", '
    '"estimated_duration": 40}]}\n```\n'
    "JSON rules:\n"
    "- task_name is a short non-empty string.\n"
    "- date is YYYY-MM-DD and must be TODAY or a FUTURE date (never a past date).\n"
    "- estimated_duration is an integer number of minutes between 1 and 600.\n"
    "- You may include multiple tasks in the array.\n"
    "- Only append the JSON block when the user actually wants tasks/plans created. "
    "Otherwise reply with plain text only and no JSON block.\n"
)


@router.get("/history")
def chat_history(user=Depends(get_current_user)):
    """Return the user's recent chat exchanges (newest first)."""
    user_id = _to_dict(user)["id"]
    rows = service.fetchall(
        "SELECT * FROM chats WHERE user_id = :uid ORDER BY id DESC LIMIT 50",
        {"uid": user_id},
    )
    chats = []
    for r in rows:
        d = _to_dict(r)
        chats.append(
            {
                "id": d["id"],
                "message": d["message"],
                "response": d["response"],
                "date": str(d["date"]),
                "time": d["time"],
            }
        )
    return {"chats": chats}


@router.post("/")
def chat(payload: ChatRequest, user=Depends(get_current_user)):
    """Send a message to the AI and store the exchange for the user."""
    user_id = _to_dict(user)["id"]
    message = payload.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    try:
        ai_reply = ai.chat(
            [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": message},
            ]
        )
    except (ai.AIUnavailableError, ai.AIValidationError) as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    service.execute(
        "INSERT INTO chats (user_id, message, response, date, time) "
        "VALUES (:uid, :message, :response, :day, :time)",
        {
            "uid": user_id,
            "message": message,
            "response": ai_reply,
            "day": date.today(),
            "time": datetime.now(timezone.utc).strftime("%H:%M"),
        },
    )
    service.commit()

    return {"response": ai_reply, "message": message}