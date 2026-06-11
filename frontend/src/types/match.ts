export type ExtraType = 'none' | 'offside_wide' | 'legside_wide' | 'no_ball' | 'bye' | 'leg_bye';
export type WicketType = 'bowled' | 'caught' | 'run_out' | 'hit_wicket' | 'boundary_out' | 'retired';

export interface MatchRules {
  offsideWide: { runs: number; rebowl: boolean };
  legsideWide: { runs: number; rebowl: boolean };
  boundaryOut: boolean;
  noBall: { runs: number; freehit: boolean };
  maxBoundaryOuts: number | null;
}

export interface TossResult {
  winner: 'teamA' | 'teamB';
  decision: 'bat' | 'field';
}

export interface Wicket {
  type: WicketType;
  dismissedPlayerId: string;
  fielderId?: string;
}

export interface Ball {
  _id?: string;
  overNumber: number;
  ballNumber: number;
  batsmanId: string;
  bowlerId: string;
  runs: number;
  extras: {
    type: ExtraType;
    runs: number;
  };
  isWicket: boolean;
  wicket?: Wicket;
  commentary: string;
  isLegal: boolean;
  isUndone: boolean;
}

export interface InningsExtras {
  wides: number;
  noBalls: number;
  byes: number;
  legByes: number;
}

export interface Innings {
  _id?: string;
  battingTeam: 'teamA' | 'teamB';
  bowlingTeam: 'teamA' | 'teamB';
  balls: Ball[];
  totalRuns: number;
  totalWickets: number;
  totalBalls: number;
  totalOvers: number;
  extras: InningsExtras;
  completed: boolean;
  result: string;
}

export interface TeamInfo {
  teamId?: string;
  name: string;
  color: string;
  players: string[];
}

export interface MatchResult {
  winner: 'teamA' | 'teamB' | 'tie' | 'no_result';
  margin: string;
  playerOfMatch?: string;
  summary?: string;
}

export interface Match {
  _id: string;
  userId?: string;
  sessionToken?: string;
  teamA: TeamInfo;
  teamB: TeamInfo;
  totalOvers: number;
  venue: string;
  matchDate: string;
  rules: MatchRules;
  toss: TossResult;
  innings: Innings[];
  status: 'setup' | 'toss' | 'innings1' | 'innings2' | 'completed';
  result: MatchResult;
  createdAt: string;
  updatedAt: string;
}

export interface MatchMeta {
  target: number;
  runsRequired: number;
  ballsRemaining: number;
  rrr: string;
  crr: string;
}

export interface MatchListItem {
  _id: string;
  teamA: { name: string; color: string };
  teamB: { name: string; color: string };
  totalOvers: number;
  status: Match['status'];
  result: MatchResult;
  matchDate: string;
  createdAt: string;
}
