// src/entities/game-session.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Room } from './room.entity';

@Entity('game_sessions')
export class GameSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'room_id' })
  roomId: string;

  @Column({ name: 'started_at', type: 'timestamp' })
  startedAt: Date;

  @Column({ name: 'finished_at', type: 'timestamp', nullable: true })
  finishedAt: Date;

  @Column({ name: 'winner_id', nullable: true })
  winnerId: string;

  @Column({ name: 'winner_name', nullable: true })
  winnerName: string;

  @Column({ name: 'total_players' })
  totalPlayers: number;

  @Column({ name: 'total_words_used' })
  totalWordsUsed: number;

  @Column({ name: 'game_duration', nullable: true })
  gameDuration: number; // en segundos

  @Column({ type: 'json', nullable: true })
  finalScores: any;

  @ManyToOne(() => Room, room => room.gameSessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}