// src/game/game.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { RoomModule } from '../room/room.module';
import { WordModule } from '../word/word.module';
import { ChatModule } from '../chat/chat.module';
import { WordSubmission } from '../entities/word-submission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WordSubmission]),
    RoomModule,
    WordModule,
    ChatModule,
  ],
  providers: [GameService, GameGateway],
  exports: [GameService],
})
export class GameModule {}