import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap';
import type { AppEnv } from './config/env';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  const config = app.get<ConfigService<AppEnv, true>>(ConfigService);
  const port = config.get('PORT', { infer: true });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('CareFlow API')
    .setDescription(
      'API do CareFlow com autenticação JWT, health checks e chat com Gemini.',
    )
    .setVersion('0.1.0')
    .addBearerAuth()
    .addCookieAuth('access_token')
    .build();

  const document = cleanupOpenApiDoc(
    SwaggerModule.createDocument(app, swaggerConfig),
  );
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(port);

  Logger.log(`API em http://localhost:${port}/api`, 'Bootstrap');
  Logger.log(`Swagger em http://localhost:${port}/docs`, 'Bootstrap');
}

void bootstrap();
