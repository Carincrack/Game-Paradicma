import { Controller, Get, Query } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('api/stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('rooms')
  async getRoomStats() {
    return await this.statsService.getRoomStats();
  }

  @Get('games')
  async getGameStats() {
    return await this.statsService.getGameStats();
  }

  @Get('players')
  async getPlayerStats() {
    return await this.statsService.getPlayerStats();
  }

  @Get('words')
  async getWordStats(@Query('limit') limit?: string) {
    const limitNumber = limit ? parseInt(limit) : 20;
    return await this.statsService.getWordStats(limitNumber);
  }

  @Get('bomb-indices')
  async getBombIndicesStats(@Query('limit') limit?: string) {
    const limitNumber = limit ? parseInt(limit) : 20;
    return await this.statsService.getBombIndicesStats(limitNumber);
  }

  @Get('daily')
  async getDailyStats(@Query('days') days?: string) {
    const daysNumber = days ? parseInt(days) : 7;
    return await this.statsService.getDailyStats(daysNumber);
  }
}