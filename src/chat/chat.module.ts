
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { ChatMessage } from '../entities/chat-message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatMessage]),
  ],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}