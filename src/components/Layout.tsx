import { useEffect } from 'react';
import { Toolbar } from './Toolbar';
import { AIPanel } from './AIPanel';
import { SubtitleEditor } from './SubtitleEditor';
import { DiffViewer } from './DiffViewer';
import { ProjectDropdown } from './ProjectDropdown';
import { useStore } from '../store/subtitleStore';

export function Layout() {
  const { showDiff, subtitles, currentProjectId, saveProject } = useStore();

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
          <h1 className="text-lg font-bold text-brand">LegendaEditor</h1>
          <ProjectDropdown />
          <span className="text-xs text-gray-500 ml-auto">SRT Editor with AI Translation</span>
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
