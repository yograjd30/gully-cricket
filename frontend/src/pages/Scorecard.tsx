import { useParams, Link } from 'react-router-dom';
import { useMatch } from '@/hooks/useMatch';
import { Trophy, ArrowLeft, Calendar, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Innings, Ball } from '@/types/match';
import type { Player } from '@/types/player';

export default function Scorecard() {
  const { matchId } = useParams<{ matchId: string }>();
  const { data: match, isLoading } = useMatch(matchId || null);

  if (isLoading) return <div className="text-center py-12 text-muted-text">Loading scorecard...</div>;
  if (!match) return <div className="text-center py-12 text-muted-text">Match not found</div>;

  const teamA = match.teamA;
  const teamB = match.teamB;
  const winnerName = match.result?.winner === 'teamA' ? teamA.name
    : match.result?.winner === 'teamB' ? teamB.name
    : match.result?.winner === 'tie' ? 'Tie' : '';

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/history" className="p-2 rounded-lg hover:bg-crease-line/30 text-muted-text">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-barlow font-bold text-2xl text-off-white">Match Scorecard</h1>
      </div>

      {/* Result banner */}
      {match.status === 'completed' && match.result && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="gully-card text-center py-6 border-gold-bail/30"
          style={{ boxShadow: '0 0 30px rgba(251, 191, 36, 0.15)' }}
        >
          <Trophy size={32} className="text-gold-bail mx-auto mb-2" />
          <h2 className="font-barlow font-black text-3xl text-gold-bail">{winnerName}</h2>
          <p className="text-off-white font-medium mt-1">{match.result.margin}</p>
          {match.result.summary && (
            <p className="text-muted-text text-sm mt-3 max-w-lg mx-auto italic">
              "{match.result.summary}"
            </p>
          )}
        </motion.div>
      )}

      {/* Match info */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-text font-mono">
        <span className="flex items-center gap-1">
          <Calendar size={12} />
          {new Date(match.matchDate).toLocaleDateString()}
        </span>
        {match.venue && (
          <span className="flex items-center gap-1">
            <MapPin size={12} />
            {match.venue}
          </span>
        )}
        <span>{match.totalOvers} overs</span>
        {match.toss && (
          <span>
            Toss: {match[match.toss.winner]?.name} chose to {match.toss.decision}
          </span>
        )}
      </div>

      {/* Innings scorecards */}
      {match.innings.map((innings, idx) => (
        <InningsScorecard
          key={idx}
          innings={innings}
          inningsNumber={idx + 1}
          teamName={match[innings.battingTeam as 'teamA' | 'teamB']?.name || `Innings ${idx + 1}`}
          teamColor={match[innings.battingTeam as 'teamA' | 'teamB']?.color || '#A3E635'}
          players={match[innings.battingTeam as 'teamA' | 'teamB']?.players as unknown as Player[] || []}
          bowlers={match[innings.bowlingTeam as 'teamA' | 'teamB']?.players as unknown as Player[] || []}
        />
      ))}
    </div>
  );
}

function InningsScorecard({
  innings,
  inningsNumber,
  teamName,
  teamColor,
  players,
  bowlers,
}: {
  innings: Innings;
  inningsNumber: number;
  teamName: string;
  teamColor: string;
  players: Player[];
  bowlers: Player[];
}) {
  const getPlayerName = (id: string, list: Player[]) => {
    const p = list.find((p) => (typeof p === 'string' ? p : p._id) === id);
    return typeof p === 'string' ? `Player` : p?.name || 'Unknown';
  };

  // Calculate batsman stats
  const batsmanStats = new Map<string, { runs: number; balls: number; fours: number; sixes: number; isOut: boolean; howOutText: string }>();
  const bowlerStats = new Map<string, { balls: number; runs: number; wickets: number; maidens: number; wides: number; noBalls: number }>();

  // Group balls by bowler and over number to calculate maidens
  const bowlerOversMap = new Map<string, Map<number, Ball[]>>();

  for (const ball of innings.balls) {
    if (ball.isUndone) continue;

    const batId = ball.batsmanId?.toString();
    const bowlId = ball.bowlerId?.toString();

    // Batting
    if (batId) {
      if (!batsmanStats.has(batId)) {
        batsmanStats.set(batId, { runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, howOutText: 'not out' });
      }
      const existing = batsmanStats.get(batId)!;
      existing.runs += ball.runs;
      
      const isWide = ball.extras?.type === 'offside_wide' || ball.extras?.type === 'legside_wide';
      if (!isWide) {
        existing.balls++;
        if (ball.runs === 4) existing.fours++;
        if (ball.runs === 6) existing.sixes++;
      }
    }

    // Dismissal
    if (ball.isWicket && ball.wicket?.dismissedPlayerId) {
      const wicket = ball.wicket;
      const dismissedId = wicket.dismissedPlayerId.toString();
      if (!batsmanStats.has(dismissedId)) {
        batsmanStats.set(dismissedId, { runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, howOutText: 'not out' });
      }
      const existing = batsmanStats.get(dismissedId)!;
      if (wicket.type !== 'retired') {
        existing.isOut = true;
      }

      const bowlerNameStr = getPlayerName(ball.bowlerId, bowlers);
      const fielderNameStr = wicket.fielderId ? getPlayerName(wicket.fielderId, bowlers) : '';

      let text = '';
      switch (wicket.type) {
        case 'bowled':
          text = `b ${bowlerNameStr}`;
          break;
        case 'caught':
          if (wicket.fielderId && wicket.fielderId.toString() === ball.bowlerId?.toString()) {
            text = `c & b ${bowlerNameStr}`;
          } else {
            text = fielderNameStr ? `c ${fielderNameStr} b ${bowlerNameStr}` : `c b ${bowlerNameStr}`;
          }
          break;
        case 'run_out':
          text = fielderNameStr ? `run out (${fielderNameStr})` : `run out`;
          break;
        case 'hit_wicket':
          text = `hit wicket b ${bowlerNameStr}`;
          break;
        case 'boundary_out':
          text = `boundary out`;
          break;
        case 'retired':
          text = `retired hurt`;
          break;
        default:
          text = `out`;
      }
      existing.howOutText = text;
    }

    // Bowling
    if (bowlId) {
      if (!bowlerStats.has(bowlId)) {
        bowlerStats.set(bowlId, { balls: 0, runs: 0, wickets: 0, maidens: 0, wides: 0, noBalls: 0 });
      }
      const existing = bowlerStats.get(bowlId)!;

      const isWide = ball.extras?.type === 'offside_wide' || ball.extras?.type === 'legside_wide';
      const isNoBall = ball.extras?.type === 'no_ball' || ball.extras?.type === 'crease_no_ball' || ball.extras?.type === 'height_no_ball';

      if (!isWide && !isNoBall) {
        existing.balls++;
      }

      const conceded = ball.runs + (isWide || isNoBall ? (ball.extras?.runs || 0) : 0);
      existing.runs += conceded;

      if (isWide) existing.wides += 1;
      if (isNoBall) existing.noBalls += 1;

      if (ball.isWicket && ball.wicket?.type !== 'run_out' && ball.wicket?.type !== 'retired') {
        existing.wickets++;
      }

      // Group for maidens
      if (!bowlerOversMap.has(bowlId)) {
        bowlerOversMap.set(bowlId, new Map());
      }
      const overMap = bowlerOversMap.get(bowlId)!;
      const overNum = ball.overNumber;
      if (!overMap.has(overNum)) {
        overMap.set(overNum, []);
      }
      overMap.get(overNum)!.push(ball);
    }
  }

  // Calculate maidens
  for (const [bowlId, overMap] of bowlerOversMap.entries()) {
    let maidens = 0;
    for (const [, overBalls] of overMap.entries()) {
      const legalBallsInOver = overBalls.filter((b) => b.isLegal).length;
      if (legalBallsInOver === 6) {
        const runsInOver = overBalls.reduce((sum, b) => {
          const isWide = b.extras?.type === 'offside_wide' || b.extras?.type === 'legside_wide';
          const isNoBall = b.extras?.type === 'no_ball' || b.extras?.type === 'crease_no_ball' || b.extras?.type === 'height_no_ball';
          return sum + b.runs + (isWide || isNoBall ? (b.extras?.runs || 0) : 0);
        }, 0);
        if (runsInOver === 0) {
          maidens++;
        }
      }
    }
    if (bowlerStats.has(bowlId)) {
      bowlerStats.get(bowlId)!.maidens = maidens;
    }
  }

  // DNB
  const didNotBat = players.filter((p) => {
    const id = typeof p === 'string' ? p : p._id;
    return !batsmanStats.has(id);
  });

  // FOW
  const fallOfWickets: { wicketNumber: number; batsmanName: string; score: string; over: string }[] = [];
  let runningRuns = 0;
  let runningWickets = 0;
  let runningBalls = 0;

  for (const ball of innings.balls) {
    if (ball.isUndone) continue;

    const isWide = ball.extras?.type === 'offside_wide' || ball.extras?.type === 'legside_wide';
    const isNoBall = ball.extras?.type === 'no_ball' || ball.extras?.type === 'crease_no_ball' || ball.extras?.type === 'height_no_ball';
    const isLegal = !isWide && !isNoBall;

    runningRuns += ball.runs + (ball.extras?.runs || 0);
    if (isLegal) {
      runningBalls++;
    }

    if (ball.isWicket && ball.wicket?.type !== 'retired' && ball.wicket?.dismissedPlayerId) {
      runningWickets++;
      const batsmanName = getPlayerName(ball.wicket.dismissedPlayerId, players);
      const overVal = `${Math.floor(runningBalls / 6)}.${runningBalls % 6}`;
      fallOfWickets.push({
        wicketNumber: runningWickets,
        batsmanName,
        score: `${runningRuns}-${runningWickets}`,
        over: overVal,
      });
    }
  }

  return (
    <div className="gully-card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: teamColor }} />
          <h3 className="font-barlow font-bold text-lg" style={{ color: teamColor }}>
            {teamName} — {inningsNumber === 1 ? '1st' : '2nd'} Innings
          </h3>
        </div>
        <div className="font-barlow font-bold text-xl text-off-white">
          {innings.totalRuns}/{innings.totalWickets}
          <span className="text-muted-text text-sm ml-2">({innings.totalOvers} ov)</span>
        </div>
      </div>

      {/* Batting table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] text-muted-text font-mono uppercase border-b border-crease-line/50">
              <th className="text-left py-2 pr-2">Batsman</th>
              <th className="text-left px-2">Dismissal</th>
              <th className="text-right px-2">R</th>
              <th className="text-right px-2">B</th>
              <th className="text-right px-2">4s</th>
              <th className="text-right px-2">6s</th>
              <th className="text-right pl-2">SR</th>
            </tr>
          </thead>
          <tbody>
            {[...batsmanStats.entries()].map(([id, stats]) => (
              <tr key={id} className="border-b border-crease-line/20">
                <td className="py-2 pr-2 font-medium text-off-white">
                  {getPlayerName(id, players)}
                </td>
                <td className="px-2 py-2 text-xs text-muted-text max-w-[180px] truncate">
                  {stats.howOutText}
                </td>
                <td className="text-right px-2 font-mono font-bold text-off-white">{stats.runs}</td>
                <td className="text-right px-2 font-mono text-muted-text">{stats.balls}</td>
                <td className="text-right px-2 font-mono text-sky-six">{stats.fours}</td>
                <td className="text-right px-2 font-mono text-lime-shot">{stats.sixes}</td>
                <td className="text-right pl-2 font-mono text-muted-text">
                  {stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(1) : '0.0'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DNB Section */}
      {didNotBat.length > 0 && (
        <div className="text-xs text-muted-text font-mono border-t border-crease-line/20 pt-3">
          <span className="text-off-white font-semibold uppercase mr-1">Did Not Bat:</span>
          {didNotBat.map((p, i) => (
            <span key={typeof p === 'string' ? p : p._id}>
              {i > 0 && ', '}
              {typeof p === 'string' ? 'Player' : p.name}
            </span>
          ))}
        </div>
      )}

      {/* Fall of Wickets Section */}
      {fallOfWickets.length > 0 && (
        <div className="text-xs text-muted-text font-mono border-t border-crease-line/20 pt-3 space-y-1">
          <div className="text-off-white font-semibold uppercase">Fall of Wickets:</div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {fallOfWickets.map((fow) => (
              <span key={fow.wicketNumber}>
                {fow.wicketNumber}-{fow.score} ({fow.batsmanName}, {fow.over} ov)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Extras */}
      <div className="text-xs text-muted-text font-mono border-t border-crease-line/20 pt-3">
        Extras: {innings.extras.wides}w {innings.extras.noBalls}nb {innings.extras.byes}b {innings.extras.legByes}lb
        = <span className="text-off-white font-bold">
          {innings.extras.wides + innings.extras.noBalls + innings.extras.byes + innings.extras.legByes}
        </span>
      </div>

      {/* Bowling table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] text-muted-text font-mono uppercase border-b border-crease-line/50">
              <th className="text-left py-2 pr-2">Bowler</th>
              <th className="text-right px-2">O</th>
              <th className="text-right px-2">M</th>
              <th className="text-right px-2">R</th>
              <th className="text-right px-2">W</th>
              <th className="text-right px-2">WD</th>
              <th className="text-right px-2">NB</th>
              <th className="text-right pl-2">Econ</th>
            </tr>
          </thead>
          <tbody>
            {[...bowlerStats.entries()].map(([id, stats]) => (
              <tr key={id} className="border-b border-crease-line/20">
                <td className="py-2 pr-2 text-off-white font-medium">{getPlayerName(id, bowlers)}</td>
                <td className="text-right px-2 font-mono text-muted-text">
                  {Math.floor(stats.balls / 6)}.{stats.balls % 6}
                </td>
                <td className="text-right px-2 font-mono text-muted-text">{stats.maidens}</td>
                <td className="text-right px-2 font-mono text-off-white">{stats.runs}</td>
                <td className="text-right px-2 font-mono font-bold text-wicket-red">{stats.wickets}</td>
                <td className="text-right px-2 font-mono text-muted-text">{stats.wides}</td>
                <td className="text-right px-2 font-mono text-muted-text">{stats.noBalls}</td>
                <td className="text-right pl-2 font-mono text-muted-text">
                  {stats.balls > 0 ? (stats.runs / (stats.balls / 6)).toFixed(2) : '0.00'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
