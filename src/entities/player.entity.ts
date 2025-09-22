// src/entities/player.entity.ts
import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Room } from './room.entity';

@Entity('players')
export class Player {
  @PrimaryColumn()
  id: string; // Socket ID

  @Column()
  name: string;

  @Column({ default: 0 })
  score: number;

  @Column({ name: 'is_host', default: false })
  isHost: boolean;

  @Column({ name: 'current_word', default: '' })
  currentWord: string;

  @Column({ name: 'is_alive', default: true })
  isAlive: boolean;

  @Column({ default: 3 })
  lives: number;

  @Column({ name: 'room_id' })
  roomId: string;

  @ManyToOne(() => Room, room => room.players, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
