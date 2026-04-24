import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { LoginSchema, validate } from '../middleware/validate';

const router = Router();

router.post('/login', validate(LoginSchema), authController.login.bind(authController));
router.get('/me', authenticate, authController.me.bind(authController));

export default router;
