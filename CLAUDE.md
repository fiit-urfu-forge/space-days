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

### Локальный запуск

Для быстрого запуска обоих сервисов из корня репозитория:
```bash
# Frontend (порт 3000) — в одном терминале
cd frontend && npm start

# Backend (порт 8080) — в другом терминале
cd backend && pip install -r requirements.txt && python3 main.py
```

В Codespaces порт бэкенда по умолчанию закрыт — нужно открыть его вручную:
```bash
gh codespace ports visibility 8080:public -c $CODESPACE_NAME
```

Без переменных окружения фронтенд работает в offline-режиме с sample-данными (`REACT_APP_API_BASE_URL` пуст), а бэкенд запустится, но не сможет подключиться к YDB без `DB` и `ENDPOINT`.

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

## Деплой на Staging

Staging доступен по URL: `https://d5d01gtvhjuka0q70t5r.apigw.yandexcloud.net`

API Gateway (`dnikosmosa-staging`) проксирует:
- `/` и `/{file}` → S3 бакет `space-days-staging` (frontend)
- `/api/*`, `/docs`, `/openapi.json` → Serverless Container `bbahf3fnuhlmqmjterui` (backend)

### Предварительные требования

- **Docker** — установлен и запущен
- **Yandex Cloud CLI (`yc`)** — установлен и авторизован
- **s3cmd** — установлен и настроен для Yandex Object Storage
- **Node.js / npm** — для сборки frontend

### Первичная настройка окружения (один раз)

```bash
# 1. Установить Yandex Cloud CLI
curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash
source ~/.bashrc  # или exec -l $SHELL

# 2. Авторизоваться в Yandex Cloud
yc config set token <OAUTH_TOKEN>
yc config set cloud-id b1gs6rm7jilgibstbues
yc config set folder-id b1g4dt2al06qnmvej9jq

# 3. Настроить Docker для Yandex Container Registry
yc container registry configure-docker

# 4. Установить s3cmd
pip3 install s3cmd

# 5. Настроить s3cmd — создать ~/.s3cfg:
# [default]
# access_key = <ACCESS_KEY_ID>
# secret_key = <SECRET_ACCESS_KEY>
# host_base = storage.yandexcloud.net
# host_bucket = %(bucket)s.storage.yandexcloud.net
# use_https = True
# signature_v2 = True
#
# Ключи можно создать: yc iam access-key create --service-account-id aje01gteii89n8aho63b
```

### Повторный деплой

```bash
# Backend
cd backend
./update_backend_staging.sh

# Frontend
cd frontend
npm run deploy:staging
```

Скрипт backend собирает Docker-образ, пушит в Container Registry и деплоит новую ревизию Serverless Container. Скрипт frontend собирает React-приложение с `.env.staging` и загружает build в S3 бакет.

## Email System (Notisend)

Письма отправляются через pull-based очередь, а не синхронно из API.

**Поток:**
1. `POST /api/events/subscribe` → `save_new_mailing(is_send=False)` в таблицу `mailings` (YDB)
2. Отдельный процесс `main_mailer.py` опрашивает таблицу, забирает до 20 записей, шлёт через Notisend API (шаблон 782569), помечает `is_send=True`, пишет `sending_log`

**Развёртывание mailer:**
- Mailer развёрнут **только в production** — читает production-БД (`etn2egari06s1uugo1dn`) и отправляет реальные письма
- На staging mailer **не развёрнут** — записи `mailings` остаются в БД, но письма не отправляются
- Локально — та же staging-БД, письма тоже не отправляются (mailer не запущен)

**Конфигурация mailer (`backend/src/mailer/config.py`):**
- API_TOKEN и YDB-подключение **захардкожены**, env vars не читаются
- Захардкоженная БД в коде = staging (`etnct5k5881k8ulft373`), но в production используется production-БД

**Особенности:**
- `.env` и `.env.staging` указывают на одну и ту же БД — local и staging делят данные
- Нет механизма подавления писем в коде (нет dry-run, DEBUG-флага), но на практике письма отправляются только в production, т.к. только там запущен mailer

## UI/UX Guidelines

- **Инлайн-формы:** Для добавления элементов в списки/таблицы использовать компактную строку (инпуты + кнопка в одну линию) вместо модальных форм с отдельной кнопкой "Отмена"

## Important Conventions

- **Phone normalization:** Russian phone numbers are normalized to 10 digits (strips +7/8 prefix)
- **YDB queries:** Use YDB's SQL dialect (not standard SQL); queries use `DECLARE` for parameters
- **Environment files:** `.env.staging` and `.env.production` hold env-specific config (not committed)
- **Required env vars:** `DB`, `ENDPOINT` (YDB), `API_TOKEN` (Notisend), `BOT_TOKEN` (Telegram), `REACT_APP_API_BASE_URL`
- **CORS:** Configured with wildcard origins
- **Frontend offline mode:** When `REACT_APP_API_BASE_URL` is empty, the frontend uses hardcoded sample data
