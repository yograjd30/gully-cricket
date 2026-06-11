import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMatch, useRecordBall, useUndoBall, useCompleteMatch, useUpdateMatchStatus } from '@/hooks/useMatch';
import LiveScoreboard from '@/components/scoreboard/LiveScoreboard';
import ScoringPad from '@/components/scoring/ScoringPad';
import BallByBall from '@/components/scoring/BallByBall';
import WicketModal from '@/components/scoring/WicketModal';
import type { ExtraType, WicketType } from '@/types/match';
import type { Player } from '@/types/player';
import { Trophy } from 'lucide-react';

export default function LiveScorer() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { data: match, isLoading } = useMatch(matchId || null);
  const recordBall = useRecordBall();
  const undoBall = useUndoBall();
  const completeMatch = useCompleteMatch();
  const updateMatchStatus = useUpdateMatchStatus();

  const [wicketModalOpen, setWicketModalOpen] = useState(false);
  const [currentBatsmanIdx, setCurrentBatsmanIdx] = useState(0);
  const [currentBowlerIdx, setCurrentBowlerIdx] = useState(0);

  // Derive current innings info
  const inningsIndex = match?.status === 'innings2' ? 1 : 0;
  const currentInnings = match?.innings?.[inningsIndex];
  const isSecondInnings = inningsIndex === 1;

  // Get team data
  const battingTeamKey = currentInnings?.battingTeam || 'teamA';
  const bowlingTeamKey = currentInnings?.bowlingTeam || 'teamB';

  // Typed player arrays from match data
  const battingPlayers: Player[] = useMemo(() => {
    if (!match) return [];
    const team = match[battingTeamKey as 'teamA' | 'teamB'];
    if (!team?.players) return [];
    // Players might be populated objects or just IDs
    return (team.players as unknown as Player[]) || [];
  }, [match, battingTeamKey]);

  const bowlingPlayers: Player[] = useMemo(() => {
    if (!match) return [];
    const team = match[bowlingTeamKey as 'teamA' | 'teamB'];
    if (!team?.players) return [];
    return (team.players as unknown as Player[]) || [];
  }, [match, bowlingTeamKey]);

  // Track dismissed batsmen
  const dismissedIds = useMemo(() => {
    if (!currentInnings) return new Set<string>();
    const ids = new Set<string>();
    for (const ball of currentInnings.balls) {
      if (ball.isWicket && !ball.isUndone && ball.wicket?.dismissedPlayerId) {
        ids.add(ball.wicket.dismissedPlayerId.toString());
      }
    }
    return ids;
  }, [currentInnings]);

  const availableBatsmen = battingPlayers.filter(
    (p) => !dismissedIds.has(typeof p === 'string' ? p : p._id)
  );

  const currentBatsman = availableBatsmen[currentBatsmanIdx % availableBatsmen.length];
  const currentBowler = bowlingPlayers[currentBowlerIdx % bowlingPlayers.length];

  // Compute meta for second innings
  const meta = useMemo(() => {
    if (!isSecondInnings || !match?.innings?.[0] || !currentInnings) return null;
    const inn1 = match.innings[0];
    const target = inn1.totalRuns + 1;
    const ballsRemaining = (match.totalOvers * 6) - currentInnings.totalBalls;
    const runsRequired = target - currentInnings.totalRuns;
    const rrr = ballsRemaining > 0 ? (runsRequired / (ballsRemaining / 6)).toFixed(2) : '—';
    const crr = currentInnings.totalBalls > 0
      ? (currentInnings.totalRuns / (currentInnings.totalBalls / 6)).toFixed(2) : '0.00';
    return { target, runsRequired, ballsRemaining, rrr, crr };
  }, [isSecondInnings, match, currentInnings]);

  if (isLoading || !match || !matchId) {
    return <div className="text-center py-12 text-muted-text">Loading match...</div>;
  }

  if (match.status === 'completed') {
    navigate(`/scorecard/${matchId}`, { replace: true });
    return null;
  }

  const handleScore = (runs: number, extraType?: ExtraType) => {
    if (!currentBatsman || !currentBowler) return;
    const batsmanId = typeof currentBatsman === 'string' ? currentBatsman : currentBatsman._id;
    const bowlerId = typeof currentBowler === 'string' ? currentBowler : currentBowler._id;

    recordBall.mutate({
      matchId,
      delivery: {
        inningsIndex: inningsIndex as 0 | 1,
        batsmanId,
        bowlerId,
        runs,
        extras: { type: extraType || 'none', runs: 0 },
        isWicket: false,
      },
    });
  };

  const handleWicketConfirm = (data: {
    type: WicketType;
    dismissedPlayerId: string;
    newBatsmanId?: string;
    fielderId?: string;
  }) => {
    if (!currentBatsman || !currentBowler) return;
    const bowlerId = typeof currentBowler === 'string' ? currentBowler : currentBowler._id;

    recordBall.mutate({
      matchId,
      delivery: {
        inningsIndex: inningsIndex as 0 | 1,
        batsmanId: data.dismissedPlayerId,
        bowlerId,
        runs: 0,
        extras: { type: 'none', runs: 0 },
        isWicket: true,
        wicket: {
          type: data.type,
          dismissedPlayerId: data.dismissedPlayerId,
          fielderId: data.fielderId,
        },
      },
    });
    setWicketModalOpen(false);
  };

  const handleUndo = () => {
    undoBall.mutate(matchId);
  };

  const handleEndInnings = async () => {
    if (!matchId) return;
    if (match.status === 'innings1') {
      if (confirm('End first innings and start second innings?')) {
        await updateMatchStatus.mutateAsync({ matchId, status: 'innings2' });
      }
    } else if (match.status === 'innings2') {
      if (confirm('End match and finalize result?')) {
        await completeMatch.mutateAsync(matchId);
      }
    }
  };

  const battingTeam = match[battingTeamKey as 'teamA' | 'teamB'];

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)]">
      {/* Scoreboard */}
      <div className="space-y-4 flex-shrink-0">
        {currentInnings && (
          <LiveScoreboard
            innings={currentInnings}
            teamName={battingTeam?.name || 'Batting'}
            teamColor={battingTeam?.color || '#A3E635'}
            meta={meta}
            isSecondInnings={isSecondInnings}
          />
        )}

        {/* Current batsman & bowler selectors */}
        <div className="grid grid-cols-2 gap-3">
          <div className="gully-card py-2 px-3">
            <p className="text-[10px] text-muted-text font-mono uppercase">Batting</p>
            <select
              value={currentBatsmanIdx}
              onChange={(e) => setCurrentBatsmanIdx(Number(e.target.value))}
              className="w-full bg-transparent text-off-white text-sm font-semibold focus:outline-none truncate"
            >
              {availableBatsmen.map((p, i) => (
                <option key={typeof p === 'string' ? p : p._id} value={i} className="bg-pavilion-dark">
                  {typeof p === 'string' ? `Player ${i + 1}` : p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="gully-card py-2 px-3">
            <p className="text-[10px] text-muted-text font-mono uppercase">Bowling</p>
            <select
              value={currentBowlerIdx}
              onChange={(e) => setCurrentBowlerIdx(Number(e.target.value))}
              className="w-full bg-transparent text-off-white text-sm font-semibold focus:outline-none truncate"
            >
              {bowlingPlayers.map((p, i) => (
                <option key={typeof p === 'string' ? p : p._id} value={i} className="bg-pavilion-dark">
                  {typeof p === 'string' ? `Bowler ${i + 1}` : p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Ball by ball feed */}
      <div className="flex-1 overflow-y-auto py-4">
        {currentInnings && <BallByBall balls={currentInnings.balls} />}
      </div>

      {/* End innings button */}
      <div className="flex justify-center py-2">
        <button
          onClick={handleEndInnings}
          className="text-xs text-muted-text hover:text-gold-bail transition-colors font-mono flex items-center gap-1"
        >
          <Trophy size={12} />
          End Innings / Match
        </button>
      </div>

      {/* Scoring Pad — sticky bottom */}
      <div className="sticky bottom-16 md:bottom-0 -mx-4">
        <ScoringPad
          onScore={handleScore}
          onWicket={() => setWicketModalOpen(true)}
          onUndo={handleUndo}
          boundaryOutEnabled={match.rules?.boundaryOut ?? false}
          disabled={recordBall.isPending || undoBall.isPending}
        />
      </div>

      {/* Wicket Modal */}
      <WicketModal
        open={wicketModalOpen}
        onClose={() => setWicketModalOpen(false)}
        onConfirm={handleWicketConfirm}
        currentBatsman={currentBatsman ? {
          id: typeof currentBatsman === 'string' ? currentBatsman : currentBatsman._id,
          name: typeof currentBatsman === 'string' ? 'Batsman' : currentBatsman.name,
        } : null}
        remainingPlayers={availableBatsmen.filter(
          (p) => (typeof p === 'string' ? p : p._id) !== (typeof currentBatsman === 'string' ? currentBatsman : currentBatsman?._id)
        ) as Player[]}
        fieldingPlayers={bowlingPlayers as Player[]}
        boundaryOutEnabled={match.rules?.boundaryOut ?? false}
      />
    </div>
  );
}
