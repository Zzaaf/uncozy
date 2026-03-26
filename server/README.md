## Профессиональная структура Nest.js проекта для масштабирования

Правильная архитектура Nest.js приложения — основа для его долгосрочного развития. Она должна обеспечивать **чёткое разделение ответственности**, **модульность**, **возможность горизонтального масштабирования** и **лёгкость внесения изменений**. Ниже представлена структура, проверенная на крупных проектах и основанная на принципах чистой архитектуры и предметно-ориентированного проектирования (DDD).

---

### 1. Общие принципы

- **Модульность** — каждый функциональный блок (пользователи, заказы, платежи) выделяется в отдельный модуль Nest.js.
- **Слои** — внутри модуля строго разделяются:
  - **Контроллер** — обрабатывает HTTP-запросы, валидирует входные данные, возвращает ответы.
  - **Сервис** — содержит бизнес-логику, работает через абстракции (интерфейсы), не зависит от фреймворка.
  - **Репозиторий** — слой доступа к данным (TypeORM, Mongoose, Prisma), инкапсулирует запросы.
  - **DTO/Entity** — описывают формы данных.
- **Общие компоненты** выносятся в `common/` и переиспользуются.
- **Конфигурация** управляется через отдельный модуль с использованием `@nestjs/config`.
- **Тестируемость** — все зависимости внедряются через DI, код легко покрывается юнит-тестами.

---

### 2. Предлагаемая структура папок

```
project-root/
├── .env
├── .env.example
├── nest-cli.json
├── package.json
├── tsconfig.json
├── README.md
│
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── common/                         # Общие компоненты для всего приложения
│   │   ├── decorators/                 # Кастомные декораторы (@CurrentUser, @Roles и т.д.)
│   │   ├── filters/                    # Глобальные фильтры исключений
│   │   ├── guards/                     # Глобальные/общие guards (аутентификация, роли)
│   │   ├── interceptors/               # Перехватчики (логирование, трансформация ответа)
│   │   ├── middleware/                 # Промежуточные обработчики
│   │   ├── pipes/                      # Кастомные пайпы валидации/трансформации
│   │   ├── constants/                  # Глобальные константы
│   │   ├── utils/                      # Вспомогательные функции (хэширование, форматирование)
│   │   └── interfaces/                 # Общие интерфейсы и типы
│   │
│   ├── config/                         # Конфигурационные модули
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   ├── auth.config.ts
│   │   └── config.module.ts
│   │
│   ├── database/                       # Всё, связанное с базой данных
│   │   ├── migrations/                 # Миграции (TypeORM, MikroORM)
│   │   ├── seeds/                      # Сиды для начальных данных
│   │   └── data-source.ts              # Настройка подключения
│   │
│   └── modules/                        # Бизнес-модули
│       ├── users/
│       │   ├── users.module.ts
│       │   ├── users.controller.ts
│       │   ├── users.service.ts
│       │   ├── users.repository.ts     # (опционально, если используется свой репозиторий)
│       │   ├── dto/
│       │   │   ├── create-user.dto.ts
│       │   │   ├── update-user.dto.ts
│       │   │   └── user-response.dto.ts
│       │   ├── entities/               # (или models/) – сущности БД
│       │   │   └── user.entity.ts
│       │   ├── interfaces/             # Интерфейсы для данного модуля
│       │   │   └── user.interface.ts
│       │   └── tests/                  # Тесты модуля (можно вынести в корень test/)
│       │       ├── users.controller.spec.ts
│       │       └── users.service.spec.ts
│       │
│       ├── auth/
│       │   ├── auth.module.ts
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   ├── strategies/             # Стратегии Passport
│       │   │   ├── jwt.strategy.ts
│       │   │   └── local.strategy.ts
│       │   ├── guards/                 # Локальные guards модуля (если не общие)
│       │   └── dto/
│       │       ├── login.dto.ts
│       │       └── register.dto.ts
│       │
│       ├── orders/
│       │   ├── orders.module.ts
│       │   ├── orders.controller.ts
│       │   ├── orders.service.ts
│       │   ├── orders.repository.ts
│       │   ├── dto/
│       │   ├── entities/
│       │   └── interfaces/
│       │
│       └── shared/                     # Общие для модулей ресурсы (не выносить в common)
│           ├── shared.module.ts        # Экспортирует общие сервисы (например, EmailService)
│           ├── email/
│           │   ├── email.service.ts
│           │   └── email.module.ts
│           └── ...
│
└── test/                               # Интеграционные/сквозные тесты
    ├── jest-e2e.json
    └── app.e2e-spec.ts
```

---

### 3. Подробное описание элементов

#### 3.1. `src/main.ts`
Точка входа. Настраивает глобальные префиксы, валидацию (`ValidationPipe`), CORS, глобальные фильтры, перехватчики.  
Пример:
```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(3000);
}
```

#### 3.2. `src/app.module.ts`
Корневой модуль, импортирует остальные модули:  
- `ConfigModule` (глобально)  
- `DatabaseModule` (если создаётся отдельно)  
- Бизнес-модули (`UsersModule`, `AuthModule` и т.д.)

#### 3.3. `common/`
Содержит компоненты, которые используются **глобально** или в нескольких модулях.  
- **decorators/** – декораторы, например, `@Roles('admin')`, `@CurrentUser()`.  
- **filters/** – исключения (например, `HttpExceptionFilter` для форматирования ответов).  
- **guards/** – глобальные guard’ы (аутентификация, проверка прав).  
- **interceptors/** – для логирования, трансформации ответов, обработки времени выполнения.  
- **middleware/** – например, логирование запросов.  
- **pipes/** – кастомные пайпы (валидация ObjectId, трансформация).  
- **constants/** – глобальные константы (роли, типы событий).  
- **utils/** – чистые функции (хэширование, генерация токенов).  
- **interfaces/** – общие TypeScript интерфейсы (например, `RequestWithUser`).

#### 3.4. `config/`
Модуль конфигурации с использованием `@nestjs/config`.  
Каждый файл определяет схему валидации переменных окружения.  
`config.module.ts` собирает их и предоставляет глобально.  
Это позволяет легко переключаться между окружениями (development, staging, production).

#### 3.5. `database/`
Отвечает за миграции, сиды и настройку подключения.  
Если используется TypeORM, здесь может быть `data-source.ts` для CLI.  
Миграции позволяют управлять схемой БД в версионном контроле.

#### 3.6. `modules/`
Каждый бизнес-модуль изолирован и имеет свою структуру:

- **`*.module.ts`** – определяет модуль, импортирует зависимости, экспортирует сервисы, если они нужны другим модулям.
- **`*.controller.ts`** – только маршрутизация, валидация входных данных (через DTO), вызов сервиса. Контроллер не должен содержать бизнес-логику.
- **`*.service.ts`** – бизнес-логика. Использует репозитории (или ORM-сущности напрямую). Может вызывать другие сервисы.
- **`*.repository.ts`** – необязательный слой, если вы используете ORM с активной записью (TypeORM). В случае с паттерном "репозиторий" здесь инкапсулируются сложные запросы.
- **`dto/`** – классы валидации (class-validator) и объекты передачи данных. Для входных данных (`CreateUserDto`) и выходных (`UserResponseDto`). Использование DTO улучшает документирование (Swagger) и контроль данных.
- **`entities/`** – сущности базы данных (декораторы TypeORM, Mongoose). В DDD это могут быть модели.
- **`interfaces/`** – интерфейсы, описывающие контракты внутри модуля (например, для сервисов).
- **`tests/`** – модульные тесты (можно вынести в корень `test/unit/`).

#### 3.7. `modules/shared/`
Содержит модули и сервисы, которые используются несколькими бизнес-модулями, но не являются глобальными (например, EmailService, S3Service).  
SharedModule импортируется в те модули, которые нуждаются в этих сервисах. Это помогает избежать загрязнения глобального пространства.

---

### 4. Почему эта структура масштабируема?

- **Горизонтальное масштабирование модулей** – каждый модуль может быть выделен в отдельный микросервис без изменения внутренней логики (при условии, что зависимости явно определены).
- **Разделение на слои** позволяет заменять реализацию сервисов (например, переход с TypeORM на Prisma) без изменения контроллеров.
- **Общие компоненты** (`common/`) централизованы, что упрощает изменение поведения приложения (например, глобальное логирование).
- **Конфигурация изолирована** – приложение легко настраивается под разные окружения.
- **Тестируемость** – каждый слой можно тестировать изолированно, используя моки для зависимостей.
- **Возможность расширения** – новые модули добавляются по шаблону, не нарушая существующую архитектуру.

---

### 5. Пример модуля Users

#### users.module.ts
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { User } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
```

#### users.service.ts
```typescript
import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // бизнес-логика: проверки, хэширование пароля и т.д.
    return this.usersRepository.create(createUserDto);
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }
}
```

#### users.repository.ts
```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }
}
```

---

### 6. Рекомендации по дальнейшему масштабированию

- **Используйте абстракции** – вместо прямого использования ORM-репозитория, создайте интерфейс `IUserRepository`. Это позволит легко подменять реализацию (например, для тестов или перехода на другой источник данных).
- **Выделяйте бизнес-правила в отдельные классы (Use Cases)** – если приложение очень сложное, можно ввести слой use-cases, которые будут вызываться из контроллеров и координировать работу сервисов.
- **Применяйте CQRS** – для приложений с высокой нагрузкой разделите команды и запросы (Command Query Responsibility Segregation). Nest.js имеет встроенную поддержку CQRS через `@nestjs/cqrs`.
- **Автоматизируйте генерацию модулей** – используйте `nest generate resource` для создания заготовок по единому шаблону.
- **Документируйте API** – подключите Swagger (`@nestjs/swagger`) и описывайте DTO с помощью декораторов, чтобы документация всегда была актуальна.

---

### Заключение

Предложенная структура обеспечивает **чистоту кода**, **лёгкость поддержки** и **возможность роста** проекта от монолита до микросервисов. Она следует best practices Nest.js и современным принципам разработки. Адаптируйте её под конкретные нужды, но сохраняйте ключевые принципы: модульность, разделение ответственности и изоляцию общих компонентов.