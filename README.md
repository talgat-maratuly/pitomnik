# Питомник — QR-отчёты о работах

Monorepo: **PostgreSQL + TypeORM + NestJS + React**.

```
pitomnik/
├── apps/
│   ├── api/          @pitomnik/api   — NestJS backend (:3001)
│   └── web/          @pitomnik/web   — React frontend (:5173)
├── scripts/
│   └── dev-all.mjs   — запуск api + web одной командой
└── package.json      — npm workspaces
```

## Быстрый старт

### 1. Установка

```bash
npm install
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

### 2. PostgreSQL

Локально орнатылған PostgreSQL 18 қажет (production-пен бірдей). `pitomnik` базасын жасап, `apps/api/.env` параметрлерін өз ортаңызға сәйкес толтырыңыз.

### 3. Миграции и seed (первый раз)

```bash
npm run migration:run
npm run seed
```

Seed можно также запустить через Swagger: `POST /api/seed/run` на http://localhost:3001/api/docs

### 4. Запуск (api + web вместе)

```bash
npm run dev
```

| Сервис | URL |
|--------|-----|
| Админка | http://localhost:5173/admin |
| API | http://localhost:3001/api |
| Swagger | http://localhost:3001/api/docs |

Отдельно:
```bash
npm run dev:api    # только backend
npm run dev:web    # только frontend
```

## Переменные окружения

### `apps/web/.env`

```
# API (dev: Vite proxy → localhost:3001)
VITE_API_URL=/api

# App
VITE_APP_URL=http://localhost:5173
VITE_NURSERY_NAME=Питомник основной
```

### `apps/api/.env`

```
# Database Configuration (PostgreSQL)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=pitomnik

# Server & URLs
PORT=3001
FRONTEND_URL=http://localhost:5173
API_PUBLIC_URL=http://localhost:3001
DB_MIGRATE=true
```

## Что где хранится

| Данные | Где |
|--------|-----|
| Объекты, участки, журнал, виды работ | PostgreSQL |
| Фото | `apps/api/uploads/photos/` |
| Настройки QR-формы | PostgreSQL |

## Цепочка

```
Объект → Участок → QR → /work-form/PIT-001 → отчёт → журнал → Excel
```

## Деплой (production)

- **API** — Docker (GHCR image + Postgres) на сервере `/opt/pitomnik/api`
- **Web** — статический Vite build + nginx на `/opt/pitomnik/web`
- **CI/CD** — GitHub Actions (`deploy-api.yml`, `deploy-web.yml`)

Secrets: `DB_PASSWORD`, `SSH_PRIVATE_KEY`. Variables: `SSH_HOST`, `SSH_USER`, `FRONTEND_URL`, `API_PUBLIC_URL`.

Подробно: [deploy/README.md](deploy/README.md)
