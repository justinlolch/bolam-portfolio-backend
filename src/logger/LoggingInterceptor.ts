import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request as IRequest } from 'express';
import { Observable } from 'rxjs';

/**
 * Global Logger configuration
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Request');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<IRequest>();
    if (request && request.url.indexOf('/api') == 0) {
      this.logger.log(
        `Controller [${context.getClass().name}] Method [${request.method}] URL [${request.url}]`,
      );
    }
    return next.handle();
  }
}
