// src/game/game.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomService } from '../room/room.service';
import { WordService } from '../word/word.service';
import { WordSubmission } from '../entities/word-submission.entity';
import { GameState } from '../entities/room.entity';

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);

  constructor(
    private roomService: RoomService,
    private wordService: WordService,
    @InjectRepository(WordSubmission)
    private wordSubmissionRepository: Repository<WordSubmission>,
  ) {}

  async createRoom(hostId: string, hostName: string) {
    try {
      return await this.roomService.createRoom(hostId, hostName);
    } catch (error) {
      this.logger.error(`Error creating room: ${error.message}`, error.stack);
      throw error;
    }
  }

  async joinRoom(code: string, playerId: string, playerName: string) {
    try {
      const room = await this.roomService.findRoomByCode(code);
      
      if (!room) {
        return { success: false, error: 'ROOM_NOT_FOUND' };
      }

      if (room.players.length >= room.maxPlayers) {
        return { success: false, error: 'ROOM_FULL' };
      }

      const player = await this.roomService.addPlayerToRoom(room.id, playerId, playerName);
      
      if (!player) {
        return { success: false, error: 'FAILED_TO_JOIN' };
      }

      // Obtener sala actualizada
      const updatedRoom = await this.roomService.getRoom(room.id);

      return { success: true, room: updatedRoom, player };
    } catch (error) {
      this.logger.error(`Error joining room: ${error.message}`, error.stack);
      return { success: false, error: 'FAILED_TO_JOIN' };
    }
  }

  // src/game/game.service.ts - ACTUALIZACIÓN del método startGame
async startGame(roomId: string, hostId: string) {
  try {
    const room = await this.roomService.getRoom(roomId);
    
    if (!room) {
      return { success: false, error: 'ROOM_NOT_FOUND' };
    }

    const host = room.players.find(p => p.id === hostId && p.isHost);
    if (!host) {
      return { success: false, error: 'NOT_HOST' };
    }

    if (room.players.length < 2) {
      return { success: false, error: 'NOT_ENOUGH_PLAYERS' };
    }

    const started = await this.roomService.startGame(roomId);
    if (!started) {
      return { success: false, error: 'FAILED_TO_START' };
    }

    // ¡IMPORTANTE! Recargar la sala después de startGame para obtener turnOrder actualizado
    const updatedRoom = await this.roomService.getRoom(roomId);
    if (!updatedRoom || !updatedRoom.turnOrder || updatedRoom.turnOrder.length === 0) {
      return { success: false, error: 'TURN_ORDER_NOT_SET' };
    }

    // Generar primera bomba
    const bombIndices = this.wordService.getRandomBombIndices();
    
    // Obtener el primer jugador del turnOrder
    const firstPlayerId = updatedRoom.turnOrder[0];

    return { 
      success: true, 
      room: updatedRoom, 
      bombIndices,
      firstPlayerId // ← Nuevo campo para el gateway
    };
  } catch (error) {
    this.logger.error(`Error starting game: ${error.message}`, error.stack);
    return { success: false, error: 'FAILED_TO_START' };
  }
}

  async handlePlayerTyping(roomId: string, playerId: string, word: string) {
    try {
      const room = await this.roomService.getRoom(roomId);
      if (!room || room.gameState !== GameState.PLAYING) {
        return { success: false, error: 'INVALID_GAME_STATE' };
      }

      const player = room.players.find(p => p.id === playerId);
      if (!player || !player.isAlive) {
        return { success: false, error: 'PLAYER_NOT_FOUND_OR_ELIMINATED' };
      }

      // Actualizar palabra actual del jugador
      await this.roomService.updatePlayerWord(roomId, playerId, word);

      // Verificar si la palabra contiene los indices de la bomba
      const hasValidIndices = this.wordService.checkWordProgress(word, room.currentBomb);

      return {
        success: true,
        playerId,
        word,
        hasValidIndices
      };
    } catch (error) {
      this.logger.error(`Error handling player typing: ${error.message}`, error.stack);
      return { success: false, error: 'TYPING_ERROR' };
    }
  }

  async submitWord(roomId: string, playerId: string, word: string) {
    const startTime = Date.now();
    
    try {
      const room = await this.roomService.getRoom(roomId);
      if (!room || room.gameState !== GameState.PLAYING) {
        return { success: false, error: 'INVALID_GAME_STATE' };
      }

      const currentPlayer = await this.roomService.getCurrentPlayer(roomId);
      if (!currentPlayer || currentPlayer.id !== playerId) {
        return { success: false, error: 'NOT_YOUR_TURN' };
      }

      // Validar palabra
      const isValid = this.wordService.validateWord(word, room.currentBomb);
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);

      // Guardar estadística de palabra
      await this.recordWordSubmission(roomId, playerId, currentPlayer.name, word, room.currentBomb, isValid, timeTaken);
      
      if (isValid) {
        // Palabra válida - jugador pasa el turno
        await this.roomService.submitWord(roomId, playerId, word);
        
        // Cambiar turno
        const nextPlayerId = await this.roomService.nextTurn(roomId);
        
        // Generar nueva bomba
        const newBombIndices = this.wordService.getRandomBombIndices();
        
        // Verificar si el juego terminó
        const winner = await this.roomService.getWinner(roomId);
        
        return {
          success: true,
          isValid: true,
          word,
          playerId,
          nextPlayerId,
          newBombIndices,
          winner,
          gameFinished: !!winner
        };
      } else {
        // Palabra inválida - jugador pierde vida
        const eliminatedPlayer = await this.roomService.eliminatePlayer(roomId, playerId);
        
        if (eliminatedPlayer && eliminatedPlayer.lives <= 0) {
          // Jugador eliminado
          const winner = await this.roomService.getWinner(roomId);
          
          if (winner) {
            // Juego terminado
            return {
              success: true,
              isValid: false,
              word,
              playerId,
              eliminatedPlayer,
              winner,
              gameFinished: true
            };
          } else {
            // Continuar con el siguiente turno
            const nextPlayerId = await this.roomService.nextTurn(roomId);
            const newBombIndices = this.wordService.getRandomBombIndices();
            
            return {
              success: true,
              isValid: false,
              word,
              playerId,
              eliminatedPlayer,
              nextPlayerId,
              newBombIndices,
              gameFinished: false
            };
          }
        } else {
          // Jugador perdió vida pero sigue vivo, continuar turno
          return {
            success: true,
            isValid: false,
            word,
            playerId,
            eliminatedPlayer,
            gameFinished: false
          };
        }
      }
    } catch (error) {
      this.logger.error(`Error submitting word: ${error.message}`, error.stack);
      return { success: false, error: 'SUBMIT_ERROR' };
    }
  }

  async handleTimeUp(roomId: string) {
    try {
      const room = await this.roomService.getRoom(roomId);
      if (!room || room.gameState !== GameState.PLAYING) {
        return { success: false, error: 'INVALID_GAME_STATE' };
      }

      const currentPlayer = await this.roomService.getCurrentPlayer(roomId);
      if (!currentPlayer) {
        return { success: false, error: 'NO_CURRENT_PLAYER' };
      }

      // Registrar timeout
      await this.recordWordSubmission(roomId, currentPlayer.id, currentPlayer.name, '[TIMEOUT]', room.currentBomb, false, 15);

      // El tiempo se agotó - jugador pierde vida
      const eliminatedPlayer = await this.roomService.eliminatePlayer(roomId, currentPlayer.id);
      
      if (eliminatedPlayer && eliminatedPlayer.lives <= 0) {
        // Jugador eliminado
        const winner = await this.roomService.getWinner(roomId);
        
        if (winner) {
          // Juego terminado
          return {
            success: true,
            timeUp: true,
            eliminatedPlayer,
            winner,
            gameFinished: true
          };
        }
      }

      // Continuar con el siguiente turno
      const nextPlayerId = await this.roomService.nextTurn(roomId);
      const newBombIndices = this.wordService.getRandomBombIndices();

      return {
        success: true,
        timeUp: true,
        eliminatedPlayer,
        nextPlayerId,
        newBombIndices,
        gameFinished: false
      };
    } catch (error) {
      this.logger.error(`Error handling time up: ${error.message}`, error.stack);
      return { success: false, error: 'TIME_UP_ERROR' };
    }
  }

  async returnToLobby(roomId: string, playerId: string) {
    try {
      const room = await this.roomService.getRoom(roomId);
      if (!room) {
        return { success: false, error: 'ROOM_NOT_FOUND' };
      }

      const player = room.players.find(p => p.id === playerId);
      if (!player) {
        return { success: false, error: 'PLAYER_NOT_FOUND' };
      }

      // Solo el host puede regresar al lobby
      if (!player.isHost) {
        return { success: false, error: 'NOT_HOST' };
      }

      const reset = await this.roomService.resetRoomToLobby(roomId);
      if (!reset) {
        return { success: false, error: 'FAILED_TO_RESET' };
      }

      const updatedRoom = await this.roomService.getRoom(roomId);
      return { success: true, room: updatedRoom };
    } catch (error) {
      this.logger.error(`Error returning to lobby: ${error.message}`, error.stack);
      return { success: false, error: 'LOBBY_ERROR' };
    }
  }

  async leaveRoom(playerId: string) {
    try {
      const room = await this.roomService.findRoomByPlayerId(playerId);
      if (!room) {
        return { success: false, error: 'PLAYER_NOT_IN_ROOM' };
      }

      const removed = await this.roomService.removePlayerFromRoom(room.id, playerId);
      return { success: removed, room: removed ? room : null };
    } catch (error) {
      this.logger.error(`Error leaving room: ${error.message}`, error.stack);
      return { success: false, error: 'LEAVE_ERROR' };
    }
  }

  async getRoomByPlayerId(playerId: string) {
    try {
      return await this.roomService.findRoomByPlayerId(playerId);
    } catch (error) {
      this.logger.error(`Error getting room by player ID: ${error.message}`, error.stack);
      return null;
    }
  }

  async getRoom(roomId: string) {
    try {
      return await this.roomService.getRoom(roomId);
    } catch (error) {
      this.logger.error(`Error getting room: ${error.message}`, error.stack);
      return null;
    }
  }

  // Método privado para registrar estadísticas
  private async recordWordSubmission(
    roomId: string, 
    playerId: string, 
    playerName: string, 
    word: string, 
    bombIndices: string, 
    isValid: boolean, 
    timeTaken: number
  ) {
    try {
      const wordSubmission = this.wordSubmissionRepository.create({
        roomId,
        playerId,
        playerName,
        word,
        bombIndices,
        isValid,
        timeTaken,
        submissionTime: new Date(),
      });

      await this.wordSubmissionRepository.save(wordSubmission);
    } catch (error) {
      // No fallar el juego por errores de estadísticas
      this.logger.error(`Error recording word submission: ${error.message}`, error.stack);
    }
  }
}