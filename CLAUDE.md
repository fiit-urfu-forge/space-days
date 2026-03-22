# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Space Days is a full-stack event registration platform for space-themed activities. Users can browse events, register (with optional child attendees), receive tickets, and get email notifications. A Telegram bot handles ticket verification.

## Tech Stack

- **Frontend:** React 18 + TypeScript + React Router v6 + React Bootstrap 5 + CSS Modules
- **Backend:** Python 3.11 + FastAPI + Pydantic 1.x
- **Database:** YandexDB (YDB) — not a standard SQL database
- **Email:** Notisend API integration
- **Telegram Bot:** aiogram 2.x
- **Deployment:** Yandex Cloud Serverless Containers (backend), S3 bucket (frontend)

## Build & Run Commands

### Frontend (`/frontend`)
```bash
npm start                    # Dev server (react-app-rewired)
npm test                     # Jest + React Testing Library
npm run lint                 # ESLint
npm run build:staging        # Build with .env.staging
npm run build:production     # Build with .env.production
npm run deploy:staging       # Build + deploy to S3
```
Note: `npm run build` intentionally fails — must use `build:staging` or `build:production`.

### Backend (`/backend`)
```bash
python3 backend/main.py      # API server on 0.0.0.0:8080
python3 backend/main_bot.py  # Telegram bot
```

### Database
YDB always runs remotely on Yandex Cloud — there is no local database setup. Connection is configured via `DB` and `ENDPOINT` env vars.

## Architecture

### Backend Structure (`backend/src/`)
The backend follows a layered pattern:
- **`app/endpoints/app.py`** — All FastAPI routes and query logic
- **`app/adapters/repository.py`** — YDB client, connection pooling, query execution
- **`app/domain/model.py`** — Pydantic request/response models
- **`app/core.py`** — Date conversion utilities
- **`app/utils/`** — Logger, datetime и xlsx утилиты
- **`app/config.py`** — Environment-based configuration
- **`bot/`** — Telegram bot (aiogram) with its own repository layer
- **`mailer/`** — Email notification service using Notisend API
- **`static/`** — Static HTML files (Yandex suggest SDK)

Entry points находятся в `backend/`: `main.py` (API), `main_bot.py` (бот), `main_mailer.py` (рассылка).

### Frontend Structure (`frontend/src/`)
Фронтенд на TypeScript с CSS Modules (`styles.module.css`):
- **`pages/main/`** — Пользовательские страницы (home, events, registration, tickets)
- **`pages/admin/`** — Админ-панель (events, partners, users, export, login)
- **`components/layouts/`** — Main layout (header + footer) и admin layout (sidebar)
- **`components/`** — Переиспользуемые компоненты (формы, карточки, кнопки, loaders)
- **`apis/backend.js`** — API client; falls back to sample data when `REACT_APP_API_BASE_URL` is empty
- **`shared/image/`** — Статические изображения

### Key API Endpoints
- `GET /api/events/` — List events (filterable by event ID, day, hour)
- `POST /api/events/subscribe` — Register user for an event slot
- `POST /api/tickets/my` — Retrieve tickets by phone + birthdate
- `POST /api/event` — Create event with slots (admin)
- `POST /api/emails/subscribe` — Newsletter subscription

## Communication

Общайся на русском языке. Термины, связанные с программированием (названия технологий, команды, код), можно оставлять на английском.

## Important Conventions

- **Phone normalization:** Russian phone numbers are normalized to 10 digits (strips +7/8 prefix)
- **YDB queries:** Use YDB's SQL dialect (not standard SQL); queries use `DECLARE` for parameters
- **Environment files:** `.env.staging` and `.env.production` hold env-specific config (not committed)
- **Required env vars:** `DB`, `ENDPOINT` (YDB), `API_TOKEN` (Notisend), `BOT_TOKEN` (Telegram), `REACT_APP_API_BASE_URL`
- **CORS:** Configured with wildcard origins
- **Frontend offline mode:** When `REACT_APP_API_BASE_URL` is empty, the frontend uses hardcoded sample data
