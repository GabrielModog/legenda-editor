import { useEffect, useRef } from 'react';
import { Toolbar } from './Toolbar';
import { AIPanel } from './AIPanel';
import { SubtitleEditor } from './SubtitleEditor';
import { DiffViewer } from './DiffViewer';
import { ProjectDropdown } from './ProjectDropdown';
import { useStore } from '../store/subtitleStore';
import { useTranslation } from '../i18n';

export function Layout() {
  const { showDiff, subtitles, currentProjectId, saveProject, locale, setLocale, init } = useStore();
  const { t } = useTranslation();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    init();
  }, []);

  useEffect(() => {
    if (currentProjectId && subtitles.length > 0) {
      const timer = setTimeout(() => {
        saveProject();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [subtitles, currentProjectId]);

  return (
    <div className="flex flex-col h-screen">
      <header className="shrink-0">
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border-custom bg-surface">
          <h1 className="text-lg font-bold text-brand">{t('app.title')}</h1>
          <ProjectDropdown />
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as 'en' | 'pt' | 'es')}
            className="rounded border border-border-custom bg-transparent px-2 py-1 text-xs focus:border-brand focus:outline-none ml-auto"
          >
            <option value="en" className="bg-surface">{t('language.en')}</option>
            <option value="pt" className="bg-surface">{t('language.pt')}</option>
            <option value="es" className="bg-surface">{t('language.es')}</option>
          </select>
        </div>
        <Toolbar />
        <AIPanel />
      </header>
      <main className="flex-1 overflow-hidden flex flex-col">
        {showDiff ? <DiffViewer /> : <SubtitleEditor />}
      </main>
    </div>
  );
}