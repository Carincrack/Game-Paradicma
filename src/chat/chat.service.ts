import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from '../entities/chat-message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private chatMessageRepository: Repository<ChatMessage>,
  ) {}

  async saveMessage(
    roomId: string,
    playerId: string,
    playerName: string,
    message: string,
    timestamp: number
  ): Promise<ChatMessage> {
    const chatMessage = this.chatMessageRepository.create({
      roomId,
      playerId,
      playerName,
      message,
      timestamp,
    });

    return await this.chatMessageRepository.save(chatMessage);
  }

  async getRoomMessages(roomId: string, limit: number = 50): Promise<ChatMessage[]> {
    return await this.chatMessageRepository.find({
      where: { roomId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}