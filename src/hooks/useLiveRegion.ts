import { useEffect, useRef } from 'react';
import type { AriaPoliteness } from '../types.js';
import { useLiveRegionContext } from '../context/LiveRegionContext.js';

interface UseLiveRegionOptions {
  priority?: AriaPoliteness;
  atomic?: boolean;
}

export function useLiveRegion(
  content: string,
  options: UseLiveRegionOptions = {},
): void {
  const { priority = 'polite', atomic = false } = options;
  const { announce } = useLiveRegionContext();
  const previousContent = useRef<string | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip first render - live region should only announce changes
    if (isFirstRender.current) {
      isFirstRender.current = false;
      previousContent.current = content;
      return;
    }

    // Only announce if content has changed
    if (content !== previousContent.current && priority !== 'off') {
      announce(content, { priority: priority as 'polite' | 'assertive' });
    }

    previousContent.current = content;
  }, [content, priority, atomic, announce]);
}
