import Anthropic from '@anthropic-ai/sdk';
import { getTemplateCommentary } from '../utils/commentaryTemplates.js';

let client = null;

function getClient() {
  if (!client && process.env.CLAUDE_API_KEY) {
    client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
  }
  return client;
}

/**
 * Generate one-line dramatic commentary for a delivery.
 * Falls back to templates if AI is unavailable.
 */
export async function generateCommentary(ball, batsmanName, bowlerName, currentScore) {
  const anthropic = getClient();
  if (!anthropic) {
    return { text: getTemplateCommentary(ball), type: 'template' };
  }

  try {
    const wicketInfo = ball.isWicket ? ball.wicket.type : 'no';
    const extraInfo = ball.extras?.type !== 'none' ? ball.extras.type : 'none';

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 60,
      messages: [{
        role: 'user',
        content: `You are a dramatic gully cricket commentator. In ONE punchy sentence (max 12 words), describe this delivery:
Batsman: ${batsmanName}, Bowler: ${bowlerName}
Runs: ${ball.runs}, Extra: ${extraInfo}, Wicket: ${wicketInfo}
Current score: ${currentScore}
Be energetic, use cricket slang. No hashtags. No emojis. Just one sentence.`,
      }],
    });

    const text = message.content[0]?.text?.trim() || getTemplateCommentary(ball);
    return { text, type: 'ai' };
  } catch (error) {
    console.error('Claude commentary error:', error.message);
    return { text: getTemplateCommentary(ball), type: 'template' };
  }
}

/**
 * Generate a 3-sentence post-match summary.
 */
export async function generateMatchSummary(matchData) {
  const anthropic = getClient();
  if (!anthropic) {
    return `${matchData.teamA.name} scored ${matchData.innings[0]?.totalRuns || 0}. ${matchData.teamB.name} scored ${matchData.innings[1]?.totalRuns || 0}. ${matchData.result?.margin || 'Match completed'}.`;
  }

  try {
    const inn1 = matchData.innings[0];
    const inn2 = matchData.innings[1];

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Write a 3-sentence cricket match summary for a gully match.
Team A: ${matchData.teamA.name} scored ${inn1?.totalRuns || 0}/${inn1?.totalWickets || 0} in ${inn1?.totalOvers || 0} overs
Team B: ${matchData.teamB.name} scored ${inn2?.totalRuns || 0}/${inn2?.totalWickets || 0} in ${inn2?.totalOvers || 0} overs
Result: ${matchData.result?.margin || 'Pending'}
Keep it exciting, informal, like a friend recapping the match. No hashtags.`,
      }],
    });

    return message.content[0]?.text?.trim() || 'What a match!';
  } catch (error) {
    console.error('Claude summary error:', error.message);
    return `${matchData.teamA.name} scored ${matchData.innings[0]?.totalRuns || 0}. ${matchData.teamB.name} scored ${matchData.innings[1]?.totalRuns || 0}. ${matchData.result?.margin || 'Match completed'}.`;
  }
}
