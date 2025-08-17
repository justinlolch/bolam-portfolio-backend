import { Handler } from 'aws-lambda';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import serverlessExpress from '@codegenie/serverless-express';

let cachedServer: Handler;

async function bootstrap(): Promise<Handler> {
    const expressApp = express();

    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

    app.enableCors({
        origin: '*',
        credentials: false,
    });

    // Optional: remove or adjust as needed
    // app.setGlobalPrefix('api');

    const config = new DocumentBuilder()
        .setTitle('Bolam API')
        .setDescription('API docs')
        .setVersion('1.0')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);

    await app.init();

    return serverlessExpress({ app: expressApp }); // ✅ app already wired here
}

export const handler: Handler = async (event, context) => {
    cachedServer = cachedServer ?? (await bootstrap());
    return cachedServer(event, context);
};