import { useT } from '@/app/state';
import { OBJECT_IDS, OBJECT_NAMES, type ObjectId } from '@/content/he/objects';
import type { GameProps } from '../types';
import { ObjectArt } from '../kit/ObjectArt';
import { RecallGame, type RecallGameSpec } from '../kit/RecallGame';
import type { RecallConfig, RecallState } from '../kit/recallEngine';

/** Game 1 – picture recall: see a few objects, then pick them out from a larger set. */
export const PICTURE_CONFIG: RecallConfig = {
  pool: OBJECT_IDS,
  targetsByLevel: [3, 4, 5, 6, 7, 8],
  choicesByLevel: [6, 8, 9, 12, 12, 12],
  rounds: 3,
};

export default function PictureRecallGame(props: GameProps<RecallState>) {
  const { t } = useT();
  const name = (id: string) => OBJECT_NAMES[id as ObjectId];
  const spec: RecallGameSpec = {
    gameId: 'picture-recall',
    config: PICTURE_CONFIG,
    columns: 3,
    renderStudy: (targets) => (
      <ul className="study-card choice-grid" aria-label={t('games.picture-recall.studyLabel')} style={{ listStyle: 'none', margin: 0 }}>
        {targets.map((id) => (
          <li key={id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-1)' }}>
            <ObjectArt id={id as ObjectId} size={64} />
            <span className="item-label">{name(id)}</span>
          </li>
        ))}
      </ul>
    ),
    renderChoice: (id) => ({
      label: name(id),
      content: (
        <>
          <ObjectArt id={id as ObjectId} size={48} />
          <span className="item-label">{name(id)}</span>
        </>
      ),
    }),
    hintText: (id) => t('games.picture-recall.hint', { item: name(id) }),
  };
  return <RecallGame spec={spec} {...props} />;
}
