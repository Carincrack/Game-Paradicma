import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameState } from 'src/interfaces/game-state.enum';
import { Player } from 'src/interfaces/Player.entity';
import { Room } from 'src/interfaces/Room.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,

    @InjectRepository(Player)
    private readonly playerRepo: Repository<Player>,
  ) {}

  async createRoom(hostId: string, hostName: string): Promise<Room> {
    const room = this.roomRepo.create({
      code: await this.generateUniqueRoomCode(),
      gameState: GameState.WAITING,
      currentBomb: '',
      turnOrder: [],
      usedWords: [],
      currentTurn: 0,
      timeLeft: 15,
    });

    await this.roomRepo.save(room);

    const host = this.playerRepo.create({
      id: hostId,
      name: hostName,
      isHost: true,
      room,
    });

    await this.playerRepo.save(host);

    const fullRoom = await this.roomRepo.findOne({
      where: { id: room.id },
      relations: ['players'],
    });

    if (!fullRoom) {
      throw new InternalServerErrorException('Room not found after creation');
    }

    return fullRoom;
  }

  async findRoomByCode(code: string): Promise<Room | null> {
    return await this.roomRepo.findOne({
      where: { code },
      relations: ['players'],
    });
  }

  async findRoomByPlayerId(playerId: string): Promise<Room | null> {
    const player = await this.playerRepo.findOne({
      where: { id: playerId },
      relations: ['room'],
    });
    if (!player) return null;

    return await this.roomRepo.findOne({
      where: { id: player.room.id },
      relations: ['players'],
    });
  }

  async addPlayerToRoom(
    roomId: string,
    playerId: string,
    playerName: string,
  ): Promise<Player | null> {
    const room = await this.roomRepo.findOne({
      where: { id: roomId },
      relations: ['players'],
    });

    if (!room || room.players.length >= room.maxPlayers) return null;

    const alreadyInRoom = room.players.find((p) => p.id === playerId);
    if (alreadyInRoom) return alreadyInRoom;

    const newPlayer = this.playerRepo.create({
      id: playerId,
      name: playerName,
      room,
    });

    await this.playerRepo.save(newPlayer);
    return newPlayer;
  }

  async removePlayerFromRoom(
    roomId: string,
    playerId: string,
  ): Promise<boolean> {
    const room = await this.roomRepo.findOne({
      where: { id: roomId },
      relations: ['players'],
    });
    if (!room) return false;

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return false;

    await this.playerRepo.delete(playerId);

    if (player.isHost && room.players.length > 1) {
      const nextHost = room.players.find((p) => p.id !== playerId);
      if (nextHost) {
        nextHost.isHost = true;
        await this.playerRepo.save(nextHost);
      }
    }

    const updatedRoom = await this.roomRepo.findOne({
      where: { id: roomId },
      relations: ['players'],
    });

    if (updatedRoom && updatedRoom.players.length === 0) {
      await this.roomRepo.delete(roomId);
    }

    return true;
  }

  async updatePlayerWord(
    roomId: string,
    playerId: string,
    word: string,
  ): Promise<boolean> {
    const player = await this.playerRepo.findOne({
      where: { id: playerId, room: { id: roomId } },
    });

    if (!player) return false;

    player.currentWord = word;
    await this.playerRepo.save(player);
    return true;
  }

  async getRoom(roomId: string): Promise<Room | null> {
    return await this.roomRepo.findOne({
      where: { id: roomId },
      relations: ['players'],
    });
  }

  private async generateUniqueRoomCode(): Promise<string> {
    let code: string;
    do {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      code = [...Array(4)]
        .map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26)))
        .join('');
    } while (await this.roomRepo.findOne({ where: { code } }));
    return code;
  }
}
