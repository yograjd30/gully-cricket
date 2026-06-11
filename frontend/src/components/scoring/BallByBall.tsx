import type { Ball } from '@/types/match';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  balls: Ball[];
}

function getBallDisplay(ball: Ball) {
  if (ball.isUndone) return { text: '✕', color: 'bg-crease-line/50 text-muted-text border-crease-line' };
  if (ball.isWicket) return { text: 'W', color: 'bg-wicket-red/20 text-wicket-red border-wicket-red' };
  if (ball.extras.type === 'offside_wide' || ball.extras.type === 'legside_wide') {
    return { text: 'Wd', color: 'bg-gold-bail/10 text-gold-bail border-gold-bail/50' };
  }
  if (ball.extras.type === 'no_ball') return { text: 'Nb', color: 'bg-gold-bail/10 text-gold-bail border-gold-bail/50' };
  if (ball.runs === 0) return { text: '·', color: 'bg-crease-line/30 text-muted-text border-crease-line' };
  if (ball.runs === 4) return { text: '4', color: 'bg-sky-six/10 text-sky-six border-sky-six/50' };
  if (ball.runs === 6) return { text: '6', color: 'bg-lime-shot/10 text-lime-shot border-lime-shot/50' };
  return { text: `${ball.runs}`, color: 'bg-crease-line/20 text-off-white border-crease-line' };
}

export default function BallByBall({ balls }: Props) {
  const activeBalls = balls.filter((b) => !b.isUndone);

  // Group into overs
  const overs: Ball[][] = [];
  let currentOver: Ball[] = [];
  let legalCount = 0;

  for (const ball of activeBalls) {
    currentOver.push(ball);
    if (ball.isLegal) legalCount++;
    if (legalCount === 6) {
      overs.push(currentOver);
      currentOver = [];
      legalCount = 0;
    }
  }
  if (currentOver.length > 0) overs.push(currentOver);

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {overs.map((over, overIdx) => (
          <motion.div
            key={overIdx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <span className="text-[10px] font-mono text-muted-text w-10 flex-shrink-0">
              Ov {overIdx + 1}
            </span>
            <div className="flex gap-1.5 flex-wrap">
              {over.map((ball, ballIdx) => {
                const display = getBallDisplay(ball);
                return (
                  <motion.div
                    key={`${overIdx}-${ballIdx}`}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={cn(
                      'ball-indicator',
                      display.color
                    )}
                    title={ball.commentary || undefined}
                  >
                    {display.text}
                  </motion.div>
                );
              })}
            </div>
            {/* Over runs */}
            <span className="text-xs font-mono text-muted-text ml-auto">
              {over.reduce((sum, b) => sum + (b.isUndone ? 0 : b.runs), 0)}r
            </span>
          </motion.div>
        ))}
      </AnimatePresence>

      {activeBalls.length === 0 && (
        <p className="text-center text-muted-text text-sm py-4">No balls bowled yet</p>
      )}

      {/* Latest commentary */}
      {activeBalls.length > 0 && activeBalls[activeBalls.length - 1].commentary && (
        <motion.div
          key={activeBalls.length}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-muted-text italic bg-pitch-black/50 rounded-xl px-4 py-3 border border-crease-line/30"
        >
          💬 {activeBalls[activeBalls.length - 1].commentary}
        </motion.div>
      )}
    </div>
  );
}
