import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('word_submissions')
export class WordSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'room_id' })
  roomId: string;

  @Column({ name: 'player_id' })
  playerId: string;

  @Column({ name: 'player_name' })
  playerName: string;

  @Column()
  word: string;

  @Column({ name: 'bomb_indices' })
  bombIndices: string;

  @Column({ name: 'is_valid' })
  isValid: boolean;

  @Column({ name: 'submission_time', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  submissionTime: Date;

  @Column({ name: 'time_taken', nullable: true })
  timeTaken: number; // tiempo que tardó en responder

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}