## Doodle Jump (Three.js) — клиент + сервер

Минималистичная версия **Doodle Jump** на **Three.js**: дудлер прыгает по платформам вверх, есть меню (`Start / Scores / Settings / Exit`), очки за успешный прогресс, сохранение рекордов и имя игрока.

Проект организован как монорепо из двух приложений:

- **`client/`**: браузерная игра (Vite + Three.js)
- **`server/`**: NestJS сервер, который в production раздаёт статику из `client/dist`

---

## Стек

### Клиент (`client/`)

- **Vite** (dev-сервер, сборка)
- **Three.js** (рендер сцены/игровой мир)
- JavaScript (ESM)
- Хранение результатов/имени: **`localStorage`**

### Сервер (`server/`)

- **NestJS** (TypeScript)
- `@nestjs/serve-static` — раздача `client/dist` как статики
- Порт: `process.env.PORT` или `3000`

---

## Требования

- **Node.js >= 24** (см. `package.json` в корне)
- npm

---

## Структура проекта

```text
.
├─ client/                  # фронтенд-игра (Vite + Three.js)
│  ├─ src/                  # код игры
│  └─ dist/                 # production сборка клиента (после build)
├─ server/                  # backend (NestJS)
│  └─ src/
│     ├─ main.ts            # старт приложения, порт из env
│     └─ app.module.ts      # ServeStatic: раздаёт client/dist
└─ README.md
```

---

## Запуск в разработке (dev)

В dev-режиме обычно запускают **2 процесса**: клиентский dev-сервер Vite и NestJS сервер.

### 1) Запуск клиента (Vite)

Из корня:

```bash
npm install --prefix client
npm run dev --prefix client
```

Опционально, чтобы открыть игру с телефона в той же сети:

```bash
npm run dev:host --prefix client
```

### 2) Запуск сервера (NestJS)

Из корня:

```bash
npm install --prefix server
npm run start:dev --prefix server
```

Сервер поднимется на `3000` (или на `PORT`, если задан).

Важно: в текущем проекте **сервер раздаёт production-статику** из `client/dist`.
В dev ты обычно открываешь игру через Vite (`client`), а сервер используешь отдельно (если нужно расширять API).

---

## Production-сборка и запуск

### Сборка всего проекта

Команда из корня установит зависимости в `client` и `server`, затем выполнит сборку обоих:

```bash
npm run build
```

### Запуск production сервера

```bash
npm start
```

NestJS запустится и начнёт **раздавать клиент** из `client/dist`.

Чтобы сменить порт:

```bash
# Windows PowerShell:
$env:PORT=4000; npm start

# bash:
PORT=4000 npm start
```

---

## Полезные команды

### Клиент

```bash
npm run build --prefix client
npm run preview --prefix client
npm run prod --prefix client
```

### Сервер

```bash
npm run lint --prefix server
npm run format --prefix server
npm run build --prefix server
npm run start --prefix server
npm run start:prod --prefix server
```