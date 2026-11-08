import { useAppState, useT } from '@/app/state';
import type { GameProps } from '../types';
import { Actions, ReadAloud, Toolbar } from '../kit/Kit';
import { QuizGame, type QuizGameSpec } from '../kit/QuizGame';
import type { QuizState } from '../kit/quizEngine';
import { createStoryGame, GAME_ID, storyOf } from './logic';

export default function StoryMemoryGame(props: GameProps<QuizState>) {
  const { t } = useT();
  const { settings } = useAppState();
  const spec: QuizGameSpec = {
    gameId: GAME_ID,
    create: (level) => createStoryGame(level),
    renderIntro: (s, begin) => {
      const story = storyOf(s);
      if (!story) return null;
      const text = [story.title, ...story.sentences].join(' ');
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p className="eyebrow">{t('games.story-memory.readPrompt')}</p>
          <Toolbar>
            <ReadAloud text={text} label={t('games.story-memory.readStory')} autoRead={settings.autoReadInstructions} />
          </Toolbar>
          <article className="study-card story-text" aria-labelledby="story-title">
            <h2 id="story-title" className="title" style={{ marginBlockEnd: 'var(--space-3)' }}>{story.title}</h2>
            {story.sentences.map((line, i) => <p key={i}>{line}</p>)}
          </article>
          <p className="muted small">{t('games.story-memory.questionsCount', { count: s.questions.length })}</p>
          <Actions>
            <button type="button" className="btn btn--primary" onClick={begin}>{t('games.story-memory.toQuestions')}</button>
          </Actions>
        </div>
      );
    },
  };
  return <QuizGame spec={spec} {...props} />;
}
