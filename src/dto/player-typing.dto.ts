import { IsString, MaxLength } from 'class-validator';

export class PlayerTypingDto {
  @IsString()
  @MaxLength(100)
  word: string;
}
