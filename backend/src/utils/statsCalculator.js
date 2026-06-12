/**
 * Stats calculator utility — helper functions for aggregating player/team stats.
 * Used by stats.controller.js and player.controller.js
 */

/**
 * Calculate batting stats for a player from match innings data.
 */
export function calculateBattingStats(playerId, innings) {
  let runs = 0;
  let ballsFaced = 0;
  let fours = 0;
  let sixes = 0;
  let isOut = false;

  for (const ball of innings.balls) {
    if (ball.isUndone) continue;
    if (ball.batsmanId?.toString() !== playerId) continue;

    runs += ball.runs || 0;
    const isWide = ball.extras?.type === 'offside_wide' || ball.extras?.type === 'legside_wide';
    const isRetired = ball.isWicket && ball.wicket?.type === 'retired';
    if (!isWide && !isRetired) ballsFaced++;
    if (ball.runs === 4) fours++;
    if (ball.runs === 6) sixes++;
    if (ball.isWicket && ball.wicket?.dismissedPlayerId?.toString() === playerId && ball.wicket?.type !== 'retired') {
      isOut = true;
    }
  }

  return { runs, ballsFaced, fours, sixes, isOut };
}

/**
 * Calculate bowling stats for a player from match innings data.
 */
export function calculateBowlingStats(playerId, innings) {
  let ballsBowled = 0;
  let runsConceded = 0;
  let wickets = 0;
  let maidens = 0;

  const overRuns = {};

  for (const ball of innings.balls) {
    if (ball.isUndone) continue;
    if (ball.bowlerId?.toString() !== playerId) continue;

    if (ball.isLegal) {
      ballsBowled++;
      const overNum = Math.floor((ballsBowled - 1) / 6);
      overRuns[overNum] = (overRuns[overNum] || 0) + (ball.runs || 0);
    }

    runsConceded += (ball.runs || 0) + (ball.extras?.runs || 0);

    if (ball.isWicket && ball.wicket?.type !== 'run_out') {
      wickets++;
    }
  }

  // Count maidens (overs with 0 runs)
  for (const runs of Object.values(overRuns)) {
    if (runs === 0) maidens++;
  }

  return { ballsBowled, runsConceded, wickets, maidens };
}
