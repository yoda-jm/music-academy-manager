import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 4000);
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
  const redisUrl = configService.get<string>('REDIS_URL', 'redis://localhost:6379');
  // Parse REDIS_URL: redis://:password@host:port
  const parsedRedis = new URL(redisUrl);
  const redisHost = parsedRedis.hostname;
  const redisPort = parseInt(parsedRedis.port || '6379', 10);
  const redisPassword = parsedRedis.password || undefined;

  // CORS
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  });

  // Middleware
  app.use(compression());
  app.use(cookieParser());

  // Global prefix
  app.setGlobalPrefix('api');

  // Health check (used by Docker healthcheck — outside auth guards)
  app.getHttpAdapter().get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters
  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new PrismaExceptionFilter(),
  );

  // Global interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // Redis adapter for Socket.io (scaling)
  const pubClient = new Redis({
    host: redisHost,
    port: redisPort,
    ...(redisPassword ? { password: redisPassword } : {}),
  });
  const subClient = pubClient.duplicate();

  class RedisIoAdapter extends IoAdapter {
    createIOServer(port: number, options?: any) {
      const server = super.createIOServer(port, {
        ...options,
        cors: {
          origin: frontendUrl,
          credentials: true,
        },
      });
      server.adapter(createAdapter(pubClient, subClient));
      return server;
    }
  }

  app.useWebSocketAdapter(new RedisIoAdapter(app));

  // Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Music Academy Manager API')
    .setDescription('Complete API documentation for Music Academy Manager')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('families', 'Family management')
    .addTag('teachers', 'Teacher management')
    .addTag('students', 'Student management')
    .addTag('rooms', 'Room management')
    .addTag('instruments', 'Instrument management')
    .addTag('courses', 'Course management')
    .addTag('scheduling', 'Scheduling and sessions')
    .addTag('attendance', 'Attendance tracking')
    .addTag('billing', 'Billing and invoicing')
    .addTag('vacations', 'Vacation management')
    .addTag('messaging', 'Messaging system')
    .addTag('notifications', 'Notification management')
    .addTag('reports', 'Reports and analytics')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port);
  console.log(`Music Academy Manager API running on port ${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api/docs`);
}

bootstrap();
