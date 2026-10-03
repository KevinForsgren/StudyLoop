# StudyLoop

A web app that helps a user stay consistent with their work and goals using a
locally hosted LLM for planning, a task/plan planner, a GitHub-style
consistency graph, performance reports, and a Pomodoro focus timer.

Frontend and backend live in separate directories and share a single `.env`
at the repository root.

## Layout

```
.
├── backend/    FastAPI + SQLite backend (Phase 1 & 2)
│   └── src/    Application source (api, db, security, services, config)
├── frontend/   React + Tailwind (Vite) frontend (Phase 3)
├── agent/      Project specifications (SPEC.md, BACKEND.md, UI.md)
├── .env        Shared config for both backend and frontend
└── .env.template
```

## Shared configuration

- One `.env` lives at the repository root and is read by both sides.
- Backend: `backend/src/config/settings.py` resolves it from the repo root and
  ignores any variable it does not declare (so `VITE_*` frontend vars are safe).
- Frontend: `frontend/vite.config.js` sets `envDir: '..'`, so Vite loads the
  same root `.env` and exposes `VITE_*` variables at build time.

## Run the backend

```bash
cd backend
../.venv/bin/python -m uvicorn src.main:app --reload
# API + /docs at http://127.0.0.1:8000
```

Verify: `../.venv/bin/python tests/test_auth_final.py`

## Run the frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
npm run build        # production build into frontend/dist
```

## Testing

- Backend suites: `backend/tests/` (auth + end-to-end Phase 2 checks).
- Authentication: `cd backend && ../.venv/bin/python tests/test_auth_final.py`

## Notes

- Database: SQLite file lives at `backend/studyloop.db` (see `DATABASE_URL`).
- AI: uses a local Ollama server (`OLLAMA_BASE_URL`/`OLLAMA_MODEL`). If the
  model is unavailable the app degrades gracefully (chat returns a clear error,
  performance reports fall back to a computed summary).