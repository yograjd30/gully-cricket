/**
 * Fallback commentary templates when AI is unavailable.
 * Randomized selection per category.
 */

const TEMPLATES = {
  six: [
    "That's MASSIVE! Clean out of the ground! 🚀",
    "OUT OF HERE! What a hit!",
    "SIX! No mercy from the batsman!",
    "Maximum! That ball is in the next gully!",
    "HUGE SIX! The bowler's face says it all!",
  ],
  four: [
    "Racing to the boundary! Beautiful timing!",
    "FOUR! Pierced the gap perfectly!",
    "Cracking shot! The fielder didn't move!",
    "Boundary! Textbook cover drive!",
    "FOUR runs! Timed to perfection!",
  ],
  wicket: {
    bowled: [
      "TIMBER! 🪵 Stumps destroyed!",
      "Clean bowled! Didn't see that one coming!",
      "BOWLED HIM! What a delivery!",
    ],
    caught: [
      "CAUGHT! Brilliant grab!",
      "What a catch! That's a big wicket!",
      "Gone! Caught in the deep!",
    ],
    run_out: [
      "RUN OUT! Direct hit! 🎯",
      "No run there! Sent back and caught short!",
      "Terrible mix-up! That's a run out!",
    ],
    hit_wicket: [
      "Oh no! Hit wicket! Knocked his own stumps!",
      "Hit wicket! You hate to see it!",
    ],
    boundary_out: [
      "BOUNDARY OUT! 🔴 That's the gully rule!",
      "OUT! Crossed the boundary — gully rules apply!",
      "The boundary out rule strikes! He's gone!",
    ],
    retired: [
      "Retired! Making way for the next batter.",
      "Walks off retired. Decent knock!",
    ],
  },
  dot: [
    "Dot ball. Pressure building! 🔵",
    "No run. Defended solidly.",
    "Good length delivery. Dot ball.",
    "Tight line. No scoring opportunity.",
    "Beaten! But survives. Dot ball.",
  ],
  single: [
    "Quick single taken. Smart cricket!",
    "Pushed into the gap. Easy single.",
    "Nudged for one. Rotates the strike.",
  ],
  two: [
    "Good running! Two taken!",
    "Placed into the gap. They come back for two!",
  ],
  three: [
    "Three runs! Misfield helps the batsman!",
    "Excellent running between the wickets! Three!",
  ],
  wide: [
    "Wide! Down the leg side.",
    "Straying off target. Wide called.",
    "Can't hit that! Wide ball.",
  ],
  noBall: [
    "No ball! Overstepping the crease!",
    "FREE HIT coming up! No ball!",
    "No ball called. Extra run added.",
  ],
};

/**
 * Get a random template commentary for a delivery.
 */
export function getTemplateCommentary(ball) {
  let category;

  if (ball.isWicket && ball.wicket?.type) {
    const wicketTemplates = TEMPLATES.wicket[ball.wicket.type] || TEMPLATES.wicket.bowled;
    return wicketTemplates[Math.floor(Math.random() * wicketTemplates.length)];
  }

  if (ball.extras?.type === 'offside_wide' || ball.extras?.type === 'legside_wide') {
    category = 'wide';
  } else if (ball.extras?.type === 'no_ball') {
    category = 'noBall';
  } else if (ball.runs === 6) {
    category = 'six';
  } else if (ball.runs === 4) {
    category = 'four';
  } else if (ball.runs === 3) {
    category = 'three';
  } else if (ball.runs === 2) {
    category = 'two';
  } else if (ball.runs === 1) {
    category = 'single';
  } else {
    category = 'dot';
  }

  const templates = TEMPLATES[category] || TEMPLATES.dot;
  return templates[Math.floor(Math.random() * templates.length)];
}

export default TEMPLATES;
