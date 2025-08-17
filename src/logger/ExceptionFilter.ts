import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AxiosError } from 'axios';

interface NestError extends Error {
  isAxiosError?: boolean;
}

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionFilter.name);

  private getResponseData(exception: NestError) {
    if (exception.isAxiosError) {
      const httpError = exception as AxiosError;

      const method = httpError?.config?.method?.toUpperCase() || '';
      const url = httpError?.config?.url || '';
      const status = httpError?.response?.status || 500;
      const statusText = httpError?.response?.statusText || 'Axios Error';
      const data = httpError?.response?.data || {};

      this.logger.error(`[AxiosError] Method: ${method} URL: ${url} Code: ${status} Message: ${statusText} Data: ${JSON.stringify(data)}`);

      return {
        statusCode: status,
        message: statusText,
        error: {
          statusCode: status,
          message: data,
        },
      };
    }

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const status = exception.getStatus();

      return {
        statusCode: status,
        message: exception.message || '',
        error: typeof response === 'string'
            ? {
              statusCode: status,
              message: response,
            }
            : response,
      };
    }

    // Default fallback
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'INTERNAL_SERVER_ERROR',
      error: {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'INTERNAL_SERVER_ERROR',
      },
    };
  }

  catch(exception: NestError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const responseData = this.getResponseData(exception);

    this.logger.error(
        exception.message || 'Unknown error',
        exception.stack || '',
    );

    response.status(responseData.statusCode).json(responseData);
  }
}