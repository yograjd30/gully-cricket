import Player from '../models/Player.js';
import Match from '../models/Match.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { body, param, validationResult } from 'express-validator';

// Validation helper
const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, error: errors.array()[0].msg, code: 400 });
    return false;
  }
  return true;
};

// GET /api/players
export const getPlayers = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.user) filter.userId = req.user._id;

  const players = await Player.find(filter)
    .select('-__v')
    .sort({ name: 1 })
    .lean();

  res.json({ success: true, data: players });
});

// POST /api/players
export const createPlayerValidation = [
  body('name').trim().notEmpty().withMessage('Player name is required'),
  body('role').optional().isIn(['batsman', 'bowler', 'allrounder']),
  body('battingStyle').optional().isIn(['right', 'left']),
  body('bowlingStyle').optional().isIn(['fast', 'medium', 'spin', 'none']),
];

export const createPlayer = asyncHandler(async (req, res) => {
  if (!validate(req, res)) return;

  const player = await Player.create({
    userId: req.user?._id || null,
    name: req.body.name,
    nickname: req.body.nickname || '',
    avatar: req.body.avatar || '',
    role: req.body.role || 'allrounder',
    battingStyle: req.body.battingStyle || 'right',
    bowlingStyle: req.body.bowlingStyle || 'none',
  });

  res.status(201).json({ success: true, data: player });
});

// PATCH /api/players/:id
export const updatePlayerValidation = [
  param('id').isMongoId().withMessage('Invalid player ID'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('role').optional().isIn(['batsman', 'bowler', 'allrounder']),
  body('battingStyle').optional().isIn(['right', 'left']),
  body('bowlingStyle').optional().isIn(['fast', 'medium', 'spin', 'none']),
];

export const updatePlayer = asyncHandler(async (req, res) => {
  if (!validate(req, res)) return;

  const updates = {};
  const allowed = ['name', 'nickname', 'avatar', 'role', 'battingStyle', 'bowlingStyle'];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const player = await Player.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true, runValidators: true }
  ).select('-__v').lean();

  if (!player) {
    return res.status(404).json({ success: false, error: 'Player not found', code: 404 });
  }

  res.json({ success: true, data: player });
});

// DELETE /api/players/:id (soft-delete)
export const deletePlayer = asyncHandler(async (req, res) => {
  const player = await Player.findByIdAndUpdate(
    req.params.id,
    { $set: { isActive: false } },
    { new: true }
  ).lean();

  if (!player) {
    return res.status(404).json({ success: false, error: 'Player not found', code: 404 });
  }

  res.json({ success: true, data: { message: 'Player deactivated' } });
});

// GET /api/players/:id/stats
export const getPlayerStats = asyncHandler(async (req, res) => {
  const playerId = req.params.id;

  const player = await Player.findById(playerId).select('-__v').lean();
  if (!player) {
    return res.status(404).json({ success: false, error: 'Player not found', code: 404 });
  }

  // Aggregate stats from match data
  const matches = await Match.find({
    status: 'completed',
    $or: [
      { 'teamA.players': playerId },
      { 'teamB.players': playerId },
    ],
  }).select('innings teamA teamB result').lean();

  let totalMatches = matches.length;
  let totalRuns = 0;
  let totalBallsFaced = 0;
  let totalWickets = 0;
  let totalBallsBowled = 0;
  let totalRunsConceded = 0;
  let highestScore = 0;
  let bestBowling = { wickets: 0, runs: Infinity };
  let fifties = 0;
  let fours = 0;
  let sixes = 0;

  for (const match of matches) {
    for (const innings of match.innings) {
      // Batting stats
      let inningsRuns = 0;
      let inningsBalls = 0;
      let inningsFours = 0;
      let inningsSixes = 0;

      for (const ball of innings.balls) {
        if (ball.isUndone) continue;

        if (ball.batsmanId?.toString() === playerId) {
          inningsRuns += ball.runs;
          const isWide = ball.extras?.type === 'offside_wide' || ball.extras?.type === 'legside_wide';
          const isRetired = ball.isWicket && ball.wicket?.type === 'retired';
          if (!isWide && !isRetired) inningsBalls++;
          if (ball.runs === 4) inningsFours++;
          if (ball.runs === 6) inningsSixes++;
        }

        // Bowling stats
        if (ball.bowlerId?.toString() === playerId) {
          if (ball.isLegal) totalBallsBowled++;
          const isBowlerExtra = ball.extras?.type === 'offside_wide' || ball.extras?.type === 'legside_wide' || ball.extras?.type === 'no_ball' || ball.extras?.type === 'crease_no_ball' || ball.extras?.type === 'height_no_ball';
          const extraConceded = isBowlerExtra ? (ball.extras?.runs || 0) : 0;
          totalRunsConceded += (ball.runs || 0) + extraConceded;
          if (ball.isWicket && ball.wicket?.type !== 'run_out' && ball.wicket?.type !== 'retired') {
            totalWickets++;
          }
        }
      }

      totalRuns += inningsRuns;
      totalBallsFaced += inningsBalls;
      fours += inningsFours;
      sixes += inningsSixes;
      if (inningsRuns > highestScore) highestScore = inningsRuns;
      if (inningsRuns >= 50) fifties++;
    }
  }

  const battingAvg = totalMatches > 0 ? (totalRuns / totalMatches).toFixed(2) : '0.00';
  const strikeRate = totalBallsFaced > 0 ? ((totalRuns / totalBallsFaced) * 100).toFixed(2) : '0.00';
  const bowlingAvg = totalWickets > 0 ? (totalRunsConceded / totalWickets).toFixed(2) : '-';
  const economyRate = totalBallsBowled > 0
    ? (totalRunsConceded / (totalBallsBowled / 6)).toFixed(2) : '-';

  res.json({
    success: true,
    data: {
      player,
      stats: {
        matches: totalMatches,
        batting: {
          runs: totalRuns,
          ballsFaced: totalBallsFaced,
          average: battingAvg,
          strikeRate,
          highestScore,
          fifties,
          fours,
          sixes,
        },
        bowling: {
          wickets: totalWickets,
          ballsBowled: totalBallsBowled,
          runsConceded: totalRunsConceded,
          average: bowlingAvg,
          economyRate,
        },
      },
    },
  });
});
