import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WsAdapter } from '@nestjs/platform-ws';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new WsAdapter(app));

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc:     ["'self'"],
          scriptSrc:      ["'self'"],
          styleSrc:       ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc:        ["'self'", 'https://fonts.gstatic.com'],
          imgSrc:         ["'self'", 'data:'],
          connectSrc:     ["'self'", 'wss:', 'ws:'],
          workerSrc:      ["'self'", 'blob:'],
          objectSrc:      ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false, // Three.js needs this off
    }),
  );

  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173'],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
