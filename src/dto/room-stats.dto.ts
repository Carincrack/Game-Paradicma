export class RoomStatsDto {
  totalRooms: number;
  activeRooms: number;
  totalPlayers: number;
  averagePlayersPerRoom: number;
  roomsByState: {
    waiting: number;
    playing: number;
    finished: number;
  };
}


export class GameStatsDto {
  totalGames: number;
  completedGames: number;
  averageGameDuration: number;
  totalWordsSubmitted: number;
  averageWordsPerGame: number;
  mostUsedWords: Array<{
    word: string;
    count: number;
  }>;
  winRateByPlayerCount: Array<{
    playerCount: number;
    averageDuration: number;
    totalGames: number;
  }>;
}

export class PlayerStatsDto {
  totalPlayersToday: number;
  totalPlayersThisWeek: number;
  totalPlayersThisMonth: number;
  averageSessionDuration: number;
  peakConcurrentPlayers: number;
  playerRetentionRate: number;
}