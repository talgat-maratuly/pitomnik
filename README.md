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

Локально орнатылған PostgreSQL қажет. `pitomnik` базасын жасап, `apps/api/.env` параметрлерін өз ортаңызға сәйкес толтырыңыз.

### 3. Миграции и seed (первый раз)

```bash
npm run migration:run
npm run seed
```

### 4. Запуск (api + web вместе)

```bash
npm run dev
```

| Сервис | URL |
|--------|-----|
| Админка | http://localhost:5173/admin |
| API | http://localhost:3001/api |

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
| Тексты формы | localStorage браузера |

## Цепочка

```
Объект → Участок → QR → /work-form/PIT-001 → отчёт → журнал → Excel
```
