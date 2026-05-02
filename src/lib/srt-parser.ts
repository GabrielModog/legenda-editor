import type { SubtitleEntry } from '../types';

export function parseSRT(content: string): SubtitleEntry[] {
  const blocks = content.trim().split(/\r?\n\r?\n/);
  return blocks
    .filter((block) => block.trim().length > 0)
    .map((block, idx) => {
      const lines = block.trim().split(/\r?\n/);
      const timeMatch = lines[1]?.match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
      return {
        id: crypto.randomUUID(),
        index: idx + 1,
        startTime: timeMatch?.[1] ?? '00:00:00,000',
        endTime: timeMatch?.[2] ?? '00:00:00,000',
        text: lines.slice(2).join('\n'),
      };
    });
}

export function serializeSRT(entries: SubtitleEntry[]): string {
  return entries
    .map((e, i) => `${i + 1}\n${e.startTime} --> ${e.endTime}\n${e.text}`)
    .join('\n\n');
}
