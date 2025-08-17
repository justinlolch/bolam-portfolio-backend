import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import {catchError, Observable, timeout} from 'rxjs';
import { TimeoutError } from 'rxjs';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            timeout(300000), // 300 seconds timeout
            catchError((error) => {
                if (error instanceof TimeoutError) {
                    throw new Error('Request timed out');
                }
                throw error;
            }),
        );
    }
}