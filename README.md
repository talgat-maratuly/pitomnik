# Питомник — QR-отчёты о работах

Стек: **PostgreSQL + TypeORM + NestJS + React**.

## Быстрый старт

### 1. PostgreSQL

Создайте базу данных (локально или в Docker):

```bash
docker run --name pitomnik-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=pitomnik -p 5432:5432 -d postgres:16
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run migration:run
npm run seed
npm run start:dev
```

API: **http://localhost:3001/api**

Миграции применяются автоматически при старте (`DB_MIGRATE=true`).

### 3. Frontend

В корне проекта:

```bash
npm install
npm run dev
```

Приложение: **http://localhost:5173/admin**

## Переменные окружения

### Frontend (`.env`)

```
# API
VITE_API_URL=http://localhost:3001/api

# App
VITE_APP_URL=http://localhost:5173
VITE_NURSERY_NAME=Питомник основной
```

### Backend (`backend/.env`)

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
| Фото | `backend/uploads/photos/` |
| Тексты формы (заголовок, подсказки) | localStorage браузера |

## Цепочка

```
Объект → Участок → QR → /work-form/PIT-001 → отчёт → журнал → Excel
```

## Структура

```
backend/          NestJS + TypeORM + PostgreSQL
src/              React frontend
```
