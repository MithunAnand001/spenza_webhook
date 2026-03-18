import { Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { User } from '../modules/auth/user.entity';
import { IUserRepository } from '../types/interfaces';

export class UserRepository implements IUserRepository {
  private repo: Repository<User>;

  constructor() {
    this.repo = AppDataSource.getRepository(User);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOneBy({ emailId: email });
  }

  async findById(id: number): Promise<User | null> {
    return this.repo.findOneBy({ id });
  }

  async save(user: Partial<User>): Promise<User> {
    return this.repo.save(this.repo.create(user));
  }
}
