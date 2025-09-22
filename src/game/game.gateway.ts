import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private gameTimers = new Map<string, NodeJS.Timeout>();

  constructor(private readonly gameService: GameService) {}

  handleConnection(client: Socket): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    console.log(`Cliente conectado: ${client.id}`);
  }

  async handleDisconnect(client: Socket): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    console.log(`Cliente desconectado: ${client.id}`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    const result = await this.gameService.leaveRoom(client.id);
    if (result.success && result.room) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      client.to(result.room.id).emit('player-left', client.id);
      this.clearGameTimer(result.room.id);
    }
  }

  @SubscribeMessage('create-room')
  async handleCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() playerName: string,
  ) {
    try {
      const room = await this.gameService.createRoom(client.id, playerName);
      await client.join(room.id);
      client.emit('room-created', { room, playerId: client.id });
    } catch {
      client.emit('error', 'Error al crear la sala');
    }
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { code: string; playerName: string },
  ) {
    try {
      const result = await this.gameService.joinRoom(data.code, client.id, data.playerName);
      if (!result.success) {
        client.emit(result.error?.toLowerCase() ?? 'error', {});
        return;
      }

      await client.join(result.room!.id);
      client.emit('room-joined', { room: result.room, playerId: client.id });
      client.to(result.room!.id).emit('player-joined', result.player);
    } catch {
      client.emit('error', 'Error al unirse a la sala');
    }
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(@ConnectedSocket() client: Socket) {
    try {
      const result = await this.gameService.leaveRoom(client.id);
      if (result.success && result.room) {
        await client.leave(result.room.id);
        client.to(result.room.id).emit('player-left', client.id);
        this.clearGameTimer(result.room.id);
      }
    } catch {
      client.emit('error', 'Error al salir de la sala');
    }
  }

  @SubscribeMessage('start-game')
  async handleStartGame(@ConnectedSocket() client: Socket) {
    try {
      const room = await this.gameService.getRoomByPlayerId(client.id);
      if (!room) {
        client.emit('error', 'Sala no encontrada');
        return;
      }

      const result = await this.gameService.startGame(room.id, client.id);
      if (!result.success) {
        client.emit('error', result.error ?? 'Error al iniciar el juego');
        return;
      }

      this.server.to(room.id).emit('game-started', {
        bomb: result.bombIndices,
        currentPlayer: room.turnOrder[0],
        timeLeft: room.timeLeft,
      });

      this.startGameTimer(room.id);
    } catch {
      client.emit('error', 'Error al iniciar el juego');
    }
  }

  @SubscribeMessage('submit-word')
  async handleSubmitWord(
    @ConnectedSocket() client: Socket,
    @MessageBody() word: string,
  ) {
    try {
      const room = await this.gameService.getRoomByPlayerId(client.id);
      if (!room) {
        client.emit('error', 'Sala no encontrada');
        return;
      }

      const result = await this.gameService.submitWord(room.id, client.id, word);
      if (!result.success) {
        client.emit('error', result.error ?? 'Error al enviar la palabra');
        return;
      }

      this.server.to(room.id).emit('word-submitted', {
        playerId: client.id,
        word,
        isValid: result.isValid ?? false,
      });

      if (result.eliminatedPlayer?.lives === 0) {
        this.server.to(room.id).emit('player-eliminated', client.id);
      }

      if (result.gameFinished && result.winner) {
        this.clearGameTimer(room.id);
        this.server.to(room.id).emit('game-finished', {
          winner: result.winner,
          scores: room.players,
        });
        return;
      }

      if (result.nextPlayerId && result.newBombIndices) {
        this.server.to(room.id).emit('new-bomb', {
          bomb: result.newBombIndices,
          currentPlayer: result.nextPlayerId,
          timeLeft: room.timeLeft,
        });
        this.clearGameTimer(room.id);
        this.startGameTimer(room.id);
      }
    } catch {
      client.emit('error', 'Error al procesar la palabra');
    }
  }

  @SubscribeMessage('player-typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { word: string },
  ) {
    try {
      const room = await this.gameService.getRoomByPlayerId(client.id);
      if (!room) return;

      const result = await this.gameService.handlePlayerTyping(
        room.id,
        client.id,
        data.word,
      );

      if (result.success) {
        this.server.to(room.id).emit('player-word-update', {
          playerId: client.id,
          word: data.word,
          hasValidIndices: result.hasValidIndices ?? false,
        });
      }
    } catch {
      console.error('Error en player-typing');
    }
  }

  @SubscribeMessage('return-to-lobby')
  async handleReturnToLobby(@ConnectedSocket() client: Socket) {
    try {
      const room = await this.gameService.getRoomByPlayerId(client.id);
      if (!room) {
        client.emit('error', 'Sala no encontrada');
        return;
      }

      const result = await this.gameService.returnToLobby(room.id, client.id);
      if (!result.success) {
        client.emit('error', 'No tienes permisos para regresar al lobby');
        return;
      }

      this.clearGameTimer(room.id);

      if (result.room) {
        this.server.to(room.id).emit('room-joined', {
          room: result.room,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          playerId: client.id,
        });
      } else {
        client.emit('error', 'No se pudo regresar al lobby');
      }
    } catch {
      client.emit('error', 'Error al regresar al lobby');
    }
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: string,
  ) {
    try {
      const room = await this.gameService.getRoomByPlayerId(client.id);
      if (!room) return;

      const player = room.players.find((p) => p.id === client.id);
      if (!player) return;

      const chatMessage = {
        playerId: client.id,
        playerName: player.name,
        message,
        timestamp: Date.now(),
      };

      this.server.to(room.id).emit('message-received', chatMessage);
    } catch {
      console.error('Error al enviar mensaje');
    }
  }

  private async startGameTimer(roomId: string) {
    const room = await this.gameService.getRoom(roomId);
    if (!room) return;

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    const timer = setInterval(async () => {
      room.timeLeft--;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.server.to(roomId).emit('time-update', room.timeLeft);

      if (room.timeLeft <= 0) {
        this.clearGameTimer(roomId);
        const result = await this.gameService.handleTimeUp(roomId);

        if (result.success) {
          if (result.eliminatedPlayer?.lives === 0) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            this.server.to(roomId).emit('player-eliminated', result.eliminatedPlayer.id);
          }

          if (result.gameFinished && result.winner) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            this.server.to(roomId).emit('game-finished', {
              winner: result.winner,
              scores: room.players,
            });
            return;
          }

          if (result.nextPlayerId && result.newBombIndices) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            this.server.to(roomId).emit('new-bomb', {
              bomb: result.newBombIndices,
              currentPlayer: result.nextPlayerId,
              timeLeft: room.timeLeft,
            });
            this.startGameTimer(roomId);
          }
        }
      }
    }, 1000);

    this.gameTimers.set(roomId, timer);
  }

  private clearGameTimer(roomId: string): void {
    const timer = this.gameTimers.get(roomId);
    if (timer) {
      clearInterval(timer);
      this.gameTimers.delete(roomId);
    }
  }
}
