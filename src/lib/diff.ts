export interface DiffLine {
  type: 'same' | 'added' | 'removed';
  text: string;
}

export function computeDiff(original: string, edited: string): { original: DiffLine[]; edited: DiffLine[] } {
  const origLines = original.split('\n');
  const editLines = edited.split('\n');

  const originalDiff: DiffLine[] = [];
  const editedDiff: DiffLine[] = [];

  const maxLen = Math.max(origLines.length, editLines.length);

  for (let i = 0; i < maxLen; i++) {
    const orig = origLines[i];
    const edit = editLines[i];

    if (orig === edit) {
      if (orig !== undefined) originalDiff.push({ type: 'same', text: orig });
      if (edit !== undefined) editedDiff.push({ type: 'same', text: edit });
    } else {
      if (orig !== undefined) originalDiff.push({ type: 'removed', text: orig });
      if (edit !== undefined) editedDiff.push({ type: 'added', text: edit });
    }
  }

  return { original: originalDiff, edited: editedDiff };
}
