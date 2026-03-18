import { Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { UserEventMapping } from '../modules/subscriptions/user-event-mapping.entity';
import { IUserEventMappingRepository } from '../types/interfaces';

export class UserEventMappingRepository implements IUserEventMappingRepository {
  private repo: Repository<UserEventMapping>;

  constructor() {
    this.repo = AppDataSource.getRepository(UserEventMapping);
  }

  async findActive(userId: number, eventTypeId: number): Promise<UserEventMapping | null> {
    return this.repo.findOneBy({ userId, eventTypeId, isActive: true });
  }

  async findByUserId(userId: number): Promise<UserEventMapping[]> {
    return this.repo.find({
      where: { userId, isActive: true },
      relations: ['eventType'],
      order: { createdOn: 'DESC' },
    });
  }

  async findByIdAndUser(id: number, userId: number): Promise<UserEventMapping | null> {
    return this.repo.findOne({
      where: { id, userId },
      relations: ['eventType'],
    });
  }

  async findById(id: number): Promise<UserEventMapping | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['eventType'],
    });
  }

  async save(mapping: Partial<UserEventMapping>): Promise<UserEventMapping> {
    return this.repo.save(this.repo.create(mapping));
  }
}
