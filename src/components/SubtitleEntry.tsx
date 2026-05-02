import { Trash } from 'lucide-react';
import { Button } from './ui/button';
import { useStore } from '../store/subtitleStore';
import type { SubtitleEntry as SubtitleType } from '../types';

interface Props {
  entry: SubtitleType;
}

export function SubtitleEntryRow({ entry }: Props) {
  const { updateEntry, removeEntry } = useStore();

  return (
    <div className="group flex gap-3 border-b border-border-custom/50 p-3 hover:bg-surface-hover/50">
      <span className="mt-2 w-8 shrink-0 text-xs text-gray-500">{entry.index}</span>
      <div className="flex gap-2">
        <input
          type="text"
          value={entry.startTime}
          onChange={(e) => updateEntry(entry.id, 'startTime', e.target.value)}
          className="w-36 rounded border border-border-custom bg-transparent px-2 py-1 text-xs font-mono focus:border-brand focus:outline-none"
          placeholder="00:00:00,000"
        />
        <span className="text-gray-500 self-center">→</span>
        <input
          type="text"
          value={entry.endTime}
          onChange={(e) => updateEntry(entry.id, 'endTime', e.target.value)}
          className="w-36 rounded border border-border-custom bg-transparent px-2 py-1 text-xs font-mono focus:border-brand focus:outline-none"
          placeholder="00:00:00,000"
        />
      </div>
      <textarea
        value={entry.text}
        onChange={(e) => updateEntry(entry.id, 'text', e.target.value)}
        className="flex-1 resize-y rounded border border-border-custom bg-transparent px-2 py-1 text-sm focus:border-brand focus:outline-none"
        rows={2}
        placeholder="Subtitle text..."
      />
      <Button
        variant="ghost"
        size="sm"
        className="self-start opacity-0 transition-opacity group-hover:opacity-100 text-red-400 hover:text-red-300"
        onClick={() => removeEntry(entry.id)}
      >
        <Trash size={14} />
      </Button>
    </div>
  );
}
