import type { GameMeta } from './types';

/**
 * The game catalog. Adding a game = one entry here, its texts in the locale file,
 * and its component in src/games/registry.ts. Planned games are listed so the
 * roadmap is visible, but they are not playable and render as plain text.
 */
export const CATALOG: GameMeta[] = [
  { id: 'memory-pairs', status: 'available', domains: ['visualMemory', 'shortTermMemory'], minutes: 4, icon: 'cards', plant: 'lavender', levels: { min: 1, max: 5, start: 1 }, instructionSteps: 3 },
  { id: 'shopping-list', status: 'planned', domains: ['verbalMemory', 'longTermMemory'], minutes: 5, icon: 'basket', plant: 'tulip', levels: { min: 1, max: 8, start: 1 }, instructionSteps: 3 },
  { id: 'garden-birds', status: 'planned', domains: ['attention'], minutes: 4, icon: 'bird', plant: 'sunflower', levels: { min: 1, max: 10, start: 1 }, instructionSteps: 3 },
  { id: 'stone-path', status: 'planned', domains: ['workingMemory'], minutes: 4, icon: 'stones', plant: 'fern', levels: { min: 1, max: 6, start: 1 }, instructionSteps: 3 },
  { id: 'tip-of-tongue', status: 'planned', domains: ['wordRetrieval'], minutes: 5, icon: 'speech', plant: 'daisy', levels: { min: 1, max: 6, start: 1 }, instructionSteps: 3 },
  { id: 'morning-story', status: 'planned', domains: ['longTermMemory', 'verbalMemory'], minutes: 5, icon: 'book', plant: 'tulip', levels: { min: 1, max: 6, start: 1 }, instructionSteps: 3 },
  { id: 'whats-next', status: 'planned', domains: ['patterns'], minutes: 4, icon: 'pattern', plant: 'sunflower', levels: { min: 1, max: 8, start: 1 }, instructionSteps: 3 },
  { id: 'gatekeeper', status: 'planned', domains: ['attention', 'executive'], minutes: 3, icon: 'gate', plant: 'fern', levels: { min: 1, max: 8, start: 1 }, instructionSteps: 3 },
  { id: 'who-lives-where', status: 'planned', domains: ['logic'], minutes: 5, icon: 'house', plant: 'daisy', levels: { min: 1, max: 6, start: 1 }, instructionSteps: 3 },
  { id: 'daily-errands', status: 'planned', domains: ['executive'], minutes: 5, icon: 'map', plant: 'lavender', levels: { min: 1, max: 6, start: 1 }, instructionSteps: 3 },
];

export function getGameMeta(id: string): GameMeta | undefined {
  return CATALOG.find((g) => g.id === id);
}

export function availableGames(catalog: GameMeta[] = CATALOG): GameMeta[] {
  return catalog.filter((g) => g.status === 'available');
}

export function plannedGames(catalog: GameMeta[] = CATALOG): GameMeta[] {
  return catalog.filter((g) => g.status === 'planned');
}
