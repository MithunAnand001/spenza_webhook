import crypto from 'crypto';
import { 
  IUserEventMappingRepository, 
  IUserConfigurationRepository, 
  IWebhookLogRepository, 
  IEventRepository,
  IWebhookIngestService
} from '../../../types/interfaces';
import { EventLogStatus } from '../../events/entities/webhook-event-log.entity';
import { publishWebhookEvent } from '../../../rabbitmq/rabbitmq.service';

export class WebhookIngestService implements IWebhookIngestService {
  constructor(
    private mappingRepo: IUserEventMappingRepository,
    private configRepo: IUserConfigurationRepository,
    private logRepo: IWebhookLogRepository,
    private eventRepo: IEventRepository
  ) {}

  async ingest(
    subscriptionUuid: string,
    payload: Record<string, unknown>,
    signature: string | undefined,
    correlationId: string | undefined
  ) {
    // 1. Load subscription by UUID with user relation
    const mapping = await this.mappingRepo.findByUuid(subscriptionUuid);
    if (!mapping || !mapping.isActive) throw new Error('Subscription not found or inactive');

    // 2. Load user config for signing secret
    const config = await this.configRepo.findByUserId(mapping.userId);

    // 3. Verify HMAC signature if config exists and has signing secret
    if (config?.signingSecret) {
      if (!signature) throw new Error('Missing X-Webhook-Signature header');
      const expected = this.computeSignature(payload, config.signingSecret);
      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expected, 'hex')
      );
      if (!isValid) throw new Error('Invalid webhook signature');
    }

    // 4. Find or create event record for this event type
    let event = await this.eventRepo.findByEventTypeId(mapping.eventTypeId);
    if (!event) {
      event = await this.eventRepo.save({
        eventTypeId: mapping.eventTypeId,
        name: mapping.eventType?.name ?? 'Unknown',
        description: 'Auto-created on first ingest',
        createdBy: mapping.userId,
      });
    }

    // 5. Create event log record
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

    // 6. Publish to RabbitMQ with User UUID
    const userRepo = (this.mappingRepo as any).repo.manager.getRepository('User');
    const user = await userRepo.findOneBy({ id: mapping.userId });

    publishWebhookEvent(log.id, user.uuid, 0, log.correlationId || undefined);

    return { message: 'Webhook received', logUuid: log.uuid, correlationId: log.correlationId };
  }

  private computeSignature(payload: Record<string, unknown>, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }
}
