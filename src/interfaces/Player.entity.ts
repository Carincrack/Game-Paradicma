import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Room } from './Room.entity';

@Entity()
export class Player {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ default: 0 })
  score: number;

  @Column({ default: true })
  isAlive: boolean;

  @Column({ default: false })
  isHost: boolean;

  @Column({ default: '' })
  currentWord: string;

  @Column({ default: 3 })
  lives: number;

  @ManyToOne(() => Room, (room) => room.players, { onDelete: 'CASCADE' })
  room: Room;
}
