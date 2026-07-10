# Doodle Jump — Pixel Edition

Браузерная аркада в жанре endless-jumper, вдохновлённая оригинальным Doodle Jump. Игрок управляет персонажем, который прыгает по платформам вверх. Реализована система аутентификации, глобальная таблица лидеров в реальном времени и несколько видов платформ/препятствий.

---

## Содержание

- [Стек технологий](#стек-технологий)
- [Архитектура проекта](#архитектура-проекта)
- [Игровой движок](#игровой-движок)
- [API](#api)
- [Модель данных](#модель-данных)
- [Структура файлов](#структура-файлов)
- [Запуск в разработке](#запуск-в-разработке)
- [Production-развёртывание](#production-развёртывание)
- [Переменные окружения](#переменные-окружения)

---

## Стек технологий

### Клиент (`client/`)

| Технология | Версия | Назначение |
|---|---|---|
| [Vite](https://vitejs.dev/) | ^8 | Dev-сервер, сборка и бандлинг |
| [Three.js](https://threejs.org/) | ^0.183 | 3D-рендеринг игровой сцены |
| JavaScript (ESM) | — | Вся логика клиента |
| CSS (custom) | — | Pixel-art UI, Press Start 2P, CRT-эффект |

### Сервер (`server/`)

| Технология | Версия | Назначение |
|---|---|---|
| [NestJS](https://nestjs.com/) | ^10 | HTTP-фреймворк (TypeScript) |
| [Prisma](https://www.prisma.io/) | ^5 | ORM, миграции |
| [PostgreSQL](https://www.postgresql.org/) | — | БД (Supabase-hosted) |
| [Passport.js](http://www.passportjs.org/) + JWT | — | Аутентификация |
| [bcrypt](https://github.com/kelektiv/node.bcrypt.js) | — | Хэширование паролей |
| `@nestjs/serve-static` | — | Раздача фронтенда из `client/dist` |
| `class-validator` | — | Валидация DTO |

---

## Архитектура проекта

Проект организован как **монорепо** с двумя приложениями:

```
doodle-jump/
├── client/        ← браузерная игра (Vite + Three.js)
└── server/        ← REST API + статика (NestJS + PostgreSQL)
```

### Схема взаимодействия

```
┌─────────────────────────────────────────────────────────┐
│  Браузер                                                │
│                                                         │
│  ┌─────────────┐   ┌──────────────┐   ┌─────────────┐  │
│  │ Legend Panel│   │  Game Shell  │   │  Leaderboard│  │
│  │  (LegendUI) │   │  (Three.js)  │   │   (LB UI)   │  │
│  │             │   │  480 px фикс │   │  polling 12s│  │
│  └─────────────┘   └──────┬───────┘   └──────┬──────┘  │
│                           │                  │          │
│              ┌────────────▼──────────────────▼──────┐  │
│              │            GameApp (оркестратор)      │  │
│              │  AuthApi ─── fetch ──► /api/*         │  │
│              └───────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                              │ HTTP / JWT
┌─────────────────────────────▼───────────────────────────┐
│  NestJS Server (:3000)                                  │
│                                                         │
│  AuthController     UsersController                     │
│  POST /api/auth/register    GET  /api/users/leaderboard │
│  POST /api/auth/login       GET  /api/users/me          │
│  GET  /api/auth/me          PATCH /api/users/me/score   │
│                             PATCH /api/users/me/username│
│                                                         │
│  AuthService ◄──► UsersService ◄──► PrismaService       │
│                                          │              │
│                              ┌───────────▼───────────┐  │
│                              │  PostgreSQL (Supabase) │  │
│                              └───────────────────────┘  │
│                                                         │
│  ServeStatic: client/dist/** (все не-API маршруты)      │
└─────────────────────────────────────────────────────────┘
```

### Принципы дизайна

- **Монолитный деплой**: один процесс Node.js раздаёт и API и статику клиента — нет необходимости в отдельном веб-сервере (nginx/Caddy).
- **JWT без сессий**: сервер stateless. Токен хранится в `localStorage`, отправляется в `Authorization: Bearer`.
- **Публичный ID**: внутренний `BigInt id` никогда не покидает сервер. Наружу отдаётся только `publicId` (UUID).
- **Живой счёт без WebSocket**: `LeaderboardUI` опрашивает `/api/users/leaderboard` каждые 12 секунд.

---

## Игровой движок

Игра построена на **Three.js** с `OrthographicCamera`, всё в координатной системе игрового мира (14 × 24 единицы).

### Сущности (`client/src/game/entities/`)

| Файл | Назначение |
|---|---|
| `Doodler.js` | Персонаж игрока, три скина (Hero / Robot / Mage), физика прыжка |
| `PlatformManager.js` | Пул из 28 платформ, четыре типа: normal / super / float / crumble |
| `BarrierManager.js` | Препятствия-барьеры, физика столкновений |

### Типы платформ

| Тип | Цвет | Поведение |
|---|---|---|
| `normal` | разный | Обычная, бесконечная |
| `super` | ярко-жёлтый | Сверх-прыжок (×2.5 скорость) |
| `float` | анимация волны | Исчезает после одного отскока |

### Игровой цикл (`GameWorld.js`)

```
requestAnimationFrame → GameApp.loop(dt)
  → InputController.getHorizontal()
  → GameWorld.update(dt, dx, doShoot)
      → Doodler.update()         ← физика: гравитация, прыжки
      → PlatformManager.update() ← анимация float, переработка пула
      → BarrierManager.update()  ← движение барьеров
      → collision detection      ← платформы, барьеры, сердца
      → camera follow            ← OrthographicCamera по Y
  → leaderboardUI.setLiveScore() ← живой счёт в правой панели
```

### Слои UI

| Класс | Описание |
|---|---|
| `OverlayUI` | Все оверлеи поверх игры: меню, паузу, настройки, auth-форму |
| `LegendUI` | Левая панель (только десктоп): управление, персонажи, платформы |
| `LeaderboardUI` | Правая панель (только десктоп): топ-10 + живой счёт |
| `GameApp` | Оркестратор: состояния, переходы, связь UI ↔ движок ↔ API |

---

## API

Все эндпоинты с префиксом `/api`. Защищённые требуют `Authorization: Bearer <JWT>`.

### Аутентификация

| Метод | Путь | Тело | Описание |
|---|---|---|---|
| `POST` | `/api/auth/register` | `{ username, email, password }` | Регистрация, возвращает `{ accessToken, user }` |
| `POST` | `/api/auth/login` | `{ username, password }` | Вход, возвращает `{ accessToken, user }` |
| `GET` | `/api/auth/me` | — 🔒 | Свежие данные пользователя из БД |

### Пользователи

| Метод | Путь | Тело | Описание |
|---|---|---|---|
| `GET` | `/api/users/me` | — 🔒 | Профиль текущего пользователя |
| `PATCH` | `/api/users/me/score` | `{ score }` 🔒 | Сохранить рекорд (обновляет если лучше) |
| `PATCH` | `/api/users/me/username` | `{ username }` 🔒 | Сменить никнейм (уникальность проверяется) |
| `GET` | `/api/users/leaderboard` | — 🔒 | Топ-10 + место текущего игрока |

### Валидация никнейма

- Длина: 3–20 символов
- Символы: латиница, кириллица, цифры, `_`
- Уникальность на уровне БД (`UNIQUE` constraint)

---

## Модель данных

```prisma
model User {
  id           BigInt   @id @default(autoincrement())  // внутренний, не экспонируется
  publicId     String   @unique                        // UUID, используется в API и JWT
  username     String   @unique
  email        String   @unique
  passwordHash String                                  // bcrypt, 10 раундов
  gamesPlayed  Int      @default(0)
  highScore    Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

---

## Структура файлов

```
.
├── client/
│   ├── src/
│   │   ├── main.js              # точка входа, монтирование DOM
│   │   ├── style.css            # pixel-art тема, CRT-эффект
│   │   ├── i18n.js              # ru/en переводы (t(), setLang())
│   │   ├── core/
│   │   │   └── GameApp.js       # главный оркестратор
│   │   ├── game/
│   │   │   ├── GameWorld.js     # игровой цикл, физика
│   │   │   ├── constants.js     # параметры игры
│   │   │   └── entities/
│   │   │       ├── Doodler.js
│   │   │       ├── PlatformManager.js
│   │   │       └── BarrierManager.js
│   │   ├── ui/
│   │   │   ├── OverlayUI.js     # оверлеи (меню, пауза, auth)
│   │   │   ├── LegendUI.js      # левая панель (десктоп)
│   │   │   └── LeaderboardUI.js # правая панель (десктоп)
│   │   ├── api/
│   │   │   └── AuthApi.js       # fetch-обёртки для всех /api/* эндпоинтов
│   │   ├── input/
│   │   │   └── InputController.js # клавиатура + мышь + тач
│   │   └── storage/
│   │       └── ScoreStore.js    # localStorage: язык, скин
│   ├── public/
│   │   └── icons.svg
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── main.ts              # bootstrap, CORS, порт
│   │   ├── app.module.ts        # ServeStatic + глобальные модули
│   │   ├── config/
│   │   │   └── configuration.ts # env → типизированный конфиг
│   │   ├── prisma/
│   │   │   ├── prisma.module.ts # @Global()
│   │   │   └── prisma.service.ts
│   │   └── modules/
│   │       ├── auth/            # JWT-стратегия, register/login
│   │       └── users/           # профиль, рекорды, лидерборд
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── package.json
│
├── package.json                 # корневые скрипты (build, start)
└── README.md
```

---

## Запуск в разработке

### Требования

- **Node.js >= 24**
- PostgreSQL база данных (или аккаунт [Supabase](https://supabase.com/))

### 1. Клонировать и установить зависимости

```bash
git clone <repo-url>
cd doodle-jump
npm install --prefix client
npm install --prefix server
```

### 2. Настроить переменные окружения сервера

```bash
cp server/.env.example server/.env
# отредактируй server/.env
```

Минимальный набор:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your-secret-key-min-32-chars
PORT=3000
```

### 3. Применить миграции Prisma

```bash
cd server
npx prisma migrate deploy
cd ..
```

### 4. Запустить оба процесса

**Сервер** (порт 3000, watch-режим):

```bash
npm run start:dev --prefix server
```

**Клиент** (порт 5173, HMR):

```bash
npm run dev --prefix client
```

Открыть: [http://localhost:5173](http://localhost:5173)

> Vite проксирует `/api/*` на `localhost:3000` — настройка в `client/vite.config.js`.

### Открыть с телефона в той же сети

```bash
npm run dev:host --prefix client
```

---

## Production-развёртывание

### Сборка

```bash
# из корня — устанавливает зависимости, компилирует сервер и клиент
npm run build
```

Это выполнит:
1. `npm install` в `server/` и `client/`
2. `nest build` → `server/dist/`
3. `vite build` → `client/dist/`

NestJS при старте раздаёт `client/dist` как статику через `ServeStatic`.

### Запуск

```bash
npm start
# эквивалент: npm run start:prod --prefix server
```

Сервер поднимается на `PORT` (по умолчанию `3000`) и обслуживает и API, и фронтенд.

### Переменная окружения для порта

```bash
# bash / Linux / macOS
PORT=8080 npm start

# Windows PowerShell
$env:PORT=8080; npm start
```

### Деплой на Railway / Render / Fly.io

1. Установить переменные окружения в настройках платформы (`DATABASE_URL`, `JWT_SECRET`, `PORT`).
2. Build command: `npm run build`
3. Start command: `npm start`
4. Применить миграции: `npx prisma migrate deploy` (можно добавить в build command).

### Деплой на VPS (systemd)

```ini
# /etc/systemd/system/doodle-jump.service
[Unit]
Description=Doodle Jump Server
After=network.target

[Service]
WorkingDirectory=/opt/doodle-jump
ExecStart=/usr/bin/node server/dist/main.js
Restart=always
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=DATABASE_URL=postgresql://...
Environment=JWT_SECRET=...

[Install]
WantedBy=multi-user.target
```

```bash
systemctl enable doodle-jump
systemctl start doodle-jump
```

---

## Переменные окружения

| Переменная | Обязательна | По умолчанию | Описание |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | — | Секрет для подписи JWT (мин. 32 символа) |
| `PORT` | ❌ | `3000` | Порт HTTP-сервера |
| `JWT_EXPIRES_IN` | ❌ | `30d` | Время жизни токена |

---

## Полезные команды

```bash
# Клиент
npm run dev            --prefix client   # dev-сервер с HMR
npm run build          --prefix client   # production-сборка
npm run preview        --prefix client   # превью production-сборки

# Сервер
npm run start:dev      --prefix server   # watch-режим
npm run build          --prefix server   # компиляция TS
npm run start:prod     --prefix server   # production-старт
npm run lint           --prefix server   # ESLint
npm run format         --prefix server   # Prettier

# Prisma
cd server
npx prisma studio              # визуальный редактор БД
npx prisma migrate dev         # создать и применить новую миграцию
npx prisma migrate deploy      # применить миграции (production)
npx prisma generate            # обновить Prisma Client
```
