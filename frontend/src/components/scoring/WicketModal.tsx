import { useState } from 'react';
import type { WicketType } from '@/types/match';
import type { Player } from '@/types/player';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: {
    type: WicketType;
    dismissedPlayerId: string;
    newBatsmanId?: string;
    fielderId?: string;
  }) => void;
  currentBatsman: { id: string; name: string } | null;
  remainingPlayers: Player[];
  fieldingPlayers: Player[];
  boundaryOutEnabled: boolean;
}

const WICKET_TYPES: { value: WicketType; label: string; emoji: string }[] = [
  { value: 'bowled', label: 'Bowled', emoji: '🪵' },
  { value: 'caught', label: 'Caught', emoji: '🧤' },
  { value: 'run_out', label: 'Run Out', emoji: '🎯' },
  { value: 'hit_wicket', label: 'Hit Wicket', emoji: '💥' },
  { value: 'boundary_out', label: 'Boundary Out', emoji: '🔴' },
  { value: 'retired', label: 'Retired', emoji: '🚶' },
];

export default function WicketModal({
  open,
  onClose,
  onConfirm,
  currentBatsman,
  remainingPlayers,
  fieldingPlayers,
  boundaryOutEnabled,
}: Props) {
  const [wicketType, setWicketType] = useState<WicketType>('bowled');
  const [newBatsmanId, setNewBatsmanId] = useState('');
  const [fielderId, setFielderId] = useState('');

  if (!open) return null;

  const needsFielder = wicketType === 'caught' || wicketType === 'run_out';
  const filteredTypes = boundaryOutEnabled
    ? WICKET_TYPES
    : WICKET_TYPES.filter((t) => t.value !== 'boundary_out');

  const handleConfirm = () => {
    if (!currentBatsman) return;
    onConfirm({
      type: wicketType,
      dismissedPlayerId: currentBatsman.id,
      newBatsmanId: newBatsmanId || undefined,
      fielderId: fielderId || undefined,
    });
    setWicketType('bowled');
    setNewBatsmanId('');
    setFielderId('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-pitch-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative glass rounded-2xl w-full max-w-md p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-barlow font-bold text-2xl text-wicket-red">🔴 Wicket!</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-crease-line/50 text-muted-text">
            <X size={20} />
          </button>
        </div>

        {/* Dismissed batsman */}
        {currentBatsman && (
          <div className="bg-wicket-red/10 border border-wicket-red/20 rounded-xl px-4 py-3 mb-4">
            <p className="text-xs text-muted-text">Dismissed</p>
            <p className="font-semibold text-off-white">{currentBatsman.name}</p>
          </div>
        )}

        {/* Wicket type */}
        <div className="mb-4">
          <label className="text-sm text-muted-text mb-2 block">How Out?</label>
          <div className="grid grid-cols-3 gap-2">
            {filteredTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setWicketType(type.value)}
                className={cn(
                  'px-3 py-2 rounded-xl text-xs font-medium border transition-all text-center',
                  wicketType === type.value
                    ? 'border-wicket-red bg-wicket-red/10 text-wicket-red'
                    : 'border-crease-line text-muted-text hover:border-crease-line/80'
                )}
              >
                <span className="text-base">{type.emoji}</span>
                <br />
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Fielder select */}
        {needsFielder && (
          <div className="mb-4">
            <label className="text-sm text-muted-text mb-1.5 block">Fielder</label>
            <select
              value={fielderId}
              onChange={(e) => setFielderId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-pitch-black border border-crease-line text-off-white text-sm focus:outline-none focus:border-sky-six/50"
            >
              <option value="">Select fielder (optional)</option>
              {fieldingPlayers.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* New batsman */}
        {remainingPlayers.length > 0 && wicketType !== 'retired' && (
          <div className="mb-4">
            <label className="text-sm text-muted-text mb-1.5 block">New Batsman</label>
            <select
              value={newBatsmanId}
              onChange={(e) => setNewBatsmanId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-pitch-black border border-crease-line text-off-white text-sm focus:outline-none focus:border-lime-shot/50"
            >
              <option value="">Select next batsman</option>
              {remainingPlayers.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={handleConfirm}
          className="w-full gully-btn-danger py-3 rounded-xl text-base"
        >
          Confirm Wicket
        </button>
      </div>
    </div>
  );
}
