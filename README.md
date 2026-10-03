# StudyLoop Backend

Backend for StudyLoop - a web app to help maintain consistency with work and goals.

## Overview

This is the FastAPI backend that powers the StudyLoop application. It provides:

- User authentication and authorization
- Task and schedule management
- Performance tracking
- AI planning assistance (planned for Phase 2)

## API Documentation

See `docs/openapi.json` for the full API specification.

## Database

SQLite is used for local development. In production, this would be replaced with a more robust database.

## Setup

1. Install dependencies: `pip install -r requirements.txt`
2. Copy `.env.template` to `.env` and configure settings
3. Run the server: `uvicorn main:app --reload`

## Structure

- `src/` - Application source code
  - `api/` - FastAPI routes and endpoints
  - `core/` - Business logic and services
  - `db/` - Database models and service layer
  - `security/` - Authentication and security utilities
  - `config/` - Application configuration
- `tests/` - Test files
- `docs/` - API documentation

## API Endpoints

- `/auth/` - Authentication endpoints
- `/tasks/` - Task management endpoints
- `/plans/` - Schedule/plan management endpoints
- `/performance/` - Performance tracking endpoints
- `/chat/` - AI chat endpoints (planned for Phase 2)