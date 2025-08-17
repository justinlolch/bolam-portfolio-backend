import { INestApplication, NestInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionFilter } from './logger/ExceptionFilter';
import { LoggingInterceptor } from './logger/LoggingInterceptor';
import { TimeoutInterceptor } from './logger/TimeoutInterceptor';

export function configSwagger(app: INestApplication) {
    const options = new DocumentBuilder()
        .setTitle('Bolam Makeup')
        .setDescription('Default Description')
        .setVersion('0.0.1')
        .build();

    const document = SwaggerModule.createDocument(app, options);
    // Will be served at /bolam-portfolio-backend/docs (because of the global prefix below)
    SwaggerModule.setup('docs', app, document);
}

export function configApp(app: INestApplication) {
    // Helmet with relaxed CSP so Swagger UI works out-of-the-box
    app.use(
        helmet({
            contentSecurityPolicy: false,
            crossOriginEmbedderPolicy: false,
        }),
    );

    const interceptorList: NestInterceptor[] = [
        new LoggingInterceptor(),
        new TimeoutInterceptor(),
    ];
    app.useGlobalInterceptors(...interceptorList);
    app.useGlobalFilters(new AllExceptionFilter());
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,           // strip unknown fields
            forbidNonWhitelisted: false,
        }),
    );

    // All API routes (and Swagger UI) will be prefixed with this
    app.setGlobalPrefix('bolam-portfolio-backend');
}

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        // keep container logs clean; adjust as you like
        logger: ['error', 'warn', 'log'],
    });

    app.enableCors({
        origin: (origin, cb) => cb(null, true),  // allow ALL origins (echoes caller)
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: 'Content-Type,Authorization',
        exposedHeaders: 'Content-Disposition',
        optionsSuccessStatus: 204,
    });

    // Health check (root path, not behind the global prefix) — good for Render/Cloud Run
    app.getHttpAdapter().get('/healthz', (_req, res) => res.status(200).send('ok'));

    // Graceful shutdown for container stop signals
    app.enableShutdownHooks();

    configApp(app);
    configSwagger(app);

    // IMPORTANT: bind to platform port and 0.0.0.0 for Docker/Cloud
    const port = Number(process.env.PORT) || 8080;
    await app.listen(port, '0.0.0.0');
}

bootstrap();