// src/game/game.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { ChatService } from '../chat/chat.service';
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

  private readonly logger = new Logger(GameGateway.name);
  private gameTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private gameService: GameService,
    private chatService: ChatService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
    
    try {
      // Manejar desconexión del jugador
      const result = await this.gameService.leaveRoom(client.id);
      if (result.success && result.room) {
        // Notificar a otros jugadores en la sala
        client.to(result.room.id).emit('player-left', client.id);
        
        // Limpiar timer si existía
        this.clearGameTimer(result.room.id);
      }
    } catch (error) {
      this.logger.error(`Error handling disconnect: ${error.message}`, error.stack);
    }
  }

  @SubscribeMessage('create-room')
  async handleCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() playerName: string,
  ) {
    try {
      const room = await this.gameService.createRoom(client.id, playerName);
      
      // Unir cliente a la sala de Socket.IO
      await client.join(room.id);
      
      client.emit('room-created', {
        room,
        playerId: client.id,
      });

      this.logger.log(`Room created: ${room.code} by ${playerName}`);
    } catch (error) {
      this.logger.error(`Error creating room: ${error.message}`, error.stack);
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

        this.logger.log(`Player ${data.playerName} joined room ${data.code}`);
      }
    } catch (error) {
      this.logger.error(`Error joining room: ${error.message}`, error.stack);
      client.emit('error', 'Error al unirse a la sala');
    }
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(@ConnectedSocket() client: Socket) {
    try {
      const result = await this.gameService.leaveRoom(client.id);
      
      if (result.success && result.room) {
        // Salir de la sala de Socket.IO
        await client.leave(result.room.id);
        
        // Notificar a otros jugadores
        client.to(result.room.id).emit('player-left', client.id);
        
        // Limpiar timer si existía
        this.clearGameTimer(result.room.id);

        this.logger.log(`Player left room: ${result.room.id}`);
      }
    } catch (error) {
      this.logger.error(`Error leaving room: ${error.message}`, error.stack);
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
      client.emit('error', result.error || 'No se pudo iniciar el juego');
      return;
    }

    // ¡CORRECCIÓN AQUÍ!
    // Usar el firstPlayerId que viene del servicio
    const currentPlayerId = result.firstPlayerId || result.room?.turnOrder[0];
    
    if (!currentPlayerId) {
      client.emit('error', 'Error en el sistema de turnos');
      return;
    }

    // Notificar a todos los jugadores que el juego comenzó
    this.server.to(room.id).emit('game-started', {
      bomb: result.bombIndices,
      currentPlayer: currentPlayerId, // ← Ahora está correcto
      timeLeft: result.room?.timeLeft ?? 0,
    });

    // Iniciar timer del juego
    this.startGameTimer(room.id);

    this.logger.log(`Game started in room: ${room.code}, first player: ${currentPlayerId}`);
  } catch (error) {
    this.logger.error(`Error starting game: ${error.message}`, error.stack);
    client.emit('error', 'Error al iniciar el juego');
  }
}

// OPCIONAL: Método para debug - agregar al RoomService


  @SubscribeMessage('player-typing')
  async handlePlayerTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { word: string },
  ) {
    try {
      const room = await this.gameService.getRoomByPlayerId(client.id);
      if (!room) return;

      const result = await this.gameService.handlePlayerTyping(room.id, client.id, data.word);
      
      if (result.success) {
        // Notificar a todos los jugadores sobre el progreso de la palabra
        this.server.to(room.id).emit('player-word-update', {
          playerId: client.id,
          word: data.word,
          hasValidIndices: result.hasValidIndices,
        });
      }
    } catch (error) {
      this.logger.error(`Error in player-typing: ${error.message}`, error.stack);
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
        
        this.logger.log(`Game finished in room: ${room.code}, winner: ${result.winner.name}`);
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
      this.logger.error(`Error submitting word: ${error.message}`, error.stack);
      client.emit('error', 'Error al procesar la palabra');
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

      // Limpiar timer
      this.clearGameTimer(room.id);

      // Notificar a todos los jugadores
      this.server.to(room.id).emit('room-joined', {
        room: result.room,
        playerId: client.id,
      });

      this.logger.log(`Room ${room.code} returned to lobby`);
    } catch (error) {
      this.logger.error(`Error returning to lobby: ${error.message}`, error.stack);
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

      const player = room.players.find(p => p.id === client.id);
      if (!player) return;

      const timestamp = Date.now();

      // Guardar mensaje en base de datos
      await this.chatService.saveMessage(
        room.id,
        client.id,
        player.name,
        message,
        timestamp
      );

      const chatMessage: ChatMessage = {
        playerId: client.id,
        playerName: player.name,
        message,
        timestamp,
      };

      // Enviar mensaje a todos en la sala
      this.server.to(room.id).emit('message-received', chatMessage);
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`, error.stack);
    }
  }

  private async startGameTimer(roomId: string) {
    try {
      const room = await this.gameService.getRoom(roomId);
      if (!room) return;

      const timer = setInterval(async () => {
        try {
          // Actualizar tiempo en la base de datos sería costoso, 
          // mantenemos en memoria durante el juego
          room.timeLeft--;

          // Enviar actualización de tiempo
          this.server.to(roomId).emit('time-update', room.timeLeft);

          // Si el tiempo se agotó
          if (room.timeLeft <= 0) {
            this.clearGameTimer(roomId);
            
            const result = await this.gameService.handleTimeUp(roomId);
            
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
                
                this.logger.log(`Game finished due to timeout in room: ${roomId}`);
                return;
              }

              // Continuar con siguiente turno
              if (result.nextPlayerId && result.newBombIndices) {
                room.timeLeft = 15; // Reset timer
                
                this.server.to(roomId).emit('new-bomb', {
                  bomb: result.newBombIndices,
                  currentPlayer: result.nextPlayerId,
                  timeLeft: room.timeLeft,
                });

                this.startGameTimer(roomId);
              }
            }
          }
        } catch (error) {
          this.logger.error(`Error in game timer: ${error.message}`, error.stack);
          this.clearGameTimer(roomId);
        }
      }, 1000);

      this.gameTimers.set(roomId, timer);
    } catch (error) {
      this.logger.error(`Error starting game timer: ${error.message}`, error.stack);
    }
  }

  private clearGameTimer(roomId: string) {
    const timer = this.gameTimers.get(roomId);
    if (timer) {
      clearInterval(timer);
      this.gameTimers.delete(roomId);
    }
  }
}