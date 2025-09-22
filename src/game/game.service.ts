// game.service.ts
import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { RoomService } from 'src/room/room.service';
import { WordService } from 'src/word/word.service';

@Injectable()
export class GameService {
  private server: Server;

  constructor(
    private readonly roomService: RoomService,
    private readonly wordService: WordService,
  ) {}

  setServer(server: Server) {
    this.server = server;
  }

  startGame(roomCode: string) {
    const room = this.roomService.getRoom(roomCode);
    if (!room || room.state !== GameState.Waiting) return;

    room.players.forEach((p) => {
      p.isAlive = true;
      p.wordSubmitted = false;
      p.score = 0;
    });

    room.state = GameState.InProgress;
    room.turnIndex = 0;
    this.scheduleTurn(roomCode);

    this.server.to(roomCode).emit('GameUpdated', this.getPublicRoomState(room));
  }

  private scheduleTurn(roomCode: string) {
    const room = this.roomService.getRoom(roomCode);
    if (!room) return;

    const currentPlayer = room.players[room.turnIndex];
    room.currentBombIndex = this.wordService.getRandomBombIndices();
    currentPlayer.wordSubmitted = false;

    this.server.to(roomCode).emit('TurnChanged', currentPlayer.name);

    setTimeout(() => this.handleTimeUp(roomCode), room.turnDuration);
  }

  private handleTimeUp(roomCode: string) {
    const room = this.roomService.getRoom(roomCode);
    if (!room || room.state !== GameState.InProgress) return;

    const currentPlayer = room.players[room.turnIndex];

    if (!currentPlayer.wordSubmitted && currentPlayer.isAlive) {
      currentPlayer.isAlive = false;
      this.server.to(roomCode).emit('PlayerEliminated', currentPlayer.name);
    }

    this.advanceTurn(roomCode);
  }

  private advanceTurn(roomCode: string) {
    const room = this.roomService.getRoom(roomCode);
    if (!room) return;

    const alivePlayers = room.players.filter((p) => p.isAlive);
    if (alivePlayers.length <= 1) {
      room.state = GameState.Finished;
      this.server.to(roomCode).emit('GameEnded', this.getPublicRoomState(room));
      return;
    }

    do {
      room.turnIndex = (room.turnIndex + 1) % room.players.length;
    } while (!room.players[room.turnIndex].isAlive);

    this.scheduleTurn(roomCode);
  }

  submitWord(roomCode: string, playerId: string, word: string): boolean {
    const room = this.roomService.getRoom(roomCode);
    if (!room || room.state !== GameState.InProgress) return false;

    const player = room.players.find((p) => p.id === playerId);
    if (!player || !player.isAlive || player.wordSubmitted) return false;

    const isValid = this.wordService.validateWord(word, room.currentBombIndex);

    if (isValid) {
      player.score++;
      player.wordSubmitted = true;
      this.server.to(roomCode).emit('WordAccepted', { playerId, word });
      return true;
    } else {
      player.isAlive = false;
      this.server.to(roomCode).emit('PlayerEliminated', player.name);
      return false;
    }
  }

  getPublicRoomState(room: any) {
    return {
      code: room.code,
      state: room.state,
      players: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        isAlive: p.isAlive,
        score: p.score,
      })),
      currentBombIndex: room.currentBombIndex,
    };
  }
}