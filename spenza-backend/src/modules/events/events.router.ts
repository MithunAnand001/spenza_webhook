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

router.get('/', authMiddleware, controller.listEvents);
router.get('/stream', authMiddleware, controller.stream);
router.get('/:id', authMiddleware, controller.getEventLog);

export default router;
