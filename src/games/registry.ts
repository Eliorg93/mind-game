import { lazy, type LazyExoticComponent } from 'react';
import type { GameComponent } from './types';

/**
 * Maps a catalog id to its component. Each game is code-split, so it downloads
 * only when first played (and is precached for offline use by the service worker).
 * To add a game: create src/games/<id>/, export a default component, add it here.
 */
export const GAME_COMPONENTS: Record<string, LazyExoticComponent<GameComponent>> = {
  'memory-pairs': lazy(() => import('./memory-pairs/MemoryPairsGame')),
};

export function hasComponent(id: string): boolean {
  return id in GAME_COMPONENTS;
}
