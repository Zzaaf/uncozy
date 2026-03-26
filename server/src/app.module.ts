import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      // папка со статикой относительно корневой папки проекта
      rootPath: join(__dirname, '../../', 'client', 'dist'),
      // исключить API-маршруты
      exclude: ['/api/*'],
      serveStaticOptions: {
        // кэш на 1 неделю
        maxAge: 1000 * 60 * 60 * 24 * 7,
        etag: true,
        lastModified: true,
      },
    }),
  ],
})
export class AppModule { }