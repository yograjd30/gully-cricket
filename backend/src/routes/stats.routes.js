import { Router } from 'express';
import optionalAuth from '../middleware/optionalAuth.middleware.js';
import { getLeaderboard, getHeadToHead } from '../controllers/stats.controller.js';

const router = Router();

router.get('/leaderboard', optionalAuth, getLeaderboard);
router.get('/head-to-head', optionalAuth, getHeadToHead);

export default router;
