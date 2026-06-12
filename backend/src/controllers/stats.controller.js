import Match from '../models/Match.js';
import Player from '../models/Player.js';
import asyncHandler from '../middleware/asyncHandler.js';

// GET /api/stats/leaderboard
export const getLeaderboard = asyncHandler(async (req, res) => {
  const matches = await Match.find({ status: 'completed' })
    .select('innings teamA teamB')
    .lean();

  const playerStats = {};

  for (const match of matches) {
    // Collect all player IDs from teams
    const allPlayers = [
      ...(match.teamA?.players || []),
      ...(match.teamB?.players || []),
    ];

    for (const innings of match.innings) {
      for (const ball of innings.balls) {
        if (ball.isUndone) continue;

        // Batting
        const batId = ball.batsmanId?.toString();
        if (batId) {
          if (!playerStats[batId]) {
            playerStats[batId] = { runs: 0, wickets: 0, matches: new Set() };
          }
          playerStats[batId].runs += ball.runs || 0;
          playerStats[batId].matches.add(match._id.toString());
        }

        // Bowling
        const bowlId = ball.bowlerId?.toString();
        if (bowlId) {
          if (!playerStats[bowlId]) {
            playerStats[bowlId] = { runs: 0, wickets: 0, matches: new Set() };
          }
          if (ball.isWicket && ball.wicket?.type !== 'run_out' && ball.wicket?.type !== 'retired') {
            playerStats[bowlId].wickets += 1;
          }
          const isBowlerExtra = ball.extras?.type === 'offside_wide' || ball.extras?.type === 'legside_wide' || ball.extras?.type === 'no_ball' || ball.extras?.type === 'crease_no_ball' || ball.extras?.type === 'height_no_ball';
          const extraConceded = isBowlerExtra ? (ball.extras?.runs || 0) : 0;
          playerStats[bowlId].runs += (ball.runs || 0) + extraConceded;
          playerStats[bowlId].matches.add(match._id.toString());
        }
      }
    }
  }

  // Convert to arrays and sort
  const entries = Object.entries(playerStats).map(([id, s]) => ({
    playerId: id,
    runs: s.runs,
    wickets: s.wickets,
    matches: s.matches.size,
  }));

  const sortedRuns = [...entries].sort((a, b) => b.runs - a.runs).slice(0, 10);
  const sortedWickets = [...entries].sort((a, b) => b.wickets - a.wickets).slice(0, 10);

  // Fetch player details
  const playerIds = Array.from(new Set([
    ...sortedRuns.map(e => e.playerId),
    ...sortedWickets.map(e => e.playerId)
  ]));

  const players = await Player.find({ _id: { $in: playerIds } })
    .select('name avatar nickname')
    .lean();

  const playerMap = players.reduce((acc, p) => {
    acc[p._id.toString()] = p;
    return acc;
  }, {});

  const topRunScorers = sortedRuns.map(e => ({
    ...e,
    playerName: playerMap[e.playerId]?.name || `Player #${e.playerId.slice(-4)}`,
    playerAvatar: playerMap[e.playerId]?.avatar || '',
  }));

  const topWicketTakers = sortedWickets.map(e => ({
    ...e,
    playerName: playerMap[e.playerId]?.name || `Player #${e.playerId.slice(-4)}`,
    playerAvatar: playerMap[e.playerId]?.avatar || '',
  }));

  res.json({
    success: true,
    data: { topRunScorers, topWicketTakers },
  });
});

// GET /api/stats/head-to-head?teamA=<id>&teamB=<id>
export const getHeadToHead = asyncHandler(async (req, res) => {
  const { teamA, teamB } = req.query;
  if (!teamA || !teamB) {
    return res.status(400).json({
      success: false,
      error: 'teamA and teamB query params required',
      code: 400,
    });
  }

  const matches = await Match.find({
    status: 'completed',
    $or: [
      { 'teamA.teamId': teamA, 'teamB.teamId': teamB },
      { 'teamA.teamId': teamB, 'teamB.teamId': teamA },
    ],
  }).select('teamA teamB result').lean();

  let teamAWins = 0;
  let teamBWins = 0;
  let ties = 0;

  for (const match of matches) {
    if (match.result?.winner === 'tie') {
      ties++;
    } else if (match.result?.winner === 'teamA') {
      if (match.teamA.teamId?.toString() === teamA) teamAWins++;
      else teamBWins++;
    } else if (match.result?.winner === 'teamB') {
      if (match.teamB.teamId?.toString() === teamA) teamAWins++;
      else teamBWins++;
    }
  }

  res.json({
    success: true,
    data: {
      totalMatches: matches.length,
      teamAWins,
      teamBWins,
      ties,
    },
  });
});
