import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMatch, useRecordToss } from '@/hooks/useMatch';
import { motion, AnimatePresence } from 'framer-motion';

type TossState = 'ready' | 'flipping' | 'result';

export default function CoinToss() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { data: match } = useMatch(matchId || null);
  const recordToss = useRecordToss();

  const [tossState, setTossState] = useState<TossState>('ready');
  const [winner, setWinner] = useState<'teamA' | 'teamB' | null>(null);

  if (!match || !matchId) {
    return <div className="text-center py-12 text-muted-text">Loading match...</div>;
  }

  const flipCoin = () => {
    setTossState('flipping');
    const result: 'teamA' | 'teamB' = Math.random() > 0.5 ? 'teamA' : 'teamB';

    setTimeout(() => {
      setWinner(result);
      setTossState('result');
    }, 2000);
  };

  const handleDecision = async (decision: 'bat' | 'field') => {
    if (!winner) return;
    try {
      await recordToss.mutateAsync({ matchId, winner, decision });
      navigate(`/live/${matchId}`);
    } catch (err) {
      console.error('Failed to record toss:', err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8">
      {/* Team names */}
      <div className="flex items-center gap-6 text-center">
        <div>
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-barlow font-black border-2"
            style={{ borderColor: match.teamA.color, color: match.teamA.color }}
          >
            {match.teamA.name.charAt(0)}
          </div>
          <p className="font-barlow font-bold text-lg text-off-white mt-2">{match.teamA.name}</p>
        </div>
        <span className="font-barlow text-3xl text-muted-text">VS</span>
        <div>
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-barlow font-black border-2"
            style={{ borderColor: match.teamB.color, color: match.teamB.color }}
          >
            {match.teamB.name.charAt(0)}
          </div>
          <p className="font-barlow font-bold text-lg text-off-white mt-2">{match.teamB.name}</p>
        </div>
      </div>

      {/* Coin */}
      <div className="relative" style={{ perspective: '600px' }}>
        <motion.div
          className="w-32 h-32 rounded-full border-4 flex items-center justify-center text-5xl cursor-pointer relative"
          style={{
            borderColor: tossState === 'result' && winner
              ? match[winner].color
              : '#252D40',
            background: tossState === 'result' && winner
              ? `linear-gradient(135deg, ${match[winner].color}20, #1A1F2E)`
              : '#1A1F2E',
            transformStyle: 'preserve-3d',
          }}
          animate={
            tossState === 'flipping'
              ? { rotateY: [0, 360, 720, 1080] }
              : tossState === 'result'
              ? { rotateY: 0, scale: [1, 1.1, 1] }
              : {}
          }
          transition={
            tossState === 'flipping'
              ? { duration: 2, ease: 'easeInOut' }
              : { duration: 0.5 }
          }
          onClick={tossState === 'ready' ? flipCoin : undefined}
          whileHover={tossState === 'ready' ? { scale: 1.05 } : {}}
          whileTap={tossState === 'ready' ? { scale: 0.95 } : {}}
        >
          {tossState === 'ready' && '🪙'}
          {tossState === 'flipping' && '🪙'}
          {tossState === 'result' && '🏆'}
        </motion.div>

        {/* Glow ring on result */}
        {tossState === 'result' && winner && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              boxShadow: `0 0 30px ${match[winner].color}60, 0 0 60px ${match[winner].color}30`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </div>

      {/* Instructions / Result */}
      <AnimatePresence mode="wait">
        {tossState === 'ready' && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-3"
          >
            <p className="text-muted-text text-lg">Tap the coin to toss!</p>
            <p className="text-xs text-muted-text font-mono">{match.totalOvers}-over match</p>
          </motion.div>
        )}

        {tossState === 'flipping' && (
          <motion.div
            key="flipping"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <p className="text-gold-bail font-barlow font-bold text-xl animate-pulse">
              Flipping...
            </p>
          </motion.div>
        )}

        {tossState === 'result' && winner && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <div>
              <p className="text-sm text-muted-text uppercase tracking-wider font-mono">Toss won by</p>
              <h2
                className="font-barlow font-black text-4xl mt-1"
                style={{ color: match[winner].color }}
              >
                {match[winner].name}
              </h2>
            </div>

            <div className="space-y-3">
              <p className="text-off-white font-medium">Choose to:</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => handleDecision('bat')}
                  disabled={recordToss.isPending}
                  className="gully-btn bg-lime-shot/10 border-2 border-lime-shot text-lime-shot px-8 py-4 rounded-2xl text-lg font-barlow font-bold hover:bg-lime-shot hover:text-pitch-black transition-all"
                >
                  🏏 BAT
                </button>
                <button
                  onClick={() => handleDecision('field')}
                  disabled={recordToss.isPending}
                  className="gully-btn bg-sky-six/10 border-2 border-sky-six text-sky-six px-8 py-4 rounded-2xl text-lg font-barlow font-bold hover:bg-sky-six hover:text-pitch-black transition-all"
                >
                  🧤 FIELD
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
