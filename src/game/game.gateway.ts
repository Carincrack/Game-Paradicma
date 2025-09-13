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
import { ChatMessage } from '../interfaces/game.interface';

@WebSocketGateway({
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private gameTimers = new Map<string, NodeJS.Timeout>();

  constructor(private gameService: GameService) {}

  handleConnection(client: Socket) {
    console.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);
    
    // Manejar desconexión del jugador
    const result = this.gameService.leaveRoom(client.id);
    if (result.success && result.room) {
      // Notificar a otros jugadores en la sala
      client.to(result.room.id).emit('player-left', client.id);
      
      // Limpiar timer si existía
      this.clearGameTimer(result.room.id);
    }
  }

  @SubscribeMessage('create-room')
  async handleCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() playerName: string,
  ) {
    try {
      const room = this.gameService.createRoom(client.id, playerName);
      
      // Unir cliente a la sala de Socket.IO
      await client.join(room.id);
      
      client.emit('room-created', {
        room,
        playerId: client.id,
      });
    } catch (error) {
      client.emit('error', 'Error al crear la sala');
    }
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { code: string; playerName: string },
  ) {
    try {
      const result = this.gameService.joinRoom(data.code, client.id, data.playerName);
      
      if (!result.success) {
        if (result.error === 'ROOM_NOT_FOUND') {
          client.emit('room-not-found');
        } else if (result.error === 'ROOM_FULL') {
          client.emit('room-full');
        } else {
          client.emit('error', 'Error al unirse a la sala');
        }
        return;
      }

      // Unir cliente a la sala de Socket.IO
      if (result.room) {
        await client.join(result.room.id);
        
        // Notificar al jugador que se unió
        client.emit('room-joined', {
          room: result.room,
          playerId: client.id,
        });

        // Notificar a otros jugadores en la sala
        client.to(result.room.id).emit('player-joined', result.player);
      }
    } catch (error) {
      client.emit('error', 'Error al unirse a la sala');
    }
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(@ConnectedSocket() client: Socket) {
    try {
      const result = this.gameService.leaveRoom(client.id);
      
      if (result.success && result.room) {
        // Salir de la sala de Socket.IO
        await client.leave(result.room.id);
        
        // Notificar a otros jugadores
        client.to(result.room.id).emit('player-left', client.id);
        
        // Limpiar timer si existía
        this.clearGameTimer(result.room.id);
      }
    } catch (error) {
      client.emit('error', 'Error al salir de la sala');
    }
  }

  @SubscribeMessage('start-game')
  handleStartGame(@ConnectedSocket() client: Socket) {
    try {
      const room = this.gameService.getRoomByPlayerId(client.id);
      if (!room) {
        client.emit('error', 'Sala no encontrada');
        return;
      }

      const result = this.gameService.startGame(room.id, client.id);
      
      if (!result.success) {
        client.emit('error', 'No se pudo iniciar el juego');
        return;
      }

      // Notificar a todos los jugadores que el juego comenzó
      this.server.to(room.id).emit('game-started', {
        bomb: result.bombIndices,
        currentPlayer: room.turnOrder[0],
        timeLeft: room.timeLeft,
      });

      // Iniciar timer del juego
      this.startGameTimer(room.id);
    } catch (error) {
      client.emit('error', 'Error al iniciar el juego');
    }
  }

  @SubscribeMessage('player-typing')
  handlePlayerTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { word: string },
  ) {
    try {
      const room = this.gameService.getRoomByPlayerId(client.id);
      if (!room) return;

      const result = this.gameService.handlePlayerTyping(room.id, client.id, data.word);
      
      if (result.success) {
        // Notificar a todos los jugadores sobre el progreso de la palabra
        this.server.to(room.id).emit('player-word-update', {
          playerId: client.id,
          word: data.word,
          hasValidIndices: result.hasValidIndices,
        });
      }
    } catch (error) {
      console.error('Error en player-typing:', error);
    }
  }

  @SubscribeMessage('submit-word')
  handleSubmitWord(
    @ConnectedSocket() client: Socket,
    @MessageBody() word: string,
  ) {
    try {
      const room = this.gameService.getRoomByPlayerId(client.id);
      if (!room) {
        client.emit('error', 'Sala no encontrada');
        return;
      }

      const result = this.gameService.submitWord(room.id, client.id, word);
      
      if (!result.success) {
        client.emit('error', result.error || 'Error al enviar palabra');
        return;
      }

      // Notificar resultado de la palabra
      this.server.to(room.id).emit('word-submitted', {
        playerId: client.id,
        word,
        isValid: result.isValid,
      });

      // Si el jugador fue eliminado
      if (result.eliminatedPlayer && result.eliminatedPlayer.lives <= 0) {
        this.server.to(room.id).emit('player-eliminated', client.id);
      }

      // Si el juego terminó
      if (result.gameFinished && result.winner) {
        this.clearGameTimer(room.id);
        this.server.to(room.id).emit('game-finished', {
          winner: result.winner,
          scores: room.players,
        });
        return;
      }

      // Si hay siguiente jugador, continuar el juego
      if (result.nextPlayerId && result.newBombIndices) {
        this.server.to(room.id).emit('new-bomb', {
          bomb: result.newBombIndices,
          currentPlayer: result.nextPlayerId,
          timeLeft: room.timeLeft,
        });

        // Reiniciar timer
        this.clearGameTimer(room.id);
        this.startGameTimer(room.id);
      }
    } catch (error) {
      client.emit('error', 'Error al procesar la palabra');
    }
  }

  @SubscribeMessage('return-to-lobby')
  handleReturnToLobby(@ConnectedSocket() client: Socket) {
    try {
      const room = this.gameService.getRoomByPlayerId(client.id);
      if (!room) {
        client.emit('error', 'Sala no encontrada');
        return;
      }

      const result = this.gameService.returnToLobby(room.id, client.id);
      
      if (!result.success) {
        client.emit('error', 'No tienes permisos para regresar al lobby');
        return;
      }

      // Limpiar timer
      this.clearGameTimer(room.id);

      // Notificar a todos los jugadores
      this.server.to(room.id).emit('room-joined', {
        room: result.room,
        playerId: client.id,
      });
    } catch (error) {
      client.emit('error', 'Error al regresar al lobby');
    }
  }

  @SubscribeMessage('send-message')
  handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: string,
  ) {
    try {
      const room = this.gameService.getRoomByPlayerId(client.id);
      if (!room) return;

      const player = room.players.find(p => p.id === client.id);
      if (!player) return;

      const chatMessage: ChatMessage = {
        playerId: client.id,
        playerName: player.name,
        message,
        timestamp: Date.now(),
      };

      // Enviar mensaje a todos en la sala
      this.server.to(room.id).emit('message-received', chatMessage);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    }
  }

  private startGameTimer(roomId: string) {
    const room = this.gameService.getRoom(roomId);
    if (!room) return;

    const timer = setInterval(() => {
      room.timeLeft--;

      // Enviar actualización de tiempo
      this.server.to(roomId).emit('time-update', room.timeLeft);

      // Si el tiempo se agotó
      if (room.timeLeft <= 0) {
        this.clearGameTimer(roomId);
        
        const result = this.gameService.handleTimeUp(roomId);
        
        if (result.success) {
          // Si el jugador fue eliminado
          if (result.eliminatedPlayer && result.eliminatedPlayer.lives <= 0) {
            this.server.to(roomId).emit('player-eliminated', result.eliminatedPlayer.id);
          }

          // Si el juego terminó
          if (result.gameFinished && result.winner) {
            this.server.to(roomId).emit('game-finished', {
              winner: result.winner,
              scores: room.players,
            });
            return;
          }

          // Continuar con siguiente turno
          if (result.nextPlayerId && result.newBombIndices) {
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

  private clearGameTimer(roomId: string) {
    const timer = this.gameTimers.get(roomId);
    if (timer) {
      clearInterval(timer);
      this.gameTimers.delete(roomId);
    }
  }
}