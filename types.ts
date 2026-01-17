
export enum Difficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

export interface SpellingWord {
  word: string;
  definition: string;
  hint: string;
  category: string;
}

export enum GameState {
  HOME = 'home',
  PLAYING = 'playing',
  RESULTS = 'results'
}

export type Theme = 'Animals' | 'Space' | 'Food' | 'Nature' | 'Everyday Objects' | 'Superheroes';
