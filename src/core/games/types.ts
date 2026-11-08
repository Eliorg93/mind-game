import type { LevelRange } from '../adaptive/staircase';

/** Cognitive domains from the research document (part 1). */
export type Domain =
  | 'shortTermMemory'
  | 'longTermMemory'
  | 'workingMemory'
  | 'visualMemory'
  | 'verbalMemory'
  | 'attention'
  | 'wordRetrieval'
  | 'executive'
  | 'patterns'
  | 'logic';

export type PlantKind = 'tulip' | 'sunflower' | 'lavender' | 'fern' | 'daisy';

export type IconId = 'cards' | 'basket' | 'bird' | 'stones' | 'speech' | 'book' | 'pattern' | 'gate' | 'house' | 'map';

/**
 * Everything the app needs to know about a game without loading its code.
 * Text lives in the locale files under `games.<id>.*`, never here.
 */
export interface GameMeta {
  id: string;
  status: 'available' | 'planned';
  domains: Domain[];
  minutes: number;
  icon: IconId;
  plant: PlantKind;
  levels: LevelRange;
  /** Number of instruction steps in the locale file: games.<id>.steps.1..N */
  instructionSteps: number;
}

/** Result a game reports when the player finishes. */
export interface GameResult {
  accuracy: number;
  completed: boolean;
}
