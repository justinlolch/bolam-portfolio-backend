import { Handler } from 'aws-lambda';
import serverlessExpress from '@vendia/serverless-express';
import express from 'express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

let cachedServer: Handler;

async function bootstrap() {
    const expressApp = express();
    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

    // Prefix all routes with /bolam-portfolio-backend
    app.setGlobalPrefix('bolam-portfolio-backend');

    const config = new DocumentBuilder()
        .setTitle('Bolam API')
        .setDescription('API docs')
        .setVersion('1.0')
        .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('bolam-portfolio-backend/docs', app, document, {
        customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
        customJs: [
            'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
        ],
    });

    await app.init();
    return serverlessExpress({ app: expressApp });
}

export const handler: Handler = async (event, context) => {
    cachedServer = cachedServer ?? (await bootstrap());
    return cachedServer(event, context);
};