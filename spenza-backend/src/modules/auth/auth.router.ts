import { Router } from 'express';
import { AuthController } from '../../controllers/AuthController';
import { AuthService } from './auth.service';
import { UserRepository } from '../../repositories/UserRepository';

const router = Router();

// Dependency Injection
const userRepository = new UserRepository();
const authService = new AuthService(userRepository);
const controller = new AuthController(authService);

router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/refresh', controller.refresh);

export default router;
