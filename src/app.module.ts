import { Module } from '@nestjs/common';
import { GameGateway } from './game/game.gateway';
import { GameService } from './game/game.service';
import { RoomService } from './room/room.service';
import { WordService } from './word/word.service';

@Module({
  providers: [
    GameGateway,
    GameService,
    RoomService,
    WordService,
  ],
})
export class AppModule {}