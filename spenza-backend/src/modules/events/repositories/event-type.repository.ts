import { Repository } from 'typeorm';
import { AppDataSource } from '../../../database/data-source';
import { EventType } from '../entities/event-type.entity';
import { IEventTypeRepository } from '../../../types/interfaces';

export class EventTypeRepository implements IEventTypeRepository {
  private repo: Repository<EventType>;

  constructor() {
    this.repo = AppDataSource.getRepository(EventType);
  }

  async findAllActive(): Promise<EventType[]> {
    return this.repo.find({ where: { isActive: true }, order: { name: 'ASC' } });
  }

  async findById(id: number): Promise<EventType | null> {
    return this.repo.findOneBy({ id });
  }

  async findByUuid(uuid: string): Promise<EventType | null> {
    return this.repo.findOneBy({ uuid });
  }
}
