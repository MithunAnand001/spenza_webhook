import { Router } from 'express';
import { WebhookIngestController } from '../../controllers/WebhookIngestController';
import { WebhookIngestService } from '../webhooks/webhook-ingest.service';
import { UserEventMappingRepository } from '../../repositories/UserEventMappingRepository';
import { UserConfigurationRepository } from '../../repositories/UserConfigurationRepository';
import { WebhookLogRepository } from '../../repositories/WebhookLogRepository';
import { EventRepository } from '../../repositories/EventRepository';

const router = Router();

// Dependency Injection
const mappingRepo = new UserEventMappingRepository();
const configRepo = new UserConfigurationRepository();
const logRepo = new WebhookLogRepository();
const eventRepo = new EventRepository();
const service = new WebhookIngestService(mappingRepo, configRepo, logRepo, eventRepo);
const controller = new WebhookIngestController(service);

router.post('/ingest/:subscriptionId', controller.ingest);

export default router;
