import { Router } from 'express';
import { SubscriptionController } from '../../controllers/SubscriptionController';
import { SubscriptionsService } from './subscriptions.service';
import { UserEventMappingRepository } from '../../repositories/UserEventMappingRepository';
import { UserConfigurationRepository } from '../../repositories/UserConfigurationRepository';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// Dependency Injection
const mappingRepo = new UserEventMappingRepository();
const configRepo = new UserConfigurationRepository();
const service = new SubscriptionsService(mappingRepo, configRepo);
const controller = new SubscriptionController(service);

router.post('/test-url', authMiddleware, controller.testUrl);
router.post('/', authMiddleware, controller.create);
router.get('/', authMiddleware, controller.list);
router.get('/:id', authMiddleware, controller.get);
router.patch('/:id/cancel', authMiddleware, controller.cancel);

export default router;
