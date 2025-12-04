import { useEffect, useRef } from 'react';
import type { AnnounceProps } from '../types.js';
import { useLiveRegionContext } from '../context/LiveRegionContext.js';

export function Announce({ message, priority = 'polite' }: AnnounceProps) {
  const { announce } = useLiveRegionContext();
  const previousMessage = useRef<string | null>(null);

  useEffect(() => {
    // Only announce if message has changed
    if (message && message !== previousMessage.current) {
      announce(message, { priority });
      previousMessage.current = message;
    }
  }, [message, priority, announce]);

  // This component renders nothing - it only announces
  return null;
}
