import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Player } from './Player.entity';
import { GameState } from './game-state.enum';

@Entity()
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column({ default: 4 })
  maxPlayers: number;

  @Column({
    type: 'enum',
    enum: GameState,
    default: GameState.WAITING,
  })
  gameState: GameState;

  @Column()
  currentBomb: string;

  @Column('simple-array')
  turnOrder: string[];

  @Column({ default: 0 })
  currentTurn: number;

  @Column({ default: 15 })
  timeLeft: number;

  @Column('simple-array')
  usedWords: string[];

  @OneToMany(() => Player, (player) => player.room, { cascade: true })
  players: Player[];

  bombTimer?: NodeJS.Timeout | null;
}
