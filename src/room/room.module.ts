// src/room/room.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomService } from './room.service';
import { Room } from '../entities/room.entity';
import { Player } from '../entities/player.entity';
import { GameSession } from '../entities/game-session.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Room, Player, GameSession]),
  ],
  providers: [RoomService],
  exports: [RoomService],
})
export class RoomModule {}