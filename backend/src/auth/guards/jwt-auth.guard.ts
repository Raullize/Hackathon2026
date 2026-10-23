import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type {
  AuthUser,
  AuthenticatedRequest,
} from '../../common/types/authenticated-request';

interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const bearerToken = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : undefined;
    const cookieToken = request.cookies?.access_token as string | undefined;
    const token = bearerToken ?? cookieToken;

    if (!token) {
      throw new UnauthorizedException('Token de acesso ausente');
    }

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      const user: AuthUser = { id: payload.sub, email: payload.email };
      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }
}
