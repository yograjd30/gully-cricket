import { cn } from '@/lib/utils';
import type { Player } from '@/types/player';
import { X } from 'lucide-react';

interface Props {
  teamName: string;
  color: string;
  players: Player[];
  onRemove: (playerId: string) => void;
  onNameChange: (name: string) => void;
  onColorChange: (color: string) => void;
}

const TEAM_COLORS = ['#A3E635', '#38BDF8', '#F87171', '#FBBF24', '#A78BFA', '#FB923C', '#34D399', '#F472B6'];

export default function TeamSlot({ teamName, color, players, onRemove, onNameChange, onColorChange }: Props) {
  return (
    <div className="gully-card space-y-3" style={{ borderColor: color + '30' }}>
      {/* Team header */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={teamName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Team Name"
          className="flex-1 bg-transparent font-barlow font-bold text-xl text-off-white border-b-2 border-crease-line focus:border-lime-shot/50 focus:outline-none transition-colors py-1"
          style={{ borderColor: color + '50' }}
        />
        <span className="text-xs text-muted-text font-mono">{players.length}/11</span>
      </div>

      {/* Color picker */}
      <div className="flex gap-1.5">
        {TEAM_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => onColorChange(c)}
            className={cn(
              'w-6 h-6 rounded-full border-2 transition-transform',
              color === c ? 'scale-125 border-white' : 'border-transparent hover:scale-110'
            )}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      {/* Players list */}
      <div className="space-y-1.5 min-h-[80px]">
        {players.length === 0 ? (
          <p className="text-muted-text text-sm text-center py-4">
            Tap players above to add them
          </p>
        ) : (
          players.map((player) => (
            <div
              key={player._id}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-pitch-black/50 border border-crease-line/50 group"
            >
              <span className="text-sm">{player.avatar || '🏏'}</span>
              <span className="flex-1 text-sm text-off-white truncate">{player.name}</span>
              <button
                onClick={() => onRemove(player._id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-wicket-red/20 text-muted-text hover:text-wicket-red transition-all"
              >
                <X size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
