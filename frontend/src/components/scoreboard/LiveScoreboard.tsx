import { cn } from '@/lib/utils';
import type { Innings, MatchMeta } from '@/types/match';
import { motion } from 'framer-motion';

interface Props {
  innings: Innings;
  teamName: string;
  teamColor: string;
  meta?: MatchMeta | null;
  isSecondInnings?: boolean;
}

export default function LiveScoreboard({ innings, teamName, teamColor, meta, isSecondInnings }: Props) {
  return (
    <div className="gully-card scoreboard-glow overflow-hidden">
      {/* Top bar — team name */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: teamColor }} />
        <h2 className="font-barlow font-bold text-xl text-off-white">{teamName}</h2>
        {innings.completed && (
          <span className="text-[10px] font-mono text-muted-text bg-crease-line/50 px-2 py-0.5 rounded">
            {innings.result || 'Complete'}
          </span>
        )}
      </div>

      {/* Score display */}
      <div className="flex items-end gap-4 mb-4">
        <motion.div
          key={innings.totalRuns}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="score-display text-score-xl leading-none"
          style={{ color: teamColor }}
        >
          {innings.totalRuns}
        </motion.div>
        <div className="pb-2">
          <span className="font-barlow text-3xl text-muted-text">/</span>
          <span className="font-barlow text-3xl text-wicket-red">{innings.totalWickets}</span>
        </div>
        <div className="pb-2 ml-2">
          <span className="font-mono text-xl text-sky-six">{innings.totalOvers}</span>
          <span className="text-xs text-muted-text ml-1">ov</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2">
        <StatBox
          label="CRR"
          value={
            innings.totalBalls > 0
              ? (innings.totalRuns / (innings.totalBalls / 6)).toFixed(2)
              : '0.00'
          }
          color="text-sky-six"
        />
        <StatBox
          label="Extras"
          value={String(
            innings.extras.wides + innings.extras.noBalls + innings.extras.byes + innings.extras.legByes
          )}
          color="text-gold-bail"
        />
        {isSecondInnings && meta ? (
          <>
            <StatBox label="Need" value={String(meta.runsRequired)} color="text-wicket-red" />
            <StatBox label="RRR" value={meta.rrr} color="text-wicket-red" />
          </>
        ) : (
          <>
            <StatBox label="Wides" value={String(innings.extras.wides)} color="text-muted-text" />
            <StatBox label="NB" value={String(innings.extras.noBalls)} color="text-muted-text" />
          </>
        )}
      </div>

      {/* Target line for second innings */}
      {isSecondInnings && meta && (
        <div className="mt-3 text-center text-sm font-mono">
          <span className="text-muted-text">Target: </span>
          <span className="text-gold-bail font-bold">{meta.target}</span>
          <span className="text-muted-text"> • {meta.ballsRemaining} balls left</span>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-pitch-black/50 rounded-lg p-2 text-center border border-crease-line/30">
      <div className={cn('font-mono font-bold text-lg', color)}>{value}</div>
      <div className="text-[9px] text-muted-text font-mono uppercase tracking-wider">{label}</div>
    </div>
  );
}
