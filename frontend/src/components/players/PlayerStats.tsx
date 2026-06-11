import { usePlayerStats } from '@/hooks/usePlayers';
import { X, TrendingUp, Target } from 'lucide-react';

interface Props {
  playerId: string | null;
  onClose: () => void;
}

export default function PlayerStats({ playerId, onClose }: Props) {
  const { data, isLoading } = usePlayerStats(playerId);

  if (!playerId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-pitch-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative glass rounded-2xl w-full max-w-lg p-6 animate-slide-up max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-barlow font-bold text-2xl text-off-white">Player Stats</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-crease-line/50 text-muted-text">
            <X size={20} />
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-text">Loading stats...</div>
        ) : data ? (
          <div className="space-y-6">
            {/* Player header */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-crease-line border-2 border-lime-shot/30 flex items-center justify-center text-2xl">
                {data.player.avatar || data.player.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="font-barlow font-bold text-xl text-off-white">{data.player.name}</h3>
                {data.player.nickname && (
                  <p className="text-sm text-muted-text">"{data.player.nickname}"</p>
                )}
                <p className="text-xs text-lime-shot font-mono mt-1">
                  {data.stats.matches} matches
                </p>
              </div>
            </div>

            {/* Batting Stats */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-lime-shot" />
                <h4 className="font-barlow font-bold text-lg text-off-white">Batting</h4>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Runs', value: data.stats.batting.runs, color: 'text-lime-shot' },
                  { label: 'Average', value: data.stats.batting.average, color: 'text-sky-six' },
                  { label: 'SR', value: data.stats.batting.strikeRate, color: 'text-gold-bail' },
                  { label: 'HS', value: data.stats.batting.highestScore, color: 'text-lime-shot' },
                  { label: '4s', value: data.stats.batting.fours, color: 'text-sky-six' },
                  { label: '6s', value: data.stats.batting.sixes, color: 'text-wicket-red' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-pitch-black/50 rounded-xl p-3 border border-crease-line/50 text-center">
                    <div className={`font-barlow font-bold text-xl ${stat.color}`}>{stat.value}</div>
                    <div className="text-[10px] text-muted-text font-mono uppercase mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bowling Stats */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target size={16} className="text-sky-six" />
                <h4 className="font-barlow font-bold text-lg text-off-white">Bowling</h4>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Wickets', value: data.stats.bowling.wickets, color: 'text-wicket-red' },
                  { label: 'Average', value: data.stats.bowling.average, color: 'text-sky-six' },
                  { label: 'Econ', value: data.stats.bowling.economyRate, color: 'text-gold-bail' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-pitch-black/50 rounded-xl p-3 border border-crease-line/50 text-center">
                    <div className={`font-barlow font-bold text-xl ${stat.color}`}>{stat.value}</div>
                    <div className="text-[10px] text-muted-text font-mono uppercase mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-text">No stats available yet.</div>
        )}
      </div>
    </div>
  );
}
