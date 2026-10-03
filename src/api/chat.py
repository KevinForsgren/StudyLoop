#!/usr/bin/env python3
"""
Chat API endpoints.

Lets the authenticated user have a conversation with the local AI. Each
exchange is persisted in the Chats table. When the AI is unavailable a clear
503 is returned so the frontend can let the user retry.
"""

import sys
from datetime import date, datetime, timezone

sys.path.insert(0, '/home/kevin/Desktop/Github/StudyLoop/src')

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text

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
    "practical and encouraging. Never ask for sensitive account data."
)


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