// src/stats/stats.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Room, GameState } from '../entities/room.entity';
import { Player } from '../entities/player.entity';
import { GameSession } from '../entities/game-session.entity';
import { WordSubmission } from '../entities/word-submission.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { RoomStatsDto, GameStatsDto, PlayerStatsDto } from '../dto/room-stats.dto';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(Player)
    private playerRepository: Repository<Player>,
    @InjectRepository(GameSession)
    private gameSessionRepository: Repository<GameSession>,
    @InjectRepository(WordSubmission)
    private wordSubmissionRepository: Repository<WordSubmission>,
    @InjectRepository(ChatMessage)
    private chatMessageRepository: Repository<ChatMessage>,
  ) {}

  async getRoomStats(): Promise<RoomStatsDto> {
    const totalRooms = await this.roomRepository.count();
    const activeRooms = await this.roomRepository.count({ where: { isActive: true } });
    const totalPlayers = await this.playerRepository.count();
    
    const roomsByState = await this.roomRepository
      .createQueryBuilder('room')
      .select('room.gameState', 'state')
      .addSelect('COUNT(*)', 'count')
      .where('room.isActive = :active', { active: true })
      .groupBy('room.gameState')
      .getRawMany();

    const stateStats = {
      waiting: 0,
      playing: 0,
      finished: 0,
    };

    roomsByState.forEach(stat => {
      stateStats[stat.state] = parseInt(stat.count);
    });

    return {
      totalRooms,
      activeRooms,
      totalPlayers,
      averagePlayersPerRoom: activeRooms > 0 ? Math.round(totalPlayers / activeRooms * 100) / 100 : 0,
      roomsByState: stateStats,
    };
  }

  async getGameStats(): Promise<GameStatsDto> {
    const totalGames = await this.gameSessionRepository.count();
    const completedGames = await this.gameSessionRepository.count({
      where: { finishedAt: Between(new Date(0), new Date()) }
    });

    // Duración promedio de juegos completados
    const avgDurationResult = await this.gameSessionRepository
      .createQueryBuilder('session')
      .select('AVG(session.gameDuration)', 'avgDuration')
      .where('session.finishedAt IS NOT NULL')
      .getRawOne();

    const averageGameDuration = avgDurationResult?.avgDuration ? 
      Math.round(parseFloat(avgDurationResult.avgDuration)) : 0;

    // Total de palabras enviadas
    const totalWordsSubmitted = await this.wordSubmissionRepository.count();

    // Promedio de palabras por juego
    const averageWordsPerGame = completedGames > 0 ? 
      Math.round(totalWordsSubmitted / completedGames * 100) / 100 : 0;

    // Palabras más usadas
    const mostUsedWordsResult = await this.wordSubmissionRepository
      .createQueryBuilder('submission')
      .select('submission.word', 'word')
      .addSelect('COUNT(*)', 'count')
      .where('submission.isValid = :valid', { valid: true })
      .andWhere('submission.word != :timeout', { timeout: '[TIMEOUT]' })
      .groupBy('submission.word')
      .orderBy('COUNT(*)', 'DESC')
      .limit(10)
      .getRawMany();

    const mostUsedWords = mostUsedWordsResult.map(item => ({
      word: item.word,
      count: parseInt(item.count)
    }));

    // Estadísticas por número de jugadores
    const winRateByPlayerCountResult = await this.gameSessionRepository
      .createQueryBuilder('session')
      .select('session.totalPlayers', 'playerCount')
      .addSelect('AVG(session.gameDuration)', 'avgDuration')
      .addSelect('COUNT(*)', 'totalGames')
      .where('session.finishedAt IS NOT NULL')
      .groupBy('session.totalPlayers')
      .orderBy('session.totalPlayers', 'ASC')
      .getRawMany();

    const winRateByPlayerCount = winRateByPlayerCountResult.map(item => ({
      playerCount: parseInt(item.playerCount),
      averageDuration: item.avgDuration ? Math.round(parseFloat(item.avgDuration)) : 0,
      totalGames: parseInt(item.totalGames)
    }));

    return {
      totalGames,
      completedGames,
      averageGameDuration,
      totalWordsSubmitted,
      averageWordsPerGame,
      mostUsedWords,
      winRateByPlayerCount,
    };
  }

  async getPlayerStats(): Promise<PlayerStatsDto> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const totalPlayersToday = await this.playerRepository.count({
      where: { createdAt: Between(today, now) }
    });

    const totalPlayersThisWeek = await this.playerRepository.count({
      where: { createdAt: Between(weekAgo, now) }
    });

    const totalPlayersThisMonth = await this.playerRepository.count({
      where: { createdAt: Between(monthAgo, now) }
    });

    // Duración promedio de sesión (estimada por tiempo de conexión)
    const avgSessionResult = await this.playerRepository
      .createQueryBuilder('player')
      .select('AVG(TIMESTAMPDIFF(MINUTE, player.createdAt, player.updatedAt))', 'avgSession')
      .where('player.updatedAt > player.createdAt')
      .getRawOne();

    const averageSessionDuration = avgSessionResult?.avgSession ? 
      Math.round(parseFloat(avgSessionResult.avgSession)) : 0;

    // Pico de jugadores concurrentes (estimado por salas activas)
    const activePlayersResult = await this.playerRepository
      .createQueryBuilder('player')
      .innerJoin('player.room', 'room')
      .select('COUNT(*)', 'count')
      .where('room.isActive = :active', { active: true })
      .getRawOne();

    const peakConcurrentPlayers = activePlayersResult?.count ? 
      parseInt(activePlayersResult.count) : 0;

    // Tasa de retención (jugadores que han jugado más de una partida)
    const totalUniquePlayersResult = await this.playerRepository
      .createQueryBuilder('player')
      .select('COUNT(DISTINCT player.id)', 'count')
      .getRawOne();

    const returningPlayersResult = await this.playerRepository
      .createQueryBuilder('player')
      .select('COUNT(DISTINCT player.id)', 'count')
      .innerJoin('player.room', 'room')
      .innerJoin('room.gameSessions', 'session')
      .having('COUNT(session.id) > 1')
      .getRawOne();

    const totalUniquePlayers = totalUniquePlayersResult?.count ? 
      parseInt(totalUniquePlayersResult.count) : 0;
    const returningPlayers = returningPlayersResult?.count ? 
      parseInt(returningPlayersResult.count) : 0;

    const playerRetentionRate = totalUniquePlayers > 0 ? 
      Math.round(returningPlayers / totalUniquePlayers * 100) / 100 : 0;

    return {
      totalPlayersToday,
      totalPlayersThisWeek,
      totalPlayersThisMonth,
      averageSessionDuration,
      peakConcurrentPlayers,
      playerRetentionRate,
    };
  }

  async getWordStats(limit: number = 20) {
    const validWords = await this.wordSubmissionRepository
      .createQueryBuilder('submission')
      .select('submission.word', 'word')
      .addSelect('COUNT(*)', 'usage_count')
      .addSelect('AVG(submission.timeTaken)', 'avg_time')
      .where('submission.isValid = :valid', { valid: true })
      .andWhere('submission.word != :timeout', { timeout: '[TIMEOUT]' })
      .groupBy('submission.word')
      .orderBy('COUNT(*)', 'DESC')
      .limit(limit)
      .getRawMany();

    const invalidWords = await this.wordSubmissionRepository
      .createQueryBuilder('submission')
      .select('submission.word', 'word')
      .addSelect('COUNT(*)', 'usage_count')
      .where('submission.isValid = :valid', { valid: false })
      .andWhere('submission.word != :timeout', { timeout: '[TIMEOUT]' })
      .groupBy('submission.word')
      .orderBy('COUNT(*)', 'DESC')
      .limit(limit)
      .getRawMany();

    return {
      validWords: validWords.map(item => ({
        word: item.word,
        usageCount: parseInt(item.usage_count),
        avgTime: item.avg_time ? Math.round(parseFloat(item.avg_time) * 100) / 100 : 0
      })),
      invalidWords: invalidWords.map(item => ({
        word: item.word,
        usageCount: parseInt(item.usage_count)
      }))
    };
  }

  async getBombIndicesStats(limit: number = 20) {
    const bombStats = await this.wordSubmissionRepository
      .createQueryBuilder('submission')
      .select('submission.bombIndices', 'indices')
      .addSelect('COUNT(*)', 'total_attempts')
      .addSelect('SUM(CASE WHEN submission.isValid = 1 THEN 1 ELSE 0 END)', 'valid_attempts')
      .addSelect('AVG(submission.timeTaken)', 'avg_time')
      .where('submission.bombIndices IS NOT NULL')
      .groupBy('submission.bombIndices')
      .orderBy('COUNT(*)', 'DESC')
      .limit(limit)
      .getRawMany();

    return bombStats.map(item => ({
      indices: item.indices,
      totalAttempts: parseInt(item.total_attempts),
      validAttempts: parseInt(item.valid_attempts || '0'),
      successRate: item.total_attempts > 0 ? 
        Math.round((parseInt(item.valid_attempts || '0') / parseInt(item.total_attempts)) * 100) / 100 : 0,
      avgTime: item.avg_time ? Math.round(parseFloat(item.avg_time) * 100) / 100 : 0
    }));
  }

  async getDailyStats(days: number = 7) {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const dailyGames = await this.gameSessionRepository
      .createQueryBuilder('session')
      .select('DATE(session.startedAt)', 'date')
      .addSelect('COUNT(*)', 'games_started')
      .addSelect('SUM(CASE WHEN session.finishedAt IS NOT NULL THEN 1 ELSE 0 END)', 'games_completed')
      .addSelect('AVG(session.totalPlayers)', 'avg_players')
      .where('session.startedAt BETWEEN :start AND :end', { start: startDate, end: endDate })
      .groupBy('DATE(session.startedAt)')
      .orderBy('DATE(session.startedAt)', 'ASC')
      .getRawMany();

    return dailyGames.map(item => ({
      date: item.date,
      gamesStarted: parseInt(item.games_started),
      gamesCompleted: parseInt(item.games_completed || '0'),
      avgPlayers: item.avg_players ? Math.round(parseFloat(item.avg_players) * 100) / 100 : 0
    }));
  }
}
