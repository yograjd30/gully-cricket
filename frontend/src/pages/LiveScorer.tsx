import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMatch, useRecordBall, useUndoBall, useCompleteMatch, useUpdateMatchStatus } from '@/hooks/useMatch';
import LiveScoreboard from '@/components/scoreboard/LiveScoreboard';
import ScoringPad from '@/components/scoring/ScoringPad';
import BallByBall from '@/components/scoring/BallByBall';
import WicketModal from '@/components/scoring/WicketModal';
import type { ExtraType, WicketType, Ball } from '@/types/match';
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
  const [localStrikerId, setLocalStrikerId] = useState<string>('');
  const [localNonStrikerId, setLocalNonStrikerId] = useState<string>('');
  const [localBowlerId, setLocalBowlerId] = useState<string>('');

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
    return (team.players as unknown as Player[]) || [];
  }, [match, battingTeamKey]);

  const bowlingPlayers: Player[] = useMemo(() => {
    if (!match) return [];
    const team = match[bowlingTeamKey as 'teamA' | 'teamB'];
    if (!team?.players) return [];
    return (team.players as unknown as Player[]) || [];
  }, [match, bowlingTeamKey]);

  // Track dismissed/retired batsmen
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

  const availableBatsmen = useMemo(() => {
    return battingPlayers.filter(
      (p) => !dismissedIds.has(p._id)
    );
  }, [battingPlayers, dismissedIds]);

  // Sync striker/non-striker and bowler states
  const ballsLength = currentInnings?.balls?.length || 0;
  const currentInningsId = currentInnings?._id;

  useEffect(() => {
    if (currentInnings) {
      const sId = currentInnings.strikerId;
      const nsId = currentInnings.nonStrikerId;
      if (sId) {
        setLocalStrikerId(sId);
      } else if (availableBatsmen[0]) {
        setLocalStrikerId(availableBatsmen[0]._id);
      }
      if (nsId) {
        setLocalNonStrikerId(nsId);
      } else if (availableBatsmen[1]) {
        setLocalNonStrikerId(availableBatsmen[1]._id);
      }
    }
  }, [ballsLength, currentInningsId, availableBatsmen, currentInnings]);

  useEffect(() => {
    if (bowlingPlayers.length > 0 && !localBowlerId) {
      setLocalBowlerId(bowlingPlayers[0]._id);
    }
  }, [bowlingPlayers, localBowlerId]);

  const strikerName = useMemo(() => {
    const player = battingPlayers.find((p) => p._id === localStrikerId);
    return player ? player.name : 'Select Striker';
  }, [battingPlayers, localStrikerId]);

  const nonStrikerName = useMemo(() => {
    const player = battingPlayers.find((p) => p._id === localNonStrikerId);
    return player ? player.name : 'Select Non-Striker';
  }, [battingPlayers, localNonStrikerId]);

  const bowlerName = useMemo(() => {
    const player = bowlingPlayers.find((p) => p._id === localBowlerId);
    return player ? player.name : 'Select Bowler';
  }, [bowlingPlayers, localBowlerId]);

  const handleSwapStrike = () => {
    const temp = localStrikerId;
    setLocalStrikerId(localNonStrikerId);
    setLocalNonStrikerId(temp);
  };

  // Compute live stats for batsman and bowler
  const liveStats = useMemo(() => {
    if (!currentInnings) return { striker: null, nonStriker: null, bowler: null };

    const strikerStats = { runs: 0, balls: 0, fours: 0, sixes: 0 };
    const nonStrikerStats = { runs: 0, balls: 0, fours: 0, sixes: 0 };
    const bowlerStats = { overs: 0, balls: 0, maidens: 0, runs: 0, wickets: 0, wides: 0, noBalls: 0 };

    const oversMap: Record<number, Ball[]> = {};

    for (const ball of currentInnings.balls) {
      if (ball.isUndone) continue;

      // Batsman stats
      if (ball.batsmanId === localStrikerId) {
        strikerStats.runs += ball.runs;
        const isWide = ball.extras?.type === 'offside_wide' || ball.extras?.type === 'legside_wide';
        if (!isWide) {
          strikerStats.balls += 1;
          if (ball.runs === 4) strikerStats.fours += 1;
          if (ball.runs === 6) strikerStats.sixes += 1;
        }
      } else if (ball.batsmanId === localNonStrikerId) {
        nonStrikerStats.runs += ball.runs;
        const isWide = ball.extras?.type === 'offside_wide' || ball.extras?.type === 'legside_wide';
        if (!isWide) {
          nonStrikerStats.balls += 1;
          if (ball.runs === 4) nonStrikerStats.fours += 1;
          if (ball.runs === 6) nonStrikerStats.sixes += 1;
        }
      }

      // Bowler stats
      if (ball.bowlerId === localBowlerId) {
        const isWide = ball.extras?.type === 'offside_wide' || ball.extras?.type === 'legside_wide';
        const isNoBall = ball.extras?.type === 'no_ball' || ball.extras?.type === 'crease_no_ball' || ball.extras?.type === 'height_no_ball';
        
        if (!isWide && !isNoBall) {
          bowlerStats.balls += 1;
        }
        
        const conceded = ball.runs + (isWide || isNoBall ? (ball.extras?.runs || 0) : 0);
        bowlerStats.runs += conceded;

        if (isWide) bowlerStats.wides += 1;
        if (isNoBall) bowlerStats.noBalls += 1;

        if (ball.isWicket && ball.wicket?.type !== 'run_out' && ball.wicket?.type !== 'retired') {
          bowlerStats.wickets += 1;
        }

        const overNum = ball.overNumber;
        if (!oversMap[overNum]) oversMap[overNum] = [];
        oversMap[overNum].push(ball);
      }
    }

    let maidens = 0;
    for (const overNum in oversMap) {
      const overBalls = oversMap[overNum];
      const legalBallsInOver = overBalls.filter(b => b.isLegal).length;
      if (legalBallsInOver === 6) {
        const runsInOver = overBalls.reduce((sum, b) => {
          const isWide = b.extras?.type === 'offside_wide' || b.extras?.type === 'legside_wide';
          const isNoBall = b.extras?.type === 'no_ball' || b.extras?.type === 'crease_no_ball' || b.extras?.type === 'height_no_ball';
          return sum + b.runs + (isWide || isNoBall ? (b.extras?.runs || 0) : 0);
        }, 0);
        if (runsInOver === 0) {
          maidens += 1;
        }
      }
    }
    bowlerStats.maidens = maidens;
    bowlerStats.overs = Math.floor(bowlerStats.balls / 6) + (bowlerStats.balls % 6) / 10;

    return {
      striker: strikerStats,
      nonStriker: nonStrikerStats,
      bowler: bowlerStats
    };
  }, [currentInnings, localStrikerId, localNonStrikerId, localBowlerId]);

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
    if (!localStrikerId || !localBowlerId) return;

    recordBall.mutate({
      matchId,
      delivery: {
        inningsIndex: inningsIndex as 0 | 1,
        batsmanId: localStrikerId,
        bowlerId: localBowlerId,
        runs,
        extras: { type: extraType || 'none', runs: 0 },
        isWicket: false,
        strikerId: localStrikerId,
        nonStrikerId: localNonStrikerId,
      },
    });
  };

  const handleWicketConfirm = (data: {
    type: WicketType;
    dismissedPlayerId: string;
    newBatsmanId?: string;
    fielderId?: string;
  }) => {
    if (!localStrikerId || !localBowlerId) return;

    recordBall.mutate({
      matchId,
      delivery: {
        inningsIndex: inningsIndex as 0 | 1,
        batsmanId: localStrikerId,
        bowlerId: localBowlerId,
        runs: 0,
        extras: { type: 'none', runs: 0 },
        isWicket: true,
        wicket: {
          type: data.type,
          dismissedPlayerId: data.dismissedPlayerId,
          fielderId: data.fielderId,
        },
        strikerId: localStrikerId,
        nonStrikerId: localNonStrikerId,
        newBatsmanId: data.newBatsmanId,
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

        {/* Live Batsmen & Bowler Stats (Cricbuzz style) */}
        {currentInnings && (
          <div className="gully-card p-4 space-y-4 my-2">
            <div className="flex justify-between items-center border-b border-crease-line pb-2">
              <h3 className="font-barlow font-bold text-sm text-lime-shot uppercase tracking-wider">Live Stats</h3>
              <button
                onClick={handleSwapStrike}
                className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg border border-lime-shot/30 text-lime-shot hover:bg-lime-shot/10 active:scale-95 transition-all"
              >
                ⇅ Swap Strike
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Batsmen Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono text-muted-text">
                  <thead>
                    <tr className="border-b border-crease-line/50 pb-1 text-[10px] uppercase">
                      <th className="py-1 text-off-white">Batter</th>
                      <th className="py-1 text-right">R</th>
                      <th className="py-1 text-right">B</th>
                      <th className="py-1 text-right">4s</th>
                      <th className="py-1 text-right">6s</th>
                      <th className="py-1 text-right">SR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Striker Row */}
                    <tr className="border-b border-crease-line/30 text-off-white font-semibold">
                      <td className="py-2 truncate max-w-[120px]">
                        {strikerName} <span className="text-lime-shot">*</span>
                      </td>
                      <td className="py-2 text-right">{liveStats.striker?.runs ?? 0}</td>
                      <td className="py-2 text-right">{liveStats.striker?.balls ?? 0}</td>
                      <td className="py-2 text-right">{liveStats.striker?.fours ?? 0}</td>
                      <td className="py-2 text-right">{liveStats.striker?.sixes ?? 0}</td>
                      <td className="py-2 text-right">
                        {liveStats.striker && liveStats.striker.balls > 0
                          ? ((liveStats.striker.runs / liveStats.striker.balls) * 100).toFixed(1)
                          : '0.0'}
                      </td>
                    </tr>
                    {/* Non-Striker Row */}
                    <tr className="text-muted-text">
                      <td className="py-2 truncate max-w-[120px]">{nonStrikerName}</td>
                      <td className="py-2 text-right">{liveStats.nonStriker?.runs ?? 0}</td>
                      <td className="py-2 text-right">{liveStats.nonStriker?.balls ?? 0}</td>
                      <td className="py-2 text-right">{liveStats.nonStriker?.fours ?? 0}</td>
                      <td className="py-2 text-right">{liveStats.nonStriker?.sixes ?? 0}</td>
                      <td className="py-2 text-right">
                        {liveStats.nonStriker && liveStats.nonStriker.balls > 0
                          ? ((liveStats.nonStriker.runs / liveStats.nonStriker.balls) * 100).toFixed(1)
                          : '0.0'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bowler Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono text-muted-text">
                  <thead>
                    <tr className="border-b border-crease-line/50 pb-1 text-[10px] uppercase">
                      <th className="py-1 text-off-white">Bowler</th>
                      <th className="py-1 text-right">O</th>
                      <th className="py-1 text-right">M</th>
                      <th className="py-1 text-right">R</th>
                      <th className="py-1 text-right">W</th>
                      <th className="py-1 text-right">Eco</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="text-off-white">
                      <td className="py-2 truncate max-w-[120px] font-semibold">{bowlerName}</td>
                      <td className="py-2 text-right">{liveStats.bowler?.overs.toFixed(1) ?? '0.0'}</td>
                      <td className="py-2 text-right">{liveStats.bowler?.maidens ?? 0}</td>
                      <td className="py-2 text-right">{liveStats.bowler?.runs ?? 0}</td>
                      <td className="py-2 text-right">{liveStats.bowler?.wickets ?? 0}</td>
                      <td className="py-2 text-right">
                        {liveStats.bowler && liveStats.bowler.balls > 0
                          ? ((liveStats.bowler.runs / (liveStats.bowler.balls / 6))).toFixed(2)
                          : '0.00'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Current striker, non-striker & bowler selectors */}
        <div className="grid grid-cols-3 gap-2">
          {/* Striker Select */}
          <div className="gully-card py-2 px-2.5">
            <p className="text-[10px] text-muted-text font-mono uppercase">Striker *</p>
            <select
              value={localStrikerId}
              onChange={(e) => setLocalStrikerId(e.target.value)}
              className="w-full bg-transparent text-off-white text-sm font-semibold focus:outline-none truncate"
            >
              <option value="" disabled className="bg-pavilion-dark text-muted-text">Select Striker</option>
              {availableBatsmen.map((p) => {
                const id = p._id;
                return (
                  <option key={id} value={id} className="bg-pavilion-dark">
                    {p.name}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Non-Striker Select */}
          <div className="gully-card py-2 px-2.5">
            <p className="text-[10px] text-muted-text font-mono uppercase">Non-Striker</p>
            <select
              value={localNonStrikerId}
              onChange={(e) => setLocalNonStrikerId(e.target.value)}
              className="w-full bg-transparent text-off-white text-sm font-semibold focus:outline-none truncate"
            >
              <option value="" className="bg-pavilion-dark text-muted-text">Select Non-Striker</option>
              {availableBatsmen
                .filter((p) => p._id !== localStrikerId)
                .map((p) => {
                  const id = p._id;
                  return (
                    <option key={id} value={id} className="bg-pavilion-dark">
                      {p.name}
                    </option>
                  );
                })}
            </select>
          </div>

          {/* Bowler Select */}
          <div className="gully-card py-2 px-2.5">
            <p className="text-[10px] text-muted-text font-mono uppercase">Bowler</p>
            <select
              value={localBowlerId}
              onChange={(e) => setLocalBowlerId(e.target.value)}
              className="w-full bg-transparent text-off-white text-sm font-semibold focus:outline-none truncate"
            >
              <option value="" disabled className="bg-pavilion-dark text-muted-text">Select Bowler</option>
              {bowlingPlayers.map((p) => {
                const id = p._id;
                return (
                  <option key={id} value={id} className="bg-pavilion-dark">
                    {p.name}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Ball by ball feed */}
      <div className="flex-1 overflow-y-auto py-4">
        {currentInnings && <BallByBall balls={currentInnings.balls} />}
      </div>

      {/* End innings button */}
      <div className="flex justify-center py-2 flex-shrink-0">
        <button
          onClick={handleEndInnings}
          className="text-xs text-muted-text hover:text-gold-bail transition-colors font-mono flex items-center gap-1"
        >
          <Trophy size={12} />
          End Innings / Match
        </button>
      </div>

      {/* Scoring Pad — sticky bottom */}
      <div className="sticky bottom-16 md:bottom-0 -mx-4 flex-shrink-0">
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
        striker={localStrikerId ? {
          id: localStrikerId,
          name: strikerName,
        } : null}
        nonStriker={localNonStrikerId ? {
          id: localNonStrikerId,
          name: nonStrikerName,
        } : null}
        remainingPlayers={availableBatsmen.filter(
          (p) => p._id !== localStrikerId && p._id !== localNonStrikerId
        ) as Player[]}
        fieldingPlayers={bowlingPlayers as Player[]}
        boundaryOutEnabled={match.rules?.boundaryOut ?? false}
      />
    </div>
  );
}
