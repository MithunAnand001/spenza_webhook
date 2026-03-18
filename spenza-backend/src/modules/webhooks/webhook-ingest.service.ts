import crypto from 'crypto';
import { 
  IUserEventMappingRepository, 
  IUserConfigurationRepository, 
  IWebhookLogRepository, 
  IEventRepository,
  IWebhookIngestService
} from '../../types/interfaces';
import { EventLogStatus } from '../events/webhook-event-log.entity';
import { publishWebhookEvent } from '../../rabbitmq/rabbitmq.service';
import { logger } from '../../utils/logger';

export class WebhookIngestService implements IWebhookIngestService {
  constructor(
    private mappingRepo: IUserEventMappingRepository,
    private configRepo: IUserConfigurationRepository,
    private logRepo: IWebhookLogRepository,
    private eventRepo: IEventRepository
  ) {}

  async ingest(
    subscriptionId: number,
    payload: Record<string, unknown>,
    signature: string | undefined,
    correlationId: string | undefined
  ) {
    const mapping = await this.mappingRepo.findById(subscriptionId);
    if (!mapping || !mapping.isActive) {
      throw new Error('Subscription not found or inactive');
    }

    const config = await this.configRepo.findByUserId(mapping.userId);

    if (config?.signingSecret) {
      if (!signature) throw new Error('Missing X-Webhook-Signature header');
      const expected = this.computeSignature(payload, config.signingSecret);
      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expected, 'hex')
      );
      if (!isValid) throw new Error('Invalid webhook signature');
    }

    let event = await this.eventRepo.findByEventTypeId(mapping.eventTypeId);
    if (!event) {
      event = await this.eventRepo.save({
        eventTypeId: mapping.eventTypeId,
        name: mapping.eventType?.name ?? 'Unknown',
        description: 'Auto-created on first ingest',
        createdBy: mapping.userId,
      });
    }

    const log = await this.logRepo.save({
      userId: mapping.userId,
      eventId: event.id,
      mappingId: mapping.id,
      payload,
      status: EventLogStatus.PENDING,
      correlationId: correlationId ?? null,
      attemptNumber: 0,
      createdBy: mapping.userId,
    });

    publishWebhookEvent(log.id, 0, log.correlationId || undefined);

    return { message: 'Webhook received', logId: log.id, correlationId: log.correlationId };
  }

  private computeSignature(payload: Record<string, unknown>, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }
}
