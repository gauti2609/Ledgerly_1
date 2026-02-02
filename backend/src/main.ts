import { NestFactory } from '@nestjs/core';
// Trigger restart
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set a global prefix for all routes to '/api'
  app.setGlobalPrefix('api');

  // Enable global validation pipes
  app.useGlobalPipes(new ValidationPipe());

  // Enable CORS for frontend development if needed (Docker setup handles this in prod)
  app.enableCors();

  // Increase payload size limit for large trial balance data
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  await app.listen(process.env.PORT || 8002, '0.0.0.0');
}
bootstrap();
