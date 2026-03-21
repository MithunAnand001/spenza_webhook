import { Router } from 'express';
import { EventController } from './controllers/events.controller';
import { EventTypeRepository } from './repositories/event-type.repository';
import { WebhookLogRepository } from './repositories/webhook-log.repository';
import { authMiddleware } from '../../middleware/auth.middleware';
import { logger } from '../../utils/logger';

const router = Router();

const eventTypeRepo = new EventTypeRepository();
const logRepo = new WebhookLogRepository();
const controller = new EventController(eventTypeRepo, logRepo, logger);

router.get('/', authMiddleware, controller.listEventTypes);
router.get('/:uuid', authMiddleware, controller.getEventType);

export default router;
