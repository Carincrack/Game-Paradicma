import { Injectable } from '@nestjs/common';
import { RoomService } from '../room/room.service';
import { WordService } from '../word/word.service';
import { GameState } from '../interfaces/game.interface';

@Injectable()
export class GameService {
  constructor(
    private roomService: RoomService,
    private wordService: WordService,
  ) {}

  createRoom(hostId: string, hostName: string) {
    return this.roomService.createRoom(hostId, hostName);
  }

  joinRoom(code: string, playerId: string, playerName: string) {
    const room = this.roomService.findRoomByCode(code);
    
    if (!room) {
      return { success: false, error: 'ROOM_NOT_FOUND' };
    }

    if (room.players.length >= room.maxPlayers) {
      return { success: false, error: 'ROOM_FULL' };
    }

    const player = this.roomService.addPlayerToRoom(room.id, playerId, playerName);
    
    if (!player) {
      return { success: false, error: 'FAILED_TO_JOIN' };
    }

    return { success: true, room, player };
  }

  startGame(roomId: string, hostId: string) {
    const room = this.roomService.getRoom(roomId);
    
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

    const started = this.roomService.startGame(roomId);
    if (!started) {
      return { success: false, error: 'FAILED_TO_START' };
    }

    // Generar primera bomba
    const bombIndices = this.wordService.getRandomBombIndices();
    room.currentBomb = bombIndices;

    return { success: true, room, bombIndices };
  }

  handlePlayerTyping(roomId: string, playerId: string, word: string) {
    const room = this.roomService.getRoom(roomId);
    if (!room || room.gameState !== GameState.PLAYING) {
      return { success: false, error: 'INVALID_GAME_STATE' };
    }

    const player = room.players.find(p => p.id === playerId);
    if (!player || !player.isAlive) {
      return { success: false, error: 'PLAYER_NOT_FOUND_OR_ELIMINATED' };
    }

    // Actualizar palabra actual del jugador
    this.roomService.updatePlayerWord(roomId, playerId, word);

    // Verificar si la palabra contiene los indices de la bomba
    const hasValidIndices = this.wordService.checkWordProgress(word, room.currentBomb);

    return {
      success: true,
      playerId,
      word,
      hasValidIndices
    };
  }

  submitWord(roomId: string, playerId: string, word: string) {
    const room = this.roomService.getRoom(roomId);
    if (!room || room.gameState !== GameState.PLAYING) {
      return { success: false, error: 'INVALID_GAME_STATE' };
    }

    const currentPlayer = this.roomService.getCurrentPlayer(roomId);
    if (!currentPlayer || currentPlayer.id !== playerId) {
      return { success: false, error: 'NOT_YOUR_TURN' };
    }

    // Validar palabra
    const isValid = this.wordService.validateWord(word, room.currentBomb);
    
    if (isValid) {
      // Palabra válida - jugador pasa el turno
      this.roomService.submitWord(roomId, playerId, word);
      
      // Cambiar turno
      const nextPlayerId = this.roomService.nextTurn(roomId);
      
      // Generar nueva bomba
      const newBombIndices = this.wordService.getRandomBombIndices();
      room.currentBomb = newBombIndices;

      // Verificar si el juego terminó
      const winner = this.roomService.getWinner(roomId);
      
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
      const eliminatedPlayer = this.roomService.eliminatePlayer(roomId, playerId);
      
      if (eliminatedPlayer && eliminatedPlayer.lives <= 0) {
        // Jugador eliminado
        const winner = this.roomService.getWinner(roomId);
        
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
          const nextPlayerId = this.roomService.nextTurn(roomId);
          const newBombIndices = this.wordService.getRandomBombIndices();
          room.currentBomb = newBombIndices;
          
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
  }

  handleTimeUp(roomId: string) {
    const room = this.roomService.getRoom(roomId);
    if (!room || room.gameState !== GameState.PLAYING) {
      return { success: false, error: 'INVALID_GAME_STATE' };
    }

    const currentPlayer = this.roomService.getCurrentPlayer(roomId);
    if (!currentPlayer) {
      return { success: false, error: 'NO_CURRENT_PLAYER' };
    }

    // El tiempo se agotó - jugador pierde vida
    const eliminatedPlayer = this.roomService.eliminatePlayer(roomId, currentPlayer.id);
    
    if (eliminatedPlayer && eliminatedPlayer.lives <= 0) {
      // Jugador eliminado
      const winner = this.roomService.getWinner(roomId);
      
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
    const nextPlayerId = this.roomService.nextTurn(roomId);
    const newBombIndices = this.wordService.getRandomBombIndices();
    room.currentBomb = newBombIndices;

    return {
      success: true,
      timeUp: true,
      eliminatedPlayer,
      nextPlayerId,
      newBombIndices,
      gameFinished: false
    };
  }

  returnToLobby(roomId: string, playerId: string) {
    const room = this.roomService.getRoom(roomId);
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

    const reset = this.roomService.resetRoomToLobby(roomId);
    if (!reset) {
      return { success: false, error: 'FAILED_TO_RESET' };
    }

    return { success: true, room };
  }

  leaveRoom(playerId: string) {
    const room = this.roomService.findRoomByPlayerId(playerId);
    if (!room) {
      return { success: false, error: 'PLAYER_NOT_IN_ROOM' };
    }

    const removed = this.roomService.removePlayerFromRoom(room.id, playerId);
    return { success: removed, room: removed ? room : null };
  }

  getRoomByPlayerId(playerId: string) {
    return this.roomService.findRoomByPlayerId(playerId);
  }

  getRoom(roomId: string) {
    return this.roomService.getRoom(roomId);
  }
}