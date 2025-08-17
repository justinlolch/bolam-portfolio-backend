import {
  INestApplication,
  NestInterceptor,
  ValidationPipe,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionFilter } from './logger/ExceptionFilter';
import { LoggingInterceptor } from './logger/LoggingInterceptor';
import {TimeoutInterceptor} from "./logger/TimeoutInterceptor";

export function configSwagger(app: INestApplication) {
  const options = new DocumentBuilder()
      .setTitle('Bolam Makeup')
      .setDescription('Default Description')
      .setVersion('0.0.1')
      .addBearerAuth(
          {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
          'access-token',
      )
      .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup("docs", app, document);
}

export function configApp(app: INestApplication) {
  app.use(helmet());
  const interceptorList: NestInterceptor[] = [new LoggingInterceptor(), new TimeoutInterceptor()];
  app.useGlobalInterceptors(...interceptorList);
  app.useGlobalFilters(new AllExceptionFilter());
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.setGlobalPrefix('bolam-portfolio-backend');
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
    app.enableCors({
        origin: ['http://localhost:5174'], // your frontend URL
        credentials: true, // if you're using cookies or Authorization header
    });
  configApp(app);
  configSwagger(app);
  await app.listen(8082);
}
bootstrap();
