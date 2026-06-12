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
  let runsOffBat = delivery.runs || 0;
  let extraRuns = 0;

  if (extras.type === 'offside_wide') {
    extraRuns = matchRules.offsideWide?.runs ?? 0;
    runsOffBat = 0;
    legalBall = false;
    inningsState.extras.wides += extraRuns;
  } else if (extras.type === 'legside_wide') {
    extraRuns = matchRules.legsideWide?.runs ?? 1;
    runsOffBat = 0;
    legalBall = false;
    inningsState.extras.wides += extraRuns;
  } else if (extras.type === 'no_ball' || extras.type === 'crease_no_ball') {
    extraRuns = 1;
    legalBall = false;
    inningsState.extras.noBalls += extraRuns;
  } else if (extras.type === 'height_no_ball') {
    extraRuns = 0;
    legalBall = false;
    inningsState.extras.noBalls += extraRuns;
  } else if (extras.type === 'bye') {
    extraRuns = delivery.runs || 0;
    runsOffBat = 0;
    legalBall = true;
    inningsState.extras.byes += extraRuns;
  } else if (extras.type === 'leg_bye') {
    extraRuns = delivery.runs || 0;
    runsOffBat = 0;
    legalBall = true;
    inningsState.extras.legByes += extraRuns;
  } else {
    extraRuns = 0;
    legalBall = true;
  }

  const deliveryTotalRuns = runsOffBat + extraRuns;
  inningsState.totalRuns += deliveryTotalRuns;

  if (delivery.isWicket) {
    if (delivery.wicket?.type !== 'retired') {
      inningsState.totalWickets += 1;
    }
  }

  if (legalBall) {
    inningsState.totalBalls += 1;
    inningsState.totalOvers = parseFloat(
      Math.floor(inningsState.totalBalls / 6) +
      '.' +
      (inningsState.totalBalls % 6)
    );
  }

  const completedOvers = Math.floor((inningsState.totalBalls - (legalBall ? 1 : 0)) / 6);
  const ballInOver = legalBall
    ? ((inningsState.totalBalls - 1) % 6) + 1
    : inningsState.totalBalls % 6 || 0;

  delivery.overNumber = completedOvers;
  delivery.ballNumber = ballInOver;
  delivery.runs = runsOffBat;
  delivery.extras = {
    type: extras.type,
    runs: extraRuns,
  };
  delivery.isLegal = legalBall;

  if (inningsState.strikerId && inningsState.nonStrikerId) {
    delivery.strikerId = inningsState.strikerId;
    delivery.nonStrikerId = inningsState.nonStrikerId;

    const runsRan = runsOffBat + (extras.type === 'bye' || extras.type === 'leg_bye' ? extraRuns : 0);
    if (runsRan % 2 !== 0) {
      const temp = inningsState.strikerId;
      inningsState.strikerId = inningsState.nonStrikerId;
      inningsState.nonStrikerId = temp;
    }

    if (legalBall && inningsState.totalBalls % 6 === 0) {
      const temp = inningsState.strikerId;
      inningsState.strikerId = inningsState.nonStrikerId;
      inningsState.nonStrikerId = temp;
    }
  }

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
    const wicketsLeft = (match[inn2.battingTeam]?.players?.length || 11) - 1 - inn2.totalWickets;
    return {
      winner: inn2.battingTeam,
      margin: `won by ${wicketsLeft} wicket${wicketsLeft !== 1 ? 's' : ''}`,
    };
  }

  const runMargin = inn1.totalRuns - inn2.totalRuns;
  return {
    winner: inn1.battingTeam,
    margin: runMargin === 0 ? 'won (scores level, defending team wins)' : `won by ${runMargin} run${runMargin !== 1 ? 's' : ''}`,
  };
}
