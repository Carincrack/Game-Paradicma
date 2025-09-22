import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class SubmitWordDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  word: string;
}