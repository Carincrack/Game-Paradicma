import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';

// Servicios y Gateway
import { GameGateway } from './game/game.gateway';
import { GameService } from './game/game.service';
import { RoomService } from './room/room.service';
import { WordService } from './word/word.service';
import { Room } from './interfaces/Room.entity';
import { Player } from './interfaces/Player.entity';
import { Word } from './interfaces/Word.entity';

@Module({
  imports: [
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    ConfigModule.forRoot({
      isGlobal: true, // Asegura que ConfigService esté disponible globalmente
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], // <-- Esto es necesario
      inject: [ConfigService],
      useFactory: typeOrmConfig,
    }),

    TypeOrmModule.forFeature([Room, Player, Word]),
  ],
  providers: [GameGateway, GameService, RoomService, WordService],
})
export class AppModule {}
