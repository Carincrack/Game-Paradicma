import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Word } from 'src/interfaces/Word.entity';
import { Repository } from 'typeorm';

@Injectable()
export class WordService implements OnModuleInit {
  constructor(
    @InjectRepository(Word)
    private readonly wordRepo: Repository<Word>,
  ) {}

  async onModuleInit() {
    const count = await this.wordRepo.count();
    if (count > 0) return;

    const entries: Partial<Word>[] = [
      { word: 'Perro', indices: ['per', 'err', 'rro'] },
      { word: 'Caballo', indices: ['cab', 'aba', 'bal', 'all', 'llo'] },
      { word: 'Gato', indices: ['gat', 'ato'] },
      { word: 'Pan', indices: ['pan'] },
      { word: 'Pizza', indices: ['piz', 'izz', 'zza'] },
      { word: 'Mango', indices: ['man', 'ang', 'ngo'] },
      { word: 'Cebra', indices: ['ceb', 'ebr', 'bra'] },
    ];

    const words = entries.map((e) => this.wordRepo.create(e));
    await this.wordRepo.save(words);
  }

  async getRandomBombIndices(): Promise<string> {
    const words = await this.wordRepo.find();
    const allIndices = words.flatMap((w) => w.indices);
    const randomIndex = Math.floor(Math.random() * allIndices.length);
    return allIndices[randomIndex];
  }

  async validateWord(word: string, bombIndex: string): Promise<boolean> {
    const entry = await this.wordRepo.findOne({ where: { word } });
    if (!entry) return false;
    return entry.indices.some(
      (i) => i.toLowerCase() === bombIndex.toLowerCase(),
    );
  }

  async getWordIndices(word: string): Promise<string[]> {
    const entry = await this.wordRepo.findOne({ where: { word } });
    return entry ? entry.indices : [];
  }
}
