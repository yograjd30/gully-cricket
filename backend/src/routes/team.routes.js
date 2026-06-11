import { Router } from 'express';
import optionalAuth from '../middleware/optionalAuth.middleware.js';
import { mutationLimiter } from '../middleware/rateLimit.js';
import {
  getTeams,
  createTeam,
  createTeamValidation,
  updateTeam,
  updateTeamValidation,
  deleteTeam,
} from '../controllers/team.controller.js';

const router = Router();

router.get('/', optionalAuth, getTeams);
router.post('/', optionalAuth, mutationLimiter, createTeamValidation, createTeam);
router.patch('/:id', optionalAuth, mutationLimiter, updateTeamValidation, updateTeam);
router.delete('/:id', optionalAuth, mutationLimiter, deleteTeam);

export default router;
