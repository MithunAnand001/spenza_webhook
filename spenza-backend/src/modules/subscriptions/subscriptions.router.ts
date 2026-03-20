import { Router } from 'express';
import { SubscriptionController } from '../../controllers/SubscriptionController';
import { SubscriptionsService } from './subscriptions.service';
import { UserEventMappingRepository } from '../../repositories/UserEventMappingRepository';
import { EventTypeRepository } from '../../repositories/EventTypeRepository';
import { authMiddleware } from '../../middleware/auth.middleware';
import { UserConfigurationRepository } from '../../repositories/UserConfigurationRepository';
import { logger } from '../../utils/logger';

const router = Router();

const mappingRepo = new UserEventMappingRepository();
const configRepo = new UserConfigurationRepository();
const service = new SubscriptionsService(mappingRepo, configRepo);
const controller = new SubscriptionController(service, logger);

router.post('/test-url', authMiddleware, controller.testUrl);
router.post('/', authMiddleware, controller.create);
router.get('/', authMiddleware, controller.list);
router.get('/:id', authMiddleware, controller.get);
router.patch('/:id/cancel', authMiddleware, controller.cancel);

export default router;
