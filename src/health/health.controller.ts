import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from '../entities/room.entity';

@Controller('api/health')
export class HealthController {
  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
  ) {}

  @Get()
  async getHealth() {
    try {
      // Verificar conexión a base de datos
      await this.roomRepository.count();
      
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
        uptime: process.uptime(),
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message,
      };
    }
  }

  @Get('database')
  async getDatabaseHealth() {
    try {
      const roomCount = await this.roomRepository.count();
      
      return {
        status: 'ok',
        connection: 'active',
        totalRooms: roomCount,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        connection: 'failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}