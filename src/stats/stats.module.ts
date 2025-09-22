// src/stats/stats.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import { Room } from '../entities/room.entity';
import { Player } from '../entities/player.entity';
import { GameSession } from '../entities/game-session.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { WordSubmission } from '../entities/word-submission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Room,
      Player, 
      GameSession,
      ChatMessage,
      WordSubmission,
    ]),
  ],
  providers: [StatsService],
  controllers: [StatsController],
  exports: [StatsService],
})
export class StatsModule {}
