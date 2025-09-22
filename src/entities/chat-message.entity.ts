// src/entities/chat-message.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Room } from './room.entity';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'room_id' })
  roomId: string;

  @Column({ name: 'player_id' })
  playerId: string;

  @Column({ name: 'player_name' })
  playerName: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'bigint' })
  timestamp: number;

  @ManyToOne(() => Room, room => room.chatMessages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}