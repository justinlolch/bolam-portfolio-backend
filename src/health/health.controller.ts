import {Controller, Get, Logger} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {PrismaService} from "../prisma/prisma.service";

@ApiTags('Health')
@Controller('health')
export class HealthController {
    private readonly logger = new Logger(HealthController.name);

    constructor(private readonly prisma: PrismaService) {}

    @Get()
    async getHealthCheck() {
        return {
            ok: true,
            timestamp: new Date().toISOString(),
            uptimeSec: Math.round(process.uptime()),
            version: process.env.APP_VERSION ?? 'dev',
        };
    }

    @Get('db-ping')
    async dbPing() {
        const ms = await this.prisma.pingMs();
        this.logger.log(`db-ping: ${ms}ms`);
        return { ok: true, ms };
    }
}