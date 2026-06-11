export interface Player {
  _id: string;
  userId?: string;
  name: string;
  nickname: string;
  avatar: string;
  role: 'batsman' | 'bowler' | 'allrounder';
  battingStyle: 'right' | 'left';
  bowlingStyle: 'fast' | 'medium' | 'spin' | 'none';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlayerPayload {
  name: string;
  nickname?: string;
  avatar?: string;
  role?: Player['role'];
  battingStyle?: Player['battingStyle'];
  bowlingStyle?: Player['bowlingStyle'];
}

export interface PlayerBattingStats {
  runs: number;
  ballsFaced: number;
  average: string;
  strikeRate: string;
  highestScore: number;
  fifties: number;
  fours: number;
  sixes: number;
}

export interface PlayerBowlingStats {
  wickets: number;
  ballsBowled: number;
  runsConceded: number;
  average: string;
  economyRate: string;
}

export interface PlayerStats {
  player: Player;
  stats: {
    matches: number;
    batting: PlayerBattingStats;
    bowling: PlayerBowlingStats;
  };
}
