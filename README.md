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

## Run everything (recommended)

Each entry point creates the Python virtual environment (if missing) and then starts the backend and frontend together.

- **Linux / macOS:** `./dev.sh` — combined logs in one terminal, Ctrl+C stops both.
- **Windows CMD:** `dev.bat`
- **Windows PowerShell:** `dev.ps1` — opens a window for each service.

`dev.sh` overrides: `BACKEND_PORT`, `FRONTEND_PORT`, `PYTHON`.

## Run the backend

Linux / macOS:
```bash
cd backend
../.venv/bin/python -m uvicorn src.main:app --reload
# API + /docs at http://127.0.0.1:8000
```

Windows (PowerShell, from the repo root):
```powershell
cd backend
..\.venv\Scripts\python.exe -m uvicorn src.main:app --reload
```

Verify the backend: Linux `../.venv/bin/python tests/test_auth_final.py` · Windows `..\.venv\Scripts\python.exe tests\test_auth_final.py`

## Run the frontend

Linux / macOS:
```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
npm run build        # production build into frontend/dist
```

Windows (PowerShell):
```powershell
cd frontend
npm install
npm run dev
```

## AI model (Ollama + gemma3:4b)

The app talks to a local Ollama server (`OLLAMA_BASE_URL` / `OLLAMA_MODEL` in `.env`, default model `gemma3:4b`).

Install Ollama:
- **Linux / macOS:**
  ```bash
  curl -fsSL https://ollama.com/install.sh | sh
  ```
- **Windows:** download from https://ollama.com/download (or `winget install Ollama.Ollama`) and run the installer.

Pull the model the app uses:
```bash
ollama pull gemma3:4b
```

Start Ollama if it is not already running: `ollama serve`.

The app degrades gracefully when the model is unavailable — chat returns a clear error and performance reports fall back to a computed summary.

## Testing

- Backend suites: `backend/tests/` (auth + end-to-end Phase 2 checks).
- Authentication: `cd backend && ../.venv/bin/python tests/test_auth_final.py`

## Notes

- Database: SQLite file lives at `backend/Database/studyloop.db` (see `DATABASE_URL`).
- Windows: the backend source currently hardcodes Linux-style absolute `sys.path`
  entries, so a native-Windows run needs those paths adjusted in `backend/src`
  (a backend change) or a WSL environment. The Windows entry points still handle
  venv creation and launching the backend + frontend.
- If PowerShell blocks scripts, run with:
  `powershell -ExecutionPolicy Bypass -File dev.ps1`