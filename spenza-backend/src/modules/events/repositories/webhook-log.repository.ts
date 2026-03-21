import { Repository } from 'typeorm';
import { AppDataSource } from '../../../database/data-source';
import { WebhookEventLog } from '../entities/webhook-event-log.entity';
import { IWebhookLogRepository } from '../../../types/interfaces';

export class WebhookLogRepository implements IWebhookLogRepository {
  private repo: Repository<WebhookEventLog>;

  constructor() {
    this.repo = AppDataSource.getRepository(WebhookEventLog);
  }

  async findById(id: number): Promise<WebhookEventLog | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['mapping'],
    });
  }

  async findByUuid(uuid: string): Promise<WebhookEventLog | null> {
    return this.repo.findOne({
      where: { uuid },
      relations: ['mapping'],
    });
  }

  async findByUuidAndUser(uuid: string, userId: number): Promise<WebhookEventLog | null> {
    return this.repo.findOne({
      where: { uuid, userId },
      relations: ['mapping'],
    });
  }

  async findAndCount(options: any): Promise<[WebhookEventLog[], number]> {
    return this.repo.findAndCount(options);
  }

  async findOne(options: any): Promise<WebhookEventLog | null> {
    return this.repo.findOne(options);
  }

  async save(log: Partial<WebhookEventLog>): Promise<WebhookEventLog> {
    return this.repo.save(this.repo.create(log));
  }
}
