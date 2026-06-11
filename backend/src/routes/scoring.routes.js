import { Router } from 'express';
import optionalAuth from '../middleware/optionalAuth.middleware.js';
import { mutationLimiter } from '../middleware/rateLimit.js';
import {
  recordBall,
  recordBallValidation,
  undoLastBall,
  completeMatch,
} from '../controllers/scoring.controller.js';

const router = Router();

// POST /api/scoring/:id/ball — Record a delivery
router.post('/:id/ball', optionalAuth, mutationLimiter, recordBallValidation, recordBall);

// DELETE /api/scoring/:id/ball — Undo last ball
router.delete('/:id/ball', optionalAuth, mutationLimiter, undoLastBall);

// POST /api/scoring/:id/complete — Finalize match
router.post('/:id/complete', optionalAuth, mutationLimiter, completeMatch);

export default router;
