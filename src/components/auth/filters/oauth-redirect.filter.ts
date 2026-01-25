import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(UnauthorizedException)
export class OAuthRedirectFilter implements ExceptionFilter {
  catch(exception: UnauthorizedException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const exceptionResponse = exception.getResponse() as any;

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    // Check if this is a WITHDRAWN user - redirect to signup with error
    if (exceptionResponse?.error === 'WITHDRAWN') {
      return response.redirect(`${frontendUrl}/signup?error=WITHDRAWN`);
    }

    // Check if this is a NOT_REGISTERED user - redirect to signup with error
    if (exceptionResponse?.error === 'NOT_REGISTERED') {
      return response.redirect(`${frontendUrl}/signup?error=NOT_REGISTERED`);
    }

    // Default fallback - redirect to signup
    return response.redirect(`${frontendUrl}/signup`);
  }
}
