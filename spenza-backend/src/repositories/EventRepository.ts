import { Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { Event } from '../modules/events/event.entity';
import { IEventRepository } from '../types/interfaces';

export class EventRepository implements IEventRepository {
  private repo: Repository<Event>;

  constructor() {
    this.repo = AppDataSource.getRepository(Event);
  }

  async findByEventTypeId(eventTypeId: number): Promise<Event | null> {
    return this.repo.findOneBy({ eventTypeId });
  }

  async findByUuid(uuid: string): Promise<Event | null> {
    return this.repo.findOneBy({ uuid });
  }

  async save(event: Partial<Event>): Promise<Event> {
    return this.repo.save(this.repo.create(event));
  }
}
