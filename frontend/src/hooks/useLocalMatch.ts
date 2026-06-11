import { useState, useCallback, useEffect } from 'react';
import type { Match } from '@/types/match';
import type { DeliveryPayload } from '@/types/scoring';

const STORAGE_KEY = 'gully_local_match';

/**
 * Hook for offline/guest scoring using localStorage.
 * Mirrors the backend scoring engine logic client-side.
 */
export function useLocalMatch() {
  const [match, setMatch] = useState<Match | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Persist to localStorage
  useEffect(() => {
    if (match) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(match));
    }
  }, [match]);

  const clearMatch = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setMatch(null);
  }, []);

  const processLocalBall = useCallback((delivery: DeliveryPayload) => {
    if (!match) return;

    setMatch((prev) => {
      if (!prev) return prev;
      const updated = { ...prev };
      const innings = { ...updated.innings[delivery.inningsIndex] };
      const rules = updated.rules;
      const extras = delivery.extras || { type: 'none' as const, runs: 0 };

      let legalBall = true;
      let runsScored = delivery.runs;

      // Wide logic
      if (extras.type === 'offside_wide') {
        runsScored = rules.offsideWide?.runs ?? 0;
        legalBall = false;
        innings.extras.wides += runsScored;
      }
      if (extras.type === 'legside_wide') {
        runsScored = rules.legsideWide?.runs ?? 1;
        legalBall = false;
        innings.extras.wides += runsScored;
      }
      if (extras.type === 'no_ball') {
        runsScored = delivery.runs + (rules.noBall?.runs ?? 1);
        legalBall = false;
        innings.extras.noBalls += (rules.noBall?.runs ?? 1);
      }
      if (extras.type === 'bye') {
        innings.extras.byes += delivery.runs;
      }
      if (extras.type === 'leg_bye') {
        innings.extras.legByes += delivery.runs;
      }

      // Boundary out
      let isWicket = delivery.isWicket;
      let wicket = delivery.wicket;
      if (rules.boundaryOut && delivery.runs === 6 && extras.type === 'none') {
        isWicket = true;
        wicket = { type: 'boundary_out', dismissedPlayerId: delivery.batsmanId };
      }

      innings.totalRuns += runsScored;
      if (isWicket) innings.totalWickets += 1;
      if (legalBall) {
        innings.totalBalls += 1;
        innings.totalOvers = parseFloat(
          Math.floor(innings.totalBalls / 6) + '.' + (innings.totalBalls % 6)
        );
      }

      innings.balls = [...innings.balls, {
        overNumber: Math.floor((innings.totalBalls - (legalBall ? 1 : 0)) / 6),
        ballNumber: legalBall ? ((innings.totalBalls - 1) % 6) + 1 : 0,
        batsmanId: delivery.batsmanId,
        bowlerId: delivery.bowlerId,
        runs: runsScored,
        extras,
        isWicket,
        wicket,
        commentary: '',
        isLegal: legalBall,
        isUndone: false,
      }];

      updated.innings[delivery.inningsIndex] = innings;
      return updated;
    });
  }, [match]);

  return { match, setMatch, clearMatch, processLocalBall };
}
