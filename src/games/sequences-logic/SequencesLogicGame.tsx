import { useT } from '@/app/state';
import type { GameProps } from '../types';
import { QuizGame, type QuizGameSpec } from '../kit/QuizGame';
import type { QuizState } from '../kit/quizEngine';
import { createSequencesGame, decodeShape, GAME_ID, shapeLabel, type PatternVisual, type ShapeItem } from './logic';

const FILL: Record<ShapeItem['color'], string> = { green: '#3D6B47', orange: '#C9744D', gold: '#D9A21B', purple: '#7A5EA8', blue: '#3E6FA8' };

export function ShapeArt({ item, size = 40 }: { item: ShapeItem; size?: number }) {
  const f = FILL[item.color];
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      {item.shape === 'circle' && <circle cx="20" cy="20" r="15" fill={f} />}
      {item.shape === 'square' && <rect x="6" y="6" width="28" height="28" rx="3" fill={f} />}
      {item.shape === 'triangle' && <path d="M20 4L37 35H3Z" fill={f} />}
      {item.shape === 'star' && <path d="M20 3l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1Z" fill={f} />}
    </svg>
  );
}

export default function SequencesLogicGame(props: GameProps<QuizState>) {
  const { t } = useT();
  const spec: QuizGameSpec = {
    gameId: GAME_ID,
    create: (level) => createSequencesGame(level),
    renderVisual: (q) => {
      if (q.type !== 'pattern') return null;
      const v = q.visual as PatternVisual;
      return (
        <div className="study-card" role="img" aria-label={`${t('games.sequences-logic.patternLabel')}: ${v.items.map(shapeLabel).join(', ')}`} style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', justifyContent: 'center', alignItems: 'center' }}>
          {v.items.map((it, i) => <ShapeArt key={i} item={it} size={36} />)}
          <span className="title" aria-hidden="true" style={{ inlineSize: 36, textAlign: 'center' }}>?</span>
        </div>
      );
    },
    renderOption: (q, opt) => {
      if (q.type !== 'pattern') return null;
      const it = decodeShape(opt);
      return { label: shapeLabel(it), content: (<><ShapeArt item={it} size={44} /><span>{shapeLabel(it)}</span></>) };
    },
    twoColumns: (q) => q.shape === 'choice' && q.type !== 'logic' && q.options.every((o) => o.length <= 12),
  };
  return <QuizGame spec={spec} {...props} />;
}
