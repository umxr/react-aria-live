import { useCallback } from 'react';
import type { AnnounceOptions } from '../types.js';
import { useLiveRegionContext } from '../context/LiveRegionContext.js';

export function useAnnounce(): (
  message: string,
  options?: AnnounceOptions,
) => void {
  const { announce } = useLiveRegionContext();

  return useCallback(
    (message: string, options?: AnnounceOptions) => {
      announce(message, options);
    },
    [announce],
  );
}
