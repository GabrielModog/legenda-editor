import { useRef } from 'react';
import { useStore } from '../store/subtitleStore';
import { computeDiff } from '../lib/diff';
import type { DiffLine } from '../lib/diff';
import { useTranslation } from '../i18n';

function DiffLines({ lines }: { lines: DiffLine[] }) {
  return (
    <>
      {lines.map((line, i) => (
        <div
          key={i}
          className={`border-l-2 px-3 py-1 font-mono text-sm whitespace-pre-wrap ${
            line.type === 'added'
              ? 'border-green-500 bg-diff-add text-diff-add-text'
              : line.type === 'removed'
                ? 'border-red-500 bg-diff-del text-diff-del-text'
                : 'border-transparent'
          }`}
        >
          {line.type === 'added' ? '+ ' : line.type === 'removed' ? '- ' : '  '}
          {line.text}
        </div>
      ))}
    </>
  );
}

export function DiffViewer() {
  const subtitles = useStore((s) => s.subtitles);
  const original = useStore((s) => s.originalSubtitles);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);
  const { t } = useTranslation();

  if (!original) return null;

  const handleLeftScroll = () => {
    if (isScrolling.current || !leftRef.current || !rightRef.current) return;
    isScrolling.current = true;
    rightRef.current.scrollTop = leftRef.current.scrollTop;
    requestAnimationFrame(() => { isScrolling.current = false; });
  };

  const handleRightScroll = () => {
    if (isScrolling.current || !leftRef.current || !rightRef.current) return;
    isScrolling.current = true;
    leftRef.current.scrollTop = rightRef.current.scrollTop;
    requestAnimationFrame(() => { isScrolling.current = false; });
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <div ref={leftRef} className="flex-1 overflow-y-auto border-r border-border-custom" onScroll={handleLeftScroll}>
        <div className="sticky top-0 bg-surface px-3 py-2 font-semibold text-sm border-b border-border-custom">{t('diff.original')}</div>
        {original.map((orig, i) => {
          const current = subtitles[i];
          const diff = computeDiff(orig.text, current?.text ?? '');
          return (
            <div key={orig.id} className="border-b border-border-custom/30">
              <div className="px-3 py-1 text-xs text-gray-500">#{orig.index} ({orig.startTime})</div>
              <DiffLines lines={diff.original} />
            </div>
          );
        })}
      </div>
      <div ref={rightRef} className="flex-1 overflow-y-auto" onScroll={handleRightScroll}>
        <div className="sticky top-0 bg-surface px-3 py-2 font-semibold text-sm border-b border-border-custom">{t('diff.edited')}</div>
        {original.map((orig, i) => {
          const current = subtitles[i];
          const diff = computeDiff(orig.text, current?.text ?? '');
          return (
            <div key={orig.id} className="border-b border-border-custom/30">
              <div className="px-3 py-1 text-xs text-gray-500">#{orig.index} ({current?.startTime})</div>
              <DiffLines lines={diff.edited} />
            </div>
          );
        })}
      </div>
    </div>
  );
}