import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse: any = exception.getResponse();

      // If we threw a structured error like { error: { code, message } }
      if (exceptionResponse?.error?.code) {
        code = exceptionResponse.error.code;
        message = exceptionResponse.error.message;
      } 
      // If it's a validation error from class-validator
      else if (status === HttpStatus.BAD_REQUEST && Array.isArray(exceptionResponse?.message)) {
        code = 'VALIDATION_ERROR';
        message = exceptionResponse.message.join(', ');
      }
      else {
        message = exception.message;
      }
    } else {
      console.error(exception); // Log unexpected errors
    }

    response.status(status).json({
      error: { code, message },
    });
  }
}
