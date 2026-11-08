import { useEffect, useState } from 'react';
import { useAppState, useT } from '@/app/state';
import { useInstall } from '@/app/pwa';
import type { Address, ChallengeStyle, Settings, TextSize } from '@/core/settings/settings';
import { speechSupported } from '@/core/speech/speech';
import { deleteAllData, exportData } from '@/core/storage/dataControl';
import { BackLink, ConfirmSheet, Screen } from '@/ui/Layout';
import { IconDownload, IconPhoneAdd, IconTrash } from '@/ui/icons';

const SIZES: TextSize[] = ['normal', 'large', 'xlarge'];
const ADDRESSES: Address[] = ['female', 'male', 'neutral'];
const STYLES: ChallengeStyle[] = ['calm', 'balanced', 'challenging'];

export default function SettingsScreen() {
  const { t } = useT();
  const { settings, updateSettings } = useAppState();
  const install = useInstall();
  const [confirm, setConfirm] = useState(false);
  const [persisted, setPersisted] = useState(false);
  const canSpeak = speechSupported();

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted).catch(() => undefined);
  }, []);

  const toggles: { key: keyof Settings; label: string; hint: string; disabled?: boolean }[] = [
    { key: 'highContrast', label: t('settings.contrast'), hint: t('settings.contrastHint') },
    { key: 'sound', label: t('settings.sound'), hint: t('settings.soundHint') },
    { key: 'autoReadInstructions', label: t('settings.autoRead'), hint: canSpeak ? t('settings.autoReadHint') : t('settings.noSpeech'), disabled: !canSpeak },
    { key: 'reduceMotion', label: t('settings.motion'), hint: t('settings.motionHint') },
  ];

  const doExport = async () => {
    const json = await exportData();
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `mind-garden-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const doDelete = async () => {
    await deleteAllData();
    location.hash = '#/';
    location.reload();
  };

  return (
    <Screen>
      <header className="topbar"><BackLink /></header>
      <h1 className="display">{t('settings.title')}</h1>

      <section className="card card--sage" aria-label={t('settings.preview')}>
        <p className="small muted" style={{ fontWeight: 700 }}>{t('settings.preview')}</p>
        <p className="lead" style={{ fontWeight: 700 }}>{t('settings.previewSample')}</p>
      </section>

      <section className="card" aria-labelledby="size-title" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <h2 id="size-title" style={{ fontSize: 'var(--fs-body)', fontWeight: 700 }}>{t('settings.textSize')}</h2>
        <div className="segmented" role="group" aria-labelledby="size-title">
          {SIZES.map((s, i) => (
            <button key={s} type="button" aria-pressed={settings.textSize === s} onClick={() => updateSettings({ textSize: s })} style={{ fontSize: `${1 + i * 0.15}rem` }}>
              {t(`settings.sizes.${s}`)}
            </button>
          ))}
        </div>
      </section>

      <section className="card" style={{ paddingBlock: 0 }}>
        {toggles.map((tg) => {
          const on = !!settings[tg.key];
          const id = `t-${tg.key}`;
          return (
            <div key={tg.key} className="setting-row">
              <div className="setting-row__text">
                <div id={id} style={{ fontWeight: 700 }}>{tg.label}</div>
                <div className="muted small" id={`${id}-hint`}>{tg.hint}</div>
              </div>
              <button type="button" role="switch" className="switch" aria-checked={on} aria-labelledby={id} aria-describedby={`${id}-hint`} disabled={tg.disabled} onClick={() => updateSettings({ [tg.key]: !on } as Partial<Settings>)}>
                <span className="switch__knob" />
              </button>
            </div>
          );
        })}
      </section>

      <section className="card" aria-labelledby="pace-title" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <h2 id="pace-title" style={{ fontSize: 'var(--fs-body)', fontWeight: 700 }}>{t('settings.challenge')}</h2>
        <div className="segmented" role="group" aria-labelledby="pace-title" aria-describedby="pace-desc">
          {STYLES.map((c) => (
            <button key={c} type="button" aria-pressed={settings.challenge === c} onClick={() => updateSettings({ challenge: c })}>
              {t(`settings.challenges.${c}`)}
            </button>
          ))}
        </div>
        <p id="pace-desc" className="small" aria-live="polite">{t(`settings.challengeDesc.${settings.challenge}`)}</p>
        <p className="muted small">{t('settings.challengeNote')}</p>
      </section>

      <section className="card" aria-labelledby="addr-title" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <h2 id="addr-title" style={{ fontSize: 'var(--fs-body)', fontWeight: 700 }}>{t('settings.address')}</h2>
        <div className="segmented" role="group" aria-labelledby="addr-title">
          {ADDRESSES.map((a) => (
            <button key={a} type="button" aria-pressed={settings.address === a} onClick={() => updateSettings({ address: a })}>
              {t(`settings.addresses.${a}`)}
            </button>
          ))}
        </div>
      </section>

      <section className="card" aria-labelledby="install-title" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <h2 id="install-title" style={{ fontSize: 'var(--fs-body)', fontWeight: 700 }}>{t('settings.install')}</h2>
        {install.installed ? (
          <p className="muted small">{t('settings.installed')}</p>
        ) : (
          <>
            <p className="muted small">{t('settings.installHint')}</p>
            {install.canPrompt ? (
              <button type="button" className="btn btn--secondary" onClick={() => void install.prompt()}><IconPhoneAdd />{t('settings.installButton')}</button>
            ) : (
              <p className="small">{install.ios ? t('settings.installIos') : t('settings.installOther')}</p>
            )}
          </>
        )}
      </section>

      <section className="card" aria-labelledby="privacy-title" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <h2 id="privacy-title" style={{ fontSize: 'var(--fs-body)', fontWeight: 700 }}>{t('settings.privacy')}</h2>
        <p className="muted small">{t('settings.privacyBody')}</p>
        {persisted && <p className="muted small">{t('settings.storageProtected')}</p>}
        <button type="button" className="btn btn--secondary" onClick={() => void doExport()}><IconDownload />{t('settings.export')}</button>
        <p className="muted small">{t('settings.exportHint')}</p>
        <button type="button" className="btn btn--quiet" style={{ alignSelf: 'flex-start' }} onClick={() => setConfirm(true)}><IconTrash />{t('settings.deleteAll')}</button>
      </section>

      <p className="muted small" style={{ textAlign: 'center' }}>{t('settings.version', { version: __APP_VERSION__ })}</p>

      {confirm && (
        <ConfirmSheet title={t('settings.confirmDeleteAllTitle')} body={t('settings.confirmDeleteAllBody')} confirmLabel={t('settings.confirmDeleteAll')} onConfirm={() => void doDelete()} onCancel={() => setConfirm(false)} />
      )}
    </Screen>
  );
}
