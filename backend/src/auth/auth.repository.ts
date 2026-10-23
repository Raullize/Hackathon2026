import type { CreateUserData, UserRecord } from './domain/user';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  create(data: CreateUserData): Promise<UserRecord>;
}
