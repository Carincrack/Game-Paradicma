import { Injectable } from '@nestjs/common';
import { Room, Player, GameState } from '../interfaces/game.interface';

@Injectable()
export class RoomService {
  private rooms: Map<string, Room> = new Map();

  generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  createRoom(hostId: string, hostName: string): Room {
    const roomId = this.generateUniqueRoomId();
    const roomCode = this.generateUniqueRoomCode();

    const host: Player = {
      id: hostId,
      name: hostName,
      score: 0,
      isHost: true,
      currentWord: '',
      isAlive: true,
      lives: 3,
    };

    const room: Room = {
      id: roomId,
      code: roomCode,
      players: [host],
      maxPlayers: 4,
      gameState: GameState.WAITING,
      currentBomb: '',
      turnOrder: [],
      currentTurn: 0,
      timeLeft: 15,
      usedWords: [],
      bombTimer: null,
    };

    this.rooms.set(roomId, room);
    return room;
  }

  findRoomByCode(code: string): Room | null {
    for (const room of this.rooms.values()) {
      if (room.code === code) {
        return room;
      }
    }
    return null;
  }

  findRoomByPlayerId(playerId: string): Room | null {
    for (const room of this.rooms.values()) {
      if (room.players.some(player => player.id === playerId)) {
        return room;
      }
    }
    return null;
  }

  addPlayerToRoom(roomId: string, playerId: string, playerName: string): Player | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    if (room.players.length >= room.maxPlayers) {
      return null;
    }

    // Verificar si el jugador ya existe en la sala
    const existingPlayer = room.players.find(p => p.id === playerId);
    if (existingPlayer) {
      return existingPlayer;
    }

    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      score: 0,
      isHost: false,
      currentWord: '',
      isAlive: true,
      lives: 3,
    };

    room.players.push(newPlayer);
    return newPlayer;
  }

  removePlayerFromRoom(roomId: string, playerId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return false;

    const player = room.players[playerIndex];
    room.players.splice(playerIndex, 1);

    // Si el host se va, asignar un nuevo host
    if (player.isHost && room.players.length > 0) {
      room.players[0].isHost = true;
    }

    // Si no quedan jugadores, eliminar la sala
    if (room.players.length === 0) {
      this.rooms.delete(roomId);
    }

    return true;
  }

  startGame(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.gameState !== GameState.WAITING || room.players.length < 2) {
      return false;
    }

    room.gameState = GameState.PLAYING;
    room.turnOrder = room.players.map(p => p.id);
    room.currentTurn = 0;
    room.timeLeft = 15;
    room.usedWords = [];

    // Resetear stats de jugadores
    room.players.forEach(player => {
      player.score = 0;
      player.isAlive = true;
      player.lives = 3;
      player.currentWord = '';
    });

    return true;
  }

  updatePlayerWord(roomId: string, playerId: string, word: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return false;

    player.currentWord = word;
    return true;
  }

  submitWord(roomId: string, playerId: string, word: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.gameState !== GameState.PLAYING) return false;

    const player = room.players.find(p => p.id === playerId);
    if (!player || !player.isAlive) return false;

    // Verificar si es el turno del jugador
    const currentPlayerId = room.turnOrder[room.currentTurn];
    if (currentPlayerId !== playerId) return false;

    // Verificar si la palabra ya fue usada
    if (room.usedWords.includes(word.toLowerCase())) {
      return false;
    }

    room.usedWords.push(word.toLowerCase());
    player.score += 10;
    player.currentWord = '';

    return true;
  }

  eliminatePlayer(roomId: string, playerId: string): Player | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return null;

    player.lives--;
    if (player.lives <= 0) {
      player.isAlive = false;
    }

    return player;
  }

  nextTurn(roomId: string): string | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const alivePlayers = room.players.filter(p => p.isAlive);
    if (alivePlayers.length <= 1) {
      room.gameState = GameState.FINISHED;
      return null;
    }

    do {
      room.currentTurn = (room.currentTurn + 1) % room.turnOrder.length;
    } while (!room.players.find(p => p.id === room.turnOrder[room.currentTurn])?.isAlive);

    room.timeLeft = 15;
    return room.turnOrder[room.currentTurn];
  }

  getCurrentPlayer(roomId: string): Player | null {
    const room = this.rooms.get(roomId);
    if (!room || room.gameState !== GameState.PLAYING) return null;

    const currentPlayerId = room.turnOrder[room.currentTurn];
    return room.players.find(p => p.id === currentPlayerId) || null;
  }

  getWinner(roomId: string): Player | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const alivePlayers = room.players.filter(p => p.isAlive);
    return alivePlayers.length === 1 ? alivePlayers[0] : null;
  }

  resetRoomToLobby(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.gameState = GameState.WAITING;
    room.currentBomb = '';
    room.turnOrder = [];
    room.currentTurn = 0;
    room.timeLeft = 15;
    room.usedWords = [];
    
    if (room.bombTimer) {
      clearInterval(room.bombTimer);
      room.bombTimer = null;
    }

    // Resetear jugadores
    room.players.forEach(player => {
      player.score = 0;
      player.isAlive = true;
      player.lives = 3;
      player.currentWord = '';
    });

    return true;
  }

  getRoom(roomId: string): Room | null {
    return this.rooms.get(roomId) || null;
  }

  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  private generateUniqueRoomId(): string {
    let id: string;
    do {
      id = Math.random().toString(36).substring(2, 9);
    } while (this.rooms.has(id));
    return id;
  }

  private generateUniqueRoomCode(): string {
    let code: string;
    do {
      code = this.generateRoomCode();
    } while (this.findRoomByCode(code));
    return code;
  }
}