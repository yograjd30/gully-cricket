import type { Player } from '@/types/player';
import { cn } from '@/lib/utils';
import { Zap as Cricket, Target, Swords, Edit2, Trash2 } from 'lucide-react';

const roleConfig = {
  batsman: { icon: Cricket, label: 'Bat', color: 'bg-lime-shot/10 text-lime-shot border-lime-shot/20' },
  bowler: { icon: Target, label: 'Bowl', color: 'bg-sky-six/10 text-sky-six border-sky-six/20' },
  allrounder: { icon: Swords, label: 'All', color: 'bg-gold-bail/10 text-gold-bail border-gold-bail/20' },
};

interface Props {
  player: Player;
  onEdit: (player: Player) => void;
  onDelete: (id: string) => void;
  onViewStats: (id: string) => void;
}

export default function PlayerCard({ player, onEdit, onDelete, onViewStats }: Props) {
  const role = roleConfig[player.role] || roleConfig.allrounder;
  const RoleIcon = role.icon;

  // Generate initials-based avatar
  const initials = player.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="gully-card group relative overflow-hidden">
      {/* Hover gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-lime-shot/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative flex items-center gap-3">
        {/* Avatar */}
        <button
          onClick={() => onViewStats(player._id)}
          className="flex-shrink-0 w-14 h-14 rounded-full bg-crease-line border-2 border-crease-line flex items-center justify-center text-lg font-barlow font-bold text-off-white hover:border-lime-shot/50 transition-colors cursor-pointer"
        >
          {player.avatar || initials}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <button
            onClick={() => onViewStats(player._id)}
            className="text-left cursor-pointer"
          >
            <h3 className="font-semibold text-off-white truncate hover:text-lime-shot transition-colors">
              {player.name}
            </h3>
            {player.nickname && (
              <p className="text-xs text-muted-text truncate">"{player.nickname}"</p>
            )}
          </button>

          <div className="flex items-center gap-2 mt-1.5">
            {/* Role badge */}
            <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border', role.color)}>
              <RoleIcon size={10} />
              {role.label}
            </span>

            {/* Batting style */}
            <span className="text-[10px] text-muted-text font-mono">
              {player.battingStyle === 'left' ? 'LHB' : 'RHB'}
            </span>

            {/* Bowling style */}
            {player.bowlingStyle !== 'none' && (
              <span className="text-[10px] text-muted-text font-mono capitalize">
                {player.bowlingStyle}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(player)}
            className="p-1.5 rounded-lg hover:bg-crease-line/50 text-muted-text hover:text-sky-six transition-colors"
            aria-label="Edit player"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => onDelete(player._id)}
            className="p-1.5 rounded-lg hover:bg-crease-line/50 text-muted-text hover:text-wicket-red transition-colors"
            aria-label="Delete player"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
