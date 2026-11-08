import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppState, useLoad, useT } from '@/app/state';
import { deleteMemory, getMemory } from '@/core/memories/memories';
import { formatHebrewDate } from '@/core/time/time';
import { BackLink, ConfirmSheet, Screen } from '@/ui/Layout';
import { IconTrash } from '@/ui/icons';

export default function MemoryViewScreen() {
  const { id = '' } = useParams();
  const { t } = useT();
  const { bumpData } = useAppState();
  const navigate = useNavigate();
  const { data, loading } = useLoad(() => getMemory(id), [id]);
  const [confirm, setConfirm] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!data?.photo) return;
    const url = URL.createObjectURL(data.photo);
    setPhotoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [data]);

  const remove = async () => {
    await deleteMemory(id);
    bumpData();
    navigate('/memories', { replace: true });
  };

  return (
    <Screen>
      <header className="topbar"><BackLink to="/memories" /></header>
      {!loading && !data && <h1 className="title">{t('memories.notFound')}</h1>}
      {data && (
        <>
          <h1 className="display">{data.title}</h1>
          <p className="muted small">{t('memories.savedOn', { date: formatHebrewDate(data.createdAt) })}</p>
          {photoUrl && <img src={photoUrl} alt={data.title} className="photo-preview" />}
          {data.body && <p className="lead" style={{ whiteSpace: 'pre-wrap' }}>{data.body}</p>}
          <div className="spacer" />
          <button type="button" className="btn btn--secondary" onClick={() => setConfirm(true)}>
            <IconTrash />{t('memories.delete')}
          </button>
        </>
      )}
      {confirm && (
        <ConfirmSheet title={t('memories.confirmDeleteTitle')} body={t('memories.confirmDeleteBody')} confirmLabel={t('memories.confirmDelete')} onConfirm={remove} onCancel={() => setConfirm(false)} />
      )}
    </Screen>
  );
}
