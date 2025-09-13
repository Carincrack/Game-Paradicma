export interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  currentWord: string;
  isAlive: boolean;
  lives: number;
}

export interface Room {
  id: string;
  code: string;
  players: Player[];
  maxPlayers: number;
  gameState: GameState;
  currentBomb: string;
  turnOrder: string[];
  currentTurn: number;
  timeLeft: number;
  usedWords: string[];
  bombTimer: NodeJS.Timeout | null;
}

export interface ChatMessage {
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
}

export interface WordData {
  word: string;
  indices: string[];
}

export interface Dictionary {
  [word: string]: {
    indices: string[];
  };
}

export enum GameState {
  WAITING = 'waiting',
  PLAYING = 'playing',
  FINISHED = 'finished',
}

export interface GameEvents {
  // Room events
  'create-room': (playerName: string) => void;
  'join-room': (data: { code: string; playerName: string }) => void;
  'leave-room': () => void;
  'start-game': () => void;
  'return-to-lobby': () => void;
  
  // Game events
  'word-input': (data: { word: string; playerId: string }) => void;
  'submit-word': (word: string) => void;
  'player-typing': (data: { word: string }) => void;
  
  // Chat events
  'send-message': (message: string) => void;
}

export interface ServerEvents {
  // Room events
  'room-created': (data: { room: Room; playerId: string }) => void;
  'room-joined': (data: { room: Room; playerId: string }) => void;
  'player-joined': (player: Player) => void;
  'player-left': (playerId: string) => void;
  'room-not-found': () => void;
  'room-full': () => void;
  
  // Game events
  'game-started': (data: { bomb: string; currentPlayer: string; timeLeft: number }) => void;
  'new-bomb': (data: { bomb: string; currentPlayer: string; timeLeft: number }) => void;
  'word-submitted': (data: { playerId: string; word: string; isValid: boolean }) => void;
  'player-eliminated': (playerId: string) => void;
  'game-finished': (data: { winner: Player; scores: Player[] }) => void;
  'turn-changed': (data: { currentPlayer: string; timeLeft: number }) => void;
  'time-update': (timeLeft: number) => void;
  'player-word-update': (data: { playerId: string; word: string; hasValidIndices: boolean }) => void;
  
  // Chat events
  'message-received': (message: ChatMessage) => void;
  
  // Error events
  'error': (message: string) => void;
}