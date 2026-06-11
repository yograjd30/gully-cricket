import Match from '../models/Match.js';
import Player from '../models/Player.js';
import Commentary from '../models/Commentary.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { processBall, checkInningsEnd, getMatchMeta, calculateResult } from '../utils/scoringEngine.js';
import { generateCommentary, generateMatchSummary } from '../lib/claude.js';
import { body, validationResult } from 'express-validator';

const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, error: errors.array()[0].msg, code: 400 });
    return false;
  }
  return true;
};

// POST /api/matches/:id/ball — Record a delivery
export const recordBallValidation = [
  body('inningsIndex').isIn([0, 1]).withMessage('inningsIndex must be 0 or 1'),
  body('batsmanId').notEmpty().withMessage('batsmanId is required'),
  body('bowlerId').notEmpty().withMessage('bowlerId is required'),
  body('runs').isInt({ min: 0, max: 7 }).withMessage('runs must be 0-7'),
];

export const recordBall = asyncHandler(async (req, res) => {
  if (!validate(req, res)) return;

  const match = await Match.findById(req.params.id);
  if (!match) {
    return res.status(404).json({ success: false, error: 'Match not found', code: 404 });
  }

  if (match.status !== 'innings1' && match.status !== 'innings2') {
    return res.status(400).json({
      success: false,
      error: `Cannot record ball in ${match.status} phase`,
      code: 400,
    });
  }

  const { inningsIndex, batsmanId, bowlerId, runs, extras, isWicket, wicket } = req.body;
  const innings = match.innings[inningsIndex];

  if (!innings || innings.completed) {
    return res.status(400).json({ success: false, error: 'Innings not available or completed', code: 400 });
  }

  const delivery = {
    batsmanId,
    bowlerId,
    runs: runs || 0,
    extras: extras || { type: 'none', runs: 0 },
    isWicket: isWicket || false,
    wicket: wicket || undefined,
    commentary: '',
    isLegal: true,
    isUndone: false,
  };

  // Process through scoring engine
  const updatedInnings = processBall(innings, delivery, match.rules);

  // Generate commentary (non-blocking)
  const batsmanName = (await Player.findById(batsmanId).select('name').lean())?.name || 'Batsman';
  const bowlerName = (await Player.findById(bowlerId).select('name').lean())?.name || 'Bowler';
  const currentScore = `${updatedInnings.totalRuns}/${updatedInnings.totalWickets} (${updatedInnings.totalOvers} ov)`;

  const commentaryResult = await generateCommentary(delivery, batsmanName, bowlerName, currentScore);
  const lastBallIndex = updatedInnings.balls.length - 1;
  updatedInnings.balls[lastBallIndex].commentary = commentaryResult.text;

  // Save commentary to separate collection (fire and forget)
  Commentary.create({
    matchId: match._id,
    ballRef: { inningsIndex, ballIndex: lastBallIndex },
    text: commentaryResult.text,
    type: commentaryResult.type,
  }).catch(err => console.error('Commentary save error:', err.message));

  // Check if innings should end
  const totalPlayers = match[innings.battingTeam]?.players?.length || 11;
  const target = inningsIndex === 1 ? match.innings[0].totalRuns + 1 : null;
  const endCheck = checkInningsEnd(updatedInnings, match.totalOvers, totalPlayers, target);

  if (endCheck.ended) {
    updatedInnings.completed = true;
    updatedInnings.result = endCheck.reason;

    if (match.status === 'innings1') {
      // Transition to innings2
      match.status = 'innings2';
      match.innings.push({
        battingTeam: innings.bowlingTeam,
        bowlingTeam: innings.battingTeam,
        balls: [],
        totalRuns: 0,
        totalWickets: 0,
        totalBalls: 0,
        totalOvers: 0,
        extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
        completed: false,
      });
    } else {
      // Match completed
      match.status = 'completed';
      const result = calculateResult(match);
      match.result = {
        winner: result.winner,
        margin: result.margin,
      };
    }
  }

  match.innings[inningsIndex] = updatedInnings;
  await match.save();

  // Prepare response with match meta
  let meta = null;
  if (inningsIndex === 1 && match.innings[0]) {
    meta = getMatchMeta(match.innings[0], updatedInnings, match.totalOvers);
  }

  res.json({
    success: true,
    data: {
      innings: updatedInnings,
      matchStatus: match.status,
      result: match.result,
      meta,
      commentary: commentaryResult.text,
    },
  });
});

// DELETE /api/matches/:id/ball — Undo last ball
export const undoLastBall = asyncHandler(async (req, res) => {
  const match = await Match.findById(req.params.id);
  if (!match) {
    return res.status(404).json({ success: false, error: 'Match not found', code: 404 });
  }

  const inningsIndex = match.status === 'innings2' ? 1 : 0;
  const innings = match.innings[inningsIndex];

  if (!innings || innings.balls.length === 0) {
    return res.status(400).json({ success: false, error: 'No balls to undo', code: 400 });
  }

  // Find last non-undone ball
  let lastBallIdx = innings.balls.length - 1;
  while (lastBallIdx >= 0 && innings.balls[lastBallIdx].isUndone) {
    lastBallIdx--;
  }

  if (lastBallIdx < 0) {
    return res.status(400).json({ success: false, error: 'No balls to undo', code: 400 });
  }

  const ball = innings.balls[lastBallIdx];
  ball.isUndone = true;

  // Reverse the ball's effect on totals
  innings.totalRuns -= ball.runs;
  if (ball.isWicket) innings.totalWickets -= 1;
  if (ball.isLegal) {
    innings.totalBalls -= 1;
    innings.totalOvers = parseFloat(
      Math.floor(innings.totalBalls / 6) + '.' + (innings.totalBalls % 6)
    );
  }

  // Reverse extras
  if (ball.extras?.type === 'offside_wide' || ball.extras?.type === 'legside_wide') {
    innings.extras.wides -= ball.runs;
  } else if (ball.extras?.type === 'no_ball') {
    innings.extras.noBalls -= (match.rules.noBall?.runs || 1);
  } else if (ball.extras?.type === 'bye') {
    innings.extras.byes -= ball.runs;
  } else if (ball.extras?.type === 'leg_bye') {
    innings.extras.legByes -= ball.runs;
  }

  innings.completed = false;
  innings.result = '';

  match.innings[inningsIndex] = innings;
  await match.save();

  res.json({ success: true, data: { innings, matchStatus: match.status } });
});

// POST /api/matches/:id/complete — Finalize match
export const completeMatch = asyncHandler(async (req, res) => {
  const match = await Match.findById(req.params.id);
  if (!match) {
    return res.status(404).json({ success: false, error: 'Match not found', code: 404 });
  }

  if (match.status === 'completed') {
    return res.json({ success: true, data: match });
  }

  match.status = 'completed';

  // Calculate result if not already set
  if (!match.result?.winner) {
    const result = calculateResult(match);
    match.result = { winner: result.winner, margin: result.margin };
  }

  // Generate AI match summary
  const summary = await generateMatchSummary(match);
  match.result.summary = summary;

  // Set player of match (auto-pick: top scorer)
  if (match.innings.length > 0) {
    const playerRuns = {};
    for (const innings of match.innings) {
      for (const ball of innings.balls) {
        if (ball.isUndone) continue;
        const batId = ball.batsmanId?.toString();
        if (batId) {
          playerRuns[batId] = (playerRuns[batId] || 0) + (ball.runs || 0);
        }
      }
    }
    const topScorer = Object.entries(playerRuns).sort((a, b) => b[1] - a[1])[0];
    if (topScorer) {
      match.result.playerOfMatch = topScorer[0];
    }
  }

  await match.save();
  res.json({ success: true, data: match });
});
