import { Injectable } from '@nestjs/common';
import type { User as PrismaUser } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { UserRepository } from '../auth.repository';
import type { CreateUserData, UserRecord } from '../domain/user';

function toUserRecord(user: PrismaUser): UserRecord {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserRecord | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user ? toUserRecord(user) : null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? toUserRecord(user) : null;
  }

  async create(data: CreateUserData): Promise<UserRecord> {
    const user = await this.prisma.user.create({ data });
    return toUserRecord(user);
  }
}
