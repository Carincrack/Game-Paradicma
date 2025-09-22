import { IsString, IsNotEmpty, Length, MaxLength } from 'class-validator';

export class JoinRoomDto {
  @IsString()
  @IsNotEmpty()
  @Length(4, 4)
  code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  playerName: string;
}
