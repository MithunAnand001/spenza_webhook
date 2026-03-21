import { Router } from 'express';
import { SubscriptionController } from './controllers/subscriptions.controller';
import { SubscriptionsService } from './services/subscriptions.service';
import { UserEventMappingRepository } from './repositories/user-event-mapping.repository';
import { authMiddleware } from '../../middleware/auth.middleware';
import { UserConfigurationRepository } from './repositories/user-configuration.repository';
import { EventTypeRepository } from '../events/repositories/event-type.repository';
import { logger } from '../../utils/logger';

const router = Router();

const mappingRepo = new UserEventMappingRepository();
const configRepo = new UserConfigurationRepository();
const eventTypeRepo = new EventTypeRepository();
const service = new SubscriptionsService(mappingRepo, configRepo, eventTypeRepo);
const controller = new SubscriptionController(service, logger);

router.post('/test-url', authMiddleware, controller.testUrl);
router.post('/', authMiddleware, controller.create);
router.get('/', authMiddleware, controller.list);
router.get('/:uuid', authMiddleware, controller.get);
router.patch('/:uuid/cancel', authMiddleware, controller.cancel);

export default router;
