
// src/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { RoomModule } from '../room/room.module';
import { StatsModule } from '../stats/stats.module';

@Module({
  imports: [RoomModule, StatsModule],
  controllers: [AdminController],
})
export class AdminModule {}