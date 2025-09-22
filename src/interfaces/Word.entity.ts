import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Word {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  word: string;

  @Column('simple-array')
  indices: string[];
}
