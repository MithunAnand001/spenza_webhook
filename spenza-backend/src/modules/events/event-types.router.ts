import { Router } from 'express';
import { EventController } from '../../controllers/EventController';
import { EventTypeRepository } from '../../repositories/EventTypeRepository';
import { WebhookLogRepository } from '../../repositories/WebhookLogRepository';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// Dependency Injection
const eventTypeRepo = new EventTypeRepository();
const logRepo = new WebhookLogRepository();
const controller = new EventController(eventTypeRepo, logRepo);

router.get('/', authMiddleware, controller.listEventTypes);
router.get('/:id', authMiddleware, controller.getEventType);

export default router;
