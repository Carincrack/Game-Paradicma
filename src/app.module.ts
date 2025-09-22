// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { GameModule } from './game/game.module';
import { RoomModule } from './room/room.module';
import { WordModule } from './word/word.module';
import { ChatModule } from './chat/chat.module';
import { StatsModule } from './stats/stats.module';
import { AdminModule } from './admin/admin.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    GameModule,
    RoomModule,
    WordModule,
    ChatModule,
    StatsModule,
    AdminModule,
    HealthModule,
  ],
})
export class AppModule {}
