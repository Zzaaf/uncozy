# UNCOZY — Pixel Edition

Браузерная аркада в жанре endless-jumper. Игрок управляет персонажем, прыгающим по платформам вверх, уклоняясь от врагов и разрушая барьеры. Реализована система аутентификации, таблица лидеров с онлайн-статусом в реальном времени (WebSocket), защита счёта от подделки и глубокая система усложнения по уровням.

---

## Содержание

- [Стек технологий](#стек-технологий)
- [Архитектура проекта](#архитектура-проекта)
- [Игровой движок](#игровой-движок)
- [API](#api)
- [WebSocket](#websocket)
- [Безопасность](#безопасность)
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
| `@nestjs/throttler` | — | Rate limiting (in-memory, по publicId / IP) |
| [Helmet](https://helmetjs.github.io/) | — | HTTP-заголовки безопасности + CSP |
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
│              ┌────────────▼────────────────────▼───────────┐ │
│              │          GameApp (оркестратор)              │ │
│              │  AuthApi ──── fetch ──► /api/*              │ │
│              │  WsClient ─── ws:// ──► /ws                 │ │
│              └─────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                    │ HTTP+JWT          │ WebSocket+JWT
┌───────────────────▼───────────────────▼──────────────────────┐
│  NestJS Server (:3000)                                       │
│                                                              │
│  AuthController       UsersController    GameController      │
│  POST /api/auth/reg   GET  /api/users/lb POST /api/game/ses  │
│  POST /api/auth/login GET  /api/users/me PATCH /api/users/sc │
│  GET  /api/auth/me    PATCH /users/name                      │
│                                                              │
│  PresenceGateway (ws: /ws)                                   │
│  ← auth → broadcast presence:online                          │
│                                                              │
│  AuthService ◄──► UsersService ◄──► GameService              │
│                         ▼                                    │
│                   PrismaService                              │
│                         ▼                                    │
│                   PostgreSQL (Supabase)                      │
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

### Управление вводом (`InputController.js`)

Поддерживает клавиатуру, мышь и тач. Особенности:

- `preventDefault()` на все игровые клавиши (`ArrowLeft/Right/Up/Down`, `A/D/W/S`, `Space`) — предотвращает перехват браузером (в Firefox — панель быстрого поиска).
- `preventDefault` не срабатывает если фокус на `<input>`, `<textarea>` или `<select>` — набор текста в формах работает нормально.
- При потере фокуса окном (`blur`) и сворачивании вкладки (`visibilitychange`) — принудительный сброс `pressedKeys`, исключающий «залипание» клавиш.

### Система жизней и Game Over

- Начальных жизней: 3. Максимум: 5 (собираются сердца на платформах).
- При смерти (падение ниже камеры, враг, взрыв): жизнь снимается, герой респавнится с миганием (1 с инвалидности).
- При 0 жизней: красный баннер «GAME OVER!» / «ИГРА ОКОНЧЕНА!» (5 с) → оверлей с итогом.

### Кастомные курсоры

Три состояния — pixel-art SVG 32×32, hotspot по центру (16, 16):

| Состояние | Переменная | Вид | Применяется |
|---|---|---|---|
| Обычный | `--cur-default` | Cyan-прицел с угловыми скобками | Всё |
| Наведение | `--cur-pointer` | Gold-прицел, толстые плечи, центральная точка | `button`, `a`, `select` и др. |
| Клик | `--cur-active` | White-прицел, короткие штрихи, крупный центр | `:active` |

### Локализация

Полная поддержка **ru** / **en** через `i18n.js`. При смене языка (`setLang()`) автоматически обновляются:
- `document.title` — SEO-заголовок на нужном языке
- `document.documentElement.lang` — атрибут `lang` тега `<html>`
- `meta[name="description"]` — описание страницы для поисковиков

Язык сохраняется в `localStorage`.

### SEO

`index.html` содержит полный набор мета-тегов:
- `<title>` + `<meta name="description">` — обновляются динамически при смене языка
- Open Graph (`og:title`, `og:description`, `og:image`) — красивые превью при шаринге
- Twitter Card
- `hreflang` — сигнал поисковикам о двуязычности (`ru`, `en`, `x-default`)
- JSON-LD `VideoGame` (Schema.org) — расширенный сниппет в Google
- `<meta name="theme-color">` — цвет адресной строки на мобильных

### Слои UI

| Класс | Описание |
|---|---|
| `OverlayUI` | Все оверлеи: меню (с кнопкой «Выйти из аккаунта»), пауза, настройки, auth-форма |
| `LegendUI` | Левая панель (десктоп): управление, персонажи, все типы платформ и барьеров |
| `LeaderboardUI` | Правая панель (десктоп): топ-10, живой счёт, `●` онлайн-статус игроков |
| `GameApp` | Оркестратор: состояния, переходы, связь UI ↔ движок ↔ API ↔ WsClient |

---

## API

Все эндпоинты с префиксом `/api`. Защищённые (🔒) требуют `Authorization: Bearer <JWT>`.

### Аутентификация

| Метод | Путь | Тело | Rate limit | Описание |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | `{ username, email, password }` | 10 / час | Регистрация, возвращает `{ accessToken, user }` |
| `POST` | `/api/auth/login` | `{ username, password }` | 10 / 15 мин | Вход, возвращает `{ accessToken, user }` |
| `GET` | `/api/auth/me` | — 🔒 | 120 / мин | Свежие данные пользователя из БД |

### Пользователи

| Метод | Путь | Тело | Rate limit | Описание |
|---|---|---|---|---|
| `GET` | `/api/users/me` | — 🔒 | 120 / мин | Профиль текущего пользователя |
| `PATCH` | `/api/users/me/score` | `{ score, sessionToken }` 🔒 | 60 / час | Сохранить рекорд (обновляет только если лучше) |
| `PATCH` | `/api/users/me/username` | `{ username }` 🔒 | 120 / мин | Сменить никнейм |
| `GET` | `/api/users/leaderboard` | — 🔒 | 120 / мин | Топ-10 + позиция текущего игрока |

### Игровые сессии

| Метод | Путь | Rate limit | Описание |
|---|---|---|---|
| `POST` | `/api/game/session` | 60 / час 🔒 | Выдать подписанный токен сессии перед стартом игры |

---

## WebSocket

Шлюз доступен по пути `/ws` на том же порту, что и HTTP (Upgrade). Используется `ws`-адаптер NestJS.

### Протокол (клиент → сервер)

| Тип | Поля | Описание |
|---|---|---|
| `auth` | `{ token }` | **Первое сообщение.** JWT-токен. Таймаут: 5 с (код 4001). Токены с `type: "game_session"` отклоняются (код 4003). |
| `ping` | — | Клиентский keep-alive. |

### Протокол (сервер → клиент)

| Тип | Поля | Описание |
|---|---|---|
| `presence:online` | `{ users: [{ id, username }] }` | Полный список онлайн-игроков, рассылается при каждом подключении / отключении. |
| `pong` | — | Ответ на ping (интервал 25 с). |

### Коды закрытия

| Код | Причина |
|---|---|
| 4001 | Таймаут аутентификации (5 с) |
| 4002 | Первое сообщение не является `auth` |
| 4003 | Невалидный / истёкший JWT или game_session токен |
| 4029 | Rate limit превышен (30 сообщений / мин) |

### Переподключение клиента

`WsClient.js` реализует экспоненциальный backoff: 2 с → 4 с → 8 с … до 30 с.

---

## Безопасность

### Защита счёта (Game Session Token)

Перед стартом игры клиент запрашивает одноразовый **game session token** (`POST /api/game/session`). Сервер выдаёт JWT с полями `type: "game_session"` + `nonce` (UUID). При сабмите счёта токен верифицируется и его nonce вносится в чёрный список (in-memory Map с TTL 30 мин). Повторная отправка тем же токеном вернёт 401.

### Rate Limiting

`@nestjs/throttler` с кастомным `UserThrottlerGuard` (троттлинг по `publicId` для авторизованных, по IP для остальных).

> **Важно**: маршруты без явного `@Throttle()` применяют **все** зарегистрированные бакеты одновременно. Маршруты, не связанные с игровой сессией, явно ограничены бакетом `global` через `@Throttle({ global: {} })`.

| Бакет | TTL | Лимит | Применяется к |
|---|---|---|---|
| `global` | 1 мин | 120 req | Все маршруты по умолчанию |
| `auth` | 15 мин | 10 req | `POST /api/auth/login` |
| `register` | 1 час | 10 req | `POST /api/auth/register` |
| `game` | 1 час | 60 req | `/api/game/session`, `/api/users/me/score` |

### Helmet / CSP

```
default-src:  'self'
script-src:   'self'
style-src:    'self' 'unsafe-inline' https://fonts.googleapis.com
font-src:     'self' https://fonts.gstatic.com
img-src:      'self' data:
connect-src:  'self' wss: ws:
worker-src:   'self' blob:
object-src:   'none'
```

`'unsafe-inline'` в `style-src` — намеренно: Three.js и игровой UI применяют инлайн-стили через JavaScript, `'unsafe-inline'` для стилей не создаёт XSS-вектора.

### Прочее

- **bcrypt DoS**: `@MaxLength(72)` на всех полях пароля (ограничение bcrypt).
- **IDOR**: публичный `publicId` (UUID) вместо числового `id`. Пользователь может обращаться только к своим данным.
- **WS rate limit**: 30 сообщений / мин на соединение, закрытие с кодом 4029 при превышении.

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
│   │   ├── i18n.js                  # ru/en переводы + обновление document.title/lang/description
│   │   ├── core/
│   │   │   ├── GameApp.js           # главный оркестратор (состояния, auth, WS, game session)
│   │   │   └── WsClient.js          # WebSocket-клиент (авторизация, reconnect, backoff)
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
│   │   │   └── AuthApi.js           # fetch-обёртки для всех /api/* эндпоинтов + game session
│   │   ├── input/
│   │   │   └── InputController.js   # клавиатура + мышь + тач, Firefox-фикс, anti-stuck
│   │   └── storage/
│   │       └── ScoreStore.js        # localStorage: язык, скин, имя игрока
│   ├── public/
│   │   ├── favicon.svg              # pixel-art иконка (герой + платформа)
│   │   └── icons.svg
│   ├── index.html                   # SEO: title, description, OG, Twitter Card, JSON-LD
│   ├── vite.config.js               # base: '/', proxy /api и /ws → localhost:3000
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── main.ts                  # bootstrap, WsAdapter, Helmet CSP, CORS, порт
│   │   ├── app.module.ts            # ServeStatic, ThrottlerModule, глобальные модули
│   │   ├── config/
│   │   │   └── configuration.ts    # env → типизированный конфиг
│   │   ├── common/
│   │   │   └── guards/
│   │   │       └── user-throttler.guard.ts  # троттлинг по publicId вместо IP
│   │   ├── prisma/
│   │   │   ├── prisma.module.ts    # @Global()
│   │   │   └── prisma.service.ts
│   │   └── modules/
│   │       ├── auth/               # JWT-стратегия, register/login, DTO с MaxLength
│   │       ├── users/              # профиль, рекорды, лидерборд
│   │       ├── game/               # game session token: выдача + nonce blacklist
│   │       │   ├── game.controller.ts
│   │       │   ├── game.service.ts
│   │       │   └── game.module.ts
│   │       └── presence/           # WebSocket-шлюз онлайн-статуса
│   │           ├── presence.gateway.ts  # rate limit 30msg/min, game_session rejection
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

> Vite проксирует `/api/*` → `localhost:3000` (HTTP) и `/ws` → `localhost:3000` (WebSocket Upgrade). Настройка в `client/vite.config.js`.

### Открыть с телефона в той же сети

```bash
npm run dev:host --prefix client
```

---

## Production-развёртывание

### Сборка

```bash
npm run build
```

Выполнит:
1. `npm install` в `server/` и `client/`
2. `nest build` → `server/dist/`
3. `vite build` → `client/dist/`

NestJS при старте раздаёт `client/dist` как статику через `ServeStatic`. WebSocket (`/ws`) работает на том же порту через HTTP Upgrade.

### Запуск

```bash
npm start
# эквивалент: npm run start:prod --prefix server
```

### Деплой на Render.com / Railway / Fly.io

1. Установить переменные окружения в настройках платформы (`DATABASE_URL`, `JWT_SECRET`, `PORT`).
2. Build command: `npm run build`
3. Start command: `npm start`
4. Применить миграции: добавить `npx prisma migrate deploy` в build command.

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
