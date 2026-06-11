import { useParams, Link } from 'react-router-dom';
import { useMatch } from '@/hooks/useMatch';
import { Trophy, ArrowLeft, Calendar, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Innings } from '@/types/match';
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
  // Calculate batsman stats
  const batsmanStats = new Map<string, { runs: number; balls: number; fours: number; sixes: number; isOut: boolean; howOut: string }>();
  const bowlerStats = new Map<string, { balls: number; runs: number; wickets: number; extras: number }>();

  for (const ball of innings.balls) {
    if (ball.isUndone) continue;

    const batId = ball.batsmanId?.toString();
    const bowlId = ball.bowlerId?.toString();

    // Batting
    if (batId) {
      const existing = batsmanStats.get(batId) || { runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, howOut: '' };
      existing.runs += ball.runs;
      if (ball.isLegal && ball.extras.type === 'none') existing.balls++;
      if (ball.runs === 4) existing.fours++;
      if (ball.runs === 6) existing.sixes++;
      if (ball.isWicket && ball.wicket?.dismissedPlayerId?.toString() === batId) {
        existing.isOut = true;
        existing.howOut = ball.wicket.type || 'out';
      }
      batsmanStats.set(batId, existing);
    }

    // Bowling
    if (bowlId) {
      const existing = bowlerStats.get(bowlId) || { balls: 0, runs: 0, wickets: 0, extras: 0 };
      if (ball.isLegal) existing.balls++;
      existing.runs += ball.runs;
      if (ball.isWicket && ball.wicket?.type !== 'run_out') existing.wickets++;
      if (ball.extras.type !== 'none') existing.extras++;
      bowlerStats.set(bowlId, existing);
    }
  }

  const getPlayerName = (id: string, list: Player[]) => {
    const p = list.find((p) => (typeof p === 'string' ? p : p._id) === id);
    return typeof p === 'string' ? `Player` : p?.name || 'Unknown';
  };

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
                <td className="py-2 pr-2">
                  <span className="text-off-white">{getPlayerName(id, players)}</span>
                  {stats.isOut && (
                    <span className="text-[10px] text-wicket-red ml-1">({stats.howOut})</span>
                  )}
                  {!stats.isOut && (
                    <span className="text-[10px] text-lime-shot ml-1">not out</span>
                  )}
                </td>
                <td className="text-right px-2 font-mono font-bold text-off-white">{stats.runs}</td>
                <td className="text-right px-2 font-mono text-muted-text">{stats.balls}</td>
                <td className="text-right px-2 font-mono text-sky-six">{stats.fours}</td>
                <td className="text-right px-2 font-mono text-lime-shot">{stats.sixes}</td>
                <td className="text-right pl-2 font-mono text-muted-text">
                  {stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(0) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Extras */}
      <div className="text-xs text-muted-text font-mono">
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
              <th className="text-right px-2">R</th>
              <th className="text-right px-2">W</th>
              <th className="text-right pl-2">Econ</th>
            </tr>
          </thead>
          <tbody>
            {[...bowlerStats.entries()].map(([id, stats]) => (
              <tr key={id} className="border-b border-crease-line/20">
                <td className="py-2 pr-2 text-off-white">{getPlayerName(id, bowlers)}</td>
                <td className="text-right px-2 font-mono text-muted-text">
                  {Math.floor(stats.balls / 6)}.{stats.balls % 6}
                </td>
                <td className="text-right px-2 font-mono text-off-white">{stats.runs}</td>
                <td className="text-right px-2 font-mono font-bold text-wicket-red">{stats.wickets}</td>
                <td className="text-right pl-2 font-mono text-muted-text">
                  {stats.balls > 0 ? (stats.runs / (stats.balls / 6)).toFixed(1) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
