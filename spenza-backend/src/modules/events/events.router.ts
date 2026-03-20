import { Router } from 'express';
import { EventController } from '../../controllers/EventController';
import { EventTypeRepository } from '../../repositories/EventTypeRepository';
import { WebhookLogRepository } from '../../repositories/WebhookLogRepository';
import { authMiddleware } from '../../middleware/auth.middleware';
import { logger } from '../../utils/logger';

const router = Router();

const eventTypeRepo = new EventTypeRepository();
const logRepo = new WebhookLogRepository();
const controller = new EventController(eventTypeRepo, logRepo, logger);

router.get('/', authMiddleware, controller.listEvents);
router.get('/:id', authMiddleware, controller.getEventLog);

export default router;
