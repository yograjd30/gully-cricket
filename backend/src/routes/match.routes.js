import { Router } from 'express';
import optionalAuth from '../middleware/optionalAuth.middleware.js';
import { mutationLimiter } from '../middleware/rateLimit.js';
import {
  getMatches,
  getMatch,
  createMatch,
  createMatchValidation,
  updateToss,
  updateTossValidation,
  updateStatus,
  deleteMatch,
} from '../controllers/match.controller.js';

const router = Router();

router.get('/', optionalAuth, getMatches);
router.get('/:id', optionalAuth, getMatch);
router.post('/', optionalAuth, mutationLimiter, createMatchValidation, createMatch);
router.patch('/:id/toss', optionalAuth, mutationLimiter, updateTossValidation, updateToss);
router.patch('/:id/status', optionalAuth, mutationLimiter, updateStatus);
router.delete('/:id', optionalAuth, mutationLimiter, deleteMatch);

export default router;
