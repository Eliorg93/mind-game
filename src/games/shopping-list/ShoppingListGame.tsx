import { useT } from '@/app/state';
import { PRODUCTS, productById, sectionById } from '@/content/he/shopping';
import type { GameProps } from '../types';
import { shuffle, type Rng } from '../kit/random';
import { RecallGame, type RecallGameSpec } from '../kit/RecallGame';
import type { RecallConfig, RecallState } from '../kit/recallEngine';

/**
 * Game 3 – shopping list: read a shopping list, then pick the products from the
 * store shelf. Distractors come from the same store sections, so the choice
 * relies on memory rather than on guessing the category.
 */
export function sameSectionDistractors(targets: string[], pool: readonly string[], n: number, rng: Rng): string[] {
  const sections = new Set(targets.map((id) => productById(id)?.sectionId));
  const near = shuffle(pool.filter((id) => sections.has(productById(id)?.sectionId)), rng);
  const far = shuffle(pool.filter((id) => !sections.has(productById(id)?.sectionId)), rng);
  return [...near, ...far].slice(0, n);
}

export const SHOPPING_CONFIG: RecallConfig = {
  pool: PRODUCTS.map((p) => p.id),
  targetsByLevel: [3, 4, 5, 6, 7, 8],
  choicesByLevel: [6, 8, 10, 12, 12, 14],
  rounds: 3,
  distractors: sameSectionDistractors,
};

export default function ShoppingListGame(props: GameProps<RecallState>) {
  const { t } = useT();
  const name = (id: string) => productById(id)?.name ?? '';
  const spec: RecallGameSpec = {
    gameId: 'shopping-list',
    config: SHOPPING_CONFIG,
    columns: 2,
    renderStudy: (targets) => (
      <div className="study-card paper-note">
        <p className="eyebrow" style={{ marginBlockEnd: 'var(--space-2)' }}>{t('games.shopping-list.listTitle')}</p>
        <ul className="study-list">
          {targets.map((id) => <li key={id}>{name(id)}</li>)}
        </ul>
        <p className="muted small" style={{ marginBlockStart: 'var(--space-3)' }}>{t('games.shopping-list.tip')}</p>
      </div>
    ),
    renderChoice: (id) => ({ label: name(id), content: <span>{name(id)}</span> }),
    studyReadText: (targets) => targets.map(name).join(', '),
    hintText: (id) => t('games.shopping-list.hint', { item: name(id), section: sectionById(productById(id)?.sectionId ?? '')?.name ?? '' }),
  };
  return <RecallGame spec={spec} {...props} />;
}

