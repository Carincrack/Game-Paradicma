// src/admin/admin.controller.ts
import { Controller, Get, Query, Delete, Param } from '@nestjs/common';
import { RoomService } from '../room/room.service';
import { StatsService } from '../stats/stats.service';

@Controller('api/admin')
export class AdminController {
  constructor(
    private readonly roomService: RoomService,
    private readonly statsService: StatsService,
  ) {}

  @Get('rooms')
  async getAllRooms() {
    return await this.roomService.getAllActiveRooms();
  }

  @Get('rooms/:id')
  async getRoom(@Param('id') roomId: string) {
    return await this.roomService.getRoom(roomId);
  }

  @Delete('rooms/:id')
  async deactivateRoom(@Param('id') roomId: string) {
    // En lugar de eliminar, marcar como inactiva
    const room = await this.roomService.getRoom(roomId);
    if (room) {
      // Lógica para marcar sala como inactiva
      return { success: true, message: 'Room deactivated' };
    }
    return { success: false, message: 'Room not found' };
  }

  @Get('cleanup')
  async cleanupRooms(@Query('hours') hours?: string) {
    const hoursNumber = hours ? parseInt(hours) : 24;
    const cleaned = await this.roomService.cleanupInactiveRooms(hoursNumber);
    return { cleaned, message: `${cleaned} rooms cleaned up` };
  }

  @Get('dashboard')
  async getDashboardData() {
    const [roomStats, gameStats, playerStats] = await Promise.all([
      this.statsService.getRoomStats(),
      this.statsService.getGameStats(),
      this.statsService.getPlayerStats(),
    ]);

    return {
      rooms: roomStats,
      games: gameStats,
      players: playerStats,
      lastUpdated: new Date().toISOString(),
    };
  }
}