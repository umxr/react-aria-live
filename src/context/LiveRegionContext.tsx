import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  Announcement,
  AnnounceOptions,
  LiveRegionContextValue,
  LiveRegionProviderProps,
} from '../types.js';
import {
  announceMessage,
  clearAnnouncer,
  setupAnnouncer,
  teardownAnnouncer,
} from '../utils/announcer.js';
import { DEFAULT_DEBOUNCE_MS } from '../utils/constants.js';
import { createAnnouncement, isDuplicate } from '../utils/queue.js';

const LiveRegionContext = createContext<LiveRegionContextValue | null>(null);

export function LiveRegionProvider({
  children,
  clearOnUnmount = true,
}: LiveRegionProviderProps) {
  const [queue, setQueue] = useState<Announcement[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setupAnnouncer();
    return () => {
      if (clearOnUnmount) {
        clearAnnouncer();
      }
      teardownAnnouncer();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [clearOnUnmount]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    clearAnnouncer();
  }, []);

  const announce = useCallback(
    (message: string, options: AnnounceOptions = {}) => {
      const {
        priority = 'polite',
        clearQueue: shouldClear,
        delay = 0,
      } = options;

      if (!message.trim()) {
        return;
      }

      const doAnnounce = () => {
        setQueue((currentQueue) => {
          if (isDuplicate(currentQueue, message, DEFAULT_DEBOUNCE_MS)) {
            return currentQueue;
          }

          if (shouldClear) {
            clearAnnouncer();
          }

          const announcement = createAnnouncement(message, priority);
          announceMessage(message, priority);

          const newQueue = shouldClear
            ? [announcement]
            : [...currentQueue, announcement];

          // Clean up old announcements (older than 5 seconds)
          const now = Date.now();
          return newQueue.filter((a) => now - a.timestamp < 5000);
        });
      };

      if (delay > 0) {
        timeoutRef.current = setTimeout(doAnnounce, delay);
      } else {
        doAnnounce();
      }
    },
    [],
  );

  const value = useMemo<LiveRegionContextValue>(
    () => ({
      announce,
      queue,
      clearQueue,
    }),
    [announce, queue, clearQueue],
  );

  return (
    <LiveRegionContext.Provider value={value}>
      {children}
    </LiveRegionContext.Provider>
  );
}

export function useLiveRegionContext(): LiveRegionContextValue {
  const context = useContext(LiveRegionContext);
  if (!context) {
    throw new Error(
      'useLiveRegionContext must be used within a LiveRegionProvider',
    );
  }
  return context;
}

export { LiveRegionContext };
