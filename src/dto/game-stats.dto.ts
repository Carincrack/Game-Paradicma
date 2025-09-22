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