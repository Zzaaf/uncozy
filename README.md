# UNCOZY — Pixel Edition

Браузерная аркада в жанре endless-jumper. Игрок управляет персонажем, прыгающим по платформам вверх, уклоняясь от врагов и разрушая барьеры. Реализована система аутентификации, таблица лидеров с онлайн-статусом в реальном времени (WebSocket) и глубокая система усложнения по уровням.

---

## Содержание

- [Стек технологий](#стек-технологий)
- [Архитектура проекта](#архитектура-проекта)
- [Игровой движок](#игровой-движок)
- [API](#api)
- [WebSocket](#websocket)
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
| CSS (custom) | — | Pixel-art UI, Press Start 2P, CRT-эффект, кастомный курсор |
| WebSocket API | — | Онлайн-присутствие игроков в реальном времени |

### Сервер (`server/`)

| Технология | Версия | Назначение |
|---|---|---|
| [NestJS](https://nestjs.com/) | ^11 | HTTP + WebSocket фреймворк (TypeScript) |
| [Prisma](https://www.prisma.io/) | ^5 | ORM, миграции |
| [PostgreSQL](https://www.postgresql.org/) | — | БД (Supabase-hosted) |
| [Passport.js](http://www.passportjs.org/) + JWT | — | Аутентификация |
| [bcrypt](https://github.com/kelektiv/node.bcrypt.js) | — | Хэширование паролей |
| `@nestjs/websockets` + `ws` | — | WebSocket-шлюз (онлайн-присутствие) |
| `@nestjs/serve-static` | — | Раздача фронтенда из `client/dist` |
| `class-validator` | — | Валидация DTO |

---

## Архитектура проекта

Проект организован как **монорепо** с двумя приложениями:

```
doodle-jump/
├── client/        ← браузерная игра (Vite + Three.js)
└── server/        ← REST API + WebSocket + статика (NestJS + PostgreSQL)
```

### Схема взаимодействия

```
┌──────────────────────────────────────────────────────────────┐
│  Браузер                                                     │
│                                                              │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────────┐   │
│  │  LegendUI   │   │  Game Shell  │   │  LeaderboardUI   │   │
│  │ левая панель│   │  (Three.js)  │   │ правая панель    │   │
│  │             │   │  480 px фикс │   │ ● онлайн-статус  │   │
│  └─────────────┘   └──────┬───────┘   └────────┬─────────┘   │
│                           │                    │             │
│              ┌────────────▼────────────────────▼───────── ─┐ │
│              │          GameApp (оркестратор)              │ │
│              │  AuthApi ──── fetch ──► /api/*              │ │
│              │  WsClient ─── ws:// ──► /ws                 │ │
│              └─────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                    │ HTTP+JWT          │ WebSocket+JWT
┌───────────────────▼───────────────────▼──────────────────────┐
│  NestJS Server (:3000)                                       │
│                                                              │
│  AuthController          UsersController                     │
│  POST /api/auth/register    GET  /api/users/leaderboard      │
│  POST /api/auth/login       GET  /api/users/me               │
│  GET  /api/auth/me          PATCH /api/users/me/score        │
│                             PATCH /api/users/me/username     │
│                                                              │
│  PresenceGateway (ws: /ws)                                   │
│  ← auth → broadcast presence:online                          │
│                                                              │
│  AuthService ◄──► UsersService ◄──► PrismaService            │
│                                           │                  │
│                               │  PostgreSQL (Supabase)│      │
│                               └───────────────────────┘      │
│                                                              │
│  ServeStatic: client/dist/** (все не-API маршруты)           │
└──────────────────────────────────────────────────────────────┘
```

### Принципы дизайна

- **Монолитный деплой**: один процесс Node.js раздаёт и API, и WebSocket, и статику клиента.
- **JWT без сессий**: сервер stateless. Токен хранится в `localStorage`, отправляется в `Authorization: Bearer` (HTTP) и в первом WS-сообщении `{ type: "auth", token }`.
- **Публичный ID**: внутренний `BigInt id` никогда не покидает сервер. Наружу отдаётся только `publicId` (UUID).
- **WebSocket на том же порту**: используется HTTP Upgrade, отдельный порт не нужен — работает на Render.com и любых PaaS без дополнительных настроек.
- **Онлайн = открытая вкладка**: факт подключённого WS-соединения считается онлайном; разрыв вкладки снимает статус мгновенно.

---

## Игровой движок

Игра построена на **Three.js** с `OrthographicCamera`, всё в координатной системе игрового мира (14 × 24 единицы).

### Сущности (`client/src/game/entities/`)

| Файл | Назначение |
|---|---|
| `Hero.js` | Персонаж игрока, три скина (Hero / Robot / Wizard), физика прыжка, мигание после возрождения |
| `PlatformManager.js` | Пул из 28 платформ, четыре типа: normal / super / float / crumble |
| `EnemyManager.js` | Враги с постепенным введением по уровням (crawler / flyer / shooter / dropper) |
| `BarrierManager.js` | Пять типов барьеров с введением по уровням, таймерный спавн |

### Типы платформ

| Тип | Цвет | Поведение |
|---|---|---|
| `normal` | разный | Обычная, стационарная |
| `super` | ярко-жёлтый | Супер-прыжок (×2.5 скорости) |
| `float` | анимация волны | Исчезает после одного отскока |
| `crumble` | красный | Разрушается от выстрела игрока |

### Типы барьеров

Барьеры полностью блокируют путь вверх и вводятся постепенно по уровням:

| Тип | Цвет | Вводится | Механика |
|---|---|---|---|
| `destroy` | красный | уровень 1 | Разрушается от одного выстрела |
| `gap` | синий | уровень 2 | Содержит дыру; каждый выстрел сбивает один кубик; слот-детекция попаданий |
| `armored` | золотой → оранжевый → тёмно-красный | уровень 3 | Выдерживает 3 попадания, меняет цвет при каждом |
| `moving` | фиолетовый | уровень 5 | Движется горизонтально, дыра смещается синусоидально |
| `explosive` | фиолетовый → красный | уровень 7 | Таймер-запал (3 с), взрыв убивает игрока в радиусе |

### Типы врагов

Враги вводятся постепенно, чтобы сложность нарастала предсказуемо:

| Тип | Вводится | Поведение |
|---|---|---|
| `crawler` | уровень 2 | Ходит горизонтально по платформам |
| `flyer` | уровень 3 | Летает, атакует при сближении |
| `shooter` | уровень 5 | Стреляет снарядами в игрока |
| `dropper` | уровень 7 | Падает на игрока сверху |

### Игровой цикл (`GameWorld.js`)

```
requestAnimationFrame → GameApp.loop(dt)
  → InputController.getHorizontal()
  → GameWorld.update(dt, dx, doShoot)
      → Hero.update()              ← физика: гравитация, прыжки
      → PlatformManager.update()   ← анимация float, переработка пула
      → EnemyManager.update()      ← AI, патрулирование, стрельба
      → BarrierManager.update()    ← движение, запал взрыва, спавн
      → collision detection        ← платформы, барьеры, враги, сердца
      → camera follow              ← OrthographicCamera по Y
  → leaderboardUI.setLiveScore()  ← живой счёт в правой панели
```

### Система жизней и Game Over

- Начальных жизней: 3. Максимум: 5 (собираются сердца на платформах).
- При смерти (падение ниже камеры, враг, взрыв): жизнь снимается, герой респавнится с миганием (1 с инвалидности).
- При 0 жизней: красный баннер «GAME OVER!» / «ИГРА ОКОНЧЕНА!» (5 с) → оверлей с итогом.

### Кастомные курсоры

Три состояния через CSS-переменные с pixel-art SVG:

| Состояние | Переменная | Вид |
|---|---|---|
| Обычный | `--cur-default` | Cyan |
| Наведение | `--cur-pointer` | Yellow |
| Клик | `--cur-active` | White |

### Локализация

Полная поддержка **ru** / **en** через `i18n.js`. Атрибуты `data-ru` / `data-en` используются для статических текстов в панелях. Язык сохраняется в `localStorage`.

### Слои UI

| Класс | Описание |
|---|---|
| `OverlayUI` | Все оверлеи: меню (с кнопкой «Выйти из аккаунта»), пауза, настройки, auth-форма |
| `LegendUI` | Левая панель (десктоп): управление, персонажи, все типы платформ и барьеров |
| `LeaderboardUI` | Правая панель (десктоп): топ-10, живой счёт, `●` онлайн-статус игроков |
| `GameApp` | Оркестратор: состояния, переходы, связь UI ↔ движок ↔ API ↔ WsClient |

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
| `PATCH` | `/api/users/me/score` | `{ score }` 🔒 | Сохранить рекорд (обновляет только если лучше) |
| `PATCH` | `/api/users/me/username` | `{ username }` 🔒 | Сменить никнейм (уникальность проверяется) |
| `GET` | `/api/users/leaderboard` | — 🔒 | Топ-10 + позиция текущего игрока; записи включают `publicId` для сопоставления с WS-онлайном |

### Валидация никнейма

- Длина: 3–20 символов
- Символы: латиница, кириллица, цифры, `_`
- Уникальность на уровне БД (`UNIQUE` constraint)

---

## WebSocket

Шлюз доступен по пути `/ws` на том же порту, что и HTTP (Upgrade). Используется `ws`-адаптер NestJS.

### Протокол (клиент → сервер)

| Тип сообщения | Поля | Описание |
|---|---|---|
| `auth` | `{ token }` | **Первое сообщение после подключения.** JWT-токен. Должен прийти в течение 5 с, иначе соединение закрывается (код 4001). |
| `ping` | — | Клиентский keep-alive. |

### Протокол (сервер → клиент)

| Тип сообщения | Поля | Описание |
|---|---|---|
| `presence:online` | `{ users: [{ id, username }] }` | Рассылается всем авторизованным клиентам при каждом подключении и отключении. Содержит полный список онлайн-игроков. |
| `pong` | — | Ответ на ping (интервал 25 с). |

### Коды закрытия

| Код | Причина |
|---|---|
| 4001 | Таймаут аутентификации (5 с без `auth`-сообщения) |
| 4002 | Первое сообщение не является `auth` |
| 4003 | Невалидный или истёкший JWT |

### Переподключение клиента

`WsClient.js` реализует экспоненциальный backoff: 2 с → 4 с → 8 с … до максимума 30 с. Переподключение происходит автоматически при любом разрыве.

### Будущее расширение (заложено в протоколе)

Тип-поле `WsMsg` уже поддерживает:
- `chat:global` — глобальный чат
- `chat:dm` — личные сообщения между игроками

---

## Модель данных

```prisma
model User {
  id           BigInt   @id @default(autoincrement())  // внутренний, не экспонируется
  publicId     String   @unique                        // UUID, используется в API, JWT и WS
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
│   │   ├── main.js                  # точка входа, монтирование DOM
│   │   ├── style.css                # pixel-art тема, CRT-эффект, кастомные курсоры
│   │   ├── i18n.js                  # ru/en переводы (t(), setLang(), getLang())
│   │   ├── core/
│   │   │   ├── GameApp.js           # главный оркестратор (состояния, auth, WS)
│   │   │   └── WsClient.js          # WebSocket-клиент (авторизация, reconnect)
│   │   ├── game/
│   │   │   ├── GameWorld.js         # игровой цикл, физика, collision detection
│   │   │   ├── constants.js         # параметры игры
│   │   │   └── entities/
│   │   │       ├── Hero.js          # персонаж игрока (физика, скины, мигание)
│   │   │       ├── PlatformManager.js
│   │   │       ├── EnemyManager.js  # crawler / flyer / shooter / dropper
│   │   │       └── BarrierManager.js # destroy / gap / armored / moving / explosive
│   │   ├── ui/
│   │   │   ├── OverlayUI.js         # оверлеи (меню, пауза, настройки, auth)
│   │   │   ├── LegendUI.js          # левая панель (десктоп): легенда игры
│   │   │   └── LeaderboardUI.js     # правая панель: топ-10, онлайн-статус
│   │   ├── api/
│   │   │   └── AuthApi.js           # fetch-обёртки для всех /api/* эндпоинтов
│   │   ├── input/
│   │   │   └── InputController.js   # клавиатура + мышь + тач
│   │   └── storage/
│   │       └── ScoreStore.js        # localStorage: язык, скин, имя игрока
│   ├── public/
│   │   └── icons.svg
│   ├── vite.config.js               # proxy /api и /ws → localhost:3000
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── main.ts                  # bootstrap, WsAdapter, CORS, порт
│   │   ├── app.module.ts            # ServeStatic + глобальные модули
│   │   ├── config/
│   │   │   └── configuration.ts    # env → типизированный конфиг
│   │   ├── prisma/
│   │   │   ├── prisma.module.ts    # @Global()
│   │   │   └── prisma.service.ts
│   │   └── modules/
│   │       ├── auth/               # JWT-стратегия, register/login
│   │       ├── users/              # профиль, рекорды, лидерборд
│   │       └── presence/           # WebSocket-шлюз онлайн-статуса
│   │           ├── presence.gateway.ts
│   │           └── presence.module.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── package.json
│
├── package.json                     # корневые скрипты (build, start)
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

> Vite проксирует `/api/*` → `localhost:3000` (HTTP) и `/ws` → `localhost:3000` (WebSocket). Настройка в `client/vite.config.js`.

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

NestJS при старте раздаёт `client/dist` как статику через `ServeStatic`. WebSocket (`/ws`) работает на том же порту через HTTP Upgrade.

### Запуск

```bash
npm start
# эквивалент: npm run start:prod --prefix server
```

### Деплой на Railway / Render / Fly.io

1. Установить переменные окружения в настройках платформы (`DATABASE_URL`, `JWT_SECRET`, `PORT`).
2. Build command: `npm run build`
3. Start command: `npm start`
4. Применить миграции: `npx prisma migrate deploy` (можно добавить в build command).

> WebSocket работает без дополнительных настроек — тот же порт, что и HTTP.

### Деплой на VPS (systemd)

```ini
# /etc/systemd/system/uncozy.service
[Unit]
Description=UNCOZY Game Server
After=network.target

[Service]
WorkingDirectory=/opt/uncozy
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
systemctl enable uncozy
systemctl start uncozy
```

---

## Переменные окружения

| Переменная | Обязательна | По умолчанию | Описание |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | — | Секрет для подписи JWT (мин. 32 символа) |
| `PORT` | ❌ | `3000` | Порт HTTP + WebSocket сервера |
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
