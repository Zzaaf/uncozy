import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import configuration from './config/configuration';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { PresenceModule } from './modules/presence/presence.module';
import { GameModule } from './modules/game/game.module';
import { AchievementsModule } from './modules/achievements/achievements.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),

    ThrottlerModule.forRoot([
      // Default bucket — applies globally to every route
      { name: 'global',   ttl: 60_000,      limit: 120 },
      // Auth-specific buckets referenced via @Throttle() on controllers
      { name: 'auth',     ttl: 900_000,     limit: 10  },
      { name: 'register', ttl: 3_600_000,   limit: 5   },
      { name: 'game',     ttl: 3_600_000,   limit: 20  },
    ]),

    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../../', 'client', 'dist'),
      exclude: ['/api/{*path}'],
      serveStaticOptions: {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        etag: true,
        lastModified: true,
        setHeaders(res, filePath) {
          if (filePath.endsWith('index.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
          }
        },
      },
    }),

    PrismaModule,
    UsersModule,
    AuthModule,
    PresenceModule,
    GameModule,
    AchievementsModule,
  ],
  providers: [
    // IP-based global throttle guard for all routes
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
