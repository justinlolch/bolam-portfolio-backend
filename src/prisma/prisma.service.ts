import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
    private readonly logger = new Logger(PrismaService.name);
    private connecting?: Promise<void>;

    constructor() {
        super({
            log: ['warn', 'error'],
            datasources: { db: { url: process.env.DATABASE_URL } },
        });
    }

    async ensureConnected() {
        this.logger.log("Checking Prisma Connection")
        if ((this as any)._engine?.isConnected?.()) return;
        if (!this.connecting) {
            this.logger.log("Prisma was not connecting");
            this.connecting = this.$connect().catch((e) => {
                this.connecting = undefined;
                throw e;
            });
        }
        this.logger.log("Prisma connected");
        await this.connecting;
        this.connecting = undefined;
    }

    async pingMs(): Promise<number> {
        const t0 = Date.now();
        await this.$queryRaw`SELECT 1`;
        return Date.now() - t0;
    }
}