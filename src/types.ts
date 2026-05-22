export interface GameData {
  gamePk: number;
  season: string;
  date: string;
  homeTeam: string;
  homeId: number;
  homeAbbr: string;
  homeScore: number | null;
  awayTeam: string;
  awayId: number;
  awayAbbr: string;
  awayScore: number | null;
  homeStarterId: number | null;
  homeStarterName: string | null;
  awayStarterId: number | null;
  awayStarterName: string | null;
}

export interface TeamStatsSeason {
  id: number;
  season: string;
  name: string;
  abbr: string;
  batting: {
    gamesPlayed?: number;
    runs?: number;
    hits?: number;
    doubles?: number;
    triples?: number;
    homeRuns?: number;
    strikeOuts?: number;
    baseOnBalls?: number;
    avg?: string;
    obp?: string;
    slg?: string;
    ops?: string;
  };
  pitching: {
    gamesPlayed?: number;
    era?: string;
    whip?: string;
    saves?: number;
    saveOpportunities?: number;
    blownSaves?: number;
    completeGames?: number;
    shutouts?: number;
    walksPer9Inn?: string;
    strikeoutsPer9Inn?: string;
    hitsPer9Inn?: string;
    homeRunsPer9?: string;
    strikeoutWalkRatio?: string;
    winPercentage?: string;
  };
  advancedPitching: {
    qualityStarts?: number;
    runsScoredPer9?: string;
    strikeoutsPerPlateAppearance?: string;
    walksPerPlateAppearance?: string;
  };
}

export interface PitcherStatsSeason {
  id: number;
  name: string;
  teamId: number;
  teamAbbr: string;
  season: string;
  pitchHand: string; // 'L' or 'R'
  era: number;
  whip: number;
  gamesStarted: number;
  gamesPitched: number;
  inningsPitched: string;
  strikeOuts: number;
  baseOnBalls: number;
}

export interface ModelMetrics {
  accuracy: number;
  totalTrainingGames: number;
  totalTestingGames: number;
  precision: number;
  recall: number;
  f1Score: number;
  featureImportances: { metric: string; importance: number }[];
  classificationReport: {
    awayWins: { precision: number; recall: number; f1: number; support: number };
    homeWins: { precision: number; recall: number; f1: number; support: number };
  };
}
