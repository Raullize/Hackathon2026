import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type {
  AuthUser,
  AuthenticatedRequest,
} from '../types/authenticated-request';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
