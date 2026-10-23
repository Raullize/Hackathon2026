import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type {
  AuthResponse,
  LoginInput,
  PublicUser,
  RegisterInput,
} from '@hackathon/contracts';
import { Prisma } from '@prisma/client';
import argon2 from 'argon2';
import { USER_REPOSITORY, type UserRepository } from './auth.repository';
import type { UserRecord } from './domain/user';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepository,
    private readonly jwt: JwtService,
  ) {}

  async register(input: RegisterInput): Promise<AuthResponse> {
    const existing = await this.users.findByEmail(input.email);

    if (existing) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const passwordHash = await argon2.hash(input.password, {
      type: argon2.argon2id,
    });

    try {
      const user = await this.users.create({
        name: input.name,
        email: input.email,
        passwordHash,
      });

      return this.issueToken(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('E-mail já cadastrado');
      }
      throw error;
    }
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.users.findByEmail(input.email);

    if (!user) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    const passwordMatches = await argon2.verify(
      user.passwordHash,
      input.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    return this.issueToken(user);
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.users.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return toPublicUser(user);
  }

  private async issueToken(user: UserRecord): Promise<AuthResponse> {
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
    });

    return {
      accessToken,
      user: toPublicUser(user),
    };
  }
}

function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  };
}
