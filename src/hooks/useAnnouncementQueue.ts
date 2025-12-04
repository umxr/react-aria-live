import { useMemo } from 'react';
import type { AnnouncementQueue } from '../types.js';
import { useLiveRegionContext } from '../context/LiveRegionContext.js';

export function useAnnouncementQueue(): AnnouncementQueue {
  const { queue, clearQueue } = useLiveRegionContext();

  return useMemo(
    () => ({
      queue,
      clear: clearQueue,
      isPending: queue.length > 0,
    }),
    [queue, clearQueue],
  );
}
