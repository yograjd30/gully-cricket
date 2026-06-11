/**
 * Gully Cricket Scoring Engine
 * All rule logic lives here — never in the frontend.
 */

/**
 * Process a single delivery and update innings state.
 * @param {Object} inningsState - Current innings state (mutated in place)
 * @param {Object} delivery - The delivery data
 * @param {Object} matchRules - Match rules configuration
 * @returns {Object} Updated innings state
 */
export function processBall(inningsState, delivery, matchRules) {
  const extras = delivery.extras || { type: 'none', runs: 0 };
  let legalBall = true;
  let runsScored = delivery.runs || 0;
  let extraRuns = 0;

  // ─── WIDE LOGIC ────────────────────────────────────────
  if (extras.type === 'offside_wide') {
    extraRuns = matchRules.offsideWide?.runs ?? 0; // 0 by default
    runsScored = extraRuns;
    legalBall = false; // re-bowl
    inningsState.extras.wides += extraRuns;
  }

  if (extras.type === 'legside_wide') {
    extraRuns = matchRules.legsideWide?.runs ?? 1; // 1 by default
    runsScored = extraRuns;
    legalBall = false; // re-bowl
    inningsState.extras.wides += extraRuns;
  }

  // ─── NO BALL LOGIC ─────────────────────────────────────
  if (extras.type === 'no_ball') {
    extraRuns = matchRules.noBall?.runs ?? 1;
    runsScored = delivery.runs + extraRuns;
    legalBall = false;
    inningsState.extras.noBalls += extraRuns;
  }

  // ─── BYE / LEG BYE LOGIC ──────────────────────────────
  if (extras.type === 'bye') {
    runsScored = delivery.runs;
    inningsState.extras.byes += delivery.runs;
    legalBall = true;
  }

  if (extras.type === 'leg_bye') {
    runsScored = delivery.runs;
    inningsState.extras.legByes += delivery.runs;
    legalBall = true;
  }

  // ─── BOUNDARY OUT LOGIC ────────────────────────────────
  if (matchRules.boundaryOut && delivery.runs === 6 && extras.type === 'none') {
    delivery.isWicket = true;
    delivery.wicket = {
      type: 'boundary_out',
      dismissedPlayerId: delivery.batsmanId,
    };
    runsScored = 6; // runs still count before wicket
    legalBall = true;
  }

  // ─── UPDATE TOTALS ─────────────────────────────────────
  inningsState.totalRuns += runsScored;

  if (delivery.isWicket) {
    inningsState.totalWickets += 1;
  }

  if (legalBall) {
    inningsState.totalBalls += 1;
    // Overs as X.Y format (e.g., 2.3 = 2 overs and 3 balls)
    inningsState.totalOvers = parseFloat(
      Math.floor(inningsState.totalBalls / 6) +
      '.' +
      (inningsState.totalBalls % 6)
    );
  }

  // ─── COMPUTE BALL/OVER NUMBER ──────────────────────────
  const completedOvers = Math.floor((inningsState.totalBalls - (legalBall ? 1 : 0)) / 6);
  const ballInOver = legalBall
    ? ((inningsState.totalBalls - 1) % 6) + 1
    : inningsState.totalBalls % 6 || 0;

  delivery.overNumber = completedOvers;
  delivery.ballNumber = ballInOver;
  delivery.runs = runsScored;
  delivery.isLegal = legalBall;
  delivery.extras = extras;

  inningsState.balls.push(delivery);
  return inningsState;
}

/**
 * Check if the innings should end.
 * @param {Object} inningsState
 * @param {number} totalOvers - Match total overs
 * @param {number} totalPlayers - Number of players in batting team
 * @param {number|null} target - Target score (null for first innings)
 * @returns {{ ended: boolean, reason: string }}
 */
export function checkInningsEnd(inningsState, totalOvers, totalPlayers, target = null) {
  const maxWickets = totalPlayers - 1; // can't get all 11 out, last man stands

  // All out
  if (inningsState.totalWickets >= maxWickets) {
    return { ended: true, reason: 'All out' };
  }

  // Overs completed
  if (inningsState.totalBalls >= totalOvers * 6) {
    return { ended: true, reason: 'Innings complete' };
  }

  // Target achieved (second innings only)
  if (target !== null && inningsState.totalRuns >= target) {
    return { ended: true, reason: 'Target achieved' };
  }

  return { ended: false, reason: '' };
}

/**
 * Calculate run rates and target info for second innings.
 */
export function getMatchMeta(innings1, innings2, totalOvers) {
  const target = innings1.totalRuns + 1;
  const ballsRemaining = (totalOvers * 6) - innings2.totalBalls;
  const runsRequired = target - innings2.totalRuns;
  const rrr = ballsRemaining > 0
    ? (runsRequired / (ballsRemaining / 6)).toFixed(2)
    : '—';
  const crr = innings2.totalBalls > 0
    ? (innings2.totalRuns / (innings2.totalBalls / 6)).toFixed(2)
    : '0.00';

  return { target, runsRequired, ballsRemaining, rrr, crr };
}

/**
 * Calculate the final match result.
 */
export function calculateResult(match) {
  const inn1 = match.innings[0];
  const inn2 = match.innings[1];

  if (!inn1 || !inn2) {
    return { winner: 'no_result', margin: 'Match incomplete' };
  }

  if (inn2.totalRuns > inn1.totalRuns) {
    // Team batting second won
    const wicketsLeft = (match[inn2.battingTeam]?.players?.length || 11) - 1 - inn2.totalWickets;
    return {
      winner: inn2.battingTeam,
      margin: `won by ${wicketsLeft} wicket${wicketsLeft !== 1 ? 's' : ''}`,
    };
  }

  if (inn1.totalRuns > inn2.totalRuns) {
    // Team batting first won
    const runMargin = inn1.totalRuns - inn2.totalRuns;
    return {
      winner: inn1.battingTeam,
      margin: `won by ${runMargin} run${runMargin !== 1 ? 's' : ''}`,
    };
  }

  return { winner: 'tie', margin: 'Match tied!' };
}
