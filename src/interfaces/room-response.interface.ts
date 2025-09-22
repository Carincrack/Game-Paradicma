// src/interfaces/room-response.interface.ts
import { Room } from '../entities/room.entity';
import { Player } from '../entities/player.entity';

export interface RoomCreateResponse {
  room: Room;
  playerId: string;
}

export interface RoomJoinResponse {
  room: Room;
  playerId: string;
  player?: Player;
}

export interface GameStartResponse {
  bomb: string;
  currentPlayer: string;
  timeLeft: number;
}

export interface WordSubmissionResponse {
  playerId: string;
  word: string;
  isValid: boolean;
  eliminatedPlayer?: Player;
  nextPlayerId?: string;
  newBombIndices?: string;
  winner?: Player;
  gameFinished: boolean;
}