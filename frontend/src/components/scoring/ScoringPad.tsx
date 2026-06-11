import { cn } from '@/lib/utils';
import type { ExtraType } from '@/types/match';
import { Undo2, AlertTriangle } from 'lucide-react';

interface Props {
  onScore: (runs: number, extraType?: ExtraType) => void;
  onWicket: () => void;
  onUndo: () => void;
  boundaryOutEnabled: boolean;
  disabled?: boolean;
}

export default function ScoringPad({ onScore, onWicket, onUndo, boundaryOutEnabled, disabled }: Props) {
  const runButtons = [
    { value: 0, label: '0', color: 'border-crease-line text-muted-text hover:border-off-white hover:text-off-white' },
    { value: 1, label: '1', color: 'border-crease-line text-off-white hover:border-lime-shot' },
    { value: 2, label: '2', color: 'border-crease-line text-off-white hover:border-lime-shot' },
    { value: 3, label: '3', color: 'border-crease-line text-off-white hover:border-lime-shot' },
    { value: 4, label: '4', color: 'border-sky-six/50 text-sky-six hover:border-sky-six hover:bg-sky-six/10' },
    { value: 6, label: '6', color: boundaryOutEnabled
      ? 'border-wicket-red/50 text-wicket-red hover:border-wicket-red hover:bg-wicket-red/10 animate-pulse-soft'
      : 'border-lime-shot/50 text-lime-shot hover:border-lime-shot hover:bg-lime-shot/10'
    },
  ];

  return (
    <div className="bg-pavilion-dark/95 backdrop-blur-xl border-t border-crease-line p-4 space-y-3">
      {/* Boundary out warning */}
      {boundaryOutEnabled && (
        <div className="flex items-center justify-center gap-2 text-[10px] text-wicket-red font-mono">
          <AlertTriangle size={12} />
          BOUNDARY OUT ACTIVE — Hit 6 = OUT
        </div>
      )}

      {/* Run buttons */}
      <div className="grid grid-cols-6 gap-2">
        {runButtons.map(({ value, label, color }) => (
          <button
            key={value}
            onClick={() => onScore(value)}
            disabled={disabled}
            className={cn(
              'w-full aspect-square rounded-2xl border-2 flex items-center justify-center',
              'font-barlow font-black text-2xl transition-all duration-200 active:scale-90',
              'disabled:opacity-30 disabled:cursor-not-allowed',
              color
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Extras row */}
      <div className="grid grid-cols-5 gap-2">
        <button
          onClick={() => onScore(0, 'offside_wide')}
          disabled={disabled}
          className="py-3 rounded-xl border border-gold-bail/30 text-gold-bail text-xs font-semibold hover:bg-gold-bail/10 transition-all active:scale-95 disabled:opacity-30"
        >
          WD OFF
        </button>
        <button
          onClick={() => onScore(1, 'legside_wide')}
          disabled={disabled}
          className="py-3 rounded-xl border border-gold-bail/30 text-gold-bail text-xs font-semibold hover:bg-gold-bail/10 transition-all active:scale-95 disabled:opacity-30"
        >
          WD LEG
        </button>
        <button
          onClick={() => onScore(0, 'no_ball')}
          disabled={disabled}
          className="py-3 rounded-xl border border-gold-bail/30 text-gold-bail text-xs font-semibold hover:bg-gold-bail/10 transition-all active:scale-95 disabled:opacity-30"
        >
          NO BALL
        </button>
        <button
          onClick={() => onScore(1, 'bye')}
          disabled={disabled}
          className="py-3 rounded-xl border border-crease-line text-muted-text text-xs font-semibold hover:bg-crease-line/30 transition-all active:scale-95 disabled:opacity-30"
        >
          BYE
        </button>
        <button
          onClick={() => onScore(1, 'leg_bye')}
          disabled={disabled}
          className="py-3 rounded-xl border border-crease-line text-muted-text text-xs font-semibold hover:bg-crease-line/30 transition-all active:scale-95 disabled:opacity-30"
        >
          LEG BYE
        </button>
      </div>

      {/* Wicket + Undo row */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={onWicket}
          disabled={disabled}
          className="col-span-3 py-4 rounded-2xl bg-wicket-red/10 border-2 border-wicket-red text-wicket-red font-barlow font-bold text-xl hover:bg-wicket-red hover:text-white transition-all active:scale-95 disabled:opacity-30"
        >
          🔴 WICKET
        </button>
        <button
          onClick={onUndo}
          disabled={disabled}
          className="py-4 rounded-2xl border border-crease-line text-muted-text hover:text-off-white hover:border-off-white/50 transition-all active:scale-95 disabled:opacity-30"
        >
          <Undo2 size={20} className="mx-auto" />
        </button>
      </div>
    </div>
  );
}
