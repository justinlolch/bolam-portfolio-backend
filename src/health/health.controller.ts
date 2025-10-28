import {Controller, Get, Logger} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    private readonly logger = new Logger(HealthController.name);

    constructor() {}

    @Get()
    async getHealthCheck() {
        return {
            ok: true,
            timestamp: new Date().toISOString(),
            uptimeSec: Math.round(process.uptime()),
            version: process.env.APP_VERSION ?? 'dev',
        };
    }
}