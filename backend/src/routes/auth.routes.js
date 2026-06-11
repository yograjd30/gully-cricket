import { Router } from 'express';
import { authLimiter } from '../middleware/rateLimit.js';
import {
  googleAuth,
  googleCallback,
  googleCallbackRedirect,
  getMe,
  logout,
} from '../controllers/auth.controller.js';

const router = Router();

router.get('/google', authLimiter, googleAuth);
router.get('/google/callback', googleCallback, googleCallbackRedirect);
router.get('/me', getMe);
router.post('/logout', logout);

export default router;
