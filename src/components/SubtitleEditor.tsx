import { useStore } from '../store/subtitleStore';
import { SubtitleEntryRow } from './SubtitleEntry';
import { useTranslation } from '../i18n';

export function SubtitleEditor() {
  const subtitles = useStore((s) => s.subtitles);
  const { t } = useTranslation();

  if (!subtitles.length) {
    return (
      <div className="flex flex-1 items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-lg">{t('editor.empty.title')}</p>
          <p className="text-sm">{t('editor.empty.description')}</p>
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