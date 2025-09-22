// src/entities/room.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Player } from './player.entity';
import { GameSession } from './game-session.entity';
import { ChatMessage } from './chat-message.entity';

export enum GameState {
  WAITING = 'waiting',
  PLAYING = 'playing',
  FINISHED = 'finished',
}

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 4 })
  code: string;

  @Column({ name: 'max_players', default: 4 })
  maxPlayers: number;

  @Column({ 
    type: 'enum', 
    enum: GameState, 
    default: GameState.WAITING 
  })
  gameState: GameState;

  @Column({ name: 'current_bomb', nullable: true })
  currentBomb: string;

  @Column({ name: 'current_turn', default: 0 })
  currentTurn: number;

  @Column({ name: 'time_left', default: 15 })
  timeLeft: number;

  @Column({ type: 'json', nullable: true })
  turnOrder: string[];

  @Column({ type: 'json', nullable: true })
  usedWords: string[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => Player, player => player.room, { cascade: true })
  players: Player[];

  @OneToMany(() => GameSession, session => session.room, { cascade: true })
  gameSessions: GameSession[];

  @OneToMany(() => ChatMessage, message => message.room, { cascade: true })
  chatMessages: ChatMessage[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}