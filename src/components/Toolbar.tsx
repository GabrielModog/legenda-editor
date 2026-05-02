import { Upload, Download, Plus, GitCompare } from 'lucide-react';
import { useRef } from 'react';
import { Button } from './ui/button';
import { useStore } from '../store/subtitleStore';
import { parseSRT, serializeSRT } from '../lib/srt-parser';

export function Toolbar() {
  const { subtitles, setSubtitles, setOriginalSubtitles, addEntry, showDiff, setShowDiff, resetOriginal } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const parsed = parseSRT(content);
      setSubtitles(parsed);
      setOriginalSubtitles(parsed.map((s) => ({ ...s })));
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    if (!subtitles.length) return;
    const content = serializeSRT(subtitles);
    const blob = new Blob([content], { type: 'text/srt' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subtitles.srt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center gap-2 border-b border-border-custom bg-surface/50 px-4 py-3">
      <input ref={inputRef} type="file" accept=".srt" className="hidden" onChange={handleImport} />
      <Button variant="outline" onClick={() => inputRef.current?.click()}>
        <Upload size={16} /> Import SRT
      </Button>
      <Button variant="outline" onClick={handleExport} disabled={!subtitles.length}>
        <Download size={16} /> Export SRT
      </Button>
      <div className="flex-1" />
      <Button variant="outline" onClick={addEntry}>
        <Plus size={16} /> Add Entry
      </Button>
      <Button
        variant={showDiff ? 'default' : 'outline'}
        onClick={() => {
          setShowDiff(!showDiff);
          if (showDiff) resetOriginal();
        }}
        disabled={!subtitles.length || !useStore.getState().originalSubtitles}
      >
        <GitCompare size={16} /> {showDiff ? 'Hide Diff' : 'Show Diff'}
      </Button>
    </div>
  );
}
