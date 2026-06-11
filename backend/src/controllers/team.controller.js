import Team from '../models/Team.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { body, param, validationResult } from 'express-validator';

const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, error: errors.array()[0].msg, code: 400 });
    return false;
  }
  return true;
};

// GET /api/teams
export const getTeams = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user) filter.userId = req.user._id;

  const teams = await Team.find(filter)
    .populate('players', 'name nickname role avatar')
    .select('-__v')
    .sort({ name: 1 })
    .lean();

  res.json({ success: true, data: teams });
});

// POST /api/teams
export const createTeamValidation = [
  body('name').trim().notEmpty().withMessage('Team name is required'),
  body('color').optional().matches(/^#[0-9a-fA-F]{6}$/).withMessage('Invalid hex color'),
  body('players').optional().isArray({ max: 11 }).withMessage('Max 11 players'),
];

export const createTeam = asyncHandler(async (req, res) => {
  if (!validate(req, res)) return;

  const team = await Team.create({
    userId: req.user?._id || null,
    name: req.body.name,
    color: req.body.color || '#A3E635',
    logo: req.body.logo || '🏏',
    players: req.body.players || [],
  });

  res.status(201).json({ success: true, data: team });
});

// PATCH /api/teams/:id
export const updateTeamValidation = [
  param('id').isMongoId().withMessage('Invalid team ID'),
  body('name').optional().trim().notEmpty(),
  body('color').optional().matches(/^#[0-9a-fA-F]{6}$/),
  body('players').optional().isArray({ max: 11 }),
];

export const updateTeam = asyncHandler(async (req, res) => {
  if (!validate(req, res)) return;

  const updates = {};
  const allowed = ['name', 'color', 'logo', 'players'];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const team = await Team.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true, runValidators: true }
  ).populate('players', 'name nickname role avatar').select('-__v').lean();

  if (!team) {
    return res.status(404).json({ success: false, error: 'Team not found', code: 404 });
  }

  res.json({ success: true, data: team });
});

// DELETE /api/teams/:id
export const deleteTeam = asyncHandler(async (req, res) => {
  const team = await Team.findByIdAndDelete(req.params.id);
  if (!team) {
    return res.status(404).json({ success: false, error: 'Team not found', code: 404 });
  }

  res.json({ success: true, data: { message: 'Team deleted' } });
});
