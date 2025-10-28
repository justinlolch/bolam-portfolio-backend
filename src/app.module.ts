import {Module} from '@nestjs/common';
import {PrismaModule} from './prisma/prisma.module';
import {PrismaService} from "./prisma/prisma.service";
import {ConfigModule} from "@nestjs/config";
import {S3Module} from './s3/s3.module';
import { CollectionModule } from './collection/collection.module';
import { HealthModule } from './health/health.module';

@Module({
    imports: [PrismaModule, ConfigModule.forRoot({isGlobal: true}), S3Module, CollectionModule, HealthModule],
    providers: [PrismaService],
    controllers: [],
})
export class AppModule {
}
