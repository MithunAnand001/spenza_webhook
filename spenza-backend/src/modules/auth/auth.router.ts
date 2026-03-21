import { Router } from 'express';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { UserRepository } from './repositories/user.repository';
import { logger } from '../../utils/logger';

const router = Router();

// Dependency Injection
const userRepository = new UserRepository();
const authService = new AuthService(userRepository);
const controller = new AuthController(authService, logger);

router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/refresh', controller.refresh);

export default router;
