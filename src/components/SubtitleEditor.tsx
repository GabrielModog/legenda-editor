import { useStore } from '../store/subtitleStore';
import { SubtitleEntryRow } from './SubtitleEntry';

export function SubtitleEditor() {
  const subtitles = useStore((s) => s.subtitles);

  if (!subtitles.length) {
    return (
      <div className="flex flex-1 items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-lg">No subtitles loaded</p>
          <p className="text-sm">Import an SRT file or start adding entries</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {subtitles.map((entry) => (
        <SubtitleEntryRow key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
