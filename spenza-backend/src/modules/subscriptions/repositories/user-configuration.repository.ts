import { Repository } from 'typeorm';
import { AppDataSource } from '../../../database/data-source';
import { UserConfiguration } from '../entities/user-configuration.entity';
import { IUserConfigurationRepository } from '../../../types/interfaces';

export class UserConfigurationRepository implements IUserConfigurationRepository {
  private repo: Repository<UserConfiguration>;

  constructor() {
    this.repo = AppDataSource.getRepository(UserConfiguration);
  }

  async findByUserId(userId: number): Promise<UserConfiguration | null> {
    return this.repo.findOneBy({ userId, isActive: true });
  }

  async save(config: Partial<UserConfiguration>): Promise<UserConfiguration> {
    return this.repo.save(this.repo.create(config));
  }
}
