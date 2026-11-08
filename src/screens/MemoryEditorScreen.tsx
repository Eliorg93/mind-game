import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppState, useT } from '@/app/state';
import { addMemory, MAX_BODY, MAX_TITLE, MemoryValidationError } from '@/core/memories/memories';
import { BackLink, Screen } from '@/ui/Layout';
import { IconImage } from '@/ui/icons';

export default function MemoryEditorScreen() {
  const { t } = useT();
  const { bumpData } = useAppState();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const withPhoto = params.get('type') === 'photo';
  const prompt = params.get('prompt') ?? '';
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const onFile = (f: File | undefined) => {
    if (!f) return;
    setPhoto(f);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(f);
    });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await addMemory({ title, body, photo: photo ?? undefined });
      bumpData();
      navigate('/memories', { replace: true });
    } catch (err) {
      setError(t(`memories.errors.${err instanceof MemoryValidationError ? err.code : 'generic'}`));
      setSaving(false);
    }
  };

  return (
    <Screen>
      <header className="topbar"><BackLink to="/memories" /></header>
      <h1 className="display">{t('memories.newTitle')}</h1>
      {prompt && <p className="prompt-text muted">{prompt}</p>}
      <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        {withPhoto && (
          <div className="field">
            <span style={{ fontWeight: 700 }}>{t('memories.photoLabel')}</span>
            {preview && <img src={preview} alt={t('memories.photoPreview')} className="photo-preview" />}
            <input ref={fileRef} type="file" accept="image/*" className="visually-hidden" id="photo" onChange={(e) => onFile(e.target.files?.[0])} />
            <button type="button" className="btn btn--secondary" onClick={() => fileRef.current?.click()}>
              <IconImage />{photo ? t('memories.changePhoto') : t('memories.choosePhoto')}
            </button>
          </div>
        )}
        <div className="field">
          <label htmlFor="title">{t('memories.titleLabel')}</label>
          <input id="title" className="input" value={title} maxLength={MAX_TITLE} onChange={(e) => setTitle(e.target.value)} placeholder={t('memories.titleHint')} autoComplete="off" required aria-invalid={!!error && !title.trim()} />
        </div>
        <div className="field">
          <label htmlFor="body">{t('memories.bodyLabel')}</label>
          <textarea id="body" className="textarea" value={body} maxLength={MAX_BODY} onChange={(e) => setBody(e.target.value)} placeholder={t('memories.bodyHint')} />
        </div>
        {error && <p className="notice" role="alert">{error}</p>}
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? t('memories.saving') : t('memories.save')}
        </button>
      </form>
    </Screen>
  );
}
