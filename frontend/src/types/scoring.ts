import { ExtraType, WicketType, Innings, MatchMeta } from './match';

export interface DeliveryPayload {
  inningsIndex: 0 | 1;
  batsmanId: string;
  bowlerId: string;
  runs: number;
  extras: {
    type: ExtraType;
    runs: number;
  };
  isWicket: boolean;
  wicket?: {
    type: WicketType;
    dismissedPlayerId: string;
    fielderId?: string;
  };
}

export interface ScoringResponse {
  innings: Innings;
  matchStatus: string;
  result: {
    winner?: string;
    margin?: string;
  };
  meta: MatchMeta | null;
  commentary: string;
}
