import { Router } from 'express';
import { WebhookIngestController } from './controllers/webhook-ingest.controller';
import { WebhookIngestService } from './services/webhook-ingest.service';
import { UserEventMappingRepository } from '../subscriptions/repositories/user-event-mapping.repository';
import { UserConfigurationRepository } from '../subscriptions/repositories/user-configuration.repository';
import { WebhookLogRepository } from '../events/repositories/webhook-log.repository';
import { EventRepository } from '../events/repositories/event.repository';
import { logger } from '../../utils/logger';

const router = Router();

const mappingRepo = new UserEventMappingRepository();
const configRepo = new UserConfigurationRepository();
const logRepo = new WebhookLogRepository();
const eventRepo = new EventRepository();

const service = new WebhookIngestService(mappingRepo, configRepo, logRepo, eventRepo);
const controller = new WebhookIngestController(service, logger);

router.post('/ingest/:subscriptionUuid', controller.ingest);

export default router;
