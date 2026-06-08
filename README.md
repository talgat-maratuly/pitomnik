# Питомник — QR-отчёты о работах

Полностью **локальный** стек: SQLite + NestJS + React. Docker и PostgreSQL не нужны.

## Быстрый старт

### 1. Backend (база SQLite создаётся автоматически)

```bash
cd backend
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

API: **http://localhost:3001/api**  
База: `backend/prisma/dev.db`

### 2. Frontend

В корне проекта:

```bash
npm install
npm run dev
```

Приложение: **http://localhost:5173/admin**

## Переменные окружения

### Frontend (`.env`)

```
VITE_API_URL=http://localhost:3001/api
VITE_APP_URL=http://localhost:5173
VITE_NURSERY_NAME=Питомник основной
```

### Backend (`backend/.env`)

```
DATABASE_URL="file:./dev.db"
PORT=3001
FRONTEND_URL=http://localhost:5173
API_PUBLIC_URL=http://localhost:3001
```

## Что где хранится

| Данные | Где |
|--------|-----|
| Объекты, участки, журнал, виды работ | SQLite `backend/prisma/dev.db` |
| Фото | `backend/uploads/photos/` |
| Тексты формы (заголовок, подсказки) | localStorage браузера |

## Цепочка

```
Объект → Участок → QR → /work-form/PIT-001 → отчёт → журнал → Excel
```

## Структура

```
backend/          NestJS + Prisma + SQLite
src/              React frontend
```
