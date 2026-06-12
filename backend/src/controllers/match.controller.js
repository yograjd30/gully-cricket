import Match from '../models/Match.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { body, param, query, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';

const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, error: errors.array()[0].msg, code: 400 });
    return false;
  }
  return true;
};

// POST /api/matches — Create match (setup phase)
export const createMatchValidation = [
  body('teamA.name').trim().notEmpty().withMessage('Team A name is required'),
  body('teamB.name').trim().notEmpty().withMessage('Team B name is required'),
  body('totalOvers').isInt({ min: 1, max: 50 }).withMessage('Overs must be 1-50'),
];

export const createMatch = asyncHandler(async (req, res) => {
  if (!validate(req, res)) return;

  const matchData = {
    userId: req.user?._id || null,
    sessionToken: req.user ? null : uuidv4(),
    teamA: {
      teamId: req.body.teamA.teamId || null,
      name: req.body.teamA.name,
      color: req.body.teamA.color || '#A3E635',
      players: req.body.teamA.players || [],
    },
    teamB: {
      teamId: req.body.teamB.teamId || null,
      name: req.body.teamB.name,
      color: req.body.teamB.color || '#38BDF8',
      players: req.body.teamB.players || [],
    },
    totalOvers: req.body.totalOvers,
    venue: req.body.venue || '',
    rules: req.body.rules || {},
    status: 'toss',
    innings: [],
  };

  const match = await Match.create(matchData);
  res.status(201).json({ success: true, data: match });
});

// GET /api/matches — Match history (paginated)
export const getMatches = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.user) {
    filter.userId = req.user._id;
  } else if (req.query.sessionToken) {
    filter.sessionToken = req.query.sessionToken;
  }

  const [matches, total] = await Promise.all([
    Match.find(filter)
      .select('teamA.name teamA.color teamB.name teamB.color totalOvers status result matchDate createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Match.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      matches,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// GET /api/matches/:id — Full match detail
export const getMatch = asyncHandler(async (req, res) => {
  const match = await Match.findById(req.params.id)
    .populate('teamA.players', 'name nickname role avatar')
    .populate('teamB.players', 'name nickname role avatar')
    .select('-__v')
    .lean();

  if (!match) {
    return res.status(404).json({ success: false, error: 'Match not found', code: 404 });
  }

  res.json({ success: true, data: match });
});

// PATCH /api/matches/:id/toss — Record toss result
export const updateTossValidation = [
  param('id').isMongoId(),
  body('winner').isIn(['teamA', 'teamB']).withMessage('Winner must be teamA or teamB'),
  body('decision').isIn(['bat', 'field']).withMessage('Decision must be bat or field'),
];

export const updateToss = asyncHandler(async (req, res) => {
  if (!validate(req, res)) return;

  const match = await Match.findById(req.params.id);
  if (!match) {
    return res.status(404).json({ success: false, error: 'Match not found', code: 404 });
  }

  match.toss = {
    winner: req.body.winner,
    decision: req.body.decision,
  };

  // Determine batting order
  const battingFirst = req.body.decision === 'bat' ? req.body.winner : (req.body.winner === 'teamA' ? 'teamB' : 'teamA');
  const bowlingFirst = battingFirst === 'teamA' ? 'teamB' : 'teamA';

  const battingPlayers = match[battingFirst]?.players || [];

  // Initialize first innings
  match.innings = [
    {
      battingTeam: battingFirst,
      bowlingTeam: bowlingFirst,
      strikerId: battingPlayers[0] || null,
      nonStrikerId: battingPlayers[1] || null,
      balls: [],
      totalRuns: 0,
      totalWickets: 0,
      totalBalls: 0,
      totalOvers: 0,
      extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
      completed: false,
    },
  ];

  match.status = 'innings1';
  await match.save();

  res.json({ success: true, data: match });
});

// PATCH /api/matches/:id/status — Advance match status
export const updateStatus = asyncHandler(async (req, res) => {
  const match = await Match.findById(req.params.id);
  if (!match) {
    return res.status(404).json({ success: false, error: 'Match not found', code: 404 });
  }

  const { status } = req.body;
  const validTransitions = {
    setup: ['toss'],
    toss: ['innings1'],
    innings1: ['innings2'],
    innings2: ['completed'],
  };

  if (!validTransitions[match.status]?.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `Cannot transition from ${match.status} to ${status}`,
      code: 400,
    });
  }

  // When transitioning to innings2, initialize second innings
  if (status === 'innings2') {
    const firstInnings = match.innings[0];
    match.innings.push({
      battingTeam: firstInnings.bowlingTeam,
      bowlingTeam: firstInnings.battingTeam,
      balls: [],
      totalRuns: 0,
      totalWickets: 0,
      totalBalls: 0,
      totalOvers: 0,
      extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
      completed: false,
    });
  }

  match.status = status;
  await match.save();

  res.json({ success: true, data: match });
});

// DELETE /api/matches/:id
export const deleteMatch = asyncHandler(async (req, res) => {
  const match = await Match.findByIdAndDelete(req.params.id);
  if (!match) {
    return res.status(404).json({ success: false, error: 'Match not found', code: 404 });
  }
  res.json({ success: true, data: { message: 'Match deleted' } });
});
