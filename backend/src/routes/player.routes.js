import { Router } from 'express';
import optionalAuth from '../middleware/optionalAuth.middleware.js';
import { mutationLimiter } from '../middleware/rateLimit.js';
import {
  getPlayers,
  createPlayer,
  createPlayerValidation,
  updatePlayer,
  updatePlayerValidation,
  deletePlayer,
  getPlayerStats,
} from '../controllers/player.controller.js';

const router = Router();

router.get('/', optionalAuth, getPlayers);
router.post('/', optionalAuth, mutationLimiter, createPlayerValidation, createPlayer);
router.patch('/:id', optionalAuth, mutationLimiter, updatePlayerValidation, updatePlayer);
router.delete('/:id', optionalAuth, mutationLimiter, deletePlayer);
router.get('/:id/stats', optionalAuth, getPlayerStats);

export default router;
