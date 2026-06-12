import { useState, useEffect } from 'react';
import type { Player, CreatePlayerPayload } from '@/types/player';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePlayerPayload) => void;
  editPlayer?: Player | null;
  isLoading?: boolean;
}

const EMOJIS = ['🏏', '⚡', '🔥', '💪', '🎯', '👑', '🦁', '🐯', '🦅', '💀', '🌟', '🚀'];

export default function PlayerForm({ open, onClose, onSubmit, editPlayer, isLoading }: Props) {
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState('');
  const [role, setRole] = useState<Player['role']>('allrounder');
  const [battingStyle, setBattingStyle] = useState<Player['battingStyle']>('right');
  const [bowlingStyle, setBowlingStyle] = useState<Player['bowlingStyle']>('none');

  useEffect(() => {
    if (editPlayer) {
      setName(editPlayer.name);
      setNickname(editPlayer.nickname || '');
      setAvatar(editPlayer.avatar || '');
      setRole(editPlayer.role);
      setBattingStyle(editPlayer.battingStyle);
      setBowlingStyle(editPlayer.bowlingStyle);
    } else {
      setName('');
      setNickname('');
      setAvatar('');
      setRole('allrounder');
      setBattingStyle('right');
      setBowlingStyle('none');
    }
  }, [editPlayer, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), nickname, avatar, role, battingStyle, bowlingStyle });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-pitch-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative glass rounded-2xl w-full max-w-md p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-barlow font-bold text-2xl text-off-white">
            {editPlayer ? 'Edit Player' : 'Add Player'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-crease-line/50 text-muted-text hover:text-off-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-muted-text mb-1.5">Player Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Rahul Sharma"
              className="w-full px-4 py-3 rounded-xl bg-pitch-black border border-crease-line text-off-white placeholder-muted-text/50 focus:outline-none focus:border-lime-shot/50 focus:ring-1 focus:ring-lime-shot/20 transition-all"
              required
            />
          </div>

          {/* Nickname */}
          <div>
            <label className="block text-sm font-medium text-muted-text mb-1.5">Nickname</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g., The Wall"
              className="w-full px-4 py-3 rounded-xl bg-pitch-black border border-crease-line text-off-white placeholder-muted-text/50 focus:outline-none focus:border-lime-shot/50 focus:ring-1 focus:ring-lime-shot/20 transition-all"
            />
          </div>

          {/* Avatar emoji */}
          <div>
            <label className="block text-sm font-medium text-muted-text mb-1.5">Avatar</label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatar(emoji)}
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center text-xl border transition-all',
                    avatar === emoji
                      ? 'border-lime-shot bg-lime-shot/10 scale-110'
                      : 'border-crease-line hover:border-crease-line/80 bg-pitch-black'
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Batting style only */}
          <div>
            <label className="block text-sm font-medium text-muted-text mb-1.5">Batting Style</label>
            <div className="flex gap-2">
              {(['right', 'left'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setBattingStyle(s)}
                  className={cn(
                    'flex-1 px-4 py-3 rounded-xl text-sm font-semibold border transition-all',
                    battingStyle === s
                      ? 'border-sky-six bg-sky-six/10 text-sky-six'
                      : 'border-crease-line text-muted-text'
                  )}
                >
                  {s === 'right' ? 'Right Hand Bat (RHB)' : 'Left Hand Bat (LHB)'}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!name.trim() || isLoading}
            className="w-full gully-btn-primary py-3 rounded-xl text-base mt-2"
          >
            {isLoading ? 'Saving...' : editPlayer ? 'Update Player' : 'Add Player'}
          </button>
        </form>
      </div>
    </div>
  );
}
