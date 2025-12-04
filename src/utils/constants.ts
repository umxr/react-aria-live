import type { CSSProperties } from 'react';

export const DEFAULT_DEBOUNCE_MS = 150;

export const VISUALLY_HIDDEN_STYLES: CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};
