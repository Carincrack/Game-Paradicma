import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Room } from '../entities/room.entity';
import { Player } from '../entities/player.entity';
import { GameSession } from '../entities/game-session.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { WordSubmission } from '../entities/word-submission.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 3306),
        username: configService.get('DB_USERNAME', 'root'),
        password: configService.get('DB_PASSWORD', ''),
        database: configService.get('DB_DATABASE', 'bombparty_game'),
        entities: [Room, Player, GameSession, ChatMessage, WordSubmission],
        synchronize: configService.get('NODE_ENV', 'development') === 'development',
        logging: configService.get('NODE_ENV', 'development') === 'development',
        timezone: '+00:00',
        charset: 'utf8mb4',
      }),
    }),
  ],
})
export class DatabaseModule {}

