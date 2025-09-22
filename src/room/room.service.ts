// src/room/room.service.ts - CORRECCIONES DE ERRORES TS
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Room, GameState } from '../entities/room.entity';
import { Player } from '../entities/player.entity';
import { GameSession } from '../entities/game-session.entity';

@Injectable()
export class RoomService {
  private readonly logger = new Logger(RoomService.name);

  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(Player)
    private playerRepository: Repository<Player>,
    @InjectRepository(GameSession)
    private gameSessionRepository: Repository<GameSession>,
  ) {}

  async createRoom(hostId: string, hostName: string): Promise<Room> {
    const roomCode = await this.generateUniqueRoomCode();

    // Crear sala
    const room = this.roomRepository.create({
      code: roomCode,
      maxPlayers: 4,
      gameState: GameState.WAITING,
      currentTurn: 0,
      timeLeft: 15,
      turnOrder: [],
      usedWords: [],
      isActive: true,
      currentBomb: '', // ← CAMBIO: usar string vacío en lugar de null
    });

    const savedRoom = await this.roomRepository.save(room);

    // Crear jugador host
    const host = this.playerRepository.create({
      id: hostId,
      name: hostName,
      score: 0,
      isHost: true,
      currentWord: '',
      isAlive: true,
      lives: 3,
      roomId: savedRoom.id,
    });

    await this.playerRepository.save(host);

    // Retornar sala con jugadores - CORRECCIÓN: manejar posible null
    const roomWithPlayers = await this.getRoomWithPlayers(savedRoom.id);
    if (!roomWithPlayers) {
      throw new Error('Error al crear la sala con jugadores');
    }
    return roomWithPlayers;
  }

  async findRoomByCode(code: string): Promise<Room | null> {
    return await this.roomRepository.findOne({
      where: { code, isActive: true },
      relations: ['players'],
    });
  }

  async findRoomByPlayerId(playerId: string): Promise<Room | null> {
    const player = await this.playerRepository.findOne({
      where: { id: playerId },
      relations: ['room', 'room.players'],
    });

    return player?.room || null;
  }

  async addPlayerToRoom(roomId: string, playerId: string, playerName: string): Promise<Player | null> {
    try {
      const room = await this.getRoomWithPlayers(roomId);
      if (!room) return null;

      if (room.players.length >= room.maxPlayers) {
        return null;
      }

      // Verificar si el jugador ya existe
      const existingPlayer = room.players.find(p => p.id === playerId);
      if (existingPlayer) {
        return existingPlayer;
      }

      const newPlayer = this.playerRepository.create({
        id: playerId,
        name: playerName,
        score: 0,
        isHost: false,
        currentWord: '',
        isAlive: true,
        lives: 3,
        roomId,
      });

      return await this.playerRepository.save(newPlayer);
    } catch (error) {
      this.logger.error(`Error adding player to room: ${error.message}`, error.stack);
      return null;
    }
  }

  async removePlayerFromRoom(roomId: string, playerId: string): Promise<boolean> {
    try {
      const player = await this.playerRepository.findOne({
        where: { id: playerId, roomId },
      });

      if (!player) return false;

      await this.playerRepository.remove(player);

      // Si el host se va, asignar nuevo host
      if (player.isHost) {
        const remainingPlayers = await this.playerRepository.find({
          where: { roomId },
          order: { createdAt: 'ASC' },
        });

        if (remainingPlayers.length > 0) {
          remainingPlayers[0].isHost = true;
          await this.playerRepository.save(remainingPlayers[0]);
        }
      }

      // Si no quedan jugadores, marcar sala como inactiva
      const playerCount = await this.playerRepository.count({ where: { roomId } });
      if (playerCount === 0) {
        await this.roomRepository.update(roomId, { isActive: false });
      }

      return true;
    } catch (error) {
      this.logger.error(`Error removing player from room: ${error.message}`, error.stack);
      return false;
    }
  }

async startGame(roomId: string): Promise<boolean> {
  try {
    const room = await this.getRoomWithPlayers(roomId);
    if (!room || room.gameState !== GameState.WAITING || room.players.length < 2) {
      return false;
    }

    // Crear nueva sesión de juego
    const gameSession = this.gameSessionRepository.create({
      roomId,
      startedAt: new Date(),
      totalPlayers: room.players.length,
      totalWordsUsed: 0,
    });

    await this.gameSessionRepository.save(gameSession);

    // ¡AQUÍ ESTÁ LA CORRECCIÓN! 
    // Crear turnOrder con los IDs de los jugadores ACTIVOS
    const activePlayers = room.players.filter(p => p.isAlive);
    const turnOrder = activePlayers.map(p => p.id);

    // Actualizar sala CON el turnOrder correcto
    await this.roomRepository.update(roomId, {
      gameState: GameState.PLAYING,
      turnOrder: turnOrder,  // ← Esto es lo que faltaba
      currentTurn: 0,
      timeLeft: 15,
      usedWords: [],
    });

    // Resetear jugadores
    await this.playerRepository.update(
      { roomId },
      {
        score: 0,
        isAlive: true,
        lives: 3,
        currentWord: '',
      }
    );

    return true;
  } catch (error) {
    this.logger.error(`Error starting game: ${error.message}`, error.stack);
    return false;
  }
}


  async updatePlayerWord(roomId: string, playerId: string, word: string): Promise<boolean> {
    try {
      const result = await this.playerRepository.update(
        { id: playerId, roomId },
        { currentWord: word }
      );
      // CORRECCIÓN: manejar affected posiblemente undefined
      return (result.affected || 0) > 0;
    } catch (error) {
      this.logger.error(`Error updating player word: ${error.message}`, error.stack);
      return false;
    }
  }

  async submitWord(roomId: string, playerId: string, word: string): Promise<boolean> {
    try {
      const room = await this.getRoomWithPlayers(roomId);
      if (!room || room.gameState !== GameState.PLAYING) return false;

      const player = room.players.find(p => p.id === playerId);
      if (!player || !player.isAlive) return false;

      // Verificar turno
      const currentPlayerId = room.turnOrder[room.currentTurn];
      if (currentPlayerId !== playerId) return false;

      // Verificar palabra usada
      if (room.usedWords.includes(word.toLowerCase())) {
        return false;
      }

      // Actualizar palabras usadas
      const updatedUsedWords = [...room.usedWords, word.toLowerCase()];
      await this.roomRepository.update(roomId, { usedWords: updatedUsedWords });

      // Actualizar jugador
      await this.playerRepository.update(playerId, {
        score: player.score + 10,
        currentWord: '',
      });

      return true;
    } catch (error) {
      this.logger.error(`Error submitting word: ${error.message}`, error.stack);
      return false;
    }
  }

  async eliminatePlayer(roomId: string, playerId: string): Promise<Player | null> {
    try {
      const player = await this.playerRepository.findOne({
        where: { id: playerId, roomId },
      });

      if (!player) return null;

      const newLives = player.lives - 1;
      const isAlive = newLives > 0;

      await this.playerRepository.update(playerId, {
        lives: newLives,
        isAlive,
      });

      return await this.playerRepository.findOne({ where: { id: playerId } });
    } catch (error) {
      this.logger.error(`Error eliminating player: ${error.message}`, error.stack);
      return null;
    }
  }

  async nextTurn(roomId: string): Promise<string | null> {
    try {
      const room = await this.getRoomWithPlayers(roomId);
      if (!room) return null;

      const alivePlayers = room.players.filter(p => p.isAlive);
      if (alivePlayers.length <= 1) {
        await this.roomRepository.update(roomId, { gameState: GameState.FINISHED });
        return null;
      }

      let newCurrentTurn = room.currentTurn;
      do {
        newCurrentTurn = (newCurrentTurn + 1) % room.turnOrder.length;
      } while (!room.players.find(p => p.id === room.turnOrder[newCurrentTurn])?.isAlive);

      await this.roomRepository.update(roomId, {
        currentTurn: newCurrentTurn,
        timeLeft: 15,
      });

      return room.turnOrder[newCurrentTurn];
    } catch (error) {
      this.logger.error(`Error getting next turn: ${error.message}`, error.stack);
      return null;
    }
  }

  async getCurrentPlayer(roomId: string): Promise<Player | null> {
    try {
      const room = await this.getRoomWithPlayers(roomId);
      if (!room || room.gameState !== GameState.PLAYING) return null;

      const currentPlayerId = room.turnOrder[room.currentTurn];
      return room.players.find(p => p.id === currentPlayerId) || null;
    } catch (error) {
      this.logger.error(`Error getting current player: ${error.message}`, error.stack);
      return null;
    }
  }

  async getWinner(roomId: string): Promise<Player | null> {
    try {
      const room = await this.getRoomWithPlayers(roomId);
      if (!room) return null;

      const alivePlayers = room.players.filter(p => p.isAlive);
      
      if (alivePlayers.length === 1) {
        const winner = alivePlayers[0];
        
        // Actualizar sesión de juego
        const session = await this.gameSessionRepository.findOne({
          where: { roomId, finishedAt: IsNull() },
          order: { startedAt: 'DESC' },
        });

        if (session) {
          const finishedAt = new Date();
          const gameDuration = Math.floor((finishedAt.getTime() - session.startedAt.getTime()) / 1000);
          
          await this.gameSessionRepository.update(session.id, {
            finishedAt,
            winnerId: winner.id,
            winnerName: winner.name,
            gameDuration,
            finalScores: room.players,
          });
        }

        return winner;
      }
      
      return null;
    } catch (error) {
      this.logger.error(`Error getting winner: ${error.message}`, error.stack);
      return null;
    }
  }

  async resetRoomToLobby(roomId: string): Promise<boolean> {
    try {
      // CORRECCIÓN: usar string vacío en lugar de null
      await this.roomRepository.update(roomId, {
        gameState: GameState.WAITING,
        currentBomb: '', // ← CAMBIO: string vacío en lugar de null
        turnOrder: [],
        currentTurn: 0,
        timeLeft: 15,
        usedWords: [],
      });

      await this.playerRepository.update(
        { roomId },
        {
          score: 0,
          isAlive: true,
          lives: 3,
          currentWord: '',
        }
      );

      return true;
    } catch (error) {
      this.logger.error(`Error resetting room to lobby: ${error.message}`, error.stack);
      return false;
    }
  }

  async getRoom(roomId: string): Promise<Room | null> {
    return await this.getRoomWithPlayers(roomId);
  }

  async getAllActiveRooms(): Promise<Room[]> {
    return await this.roomRepository.find({
      where: { isActive: true },
      relations: ['players'],
    });
  }

  private async getRoomWithPlayers(roomId: string): Promise<Room | null> {
    return await this.roomRepository.findOne({
      where: { id: roomId, isActive: true },
      relations: ['players'],
    });
  }

  private async generateUniqueRoomCode(): Promise<string> {
    let code: string;
    let attempts = 0;
    const maxAttempts = 100;

    do {
      code = this.generateRoomCode();
      const existing = await this.roomRepository.findOne({ where: { code } });
      if (!existing) break;
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      throw new Error('Unable to generate unique room code');
    }

    return code;
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Método para limpiar salas inactivas
  async cleanupInactiveRooms(olderThanHours: number = 24): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - olderThanHours);

    const result = await this.roomRepository.update(
      {
        updatedAt: Not(cutoffDate),
        isActive: true,
      },
      { isActive: false }
    );

    // CORRECCIÓN: manejar affected posiblemente undefined
    return result.affected || 0;
  }
}